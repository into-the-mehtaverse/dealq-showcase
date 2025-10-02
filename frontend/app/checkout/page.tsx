import { Suspense } from "react";
import CheckoutPage from "@/features/checkout/checkout-page";

export default function CheckoutPageRoute() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutPage />
    </Suspense>
  );
}
