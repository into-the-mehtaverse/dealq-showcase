import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DealCardSkeleton() {
  return (
    <Card className="overflow-hidden border-2 border-slate-200">
      <div className="relative">
        {/* Image skeleton */}
        <div className="aspect-[4/3] bg-slate-200">
          <Skeleton className="w-full h-full" />
        </div>
      </div>

      {/* Content skeleton */}
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Property name skeleton */}
            <Skeleton className="h-5 w-3/4" />
            {/* Address skeleton */}
            <Skeleton className="h-4 w-1/2" />
          </div>
          {/* Arrow button skeleton */}
          <Skeleton className="h-8 w-8 rounded-md flex-shrink-0 ml-2" />
        </div>
      </CardContent>
    </Card>
  );
}
