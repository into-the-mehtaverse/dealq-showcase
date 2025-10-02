"use client";

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled for components that use browser APIs (PDF viewer)
const DealSummary = dynamic(() => import('@/features/deals/summary/deal-summary'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Loading deal details...</p>
      </div>
    </div>
  )
});

export default function DealDetailPage() {
  const params = useParams();
  // const router = useRouter();
  const dealId = params.dealId as string;

  // const handleDealDeleted = () => {
  //   // Navigate to the deals dashboard after successful deletion
  //   router.push('/dashboard/deals');
  // };

  return <DealSummary dealId={dealId}/>;
}
