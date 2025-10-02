export interface BillingInfo {
  user: {
    id: string;
    email: string;
    subscription_tier: string;
    deals_used: number;
    deals_limit: number;
  };
  subscription: {
    id: string;
    status: string;
    current_period_start: string | null;
    current_period_end: string | null;
  } | null;
  limits: {
    monthly_deals_limit: number;
    features: string[];
  };
  billing_period: {
    start: string | null;
    end: string | null;
  };
}

export interface CreateCheckoutSessionRequest {
  price_id: string;
  success_url: string;
  cancel_url: string;
}

export interface CreateCheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}

export interface CancelSubscriptionResponse {
  status: string;
  message: string;
}

export interface ReactivateSubscriptionResponse {
  status: string;
  message: string;
}

export interface CreatePortalSessionResponse {
  portal_url: string;
}

export interface DealLimits {
  can_create_deal: boolean;
  deals_used: number;
  deals_limit: number;
  subscription_tier: string;
  limits: {
    deals_limit: number;
    monthly_deals_limit: number;
  };
  billing_period: {
    start: string | null;
    end: string | null;
  };
}
