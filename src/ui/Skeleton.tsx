import React from "react";

interface SkeletonProps {
  className?: string;
  "data-testid"?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "", "data-testid": testId }) => (
  <div
    data-testid={testId}
    className={`animate-pulse rounded bg-slate-300 dark:bg-slate-700 ${className}`}
  />
);

export default Skeleton;

interface RepeatSkeletonProps {
  count?: number;
  isDarkMode?: boolean;
}

export const ListRowSkeleton: React.FC<RepeatSkeletonProps> = ({ count = 8, isDarkMode }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        data-testid="list-row-skeleton"
        className={`flex items-center gap-4 px-2 py-2 ${isDarkMode ? "bg-slate-800" : "bg-white"}`}
      >
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-32" />
      </div>
    ))}
  </>
);

export const CardSkeleton: React.FC<RepeatSkeletonProps> = ({ count = 6, isDarkMode }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        data-testid="card-skeleton"
        className={`rounded-lg shadow-lg overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-white"}`}
      >
        <Skeleton className="h-48 w-full rounded-none" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    ))}
  </>
);

export const StatSkeleton: React.FC<RepeatSkeletonProps> = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} data-testid="stat-skeleton" className="text-center">
        <Skeleton className="h-8 w-16 mx-auto mb-1" />
        <Skeleton className="h-4 w-20 mx-auto" />
      </div>
    ))}
  </>
);
