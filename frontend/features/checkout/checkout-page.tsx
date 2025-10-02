"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import CheckoutForm from "./checkout-form";

export default function CheckoutPage() {
  const [canceled, setCanceled] = useState(false);
  const searchParams = useSearchParams();

  // Handle URL parameters for canceled checkout
  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      setCanceled(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Complete Your Setup
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose your plan and create your organization to get started
          </p>
        </div>

        {/* Checkout Form */}
        <CheckoutForm showCanceledMessage={canceled} />
      </div>
    </div>
  );
}
