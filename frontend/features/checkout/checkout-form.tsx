"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, AlertCircle, X } from "lucide-react";
import { createCheckoutSession } from "@/lib/api/actions/createCheckoutSession";

const pricingTiers = [
  {
    id: "starter",
    name: "Starter",
    price: 30,
    period: "month",
    description: "Perfect for individual analysts and small teams",
    features: [
      "5 deals per month",
      "Basic underwriting tools",
      "PDF and Excel analysis",
      "DealQ Proprietary Excel Model",
      "Standard reporting"
    ],
    popular: false
  },
  {
    id: "professional",
    name: "Professional",
    price: 175,
    period: "month",
    description: "For growing teams and advanced analysis",
    features: [
      "Unlimited deals",
      "Advanced underwriting tools",
      "Unlimited custom model integrations",
      "Priority support",
      "Advanced analytics"
    ],
    popular: true
  }
];

interface CheckoutFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  showCanceledMessage?: boolean;
}

export default function CheckoutForm({
  onSuccess,
  onError,
  showCanceledMessage = false
}: CheckoutFormProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!selectedTier) {
      const errorMsg = "Please select a plan";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create Stripe checkout session
      const priceId = selectedTier === "starter"
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_MONTHLY!
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY!;

      const checkoutData = await createCheckoutSession({
        price_id: priceId,
        success_url: `${window.location.origin}/dashboard/billing?success=true`,
        cancel_url: `${window.location.origin}/checkout?canceled=true`
      });

      // Redirect to Stripe checkout
      window.location.href = checkoutData.checkout_url;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to process checkout";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Plan Selection */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {pricingTiers.map((tier) => (
          <Card
            key={tier.id}
            className={`relative cursor-pointer transition-all ${
              selectedTier === tier.id
                ? 'border-accent shadow-lg scale-105'
                : 'border-border hover:border-accent/50'
            }`}
            onClick={() => setSelectedTier(tier.id)}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-accent text-accent-foreground px-4 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {tier.description}
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${tier.price}</span>
                <span className="text-muted-foreground">/{tier.period}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Features List */}
              <ul className="space-y-2">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Selection Indicator */}
              {selectedTier === tier.id && (
                <div className="text-center text-accent font-medium">
                  ✓ Selected
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Canceled Checkout Message */}
      {showCanceledMessage && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <X className="h-4 w-4" />
            <span>Checkout was canceled. You can try again below.</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Subscribe Button */}
      <div className="text-center">
        <Button
          onClick={handleSubscribe}
          disabled={loading || !selectedTier}
          size="lg"
          className="px-8 py-3 text-lg"
        >
          {loading ? "Processing..." : "Subscribe & Continue"}
        </Button>
      </div>

      {/* Additional Info */}
      <div className="text-center mt-8 text-sm text-muted-foreground">
      </div>
    </div>
  );
}
