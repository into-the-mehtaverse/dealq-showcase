import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface MultiSelectFilterProps {
  options: string[];
  selectedValues: string[];
  onSelectionChange: (value: string, checked: boolean) => void;
  onRemoveValue: (value: string) => void;
  gridCols?: number;
}

export default function MultiSelectFilter({
  options,
  selectedValues,
  onSelectionChange,
  onRemoveValue,
  gridCols = 2
}: MultiSelectFilterProps) {
  return (
    <div className="space-y-2">
      {/* Checkboxes */}
      <div className={`grid grid-cols-${gridCols} gap-2`}>
        {options.map(option => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={(e) => onSelectionChange(option, e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>

      {/* Selected Values Badges */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map(value => (
            <Badge key={value} variant="secondary" className="h-6 px-2 text-xs">
              {value}
              <button
                onClick={() => onRemoveValue(value)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
