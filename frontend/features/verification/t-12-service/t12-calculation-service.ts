/**
 * T12 Calculation Service
 *
 * Handles all financial calculations for T12 data including:
 * - Revenue calculations
 * - Deduction calculations
 * - Expense calculations
 * - NOI calculations
 * - Category filtering and exclusions
 */

import { CATEGORY_GROUPS } from './category-config';

// T12 data structure
export interface T12DataItem {
  category: string;
  total: number;
  line_item: string;
  [key: string]: any; // Allow for additional fields
}

export interface FinancialSummary {
  totalRevenue: number;
  totalDeductions: number;
  totalExpenses: number;
  grossIncome: number;
  noi: number;
  lastCalculated: Date;
}

export class T12CalculationService {
  /**
   * Calculate total revenue from T12 data
   * Excludes subtotal categories to avoid double counting
   */
  static calculateRevenue(data: T12DataItem[]): number {
    const revenueGroup = CATEGORY_GROUPS.find(group => group.name === 'Revenues');
    if (!revenueGroup) return 0;

    const revenueItems = data.filter(item =>
      Object.keys(revenueGroup.categories).includes(item.category)
    );

    return revenueItems.reduce((sum, item) => sum + item.total, 0);
  }

  /**
   * Calculate total deductions from T12 data
   * Deductions are typically negative values, so we take the absolute value
   */
  static calculateDeductions(data: T12DataItem[]): number {
    const deductionGroup = CATEGORY_GROUPS.find(group => group.name === 'Deductions');
    if (!deductionGroup) return 0;

    const deductionItems = data.filter(item =>
      Object.keys(deductionGroup.categories).includes(item.category)
    );

    return deductionItems.reduce((sum, item) => sum + Math.abs(item.total), 0);
  }

  /**
   * Calculate total expenses from T12 data
   * Excludes subtotal categories to avoid double counting
   */
  static calculateExpenses(data: T12DataItem[]): number {
    const expenseGroup = CATEGORY_GROUPS.find(group => group.name === 'Expenses');
    if (!expenseGroup) return 0;

    const expenseItems = data.filter(item =>
      Object.keys(expenseGroup.categories).includes(item.category)
    );

    return expenseItems.reduce((sum, item) => sum + Math.abs(item.total), 0);
  }

  /**
   * Calculate subtotal categories (for display purposes only)
   * These are excluded from main calculations to avoid double counting
   */
  static calculateSubtotals(data: T12DataItem[]): number {
    const subtotalGroup = CATEGORY_GROUPS.find(group => group.name === 'Subtotals');
    if (!subtotalGroup) return 0;

    const subtotalItems = data.filter(item =>
      Object.keys(subtotalGroup.categories).includes(item.category)
    );

    return subtotalItems.reduce((sum, item) => sum + Math.abs(item.total), 0);
  }

  /**
   * Calculate gross income (Revenue - Deductions)
   * This represents the effective income after accounting for deductions
   */
  static calculateGrossIncome(data: T12DataItem[]): number {
    const revenue = this.calculateRevenue(data);
    const deductions = this.calculateDeductions(data);
    return revenue - deductions;
  }

  /**
   * Calculate Net Operating Income (NOI)
   * Formula: Gross Income - Total Expenses
   * Where Gross Income = Revenue - Deductions
   */
  static calculateNOI(data: T12DataItem[]): number {
    const grossIncome = this.calculateGrossIncome(data);
    const totalExpenses = this.calculateExpenses(data);
    return grossIncome - totalExpenses;
  }

  /**
   * Calculate all financial metrics at once
   * This is the main method used by the store to update computed financials
   */
  static calculateAll(data: T12DataItem[]): FinancialSummary {
    const totalRevenue = this.calculateRevenue(data);
    const totalDeductions = this.calculateDeductions(data);
    const totalExpenses = this.calculateExpenses(data);
    const grossIncome = this.calculateGrossIncome(data);
    const noi = this.calculateNOI(data);

    return {
      totalRevenue,
      totalDeductions,
      totalExpenses,
      grossIncome,
      noi,
      lastCalculated: new Date()
    };
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Validate T12 data structure
   */
  static validateData(data: T12DataItem[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(data)) {
      errors.push('Data must be an array');
      return { isValid: false, errors };
    }

    data.forEach((item, index) => {
      if (!item.category) {
        errors.push(`Item at index ${index} is missing category`);
      }
      if (typeof item.total !== 'number') {
        errors.push(`Item at index ${index} has invalid total: ${item.total}`);
      }
      if (!item.line_item) {
        errors.push(`Item at index ${index} is missing line_item`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
