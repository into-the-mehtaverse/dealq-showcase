"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { useState } from "react";
// import { useBlogSubscribe } from "@/lib/quotient/client";

export default function Hero() {
//   const blogSubscribe = useBlogSubscribe();
  const [email, setEmail] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
    //   await blogSubscribe({
    //     emailAddress: email,
    //   });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setIsExpanded(false);
        setEmail("");
      }, 3000);
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      console.error("Blog subscription error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center py-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold mb-6 gradient-text">
              From OM to Completed Model In Less Than 5 Minutes
            </h1>

            <p className="text-xl text-muted-foreground mb-8">
              Get back hours of your day with automated data extraction from scattered T12s and cluttered rent rolls. Seamlessly integrate with your existing Excel models or underwrite with DealQ&apos;s proprietary model set.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/landing#beta"
                className="inline-flex items-center px-8 py-3 bg-accent text-accent-foreground rounded-full text-base font-medium hover:bg-accent/90 transition-all transform hover:scale-105 shadow-lg"
              >
                Beta Signup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              {isSubmitted ? (
                <div className="inline-flex items-center gap-2 px-8 py-3 bg-green-100 text-green-700 rounded-full shadow-lg">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-base font-medium">Subscribed!</span>
                </div>
              ) : !isExpanded ? (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="inline-flex items-center px-8 py-3 bg-secondary text-secondary-foreground rounded-full text-base font-medium hover:bg-secondary/90 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Subscribe to Updates
                </button>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="inline-flex items-center gap-2"
                >
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-accent text-accent-foreground rounded-full font-medium hover:bg-accent/90 transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "..." : "Subscribe"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      setEmail("");
                      setError("");
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </form>
              )}
              {error && (
                <p className="text-destructive text-sm mt-2">{error}</p>
              )}
            </div>
          </div>
          <div className="text-center">
            <Image
              src="/icon.svg"
              alt="generic"
              width={500}
              height={500}
              className="mx-auto w-full opacity-90"
              style={{
                maxWidth: "500px",
                height: "500px",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
