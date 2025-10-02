"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowUpDown, SortAsc, SortDesc } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineSortingProps {
  sortConfig: {
    sort_by: string;
    sort_order: 'asc' | 'desc';
  };
  onSortChange: (newSortConfig: Partial<{
    sort_by: string;
    sort_order: 'asc' | 'desc';
  }>) => void;
}

const sortableFields = [
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'property_name', label: 'Property Name' },
  { value: 'asking_price', label: 'Asking Price' },
  { value: 'number_of_units', label: 'Number of Units' },
  { value: 'year_built', label: 'Year Built' }
];

export default function PipelineSorting({ sortConfig, onSortChange }: PipelineSortingProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSortFieldChange = (field: string) => {
    onSortChange({ sort_by: field });
    setIsOpen(false);
  };

  const handleSortOrderChange = (order: 'asc' | 'desc') => {
    onSortChange({ sort_order: order });
    setIsOpen(false);
  };



  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 gap-2"
        >
          <span className="hidden sm:inline">Sort by</span>
          <span className="sm:hidden">Sort</span>
          {sortConfig.sort_order === 'asc' ? (
            <SortAsc className="w-3 h-3" />
          ) : (
            <SortDesc className="w-3 h-3" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start" side="bottom" sideOffset={4}>
        <div className="space-y-3">
          {/* Sort Field Selection */}
          <div className="space-y-1">
            <div className="grid grid-cols-1 gap-1">
              {sortableFields.map(field => (
                <button
                  key={field.value}
                  onClick={() => handleSortFieldChange(field.value)}
                  className={cn(
                    "flex items-center gap-2 p-1.5 text-sm rounded-md text-left transition-colors",
                    sortConfig.sort_by === field.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <span>{field.label}</span>
                  {sortConfig.sort_by === field.value && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Order Selection */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSortOrderChange('asc')}
                className={cn(
                  "flex items-center justify-center gap-1 p-1.5 text-sm rounded-md transition-colors",
                  sortConfig.sort_order === 'asc'
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted border border-input"
                )}
              >
                <SortAsc className="w-3 h-3" />
                Asc
                {sortConfig.sort_order === 'asc' && (
                  <span className="text-xs">✓</span>
                )}
              </button>
              <button
                onClick={() => handleSortOrderChange('desc')}
                className={cn(
                  "flex items-center justify-center gap-1 p-1.5 text-sm rounded-md transition-colors",
                  sortConfig.sort_order === 'desc'
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted border border-input"
                  )}
              >
                <SortDesc className="w-3 h-3" />
                Desc
                {sortConfig.sort_order === 'desc' && (
                  <span className="text-xs">✓</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
