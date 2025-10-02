"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Filter, ChevronDown, X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterPanelProps {
  onFilterChange: (filters: Record<string, string[]>) => void;
  className?: string;
}

const statusOptions: FilterOption[] = [
  { value: 'all', label: 'All Deals' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'draft', label: 'Draft' },
];

const propertyTypeOptions: FilterOption[] = [
  { value: 'all', label: 'All Types' },
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'multifamily', label: 'Multifamily' },
  { value: 'hotel', label: 'Hotel' },
];

export default function FilterPanel({ onFilterChange, className }: FilterPanelProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    status: ['all'],
    propertyType: ['all'],
  });

  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...activeFilters };

    if (value === 'all') {
      newFilters[filterType] = ['all'];
    } else {
      const currentValues = newFilters[filterType] || [];
      if (currentValues.includes('all')) {
        newFilters[filterType] = [value];
      } else if (currentValues.includes(value)) {
        newFilters[filterType] = currentValues.filter(v => v !== value);
        if (newFilters[filterType].length === 0) {
          newFilters[filterType] = ['all'];
        }
      } else {
        newFilters[filterType] = [...currentValues, value];
      }
    }

    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      status: ['all'],
      propertyType: ['all'],
    };
    setActiveFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, values) => {
      return count + values.filter(v => v !== 'all').length;
    }, 0);
  };

  const getFilterLabel = (filterType: string) => {
    const values = activeFilters[filterType] || [];
    if (values.includes('all') || values.length === 0) {
      return filterType === 'status' ? 'Status' : 'Property Type';
    }
    return `${values.length} selected`;
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="mr-2 h-4 w-4" />
            {getFilterLabel('status')}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {statusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleFilterChange('status', option.value)}
              className="cursor-pointer"
            >
              {option.label}
              {activeFilters.status?.includes(option.value) && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Property Type Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="mr-2 h-4 w-4" />
            {getFilterLabel('propertyType')}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {propertyTypeOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleFilterChange('propertyType', option.value)}
              className="cursor-pointer"
            >
              {option.label}
              {activeFilters.propertyType?.includes(option.value) && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filters Badge */}
      {getActiveFilterCount() > 0 && (
        <Badge variant="secondary" className="h-9 px-3">
          {getActiveFilterCount()} active
        </Badge>
      )}

      {/* Clear All Button */}
      {getActiveFilterCount() > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-9 text-muted-foreground hover:text-foreground"
        >
          <X className="mr-2 h-4 w-4" />
          Clear all
        </Button>
      )}
    </div>
  );
}
