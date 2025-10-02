import { Input } from '@/components/ui/input';

interface RangeFilterProps {
  minValue?: number;
  maxValue?: number;
  onMinChange: (value: number | undefined) => void;
  onMaxChange: (value: number | undefined) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  minProps?: React.InputHTMLAttributes<HTMLInputElement>;
  maxProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export default function RangeFilter({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
  minProps = {},
  maxProps = {}
}: RangeFilterProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        placeholder={minPlaceholder}
        type="number"
        value={minValue || ''}
        onChange={(e) => onMinChange(e.target.value ? Number(e.target.value) : undefined)}
        className="h-8 text-sm"
        {...minProps}
      />
      <Input
        placeholder={maxPlaceholder}
        type="number"
        value={maxValue || ''}
        onChange={(e) => onMaxChange(e.target.value ? Number(e.target.value) : undefined)}
        className="h-8 text-sm"
        {...maxProps}
      />
    </div>
  );
}
