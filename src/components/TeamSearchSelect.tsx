'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Shield, X, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Team } from '@/lib/types';
import { TeamsIcon } from '@/components/icons/CustomIcons';

interface TeamSearchSelectProps {
  label?: string;
  value?: string | null; // Team ID
  onSelect: (team: Team | null) => void;
  excludeTeamId?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function TeamSearchSelect({
  label = 'الفريق الخصم (من فرق IEH المسجلة):',
  value,
  onSelect,
  excludeTeamId,
  placeholder = 'ابحث عن اسم أو تاغ الفريق الخصم...',
  className = '',
  error,
}: TeamSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Fetch initial selected team if value is provided
  useEffect(() => {
    if (value && (!selectedTeam || selectedTeam.id !== value)) {
      supabase
        .from('teams')
        .select('*')
        .eq('id', value)
        .single()
        .then(({ data }) => {
          if (data) setSelectedTeam(data as Team);
        });
    } else if (!value) {
      setSelectedTeam(null);
    }
  }, [value]);

  // Search teams in Supabase with debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!isOpen) return;

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        let req = supabase.from('teams').select('*').limit(15);
        if (excludeTeamId) {
          req = req.neq('id', excludeTeamId);
        }
        if (trimmed) {
          req = req.or(`name.ilike.%${trimmed}%,tag.ilike.%${trimmed}%`);
        }

        const { data } = await req;
        if (data) {
          setResults(data as Team[]);
        }
      } catch (err) {
        console.error('Error searching teams:', err);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, isOpen, excludeTeamId]);

  const handleSelect = (team: Team) => {
    setSelectedTeam(team);
    onSelect(team);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    setSelectedTeam(null);
    onSelect(null);
    setQuery('');
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-zinc-300">
          {label}
        </label>
      )}

      {selectedTeam ? (
        <div className="h-11 flex items-center justify-between px-3 rounded-xl input-3d bg-[#121212] border border-white/20 text-white shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-black border border-white/15 overflow-hidden flex items-center justify-center shrink-0">
              {selectedTeam.logo_url ? (
                <img
                  src={selectedTeam.logo_url}
                  alt={selectedTeam.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
              )}
            </div>
            <span className="text-xs font-black text-white truncate">{selectedTeam.name}</span>
            <span className="px-1.5 py-0.2 rounded bg-white/10 text-white text-[10px] font-mono font-bold">
              [{selectedTeam.tag}]
            </span>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition shrink-0"
            title="إلغاء واختيار فريق آخر"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full h-11 text-xs pr-9 pl-8 py-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
            />
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-zinc-400 animate-spin absolute left-3 pointer-events-none" />
            ) : query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-zinc-400 hover:text-white absolute left-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div className="absolute top-full right-0 left-0 mt-1.5 max-h-60 bg-[#0e0e0e] border border-white/15 rounded-2xl shadow-sm overflow-y-auto z-50 p-1.5 space-y-1 no-scrollbar animate-in fade-in duration-100">
              {isLoading && results.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>جاري البحث في أندية IEH...</span>
                </div>
              ) : results.length > 0 ? (
                results.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelect(t)}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-right hover:bg-white/10 transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-black border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                        {t.logo_url ? (
                          <img src={t.logo_url} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          <Shield className="w-4 h-4 text-zinc-500" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-white truncate">
                            {t.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-white/10 text-white text-[9px] font-mono font-bold">
                            [{t.tag}]
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {t.city} {t.games?.[0] ? `• ${t.games[0]}` : ''}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] text-zinc-500 font-bold px-2 py-0.5 rounded-md bg-white/5 group-hover:bg-white group-hover:text-black transition shrink-0 mr-2">
                      اختيار
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-zinc-500">
                  لم يتم العثور على فريق بهذا الاسم في شبكة IEH
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[10px] font-bold text-zinc-400">{error}</p>}
    </div>
  );
}
