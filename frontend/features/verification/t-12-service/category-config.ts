/**
 * T12 Category Configuration
 *
 * Defines the structure and configuration for T12 financial categories
 * organized into four main buckets: Revenues, Deductions, Expenses, and Subtotals.
 */

import { T12_CATEGORY_DEFINITIONS, CATEGORY_GROUP_DISPLAY } from './category-constants';

export interface CategoryInfo {
  label: string;
  color: string;
  icon: string;
  type: 'revenue' | 'deduction' | 'expense' | 'subtotal';
}

export interface CategoryGroup {
  name: string;
  categories: Record<string, CategoryInfo>;
  color: string;
  calculationMethod: 'sum' | 'exclude';
}

// Build category groups directly from constants for efficiency
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    name: CATEGORY_GROUP_DISPLAY.REVENUES.name,
    categories: Object.fromEntries(
      Object.entries(T12_CATEGORY_DEFINITIONS.REVENUES).map(([key, value]) => [
        key,
        { ...value, type: 'revenue' as const }
      ])
    ),
    color: CATEGORY_GROUP_DISPLAY.REVENUES.color,
    calculationMethod: 'sum'
  },
  {
    name: CATEGORY_GROUP_DISPLAY.DEDUCTIONS.name,
    categories: Object.fromEntries(
      Object.entries(T12_CATEGORY_DEFINITIONS.DEDUCTIONS).map(([key, value]) => [
        key,
        { ...value, type: 'deduction' as const }
      ])
    ),
    color: CATEGORY_GROUP_DISPLAY.DEDUCTIONS.color,
    calculationMethod: 'sum'
  },
  {
    name: CATEGORY_GROUP_DISPLAY.EXPENSES.name,
    categories: Object.fromEntries(
      Object.entries(T12_CATEGORY_DEFINITIONS.EXPENSES).map(([key, value]) => [
        key,
        { ...value, type: 'expense' as const }
      ])
    ),
    color: CATEGORY_GROUP_DISPLAY.EXPENSES.color,
    calculationMethod: 'sum'
  },
  {
    name: CATEGORY_GROUP_DISPLAY.SUBTOTALS.name,
    categories: Object.fromEntries(
      Object.entries(T12_CATEGORY_DEFINITIONS.SUBTOTALS).map(([key, value]) => [
        key,
        { ...value, type: 'subtotal' as const }
      ])
    ),
    color: CATEGORY_GROUP_DISPLAY.SUBTOTALS.color,
    calculationMethod: 'exclude'
  }
];

// Flattened categories for easy lookup
export const ALL_CATEGORIES: Record<string, CategoryInfo> = Object.values(CATEGORY_GROUPS).reduce(
  (acc, group) => ({ ...acc, ...group.categories }),
  {}
);

// Utility functions
export function getCategoryInfo(category: string): CategoryInfo {
  return ALL_CATEGORIES[category] || {
    label: "Uncategorized",
    color: "bg-gray-100 text-gray-800",
    icon: "❓",
    type: "expense"
  };
}

export function getCategoryGroup(category: string): CategoryGroup | null {
  for (const group of CATEGORY_GROUPS) {
    if (category in group.categories) {
      return group;
    }
  }
  return null;
}
