import { DealSummary } from '@/types/api/dealSummary';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Building, Calendar, MapPin } from 'lucide-react';
import { calculateNOI, calculateCapRate, calculatePricePerUnit } from '../utils/metrics';

interface DealCardDetailedProps {
  deal: DealSummary;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (dealId: string, selected: boolean) => void;
}

export default function DealCardDetailed({
  deal,
  isSelectionMode = false,
  isSelected = false,
  onSelectionChange
}: DealCardDetailedProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.preventDefault();
      onSelectionChange?.(deal.id, !isSelected);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectionChange?.(deal.id, !isSelected);
  };

  const cardContent = (
    <Card className={`group overflow-hidden p-0 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 ${
      isSelectionMode && isSelected
        ? 'border-primary bg-primary/5'
        : 'border-slate-200'
    }`}>


      {/* Property Image with Status Badge */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={deal.image_url || "/icon-deal-card.png"}
          alt={deal.property_name || 'Property'}
          className="w-full h-full bg-slate-200 object-cover"
        />
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={`text-white text-xs px-2 py-1 rounded-full font-medium ${
            deal.status === 'active' ? 'bg-green-500' :
            deal.status === 'draft' ? 'bg-orange-500' :
            deal.status === 'dead' ? 'bg-red-500' :
            'bg-gray-500'
          }`}>
            {deal.status === 'active' ? 'Active' :
             deal.status === 'draft' ? 'Draft' :
             deal.status === 'dead' ? 'Dead' :
             deal.status || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Property Details */}
      <CardContent className="px-4 pb-4">
        {/* Property Name */}
        <div className="mb-2">
          <h3 className="text-lg font-bold text-slate-900 truncate">
            {deal.property_name || 'Unnamed Property'}
          </h3>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 h-12">
          <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-500 line-clamp-2 leading-tight">
            {deal.address || (deal.city && deal.state ? `${deal.city}, ${deal.state}` : 'Unknown')}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 mb-6">
          {/* Price */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Price</p>
            <p className="text-lg font-bold text-slate-900">
              ${deal.asking_price ? (deal.asking_price / 1000000).toFixed(1) + 'M' : 'Unknown'}
            </p>
          </div>

          {/* Cap Rate */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Cap Rate</p>
            <p className="text-lg font-bold text-slate-900">
              {(() => {
                const noi = calculateNOI(deal.revenue, deal.expenses);
                const capRate = calculateCapRate(noi, deal.asking_price);
                return capRate ? capRate.toFixed(1) + '%' : 'Unknown';
              })()}
            </p>
          </div>

          {/* NOI */}
          <div>
            <p className="text-xs text-slate-500 mb-1">NOI</p>
            <p className="text-lg font-bold text-slate-900">
              {(() => {
                const noi = calculateNOI(deal.revenue, deal.expenses);
                if (!noi) return 'Unknown';
                if (noi >= 1000000) {
                  return '$' + (noi / 1000000).toFixed(1) + 'M';
                } else {
                  return '$' + (noi / 1000).toFixed(0) + 'K';
                }
              })()}
            </p>
          </div>

          {/* Units */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Units</p>
            <p className="text-lg font-bold text-slate-900">
              {deal.number_of_units || 'Unknown'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isSelectionMode) {
    return (
      <div onClick={handleCardClick}>
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={`/dashboard/deals/${deal.id}`}>
      {cardContent}
    </Link>
  );
}
