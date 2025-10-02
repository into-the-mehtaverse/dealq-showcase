"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import Link from "next/link";

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
    buttonText: "Get Started",
    buttonVariant: "default" as const,
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
    buttonText: "Get Started",
    buttonVariant: "default" as const,
    popular: true
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Choose the plan that fits your needs. No hidden fees, no surprises.
        </p>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative ${tier.popular ? 'border-accent shadow-lg scale-105' : 'border-border'}`}
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

              <CardContent className="space-y-6">
                {/* Features List */}
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link href={`/landing/sign-up?plan=${tier.id}`} className="block">
                  <Button
                    className="w-full"
                    variant={tier.buttonVariant}
                    size="lg"
                  >
                    {tier.buttonText}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center text-muted-foreground">
          <p className="text-sm">
            Already have an account?{" "}
            <Link href="/landing/login" className="text-accent hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
