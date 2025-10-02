// Mock data types for Deal Summary feature
export interface MockDealSummary {
  // Core property details
  property_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  number_of_units: number;
  year_built: number;
  gross_square_feet: number;
  parking_spaces: number;
  property_type: string;

  // Financial metrics (the 6 key metrics)
  asking_price: number;
  hold_period: number;
  cash_on_cash_return: number;
  irr: number;
  equity_multiple: number;
  cap_rate: number;

  // Additional financial data
  noi: number;
  revenue: number;
  total_expenses: number;
  price_per_unit: number;
  price_per_sqft: number;

  // Document URLs
  om_file_url: string;
  t12_file_url: string;
  rent_roll_file_url: string;

  // Property characteristics


  // Deal metadata
  deal_id: string;
  updated_at: string;
}

// Mock deal data - realistic commercial real estate deal
export const mockDealSummary: MockDealSummary = {
  // Core property details
  property_name: "Sunset Towers Apartments",
  address: "1234 Harbor View Drive",
  city: "Baltimore",
  state: "MD",
  zip_code: "21202",
  number_of_units: 156,
  year_built: 1985,
  gross_square_feet: 187500,
  parking_spaces: 180,
  property_type: "Multifamily",

  // Financial metrics (the 6 key metrics)
  asking_price: 15750000,
  hold_period: 5,
  cash_on_cash_return: 8.2,
  irr: 12.4,
  equity_multiple: 1.85,
  cap_rate: 6.13,

  // Additional financial data
  noi: 965775,
  revenue: 2840000,
  total_expenses: 1874225,
  price_per_unit: 100962,
  price_per_sqft: 84,

  // Document URLs (mock URLs for development)
  om_file_url: "https://example.com/documents/sunset-towers-om.pdf",
  t12_file_url: "https://example.com/documents/sunset-towers-t12.xlsx",
  rent_roll_file_url: "https://example.com/documents/sunset-towers-rent-roll.xlsx",

  // Deal metadata
  deal_id: "DEAL-2024-001",
  updated_at: "2024-01-20"
};

// Additional mock deals for testing different scenarios
export const mockDealSummary2: MockDealSummary = {
  ...mockDealSummary,
  property_name: "Riverside Gardens",
  address: "5678 Waterfront Boulevard",
  city: "Baltimore",
  state: "MD",
  zip_code: "21230",
  number_of_units: 89,
  year_built: 1992,
  asking_price: 8750000,
  cap_rate: 7.2,
  cash_on_cash_return: 9.1,
  irr: 14.8,
  equity_multiple: 2.1,
  hold_period: 7,
  deal_id: "DEAL-2024-002"
};
