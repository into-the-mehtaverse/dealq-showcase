"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, CreditCard, Building, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { BillingInfo, CreateCheckoutSessionRequest } from "@/types/billing";
import { getBillingInfo } from "@/lib/api/actions/getBillingInfo";
import { createCheckoutSession } from "@/lib/api/actions/createCheckoutSession";
import { useSearchParams } from "next/navigation";

const PRICE_IDS = {
  starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_MONTHLY!,
  professional: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY!
};

export default function BillingDashboard() {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    loadBillingInfo();

    // Check for success parameter from Stripe checkout
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      // Clear the success parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('success');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const loadBillingInfo = async () => {
    try {
      setLoading(true);
      const info = await getBillingInfo();
      setBillingInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing info');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier: 'starter' | 'professional') => {
    try {
      setCheckoutLoading(tier);

      const request: CreateCheckoutSessionRequest = {
        price_id: PRICE_IDS[tier],
        success_url: `${window.location.origin}/dashboard/billing?success=true`,
        cancel_url: `${window.location.origin}/dashboard/billing?canceled=true`
      };

      const checkoutData = await createCheckoutSession(request);

      // Redirect to Stripe checkout
      window.location.href = checkoutData.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Billing</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadBillingInfo}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!billingInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No Billing Information</h2>
          <p className="text-muted-foreground">Unable to load billing information.</p>
        </div>
      </div>
    );
  }

  const { user, subscription, limits, billing_period } = billingInfo;
  const hasSubscription = subscription !== null;
  const usagePercentage = (user.deals_used / limits.monthly_deals_limit) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing & Usage</h1>
        <p className="text-muted-foreground">
          Manage your subscription and track your usage
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Payment Successful!</h3>
              <p className="text-sm">Your subscription has been activated. Welcome to DealQ!</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Your Account</span>
                <Badge variant={user.subscription_tier === 'professional' ? 'default' : 'secondary'}>
                  {user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)}
                </Badge>
              </div>
              {hasSubscription ? (
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    Active subscription
                  </div>
                  <div className="mt-1">
                    Next billing: {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No active subscription
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Deals Used</span>
                <span className="font-medium">
                  {user.deals_used} / {limits.monthly_deals_limit}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {limits.monthly_deals_limit === 999999 ? 'Unlimited' : `${Math.round(usagePercentage)}% used`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Period */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Start:</span>
                <div className="font-medium">
                  {billing_period?.start ? new Date(billing_period.start).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">End:</span>
                <div className="font-medium">
                  {billing_period?.end ? new Date(billing_period.end).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Management */}
      {!hasSubscription ? (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Plan</CardTitle>
            <CardDescription>
              Select a plan to start using DealQ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">Starter</h3>
                    <p className="text-sm text-muted-foreground">$30/month</p>
                  </div>
                </div>
                <ul className="text-sm space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    5 deals per month
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    Basic underwriting tools
                  </li>
                </ul>
                <Button
                  onClick={() => handleSubscribe('starter')}
                  disabled={checkoutLoading === 'starter'}
                  className="w-full"
                >
                  {checkoutLoading === 'starter' ? 'Processing...' : 'Subscribe'}
                </Button>
              </div>

              <div className="border rounded-lg p-4 border-accent">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">Professional</h3>
                    <p className="text-sm text-muted-foreground">$175/month</p>
                  </div>
                  <Badge>Popular</Badge>
                </div>
                <ul className="text-sm space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    Unlimited deals
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    Advanced tools
                  </li>
                </ul>
                <Button
                  onClick={() => handleSubscribe('professional')}
                  disabled={checkoutLoading === 'professional'}
                  className="w-full"
                >
                  {checkoutLoading === 'professional' ? 'Processing...' : 'Subscribe'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Management</CardTitle>
            <CardDescription>
              Your subscription is active and managed through Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              To manage your subscription, update payment methods, or view invoices,
              please visit your Stripe customer portal.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
