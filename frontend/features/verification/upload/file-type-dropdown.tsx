"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, FileText, BarChart3, Receipt } from 'lucide-react';

export type DocumentType = 'T12' | 'RR' | 'OM' | null;

interface FileTypeDropdownProps {
  value: DocumentType;
  onValueChange: (value: DocumentType) => void;
  disabled?: boolean;
  className?: string;
}

const documentTypeOptions = [
  { value: 'T12' as const, label: 'T-12 Report', icon: BarChart3 },
  { value: 'RR' as const, label: 'Rent Roll', icon: Receipt },
  { value: 'OM' as const, label: 'Offering Memorandum', icon: FileText },
];

export default function FileTypeDropdown({
  value,
  onValueChange,
  disabled = false,
  className = ""
}: FileTypeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = documentTypeOptions.find(option => option.value === value);
  const IconComponent = selectedOption?.icon || FileText;

  const getVariant = (docType: DocumentType) => {
    switch (docType) {
      case 'T12': return 'default';
      case 'RR': return 'secondary';
      case 'OM': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={`h-8 gap-2 ${className}`}
        >
          <IconComponent className="h-4 w-4" />
          {selectedOption ? selectedOption.label : 'Select Type'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {documentTypeOptions.map((option) => {
          const OptionIcon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => {
                onValueChange(option.value);
                setIsOpen(false);
              }}
              className="cursor-pointer"
            >
              <OptionIcon className="mr-2 h-4 w-4" />
              <span className="font-medium">{option.label}</span>
              {value === option.value && (
                <Badge variant={getVariant(option.value)} className="ml-auto">
                  Selected
                </Badge>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
