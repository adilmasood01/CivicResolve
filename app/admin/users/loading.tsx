import { Skeleton, SkeletonTableRows } from "@/components/layout/Skeleton";

export default function Loading() {
  return (
    <>
      <div className="mb-6 space-y-2 border-b border-border pb-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <SkeletonTableRows />
    </>
  );
}
