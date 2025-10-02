// Main underwriting calculation functions
export { calculateUnderwriting, calculateUnderwritingWithCustomLoan } from './calculateUnderwriting';

// NOI calculation functions
export { calculateNOIProjections, calculateYear1NOI, projectNOI } from './calcNOI';

// Debt service calculation functions
export { calculateDebtService, calculateDSCR, calculateDSCRByYear } from './calcDebtService';

// IRR calculation functions
export { calculateIRRAnalysis, calculateUnleveredIRR, calculateLeveredIRR } from './calcIRR';

// Pro forma and exit analysis functions
export { buildProFormaCashFlows, calculateExitAnalysis, calculateInvestmentMetrics } from './buildProforma';

// Utility functions
export {
  validateAssumptions,
  calculateIRR,
  roundToDecimals,
  formatAsPercentage,
  formatAsCurrency
} from './utils';

// Types
export type {
  UnderwritingAssumptions,
  UnderwritingAnalysis,
  NOIProjection,
  ProFormaCashFlow,
  DebtServiceCalculation,
  IRRCalculation,
  ExitAnalysis
} from './types';

// Constants
export {
  DEFAULT_UNDERWRITING_ASSUMPTIONS,
  DEFAULT_LTV_RATIO,
  MINIMUM_DSCR,
  MAXIMUM_DSCR,
  HOLD_PERIOD_OPTIONS,
  INTEREST_RATE_OPTIONS,
  EXIT_CAP_RATE_OPTIONS,
  GROWTH_RATE_OPTIONS
} from './constants';
