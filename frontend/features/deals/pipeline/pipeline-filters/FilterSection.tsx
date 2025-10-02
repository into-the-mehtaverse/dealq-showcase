import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { LucideIcon } from 'lucide-react';

interface FilterSectionProps {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}

export default function FilterSection({ icon: Icon, title, children }: FilterSectionProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </Label>
      {children}
    </div>
  );
}
