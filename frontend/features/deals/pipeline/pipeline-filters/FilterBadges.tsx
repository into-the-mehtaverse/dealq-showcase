import { Badge } from '@/components/ui/badge';

interface FilterBadgesProps {
  filters: Record<string, any>;
}

export default function FilterBadges({ filters }: FilterBadgesProps) {
  const activeFilterCount = Object.values(filters).filter(value =>
    value !== undefined && value !== null &&
    (Array.isArray(value) ? value.length > 0 : value !== '')
  ).length;

  if (activeFilterCount === 0) return null;

  return (
    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
      {activeFilterCount}
    </Badge>
  );
}
