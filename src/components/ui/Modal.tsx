'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  accentColor?: string;
  size?: ModalSize;
  fixedHeight?: boolean | string;
  subHeader?: ReactNode;
  children: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    icon?: ReactNode;
    variant?: 'primary' | 'danger' | 'success';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  statusNotice?: {
    type: 'error' | 'success' | 'warning' | 'info';
    message: string;
  } | null;
  className?: string;
  bodyClassName?: string;
  closeOnBackdrop?: boolean;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
  '3xl': 'max-w-5xl',
  '4xl': 'max-w-6xl',
  full: 'max-w-[95vw] h-[95vh]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  accentColor = '#ffffff',
  size = 'lg',
  fixedHeight,
  subHeader,
  children,
  headerActions,
  footer,
  primaryAction,
  secondaryAction,
  statusNotice,
  className = '',
  bodyClassName = '',
  closeOnBackdrop = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, mounted, onClose]);

  if (!mounted || !isOpen) return null;

  const heightStyle =
    typeof fixedHeight === 'string'
      ? { height: fixedHeight, minHeight: '520px', maxHeight: '92vh' }
      : undefined;

  const heightClass =
    fixedHeight === true
      ? 'h-[90vh] sm:h-[84vh] min-h-[560px] max-h-[850px]'
      : 'max-h-[92vh]';

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={closeOnBackdrop ? onClose : undefined}
      dir="rtl"
    >
      <div
        className={`w-full ${SIZE_CLASSES[size]} ${heightClass} flex flex-col rounded-3xl bg-[#0d0d0d] border border-white/15 shadow-2xl overflow-hidden text-right text-white relative modal-animate ${className}`}
        style={heightStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-20 pointer-events-none opacity-80"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
          }}
        />

        {/* Modal Header */}
        {(title || icon) && (
          <div
            className="p-4 sm:p-5 border-b border-white/10 shrink-0 flex items-center justify-between relative z-10 select-none"
            style={{
              background: `linear-gradient(180deg, ${accentColor.startsWith('#') ? `${accentColor}18` : accentColor} 0%, rgba(13, 13, 13, 0.98) 100%)`,
            }}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {icon && (
                <div
                  className="w-10 h-10 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-center shrink-0 shadow-inner"
                  style={{ color: accentColor }}
                >
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-white truncate">
                    {title}
                  </h3>
                </div>
                {subtitle && (
                  <p className="text-[11px] text-zinc-400 mt-0.5 truncate leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Header Right Actions & Close */}
            <div className="flex items-center gap-2 shrink-0 mr-2">
              {headerActions}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Modal SubHeader (e.g. pinned navigation tabs) */}
        {subHeader && (
          <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-white/10 bg-[#0d0d0d] shrink-0 relative z-10">
            {subHeader}
          </div>
        )}

        {/* Status Notice Alert */}
        {statusNotice && (
          <div
            className={`px-5 py-2.5 text-xs font-bold flex items-center gap-2 shrink-0 border-b ${
              statusNotice.type === 'error'
                ? 'bg-white/10 border-white/20 text-white'
                : statusNotice.type === 'success'
                ? 'bg-white text-black font-black border-white'
                : 'bg-white/5 border-white/15 text-zinc-300'
            }`}
          >
            {statusNotice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            ) : statusNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
            )}
            <span>{statusNotice.message}</span>
          </div>
        )}

        {/* Modal Body - Guaranteed Scrollable with zero clipping */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4 scrollbar-cyber ${bodyClassName}`}
        >
          {children}
        </div>

        {/* Modal Footer */}
        {(footer || primaryAction || secondaryAction) && (
          <div className="p-4 sm:p-5 bg-[#080808] border-t border-white/10 shrink-0 min-h-[64px] flex items-center justify-between gap-3 shadow-inner">
            {footer ? (
              footer
            ) : (
              <>
                <div>
                  {secondaryAction && (
                    <button
                      type="button"
                      onClick={secondaryAction.onClick}
                      disabled={secondaryAction.disabled}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {secondaryAction.label}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {primaryAction && (
                    <button
                      type="button"
                      onClick={primaryAction.onClick}
                      disabled={primaryAction.disabled || primaryAction.isLoading}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50 ${
                        primaryAction.variant === 'danger'
                          ? 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
                          : 'bg-white hover:bg-zinc-200 text-black'
                      }`}
                    >
                      {primaryAction.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                      ) : (
                        primaryAction.icon
                      )}
                      <span>{primaryAction.label}</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
