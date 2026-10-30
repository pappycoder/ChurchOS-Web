import { Suspense } from "react";
import MemberDetail from "./member-detail";

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-40 animate-pulse rounded bg-line" />
      <div className="h-40 animate-pulse rounded-2xl bg-line" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-line" />
        ))}
      </div>
    </div>
  );
}

export default function MemberDetailRoute({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <MemberDetail params={params} />
    </Suspense>
  );
}
