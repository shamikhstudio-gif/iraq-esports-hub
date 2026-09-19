'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ArrowDown, Loader2 } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

const PULL_THRESHOLD = 56;
const MAX_PULL = 76;

export function PullToRefresh({
  children,
  onRefresh,
  scrollContainerRef,
  className = '',
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const canPullRef = useRef<boolean>(false);
  const passedThresholdRef = useRef<boolean>(false);

  const isAtTop = useCallback(() => {
    if (typeof window === 'undefined') return true;
    const winScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const containerScroll = scrollContainerRef?.current ? scrollContainerRef.current.scrollTop : 0;
    return winScroll <= 1 && containerScroll <= 1;
  }, [scrollContainerRef]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    if (e.touches.length !== 1) return;

    if (isAtTop()) {
      canPullRef.current = true;
      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      passedThresholdRef.current = false;
    } else {
      canPullRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canPullRef.current || isRefreshing) return;
    if (e.touches.length !== 1) return;

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - startYRef.current;
    const deltaX = currentX - startXRef.current;

    // Moving upward -> scrolling down the feed
    if (deltaY <= 0) {
      if (pullDistance > 0) {
        setPullDistance(0);
        setIsPulling(false);
      }
      return;
    }

    // Horizontal swipe dominant (e.g. tabs or card swiping)
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
      canPullRef.current = false;
      if (pullDistance > 0) {
        setPullDistance(0);
        setIsPulling(false);
      }
      return;
    }

    // Double check that we are still at the top
    if (!isAtTop()) {
      canPullRef.current = false;
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    // Sub-linear damping formula: feels native, resistance increases as pulled further
    const damped = Math.min(Math.floor(deltaY * 0.42), MAX_PULL);
    setPullDistance(damped);
    setIsPulling(true);

    // Haptic feedback when crossing the release threshold
    if (damped >= PULL_THRESHOLD && !passedThresholdRef.current) {
      passedThresholdRef.current = true;
      triggerHaptic('light');
    } else if (damped < PULL_THRESHOLD && passedThresholdRef.current) {
      passedThresholdRef.current = false;
    }
  };

  const handleTouchEnd = async () => {
    if (!canPullRef.current || isRefreshing) {
      setIsPulling(false);
      return;
    }

    canPullRef.current = false;
    setIsPulling(false);

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(48); // Hold at comfortable spinner height
      triggerHaptic('medium');

      try {
        await Promise.all([
          onRefresh(),
          // Minimum duration so user perceives the tactile refresh state
          new Promise((resolve) => setTimeout(resolve, 550)),
        ]);
        triggerHaptic('success');
      } catch (err) {
        console.error('Error during pull-to-refresh:', err);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        passedThresholdRef.current = false;
      }
    } else {
      // Cancelled pull: spring smoothly back to 0
      setPullDistance(0);
      passedThresholdRef.current = false;
    }
  };

  const handleTouchCancel = () => {
    canPullRef.current = false;
    setIsPulling(false);
    if (!isRefreshing) {
      setPullDistance(0);
      passedThresholdRef.current = false;
    }
  };

  const rotationDeg = Math.min(pullDistance / PULL_THRESHOLD, 1) * 180;
  const isReady = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      className={`relative w-full ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Pull / Refresh Indicator Bar */}
      <div
        className={`w-full overflow-hidden flex items-center justify-center pointer-events-none select-none transition-all ${
          isPulling ? 'duration-75 ease-out' : 'duration-300 cubic-bezier(0.16, 1, 0.3, 1)'
        }`}
        style={{
          height: isRefreshing ? '48px' : `${pullDistance}px`,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/95 text-white border border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.9)] backdrop-blur-md">
          {isRefreshing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              <span className="text-[11px] font-bold font-mono tracking-tight text-zinc-200">
                جاري تحديث الخلاصة...
              </span>
            </>
          ) : (
            <>
              <ArrowDown
                className="w-3.5 h-3.5 text-white transition-transform duration-150 ease-out"
                style={{
                  transform: `rotate(${rotationDeg}deg)`,
                }}
              />
              <span className="text-[11px] font-bold tracking-tight text-zinc-300">
                {isReady ? 'أفلت للتحديث' : 'اسحب للتحديث'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Page / Feed Content */}
      {children}
    </div>
  );
}
