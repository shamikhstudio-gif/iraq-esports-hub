'use client';

import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
}

export interface ScrollableTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  accentColor?: string;
  variant?: 'pills' | 'underline' | 'compact';
  className?: string;
}

export function ScrollableTabs({
  tabs,
  activeTab,
  onChange,
  accentColor = '#ffffff',
  variant = 'underline',
  className = '',
}: ScrollableTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    // RTL scrollLeft is negative or inverse in some browsers, normalize:
    const scrollLeft = Math.abs(el.scrollLeft);
    const maxScroll = el.scrollWidth - el.clientWidth;

    setCanScrollRight(scrollLeft > 5);
    setCanScrollLeft(scrollLeft < maxScroll - 5);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [tabs]);

  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -200 : 200;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div className={`relative flex items-center w-full group/tabs ${className}`} dir="rtl">
      {/* Right Scroll Arrow (RTL previous) */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute right-0 z-20 h-full px-1.5 bg-gradient-to-l from-black via-black/90 to-transparent flex items-center justify-center text-zinc-400 hover:text-white transition"
          title="التمرير لليمين"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Tabs Container */}
      <div
        ref={containerRef}
        onScroll={checkScroll}
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full py-1 px-2 scrollbar-cyber no-scrollbar scroll-smooth select-none"
        style={{
          maskImage:
            canScrollLeft && canScrollRight
              ? 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)'
              : canScrollLeft
              ? 'linear-gradient(to right, transparent, black 24px, black 100%)'
              : canScrollRight
              ? 'linear-gradient(to left, transparent, black 24px, black 100%)'
              : undefined,
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          if (variant === 'pills') {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => !tab.disabled && onChange(tab.id)}
                disabled={tab.disabled}
                className={`py-2 px-3.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white text-black shadow-md'
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
                } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                      isActive ? 'bg-black text-white' : 'bg-white/15 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          }

          if (variant === 'compact') {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => !tab.disabled && onChange(tab.id)}
                disabled={tab.disabled}
                className={`py-1.5 px-3 rounded-lg text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap transition shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'text-zinc-500 hover:text-zinc-300'
                } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1 rounded bg-white/10 text-zinc-300 text-[9px] font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          }

          // Default: Underline / Hero Tab with Accent Border
          return (
            <button
              key={tab.id}
              type="button"
              data-tab="underline"
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              className={`py-2.5 px-3.5 text-xs font-black flex items-center gap-2 border-b-2 whitespace-nowrap transition shrink-0 cursor-pointer ${
                isActive
                  ? 'rounded-t-xl bg-white/10 text-white border-white shadow-xs'
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
              } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black shadow-xs ${
                    isActive ? 'bg-white text-black' : 'bg-white/15 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Left Scroll Arrow (RTL next) */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute left-0 z-20 h-full px-1.5 bg-gradient-to-r from-black via-black/90 to-transparent flex items-center justify-center text-zinc-400 hover:text-white transition"
          title="التمرير لليسار"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
