import React from 'react';
import {
  useNavigate,
  useParams as useRRParams,
  useLocation,
  useSearchParams as useRRSearchParams,
  Link as RRLink,
  LinkProps as RRLinkProps,
} from 'react-router-dom';

/**
 * Drop-in replacement for Next.js useRouter
 */
export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    prefetch: () => {},
  };
}

/**
 * Drop-in replacement for Next.js useParams
 */
export function useParams<T = Record<string, string | string[] | undefined>>(): T {
  const params = useRRParams();
  return params as unknown as T;
}

/**
 * Drop-in replacement for Next.js usePathname
 */
export function usePathname(): string {
  const location = useLocation();
  return location.pathname;
}

/**
 * Drop-in replacement for Next.js useSearchParams
 */
export function useSearchParams(): URLSearchParams {
  const [searchParams] = useRRSearchParams();
  return searchParams;
}

export interface LinkProps extends Omit<RRLinkProps, 'to' | 'prefetch'> {
  href?: string;
  to?: string;
  prefetch?: boolean | 'none' | 'intent' | 'render' | 'viewport';
  children?: React.ReactNode;
}

/**
 * Drop-in replacement for Next.js Link that supports href="..."
 */
export function Link({ href, to, prefetch, ...props }: LinkProps) {
  const target = to || href || '#';
  return <RRLink to={target} {...props} />;
}

export default Link;
