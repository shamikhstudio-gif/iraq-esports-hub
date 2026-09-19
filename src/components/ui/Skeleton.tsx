import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white/[0.06] border border-white/[0.04] rounded-xl animate-pulse ${className}`}
    />
  );
}

export function PostSkeleton() {
  return (
    <div className="ig-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="w-28 h-3.5" />
            <Skeleton className="w-16 h-2.5" />
          </div>
        </div>
        <Skeleton className="w-12 h-5 rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-4/5 h-3" />
      </div>
      <Skeleton className="w-full h-48 sm:h-64 rounded-xl" />
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        <div className="flex gap-4">
          <Skeleton className="w-12 h-6" />
          <Skeleton className="w-12 h-6" />
        </div>
        <Skeleton className="w-8 h-6" />
      </div>
    </div>
  );
}

export function TeamCardSkeleton() {
  return (
    <div className="card-3d p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="w-32 h-3.5" />
          <Skeleton className="w-20 h-2.5" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="bg-[#0c0c0c] rounded-3xl border border-white/10 p-4 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="w-28 h-3.5" />
              <Skeleton className="w-16 h-2.5" />
            </div>
          </div>
          <div className="flex gap-6">
            <Skeleton className="w-12 h-4" />
            <Skeleton className="w-12 h-4" />
            <Skeleton className="w-16 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
