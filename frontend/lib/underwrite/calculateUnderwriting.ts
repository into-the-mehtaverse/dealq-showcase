import { UnderwritingAssumptions, UnderwritingAnalysis } from './types';
import { validateAssumptions } from './utils';
import { calculateNOIProjections } from './calcNOI';
import { calculateDebtService, calculateDSCRByYear } from './calcDebtService';
import { buildProFormaCashFlows, calculateExitAnalysis, calculateInvestmentMetrics, calculateKPIs } from './buildProforma';
import { calculateIRRAnalysis } from './calcIRR';

/**
 * Main underwriting calculation function
 * Orchestrates all calculations and returns complete analysis
 */
export function calculateUnderwriting(
  year1Revenue: number,
  year1Expenses: number,
  assumptions: UnderwritingAssumptions
): UnderwritingAnalysis {
  // Validate inputs
  const assumptionErrors = validateAssumptions(assumptions);

  if (year1Revenue <= 0) {
    throw new Error('Year 1 revenue must be greater than 0');
  }

  if (year1Expenses < 0) {
    throw new Error('Year 1 expenses cannot be negative');
  }

  if (assumptionErrors.length > 0) {
    throw new Error(`Validation errors: ${assumptionErrors.join(', ')}`);
  }

  // Calculate NOI projections
  const { year1NOI, projections: noiProjections } = calculateNOIProjections(year1Revenue, year1Expenses, assumptions);

  // Calculate debt service
  const debtService = calculateDebtService(assumptions);

  // Calculate exit analysis first (needed for final year cash flow)
  const exitAnalysis = calculateExitAnalysis(noiProjections, assumptions, debtService);

  // Build pro forma cash flows (includes exit proceeds in final year)
  const proFormaCashFlows = buildProFormaCashFlows(noiProjections, debtService, exitAnalysis);

  // Calculate DSCR by year
  const dscrByYear = calculateDSCRByYear(noiProjections, debtService.annualDebtService);

  // Calculate IRR analysis
  const irrAnalysis = calculateIRRAnalysis(
    noiProjections,
    proFormaCashFlows,
    assumptions.purchasePrice,
    debtService.loanAmount,
    exitAnalysis
  );

  // Calculate investment metrics
  const { totalInvestment, totalReturn, totalProfit } = calculateInvestmentMetrics(
    assumptions.purchasePrice,
    debtService,
    proFormaCashFlows
  );

  // Calculate KPIs (cash on cash return, cap rate, etc.)
  const kpis = calculateKPIs(noiProjections, proFormaCashFlows, assumptions.purchasePrice, debtService);

  return {
    year1NOI,
    noiProjections,
    proFormaCashFlows,
    debtService,
    dscrByYear,
    irrAnalysis,
    exitAnalysis,
    totalInvestment,
    totalReturn,
    totalProfit,
    // Add KPI metrics
    cashOnCashReturn: kpis.cashOnCashReturn,
    capRate: kpis.capRate,
    noiGrowthRate: kpis.noiGrowthRate,
    averageDSCR: kpis.averageDSCR,
    minimumDSCR: kpis.minimumDSCR
  };
}

/**
 * Calculates underwriting with custom loan amount
 */
export function calculateUnderwritingWithCustomLoan(
  year1Revenue: number,
  year1Expenses: number,
  assumptions: UnderwritingAssumptions,
  customLoanAmount: number
): UnderwritingAnalysis {
  // Validate custom loan amount
  if (customLoanAmount > assumptions.purchasePrice) {
    throw new Error('Loan amount cannot exceed purchase price');
  }

  if (customLoanAmount < 0) {
    throw new Error('Loan amount cannot be negative');
  }

  // Calculate underwriting with custom debt service
  const { year1NOI, projections: noiProjections } = calculateNOIProjections(year1Revenue, year1Expenses, assumptions);

  // Calculate custom debt service
  const customDebtService = {
    loanAmount: customLoanAmount,
    annualDebtService: customLoanAmount * assumptions.interestRate,
    monthlyDebtService: (customLoanAmount * assumptions.interestRate) / 12,
    interestOnlyPayment: customLoanAmount * assumptions.interestRate
  };

  // Calculate exit analysis first (needed for final year cash flow)
  const exitAnalysis = calculateExitAnalysis(noiProjections, assumptions, customDebtService);

  // Build pro forma cash flows with custom debt service (includes exit proceeds in final year)
  const proFormaCashFlows = buildProFormaCashFlows(noiProjections, customDebtService, exitAnalysis);

  // Calculate DSCR by year
  const dscrByYear = calculateDSCRByYear(noiProjections, customDebtService.annualDebtService);

  // Calculate IRR analysis
  const irrAnalysis = calculateIRRAnalysis(
    noiProjections,
    proFormaCashFlows,
    assumptions.purchasePrice,
    customDebtService.loanAmount,
    exitAnalysis
  );

  // Calculate investment metrics
  const { totalInvestment, totalReturn, totalProfit } = calculateInvestmentMetrics(
    assumptions.purchasePrice,
    customDebtService,
    proFormaCashFlows
  );

  // Calculate KPIs with custom debt service
  const kpis = calculateKPIs(noiProjections, proFormaCashFlows, assumptions.purchasePrice, customDebtService);

  return {
    year1NOI,
    noiProjections,
    proFormaCashFlows,
    debtService: customDebtService,
    dscrByYear,
    irrAnalysis,
    exitAnalysis,
    totalInvestment,
    totalReturn,
    totalProfit,
    // Add KPI metrics
    cashOnCashReturn: kpis.cashOnCashReturn,
    capRate: kpis.capRate,
    noiGrowthRate: kpis.noiGrowthRate,
    averageDSCR: kpis.averageDSCR,
    minimumDSCR: kpis.minimumDSCR
  };
}
