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
        <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <Skeleton className="mb-3 h-4 w-2/3" />
          <Skeleton className="mb-4 h-3 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}