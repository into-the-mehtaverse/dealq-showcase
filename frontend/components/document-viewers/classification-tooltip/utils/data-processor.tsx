import { ClassificationData, isClassificationData } from '../types';

// Process classification data for display
export const processClassificationData = (
  classification: Record<string, ClassificationData | number[] | null>
): {
  fieldEntries: Array<[string, ClassificationData]>;
  t12Pages: number[];
  rentRollPages: number[];
} => {
  const fieldEntries: Array<[string, ClassificationData]> = [];
  const t12Pages: number[] = [];
  const rentRollPages: number[] = [];

  Object.entries(classification).forEach(([key, value]) => {
    if (key === 't12' && Array.isArray(value)) {
      t12Pages.push(...value);
    } else if (key === 'rent_roll' && Array.isArray(value)) {
      rentRollPages.push(...value);
    } else if (isClassificationData(value)) {
      fieldEntries.push([key, value]);
    }
  });

  // Sort field entries by page number
  fieldEntries.sort(([, a], [, b]) => a.first_page - b.first_page);

  // Sort page arrays
  t12Pages.sort((a, b) => a - b);
  rentRollPages.sort((a, b) => a - b);

  return {
    fieldEntries,
    t12Pages,
    rentRollPages
  };
};

// Check if classification has any data
export const hasClassificationData = (
  classification: Record<string, ClassificationData | number[] | null>
): boolean => {
  return Object.values(classification).some(value =>
    value !== null && (
      isClassificationData(value) ||
      (Array.isArray(value) && value.length > 0)
    )
  );
};

// Get summary statistics
export const getClassificationSummary = (
  classification: Record<string, ClassificationData | number[] | null>
): {
  totalFields: number;
  totalT12Pages: number;
  totalRentRollPages: number;
  pageRange: { min: number; max: number };
} => {
  const { fieldEntries, t12Pages, rentRollPages } = processClassificationData(classification);

  const allPages = [
    ...fieldEntries.map(([, data]) => data.first_page),
    ...t12Pages,
    ...rentRollPages
  ];

  return {
    totalFields: fieldEntries.length,
    totalT12Pages: t12Pages.length,
    totalRentRollPages: rentRollPages.length,
    pageRange: {
      min: allPages.length > 0 ? Math.min(...allPages) : 0,
      max: allPages.length > 0 ? Math.max(...allPages) : 0
    }
  };
};
