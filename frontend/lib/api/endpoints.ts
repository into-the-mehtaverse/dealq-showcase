

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const endpoints = {
    confirmUpload: `${BASE_URL}/api/v1/upload/confirm`,
    requestUpload: `${BASE_URL}/api/v1/upload/request-upload`,
    uploadJobStatus: `${BASE_URL}/api/v1/upload`,
    getDealDraft: `${BASE_URL}/api/v1/upload/draft`,
    uploadDeal: `${BASE_URL}/api/v1/upload/old`,
    getDeals: `${BASE_URL}/api/v1/deals`,
    getDeal: `${BASE_URL}/api/v1/deals`,
    getModel: `${BASE_URL}/api/v1/get-model`,
    deleteDeal: `${BASE_URL}/api/v1/deals`,
    pipeline: `${BASE_URL}/api/v1/pipeline`,
    pipelineMetrics: `${BASE_URL}/api/v1/pipeline/metrics`,
    pipelineStatus: `${BASE_URL}/api/v1/pipeline/status`,
    pipelineAll: `${BASE_URL}/api/v1/pipeline/all`,
    pipelineDealsFilter: `${BASE_URL}/api/v1/pipeline/deals/filter`,
    pipelineUpdateStatus: `${BASE_URL}/api/v1/pipeline/status`,
    billing: {
      createCheckoutSession: `${BASE_URL}/api/v1/billing/checkout`,
      getBillingInfo: `${BASE_URL}/api/v1/billing/info`,
      cancelSubscription: `${BASE_URL}/api/v1/billing/cancel`,
      reactivateSubscription: `${BASE_URL}/api/v1/billing/reactivate`,
      createPortalSession: `${BASE_URL}/api/v1/billing/portal`
    }
  };
