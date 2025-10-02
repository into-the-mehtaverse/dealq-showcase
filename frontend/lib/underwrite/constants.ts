import { UnderwritingAssumptions } from './types';

/**
 * Default underwriting assumptions for when deal data is incomplete
 * These provide reasonable starting points for commercial real estate analysis
 */
export const DEFAULT_UNDERWRITING_ASSUMPTIONS: UnderwritingAssumptions = {
  purchasePrice: 0, // Will be set from deal data
  revenueGrowth: 0.03, // 3% annual growth - conservative estimate
  expenseGrowth: 0.025, // 2.5% annual growth - slightly less than revenue
  holdPeriodYears: 5, // 5-year hold period - standard for CRE
  interestRate: 0.065, // 6.5% interest rate - current market rate
  loanTermYears: 30, // 30-year loan term - standard commercial loan
  exitCapRate: 0.06, // 6% exit cap rate - reasonable for exit analysis
  ltvRatio: 0.75, // 75% loan-to-value ratio - standard commercial LTV
};

/**
 * Loan-to-Value (LTV) ratio for debt calculations
 * Standard commercial real estate LTV is typically 65-75%
 */
export const DEFAULT_LTV_RATIO = 0.70; // 70% LTV

/**
 * Minimum DSCR (Debt Service Coverage Ratio) requirements
 * Lenders typically require DSCR > 1.25
 */
export const MINIMUM_DSCR = 1.25;

/**
 * Maximum acceptable DSCR for risk assessment
 * Very high DSCR might indicate overly conservative assumptions
 */
export const MAXIMUM_DSCR = 2.5;

/**
 * Default hold period options for users to choose from
 */
export const HOLD_PERIOD_OPTIONS = [3, 5, 7, 10, 15];

/**
 * Default interest rate options (as percentages)
 */
export const INTEREST_RATE_OPTIONS = [5.5, 6.0, 6.5, 7.0, 7.5, 8.0];

/**
 * Default exit cap rate options (as percentages)
 */
export const EXIT_CAP_RATE_OPTIONS = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5];

/**
 * Revenue and expense growth rate options (as percentages)
 */
export const GROWTH_RATE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
