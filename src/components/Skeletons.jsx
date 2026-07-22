import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ConversationListSkeleton() {
  return (
    <div className="space-y-1 px-2 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="px-3 py-2.5">
          <Skeleton className="mb-2 h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ProjectGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 pl-6"
        >
          <span className="absolute inset-y-0 left-0 w-[3px] bg-white/5" />
          <Skeleton className="mb-4 h-9 w-9 rounded-lg" />
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="mb-4 h-3 w-full" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
            <Skeleton className="h-3 w-16" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-9 rounded-full" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}