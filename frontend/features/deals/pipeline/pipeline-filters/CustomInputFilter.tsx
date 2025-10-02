import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface CustomInputFilterProps {
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder: string;
  buttonText: string;
}

export default function CustomInputFilter({
  values,
  onValuesChange,
  placeholder,
}: CustomInputFilterProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddValue = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !values.includes(trimmedValue)) {
      onValuesChange([...values, trimmedValue]);
      setInputValue('');
    }
  };

  const handleRemoveValue = (valueToRemove: string) => {
    onValuesChange(values.filter(value => value !== valueToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddValue();
    }
  };

  return (
    <div className="space-y-3">
      {/* Input and Add Button */}
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="h-8 text-sm flex-1"
        />
        <Button
          onClick={handleAddValue}
          size="sm"
          className="h-8 px-3"
          disabled={!inputValue.trim()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Selected Values Badges */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {values.map(value => (
            <Badge key={value} variant="secondary" className="h-6 px-2 text-xs">
              {value}
              <button
                onClick={() => handleRemoveValue(value)}
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
