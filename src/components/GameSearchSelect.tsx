'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Gamepad2, 
  X, 
  Check, 
  Loader2, 
  Plus, 
  Sparkles,
  Flame
} from 'lucide-react';

export interface GameItem {
  id: string;
  name: string;
  category?: string;
  image?: string;
  year?: string;
}

interface GameSearchSelectProps {
  label?: string;
  mode?: 'single' | 'multiple';
  value: string | string[];
  onChange: (value: any) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  showSuggestions?: boolean;
}

const QUICK_SUGGESTIONS = [
  'PUBG Mobile',
  'Valorant',
  'Counter-Strike 2',
  'League of Legends',
  'FC24 (FIFA)',
  'Mobile Legends',
  'Call of Duty: Warzone',
  'Dota 2',
  'Fortnite',
];

export function GameSearchSelect({
  label = 'الألعاب التنافسية:',
  mode = 'single',
  value,
  onChange,
  placeholder = 'ابحث عن لعبة...',
  error,
  className = '',
  showSuggestions = true,
}: GameSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GameItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Selected values helper
  const selectedValues: string[] = Array.isArray(value)
    ? value
    : value
    ? [value]
    : [];

  // In-memory query cache to eliminate redundant network roundtrips
  const searchCacheRef = useRef<Record<string, GameItem[]>>({});

  // Fetch games from API on query change with lazy loading & caching
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (searchCacheRef.current[trimmed.toLowerCase()]) {
      setResults(searchCacheRef.current[trimmed.toLowerCase()]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          const items = data.results || [];
          searchCacheRef.current[trimmed.toLowerCase()] = items;
          setResults(items);
        }
      } catch (err) {
        console.error('Failed to search games:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectGame = (gameName: string) => {
    if (mode === 'multiple') {
      if (!selectedValues.includes(gameName)) {
        onChange([...selectedValues, gameName]);
      }
      setQuery('');
      inputRef.current?.focus();
    } else {
      onChange(gameName);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleRemoveGame = (gameName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (mode === 'multiple') {
      onChange(selectedValues.filter((g) => g !== gameName));
    } else {
      onChange('');
    }
  };

  const isSelected = (gameName: string) => {
    return selectedValues.includes(gameName);
  };

  return (
    <div className={`relative text-right ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-zinc-300">
            {label}
          </label>
          {mode === 'multiple' && selectedValues.length > 0 && (
            <span className="text-[10px] font-bold text-white">
              تم تحديد ({selectedValues.length}) ألعاب
            </span>
          )}
        </div>
      )}

      {/* Selected Chips in Multiple Mode */}
      {mode === 'multiple' && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {selectedValues.map((g) => (
            <span
              key={g}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white text-black text-xs font-extrabold shadow-sm animate-in fade-in zoom-in-95 duration-150"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-black shrink-0" />
              <span>{g}</span>
              <button
                type="button"
                onClick={(e) => handleRemoveGame(g, e)}
                className="p-0.5 rounded-md hover:bg-black/10 text-black transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Single Mode: Active Selected Card */}
      {mode === 'single' && selectedValues.length > 0 && !isOpen ? (
        <div className="flex items-center justify-between p-2.5 rounded-2xl border border-white/20 bg-[#121212] shadow-sm">
          <div className="flex items-center gap-3 truncate">
            <div className="w-10 h-10 rounded-xl bg-[#1c1c1c] text-white flex items-center justify-center shrink-0 border border-white/20 shadow-sm">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div className="truncate">
              <div className="text-xs font-black text-white truncate">
                {selectedValues[0]}
              </div>
              <div className="text-[10px] text-zinc-400 font-bold">
                تم الاختيار
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="px-2.5 py-1 btn-3d-dark text-white text-[11px] font-bold rounded-lg transition"
            >
              تغيير
            </button>
            <button
              type="button"
              onClick={() => handleRemoveGame(selectedValues[0])}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
              title="إلغاء التحديد"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Search Box Input */
        <div className="relative">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            placeholder={placeholder}
            className={`w-full text-xs p-2.5 pr-9 pl-8 rounded-xl border transition-all duration-200 outline-none ${
 isOpen
 ? 'border-white/50 ring-1 ring-white/30 bg-[#080808] text-white shadow-sm'
 : 'border-white/12 bg-[#080808] text-zinc-200 hover:border-white/25 shadow-sm'
 }`}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Dropdown Results list */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-[#0e0e0e] rounded-2xl border border-white/15 shadow-sm overflow-hidden py-2 max-h-80 overflow-y-auto modal-animate">
          <div className="px-3 py-1.5 text-[10px] font-extrabold text-zinc-400 flex items-center justify-between border-b border-white/10 mb-1">
            <span>نتائج البحث:</span>
            {isLoading && <span className="text-white">جاري البحث...</span>}
          </div>

          {results.length === 0 && !isLoading ? (
            <div className="p-4 text-center">
              <Gamepad2 className="w-6 h-6 mx-auto text-zinc-600 mb-1" />
              <p className="text-xs text-zinc-400 font-medium">لم يتم العثور على ألعاب مطابقة.</p>
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => handleSelectGame(query.trim())}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 btn-3d-primary rounded-xl text-xs font-extrabold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة &quot;{query.trim()}&quot; كلعبة مخصصة</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1 px-1.5">
              {results.map((g) => {
                const selected = isSelected(g.name);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleSelectGame(g.name)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-right transition group ${
 selected
 ? 'bg-white text-black font-extrabold'
 : 'hover:bg-white/10 text-zinc-200'
 }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
 selected ? 'bg-black text-white border-black' : 'bg-[#181818] border-white/10 text-zinc-400'
 }`}>
                        <Gamepad2 className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className={`text-xs font-bold transition truncate ${
 selected ? 'text-black' : 'text-white group-hover:text-white'
 }`}>
                          {g.name}
                        </div>
                        <div className={`text-[10px] font-medium truncate ${
 selected ? 'text-zinc-700' : 'text-zinc-400'
 }`}>
                          {g.category || 'غلاف رسمي'} {g.year ? `• ${g.year}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 mr-2">
                      {selected ? (
                        <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-500 group-hover:text-white transition">
                          {mode === 'multiple' ? '+ إضافة' : 'اختيار'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Direct custom add option */}
              {query.trim() && !results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => handleSelectGame(query.trim())}
                  className="w-full flex items-center gap-2 p-2 mt-1 rounded-xl bg-[#080808] hover:bg-white/10 text-white text-xs font-bold transition border border-dashed border-white/20"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>إضافة &quot;{query.trim()}&quot; كلعبة جديدة</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Suggestions Chips below input */}
      {showSuggestions && mode === 'multiple' && (
        <div className="mt-2 pt-1.5">
          <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 mb-1.5">
            <Flame className="w-3 h-3 text-white" />
            <span>ألعاب شائعة سريعة:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {QUICK_SUGGESTIONS.map((sug) => {
              const isAdded = isSelected(sug);
              return (
                <button
                  key={sug}
                  type="button"
                  onClick={() => {
                    if (isAdded) {
                      handleRemoveGame(sug);
                    } else {
                      handleSelectGame(sug);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
 isAdded
 ? 'bg-white text-black shadow-xs'
 : 'bg-[#0a0a0a] hover:bg-white/10 text-zinc-300 border border-white/10'
 }`}
                >
                  {isAdded ? sug : `+ ${sug}`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-[11px] text-zinc-400 font-medium">{error}</p>}
    </div>
  );
}
