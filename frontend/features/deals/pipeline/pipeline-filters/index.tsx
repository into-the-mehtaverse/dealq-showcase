"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filter, Building, DollarSign, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import FilterSection from './FilterSection';
import RangeFilter from './RangeFilter';
import CustomInputFilter from './CustomInputFilter';
import FilterBadges from './FilterBadges';

interface PipelineFiltersProps {
  filters: {
    min_units?: number;
    max_units?: number;
    min_price?: number;
    max_price?: number;
    min_year_built?: number;
    max_year_built?: number;
    cities: string[];
    states: string[];
  };
  onFiltersChange: (newFilters: Partial<{
    min_units?: number;
    max_units?: number;
    min_price?: number;
    max_price?: number;
    min_year_built?: number;
    max_year_built?: number;
    cities: string[];
    states: string[];
  }>) => void;
}

export default function PipelineFilters({ filters, onFiltersChange }: PipelineFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [activeTab, setActiveTab] = useState('basic');

  const hasActiveFilters = Object.values(filters).some(value =>
    value !== undefined && value !== null &&
    (Array.isArray(value) ? value.length > 0 : value !== 0)
  );

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      min_units: undefined,
      max_units: undefined,
      min_price: undefined,
      max_price: undefined,
      min_year_built: undefined,
      max_year_built: undefined,
      cities: [],
      states: []
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    setIsOpen(false);
  };



  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-8 px-3 gap-2",
            hasActiveFilters && "bg-primary text-primary-foreground"
          )}
        >
          <Filter className="w-4 h-4" />
          Filters
          <FilterBadges filters={filters} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start" side="bottom" sideOffset={4}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-6 px-2 text-xs"
            >
              Reset
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
              <TabsTrigger value="location" className="text-xs">Location</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Units Range */}
              <FilterSection icon={Building} title="Units">
                <RangeFilter
                  minValue={localFilters.min_units}
                  maxValue={localFilters.max_units}
                  onMinChange={(value) => setLocalFilters(prev => ({ ...prev, min_units: value }))}
                  onMaxChange={(value) => setLocalFilters(prev => ({ ...prev, max_units: value }))}
                />
              </FilterSection>

              {/* Price Range */}
              <FilterSection icon={DollarSign} title="Price Range ($)">
                <RangeFilter
                  minValue={localFilters.min_price}
                  maxValue={localFilters.max_price}
                  onMinChange={(value) => setLocalFilters(prev => ({ ...prev, min_price: value }))}
                  onMaxChange={(value) => setLocalFilters(prev => ({ ...prev, max_price: value }))}
                />
              </FilterSection>

              {/* Year Built Range */}
              <FilterSection icon={Calendar} title="Year Built">
                <RangeFilter
                  minValue={localFilters.min_year_built}
                  maxValue={localFilters.max_year_built}
                  onMinChange={(value) => setLocalFilters(prev => ({ ...prev, min_year_built: value }))}
                  onMaxChange={(value) => setLocalFilters(prev => ({ ...prev, max_year_built: value }))}
                  minProps={{ min: 1800, max: 2030 }}
                  maxProps={{ min: 1800, max: 2030 }}
                />
              </FilterSection>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-4">
              {/* Cities */}
              <FilterSection icon={MapPin} title="Cities">
                <CustomInputFilter
                  values={localFilters.cities}
                  onValuesChange={(cities) => setLocalFilters(prev => ({ ...prev, cities }))}
                  placeholder="Enter city name..."
                  buttonText="Add City"
                />
              </FilterSection>

              {/* States */}
              <FilterSection icon={MapPin} title="States">
                <CustomInputFilter
                  values={localFilters.states}
                  onValuesChange={(states) => setLocalFilters(prev => ({ ...prev, states }))}
                  placeholder="Enter state code..."
                  buttonText="Add State"
                />
              </FilterSection>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleApplyFilters}
              size="sm"
              className="flex-1"
            >
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
