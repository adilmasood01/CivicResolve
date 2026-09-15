import { Skeleton, SkeletonTableRows } from "@/components/layout/Skeleton";
import { PageContainer } from "@/components/layout/PageContainer";

export default function Loading() {
  return (
    <main className="dashboard-main">
      <PageContainer>
        <div className="mb-6 space-y-2 border-b border-border pb-5">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <SkeletonTableRows />
      </PageContainer>
    </main>
  );
}
