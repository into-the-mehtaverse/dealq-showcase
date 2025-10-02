"use client";

import HeroSection from "@/marketing/landing/hero";
import ProductWorkflow from "@/marketing/landing/product-workflow";
import BetaForm from "@/marketing/landing/beta-form";
import Features from "@/marketing/landing/features";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <HeroSection />
      <Features />
      <ProductWorkflow />
      <BetaForm />
    </div>
  );
}
