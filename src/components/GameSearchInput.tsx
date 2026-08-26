'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, X, Search, Check } from 'lucide-react';

interface GameSearchInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

const COMMON_GAMES = [
  'Valorant',
  'Rocket League',
  'Counter-Strike 2',
  'PUBG Mobile',
  'League of Legends',
  'Overwatch 2',
  'Dota 2',
  'Rainbow Six Siege',
  'FC 25 (FIFA)',
  'Fortnite',
  'Apex Legends',
  'Call of Duty: Warzone',
  'Mobile Legends',
];

export function GameSearchInput({
  label = 'اللعبة:',
  value,
  onChange,
  placeholder = 'ابحث عن اللعبة أو اكتب اسمها...',
  className = '',
  error,
}: GameSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value with local query
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredGames = COMMON_GAMES.filter((g) =>
    g.toLowerCase().includes(query.toLowerCase().trim())
  );

  const handleSelect = (game: string) => {
    setQuery(game);
    onChange(game);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-zinc-300">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="relative flex items-center">
          <Gamepad2 className="w-4 h-4 text-zinc-400 absolute right-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full h-11 text-xs pr-9 pl-8 py-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-zinc-400 hover:text-white absolute left-2 rounded-lg hover:bg-white/10 transition"
              title="مسح"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && (
          <div className="absolute top-full right-0 left-0 mt-1.5 max-h-52 bg-[#0e0e0e] border border-white/15 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.9)] overflow-y-auto z-50 p-1.5 space-y-1 no-scrollbar animate-in fade-in duration-100">
            {filteredGames.length > 0 ? (
              filteredGames.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleSelect(g)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-right text-xs font-bold transition group ${
                    query.toLowerCase() === g.toLowerCase()
                      ? 'bg-white text-black'
                      : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Gamepad2 className={`w-3.5 h-3.5 ${query.toLowerCase() === g.toLowerCase() ? 'text-black' : 'text-zinc-400 group-hover:text-white'}`} />
                    <span>{g}</span>
                  </div>
                  {query.toLowerCase() === g.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-black" />
                  )}
                </button>
              ))
            ) : query.trim() ? (
              <button
                type="button"
                onClick={() => handleSelect(query.trim())}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-right text-xs font-bold bg-white/5 hover:bg-white/10 text-white transition"
              >
                <span>استخدام &quot;{query.trim()}&quot; كاسم لعبة</span>
                <span className="text-[10px] text-zinc-400 font-mono">جديد</span>
              </button>
            ) : (
              <div className="p-3 text-center text-xs text-zinc-500">
                اكتب للبحث عن اللعبة...
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-[10px] font-bold text-red-400">{error}</p>}
    </div>
  );
}
