import { UnderwritingAssumptions, DebtServiceCalculation, NOIProjection } from './types';
import { roundToDecimals } from './utils';

/**
 * Calculates debt service for interest-only loan
 */
export function calculateDebtService(assumptions: UnderwritingAssumptions): DebtServiceCalculation {
  const loanAmount = assumptions.purchasePrice * assumptions.ltvRatio;
  const annualInterestRate = assumptions.interestRate;
  const annualDebtService = loanAmount * annualInterestRate;
  const monthlyDebtService = annualDebtService / 12;

  return {
    loanAmount: roundToDecimals(loanAmount),
    annualDebtService: roundToDecimals(annualDebtService),
    monthlyDebtService: roundToDecimals(monthlyDebtService),
    interestOnlyPayment: roundToDecimals(annualDebtService)
  };
}

/**
 * Calculates loan-to-value ratio
 */
export function calculateLTV(loanAmount: number, purchasePrice: number): number {
  if (purchasePrice === 0) return 0;
  return roundToDecimals(loanAmount / purchasePrice, 4);
}

/**
 * Calculates debt service coverage ratio (DSCR)
 */
export function calculateDSCR(noi: number, debtService: number): number {
  if (debtService === 0) return 0;
  return roundToDecimals(noi / debtService, 2);
}

/**
 * Calculates DSCR by year for the hold period
 */
export function calculateDSCRByYear(
  noiProjections: NOIProjection[],
  annualDebtService: number
): { year: number; dscr: number }[] {
  return noiProjections.map(projection => ({
    year: projection.year,
    dscr: calculateDSCR(projection.netOperatingIncome, annualDebtService)
  }));
}

/**
 * Calculates remaining debt at any point in time (interest-only loan)
 */
export function calculateRemainingDebt(
  initialLoanAmount: number,
  yearsElapsed: number,
  loanTermYears: number
): number {
  // For interest-only loan, principal remains constant until maturity
  if (yearsElapsed >= loanTermYears) {
    return 0; // Loan is fully paid off
  }
  return roundToDecimals(initialLoanAmount);
}

/**
 * Calculates debt yield (NOI / Loan Amount)
 */
export function calculateDebtYield(noi: number, loanAmount: number): number {
  if (loanAmount === 0) return 0;
  return roundToDecimals(noi / loanAmount, 4);
}

/**
 * Calculates maximum loan amount based on DSCR requirement
 */
export function calculateMaxLoanAmount(
  noi: number,
  interestRate: number,
  requiredDSCR: number = 1.25
): number {
  if (interestRate === 0) return 0;
  const maxDebtService = noi / requiredDSCR;
  const maxLoanAmount = maxDebtService / interestRate;
  return roundToDecimals(maxLoanAmount);
}

/**
 * Calculates debt yield by year
 */
export function calculateDebtYieldByYear(
  noiProjections: NOIProjection[],
  loanAmount: number
): { year: number; debtYield: number }[] {
  return noiProjections.map(projection => ({
    year: projection.year,
    debtYield: calculateDebtYield(projection.netOperatingIncome, loanAmount)
  }));
}
