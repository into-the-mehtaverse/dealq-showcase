# Underwriting Engine

A modular underwriting engine for multifamily real estate analysis built with TypeScript.

## Architecture

The underwriting engine follows a modular architecture with clear separation of concerns:

```
lib/underwrite/
├── types.ts              # Shared type definitions
├── utils.ts              # Utility functions and validation
├── calcNOI.ts           # NOI calculations and projections
├── calcDebtService.ts   # Debt service and DSCR calculations
├── calcIRR.ts           # IRR and return calculations
├── buildProforma.ts     # Pro forma cash flow builder
├── calculateUnderwriting.ts # Main orchestration function
└── index.ts             # Public API exports
```

## Core Modules

### 1. NOI Calculations (`calcNOI.ts`)
- Year 1 NOI calculation from Year 1 revenue and expense inputs (NOI = Revenue - Expenses)
- Future NOI projections based on growth assumptions applied to previous year's values
- Revenue and expense growth applied separately to each line item
- Calculates up to holdPeriodYears + 1 (e.g., 5-year hold = 6 years of projections)
- NOI margin and expense ratio calculations
- Per-unit and per-square-foot metrics

### 2. Debt Service (`calcDebtService.ts`)
- Interest-only loan calculations
- DSCR analysis by year
- Loan-to-value ratio calculations
- Debt yield analysis

### 3. IRR Analysis (`calcIRR.ts`)
- Unlevered IRR (no debt consideration)
- Levered IRR (with debt consideration)
- Equity multiple calculations
- Payback period analysis

### 4. Pro Forma Builder (`buildProforma.ts`)
- Complete cash flow projections
- Final year includes operating cash flow + exit proceeds
- Exit analysis and valuation
- Investment metrics calculation
- Key performance indicators

## Usage

### Basic Usage

```typescript
import { calculateUnderwriting, UnderwritingAssumptions, T12Data, RentRollData } from './lib/underwrite';

const t12Data: T12Data = {
  year1Revenue: 1200000, // $1.2M Year 1 revenue
  year1Expenses: 480000 // $480K Year 1 expenses
  // year1NOI is calculated automatically as $720K (1.2M - 480K)
};

const rentRollData: RentRollData = {
  totalUnits: 100,
  occupiedUnits: 95,
  averageRent: 1000,
  totalRevenue: 1200000
};

const assumptions: UnderwritingAssumptions = {
  purchasePrice: 10000000,
  revenueGrowth: 0.03, // 3% annual revenue growth
  expenseGrowth: 0.03, // 3% annual expense growth
  holdPeriodYears: 5, // 5-year hold period (calculates 6 years total)
  interestRate: 0.055,
  loanTermYears: 30,
  exitCapRate: 0.045
};

const analysis = calculateUnderwriting(t12Data, rentRollData, assumptions);
```

### Key Outputs

The engine returns a comprehensive `UnderwritingAnalysis` object containing:

- **Year 1 NOI**: Initial net operating income
- **NOI Projections**: Year-by-year NOI growth
- **Pro Forma Cash Flows**: Complete cash flow analysis
- **Debt Service**: Loan amount and payment calculations
- **DSCR by Year**: Debt service coverage ratios
- **IRR Analysis**: Unlevered and levered IRRs
- **Exit Analysis**: Exit value and sale proceeds
- **Investment Metrics**: Total investment, return, and profit

### Advanced Usage

#### Custom Loan Amount
```typescript
import { calculateUnderwritingWithCustomLoan } from './lib/underwrite';

const analysis = calculateUnderwritingWithCustomLoan(
  t12Data,
  rentRollData,
  assumptions,
  6000000 // Custom loan amount
);
```

#### Individual Module Usage
```typescript
import {
  calculateNOIProjections,
  calculateDebtService,
  buildProFormaCashFlows
} from './lib/underwrite';

// Use individual modules for specific calculations
const noiProjections = calculateNOIProjections(t12Data, assumptions);
const debtService = calculateDebtService(assumptions);
const cashFlows = buildProFormaCashFlows(noiProjections, debtService);
```

## Assumptions

The engine makes the following key assumptions:

1. **Interest-Only Debt**: No principal amortization during the hold period
2. **75% LTV**: Default loan-to-value ratio (can be customized)
3. **Growth Projections**: Revenue and expenses grow at specified rates year-over-year
4. **Hold Period + 1**: Calculates projections for holdPeriodYears + 1 years (e.g., 5 years = 6 years of projections)
5. **Exit Cap Rate**: Exit value calculated using final year NOI and exit cap rate

## Validation

The engine includes comprehensive input validation:

- Purchase price must be positive
- Growth rates must be between 0% and 100%
- Hold period must be positive
- Interest rates must be between 0% and 100%
- Exit cap rates must be positive

## Error Handling

The engine throws descriptive errors for invalid inputs:

```typescript
try {
  const analysis = calculateUnderwriting(t12Data, rentRollData, assumptions);
} catch (error) {
  console.error('Underwriting calculation failed:', error.message);
}
```

## Testing

Run the example test to verify the engine:

```typescript
import { runUnderwritingExample, runSensitivityAnalysis } from './test-example';

// Run basic example
runUnderwritingExample();

// Run sensitivity analysis
runSensitivityAnalysis();
```

## Future Enhancements

The modular architecture allows for easy extensions:

- Amortizing loan calculations
- More sophisticated NOI projections
- Tax considerations
- Multiple exit scenarios
- Monte Carlo simulations
- Integration with external data sources
