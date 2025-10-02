// Underwriting Engine Types

// Input assumptions for underwriting calculations
export interface UnderwritingAssumptions {
  purchasePrice: number; // Purchase price in dollars
  revenueGrowth: number; // Annual revenue growth rate as decimal (e.g., 0.03 for 3%)
  expenseGrowth: number; // Annual expense growth rate as decimal
  holdPeriodYears: number; // Hold period in years (e.g., 5 for 5 years)
  interestRate: number; // Annual interest rate as decimal
  loanTermYears: number; // Loan term in years
  exitCapRate: number; // Exit capitalization rate as decimal
  ltvRatio: number; // Loan-to-value ratio as decimal (e.g., 0.75 for 75%)
}

// Year-by-year NOI projections
export interface NOIProjection {
  year: number;
  grossRevenue: number;
  operatingExpenses: number;
  netOperatingIncome: number;
}

// Pro forma cash flow structure
export interface ProFormaCashFlow {
  year: number;
  grossRevenue: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  debtService: number;
  cashFlow: number;
  cumulativeCashFlow: number;
}

// Debt service calculation result
export interface DebtServiceCalculation {
  loanAmount: number;
  annualDebtService: number;
  monthlyDebtService: number;
  interestOnlyPayment: number;
}

// IRR calculation result
export interface IRRCalculation {
  unleveredIRR: number;
  leveredIRR: number;
  equityMultiple: number;
}

// Exit analysis result
export interface ExitAnalysis {
  exitYear: number;
  exitNOI: number;
  exitValue: number;
  saleProceeds: number;
  remainingDebt: number;
  netSaleProceeds: number;
}

// Complete underwriting analysis result
export interface UnderwritingAnalysis {
  year1NOI: number;
  noiProjections: NOIProjection[];
  proFormaCashFlows: ProFormaCashFlow[];
  debtService: DebtServiceCalculation;
  dscrByYear: { year: number; dscr: number }[];
  irrAnalysis: IRRCalculation;
  exitAnalysis: ExitAnalysis;
  totalInvestment: number;
  totalReturn: number;
  totalProfit: number;
  // KPI metrics
  cashOnCashReturn: number;
  capRate: number;
  noiGrowthRate: number;
  averageDSCR: number;
  minimumDSCR: number;
}
