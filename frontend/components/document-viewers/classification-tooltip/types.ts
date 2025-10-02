// Type definitions for classification tooltip

export interface ClassificationData {
  value: string;
  first_page: number;
}

export interface ClassificationTooltipProps {
  classification: Record<string, ClassificationData | number[] | null>;
  onPageNavigate: (pageNumber: number) => void;
  trigger: React.ReactNode;
  className?: string;
}

export interface FieldItemProps {
  fieldName: string;
  data: ClassificationData;
  onPageClick: (pageNumber: number) => void;
}

export interface PageButtonProps {
  pageNumber: number;
  onClick: (pageNumber: number) => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

// Type guards
export const isClassificationData = (value: unknown): value is ClassificationData => {
  return (
    value !== null &&
    typeof value === 'object' &&
    'first_page' in value &&
    'value' in value &&
    typeof (value as ClassificationData).first_page === 'number' &&
    typeof (value as ClassificationData).value === 'string'
  );
};

export const isPageArray = (value: unknown): value is number[] => {
  return Array.isArray(value) && value.every(item => typeof item === 'number');
};
