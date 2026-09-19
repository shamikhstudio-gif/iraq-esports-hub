'use client';

import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { IehLogo } from '@/components/icons/CustomIcons';

export function DesktopTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.isDesktop) {
      setIsElectron(true);

      window.electronAPI.isMaximized().then(setIsMaximized).catch(() => {});

      const unsubscribe = window.electronAPI.onWindowStateChange((maximized) => {
        setIsMaximized(maximized);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  if (!isElectron) return null;

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();

  return (
    <header
      dir="ltr"
      className="h-8 w-full bg-black border-b border-white/10 select-none flex items-center justify-between px-3 z-50 text-white shrink-0 sticky top-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* App Brand / Icon */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="w-4 h-4 rounded bg-[#151515] border border-white/20 flex items-center justify-center">
          <IehLogo size={10} glow={false} />
        </div>
        <span className="text-[11px] font-black tracking-widest text-zinc-300 uppercase font-mono">
          IEH Desktop
        </span>
      </div>

      {/* Middle Drag Area */}
      <div className="flex-1 h-full" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />

      {/* Window Controls (No-Drag) */}
      <div
        className="flex items-center -mr-3 h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          type="button"
          data-window-control="true"
          onClick={handleMinimize}
          className="h-8 w-11 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="تصغير"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          data-window-control="true"
          onClick={handleMaximize}
          className="h-8 w-11 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title={isMaximized ? 'استعادة' : 'تكبير'}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>

        <button
          type="button"
          data-window-control="true"
          onClick={handleClose}
          className="h-8 w-11 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-white transition"
          title="إغلاق (تصغير إلى شريط المهام)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
