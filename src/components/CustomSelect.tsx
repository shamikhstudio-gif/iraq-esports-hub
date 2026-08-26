'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface CustomSelectProps {
  options: (string | SelectOption)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'اختر من القائمة...',
  icon,
  className = '',
  label,
  error,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to SelectOption objects
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative text-right ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-300 mb-1.5 select-none">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl border transition-all duration-200 outline-none select-none ${
          disabled
            ? 'bg-[#080808] text-zinc-600 border-white/5 cursor-not-allowed'
            : isOpen
            ? 'bg-[#181818] border-white/40 ring-1 ring-white/30 text-white shadow-[0_4px_14px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)]'
            : 'bg-[#080808] hover:border-white/25 border-white/10 text-zinc-200 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.05)]'
        } ${error ? 'border-white ring-1 ring-white/40' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-zinc-400 shrink-0">{icon}</span>}
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className={`font-semibold truncate ${!selectedOption ? 'text-zinc-500 font-normal' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border border-white/20">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <div className="flex items-center pl-0.5 shrink-0">
          <ChevronDown
            className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ease-out ${
              isOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu with Animation */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1.5 w-full bg-[#0e0e0e] rounded-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden py-1.5 max-h-60 overflow-y-auto modal-animate"
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3.5 py-3 text-xs text-zinc-500 text-center">
              لا توجد خيارات متاحة
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors duration-150 text-right ${
                    isSelected
                      ? 'bg-white text-black font-extrabold'
                      : 'text-zinc-300 hover:bg-white/10 hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                        isSelected ? 'bg-black text-white border-black' : 'bg-white/10 text-zinc-400 border-white/10'
                      }`}>
                        {opt.badge}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-black shrink-0 mr-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {error && <p className="mt-1 text-[11px] text-zinc-400 font-medium">{error}</p>}
    </div>
  );
}
