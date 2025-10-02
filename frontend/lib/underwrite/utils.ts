import { UnderwritingAssumptions } from './types';

/**
 * Validates underwriting assumptions
 */
export function validateAssumptions(assumptions: UnderwritingAssumptions): string[] {
  const errors: string[] = [];

  if (assumptions.purchasePrice <= 0) {
    errors.push('Purchase price must be greater than 0');
  }

  if (assumptions.revenueGrowth < 0 || assumptions.revenueGrowth > 1) {
    errors.push('Revenue growth must be between 0 and 1 (0% to 100%)');
  }

  if (assumptions.expenseGrowth < 0 || assumptions.expenseGrowth > 1) {
    errors.push('Expense growth must be between 0 and 1 (0% to 100%)');
  }

  if (assumptions.holdPeriodYears <= 0) {
    errors.push('Hold period must be greater than 0');
  }

  if (assumptions.interestRate < 0 || assumptions.interestRate > 1) {
    errors.push('Interest rate must be between 0 and 1 (0% to 100%)');
  }

  if (assumptions.loanTermYears <= 0) {
    errors.push('Loan term must be greater than 0');
  }

  if (assumptions.exitCapRate <= 0 || assumptions.exitCapRate > 1) {
    errors.push('Exit cap rate must be between 0 and 1 (0% to 100%)');
  }

  return errors;
}

/**
 * Calculates compound annual growth rate
 */
export function calculateCAGR(initialValue: number, finalValue: number, periods: number): number {
  if (initialValue <= 0 || periods <= 0) {
    return 0;
  }
  return Math.pow(finalValue / initialValue, 1 / periods) - 1;
}

/**
 * Calculates future value with compound growth
 */
export function calculateFutureValue(presentValue: number, growthRate: number, periods: number): number {
  return presentValue * Math.pow(1 + growthRate, periods);
}

/**
 * Calculates present value
 */
export function calculatePresentValue(futureValue: number, discountRate: number, periods: number): number {
  return futureValue / Math.pow(1 + discountRate, periods);
}

/**
 * Calculates net present value of cash flows
 */
export function calculateNPV(cashFlows: number[], discountRate: number): number {
  return cashFlows.reduce((npv, cashFlow, period) => {
    return npv + calculatePresentValue(cashFlow, discountRate, period);
  }, 0);
}

/**
 * Calculates internal rate of return using Newton-Raphson method
 */
export function calculateIRR(cashFlows: number[], maxIterations: number = 100, tolerance: number = 0.0001): number {
  if (cashFlows.length < 2) return 0;

  let guess = 0.1; // Initial guess of 10%

  for (let i = 0; i < maxIterations; i++) {
    const npv = calculateNPV(cashFlows, guess);

    if (Math.abs(npv) < tolerance) {
      return guess;
    }

    // Calculate derivative (simplified)
    let derivative = 0;
    for (let j = 1; j < cashFlows.length; j++) {
      derivative -= j * cashFlows[j] / Math.pow(1 + guess, j + 1);
    }

    if (Math.abs(derivative) < tolerance) {
      break; // Avoid division by zero
    }

    guess = guess - npv / derivative;
  }

  return roundToDecimals(guess, 4);
}

/**
 * Rounds a number to a specified number of decimal places
 */
export function roundToDecimals(value: number, decimals: number = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Formats a number as a percentage
 */
export function formatAsPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formats a number as currency
 */
export function formatAsCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Calculates the average of an array of numbers
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return roundToDecimals(sum / values.length);
}

/**
 * Calculates the sum of an array of numbers
 */
export function calculateSum(values: number[]): number {
  return values.reduce((acc, val) => acc + val, 0);
}

/**
 * Finds the minimum value in an array of numbers
 */
export function findMin(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.min(...values);
}

/**
 * Finds the maximum value in an array of numbers
 */
export function findMax(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}
