import { DealSummary } from '@/types/api/dealSummary';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';

interface DealCardProps {
  deal: DealSummary;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (dealId: string, selected: boolean) => void;
}

export default function DealCard({
  deal,
  isSelectionMode = false,
  isSelected = false,
  onSelectionChange
}: DealCardProps) {
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
    <Card className={`group overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 ${
      isSelectionMode
        ? isSelected
          ? 'border-primary bg-primary/5'
          : 'border-slate-200'
        : 'border-slate-200'
    }`}>
      <div className="relative">
                {/* Selection Checkbox */}
        {isSelectionMode && (
          <div className="absolute top-2 left-2 z-10">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                isSelected
                  ? 'bg-primary border-primary'
                  : 'bg-white/90 border-white/90 hover:border-primary'
              }`}
              onClick={handleCheckboxClick}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
        )}

        {/* Property Image */}
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={deal.image_url || "/icon-deal-card.png"}
            alt={deal.property_name || 'Property'}
            className="w-full h-full bg-slate-200 object-cover"
          />
        </div>
      </div>

      {/* Property Name in the content area */}
      <CardContent className="px-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 truncate">
              {deal.property_name || 'Unnamed Property'}
            </h3>
            <p className="text-sm text-slate-500 truncate mt-1">
              {deal.city && deal.state
                ? `${deal.city}, ${deal.state}`
                : deal.address || 'No address'
              }
            </p>
          </div>
          {!isSelectionMode && (
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
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
