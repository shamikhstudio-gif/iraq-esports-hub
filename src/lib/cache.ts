/**
 * Iraq Esports Hub — In-Memory Stale-While-Revalidate (SWR) Cache
 *
 * Provides instantaneous 0ms renders for previously loaded pages and components,
 * eliminating redundant network round-trips between tab switches.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cacheStore = new Map<string, CacheEntry<any>>();
const activePromises = new Map<string, Promise<any>>();
const listeners = new Map<string, Set<(data: any) => void>>();

const LOCAL_STORAGE_PREFIX = 'ieh_swr_';

// Default TTL: 5 minutes (300,000 ms)
export const DEFAULT_CACHE_TTL = 300_000;

export function getCachedData<T>(key: string, allowStale = true): T | undefined {
  let entry = cacheStore.get(key);

  if (!entry && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
      if (raw) {
        entry = JSON.parse(raw);
        if (entry) {
          cacheStore.set(key, entry);
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  if (!entry) return undefined;

  const isExpired = Date.now() - entry.timestamp > entry.ttl;
  if (isExpired && !allowStale) {
    cacheStore.delete(key);
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(LOCAL_STORAGE_PREFIX + key); } catch {}
    }
    return undefined;
  }

  return entry.data as T;
}

export function setCachedData<T>(key: string, data: T, ttl = DEFAULT_CACHE_TTL): void {
  const entry = {
    data,
    timestamp: Date.now(),
    ttl,
  };
  cacheStore.set(key, entry);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // ignore storage quota errors
    }
  }

  // Notify active component subscribers
  const subs = listeners.get(key);
  if (subs) {
    subs.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(`Error notifying cache subscriber for ${key}:`, err);
      }
    });
  }
}

export function prefetchData<T>(key: string, fetcher: () => Promise<T>, ttl = DEFAULT_CACHE_TTL): Promise<void> {
  const cached = getCachedData<T>(key, false);
  if (cached !== undefined) return Promise.resolve();
  return fetcher().then((data) => {
    setCachedData(key, data, ttl);
  }).catch((err) => {
    console.warn(`[Prefetch] Error for ${key}:`, err);
  });
}

export function invalidateCache(keyOrPrefix: string): void {
  for (const key of cacheStore.keys()) {
    if (key === keyOrPrefix || key.startsWith(`${keyOrPrefix}:`) || key.startsWith(keyOrPrefix)) {
      cacheStore.delete(key);
    }
  }
  if (typeof window !== 'undefined') {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k === LOCAL_STORAGE_PREFIX + keyOrPrefix || k.startsWith(LOCAL_STORAGE_PREFIX + keyOrPrefix))) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
  for (const key of activePromises.keys()) {
    if (key === keyOrPrefix || key.startsWith(`${keyOrPrefix}:`) || key.startsWith(keyOrPrefix)) {
      activePromises.delete(key);
    }
  }
}

export function mutateCache<T>(
  key: string,
  updater: T | ((prev: T | undefined) => T),
  ttl = DEFAULT_CACHE_TTL
): T {
  const current = getCachedData<T>(key, true);
  const nextData = typeof updater === 'function' ? (updater as any)(current) : updater;
  setCachedData(key, nextData, ttl);
  return nextData;
}

interface UseSwrOptions<T> {
  ttl?: number;
  initialData?: T;
  revalidateOnMount?: boolean;
}

export function useSwrData<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseSwrOptions<T> = {}
) {
  const { ttl = DEFAULT_CACHE_TTL, initialData, revalidateOnMount = true } = options;

  const initialCached = key ? getCachedData<T>(key, true) : undefined;
  const [data, setData] = useState<T | undefined>(initialCached ?? initialData);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCached && !initialData && Boolean(key));
  const [isValidating, setIsValidating] = useState<boolean>(Boolean(key && initialCached));
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const runRevalidation = useCallback(async (forced = false): Promise<T | undefined> => {
    if (!key) return undefined;

    const cached = getCachedData<T>(key, true);
    if (!cached) {
      setIsLoading(true);
    } else {
      setIsValidating(true);
    }

    try {
      // Deduplicate in-flight requests for the exact same key
      let promise = activePromises.get(key);
      if (!promise || forced) {
        promise = fetcherRef.current();
        activePromises.set(key, promise);
      }

      const freshData = await promise;
      setCachedData(key, freshData, ttl);
      setData(freshData);
      setError(null);
      return freshData;
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      setError(errObj);
      console.warn(`[SWR] Error fetching ${key}:`, errObj.message);
      return undefined;
    } finally {
      activePromises.delete(key);
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [key, ttl]);

  useEffect(() => {
    if (!key) return;

    // Subscribe to external mutations on this key
    let subs = listeners.get(key);
    if (!subs) {
      subs = new Set();
      listeners.set(key, subs);
    }
    const updateHandler = (updatedData: T) => {
      setData(updatedData);
      setIsLoading(false);
    };
    subs.add(updateHandler);

    // Initial load check
    const cached = getCachedData<T>(key, true);
    if (cached !== undefined) {
      setData(cached);
      setIsLoading(false);
      if (revalidateOnMount) {
        runRevalidation();
      }
    } else {
      runRevalidation();
    }

    return () => {
      subs.delete(updateHandler);
      if (subs.size === 0) {
        listeners.delete(key);
      }
    };
  }, [key, runRevalidation, revalidateOnMount]);

  const mutate = useCallback(
    async (newData?: T | ((prev: T | undefined) => T), shouldRevalidate = false) => {
      if (!key) return;
      if (newData !== undefined) {
        const updated = mutateCache(key, newData, ttl);
        setData(updated);
      }
      if (shouldRevalidate) {
        await runRevalidation(true);
      }
    },
    [key, ttl, runRevalidation]
  );

  return {
    data,
    isLoading,
    isValidating,
    error,
    mutate,
    revalidate: () => runRevalidation(true),
  };
}
