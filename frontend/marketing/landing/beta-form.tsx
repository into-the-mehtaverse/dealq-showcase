"use client";

import { useState } from "react";
// import { useBetaSignup } from "@/lib/quotient/client";

const JOB_TITLES = [
  { label: "Founder", value: "founder" },
  { label: "CEO", value: "ceo" },
  { label: "CTO", value: "chief_technology_officer" },
  { label: "Developer", value: "developer" },
  { label: "Principal", value: "principal" },
  { label: "Syndicator", value: "syndicator" },
  { label: "Originator", value: "originator" },
  { label: "Investment Analyst", value: "investment_analyst" },
  { label: "Investment Associate", value: "investment_associate" },
  { label: "Broker", value: "broker" },
  { label: "Other", value: "other" },
];

export default function BetaForm() {
//   const betaSignup = useBetaSignup();
  const [formData, setFormData] = useState({
    emailAddress: "",
    firstName: "",
    lastName: "",
    jobTitle: "",
  });
  const [customJobTitle, setCustomJobTitle] = useState("");
  const [showCustomJobTitle, setShowCustomJobTitle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setEmailError("");

    // Validate email
    if (!validateEmail(formData.emailAddress)) {
      setEmailError("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    try {
    //   const jobTitle = showCustomJobTitle ? customJobTitle : formData.jobTitle;
    //   await betaSignup({
    //     ...formData,
    //     jobTitle,
    //   });
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting beta form:", err);

      // Check for specific error types
      if (err.message?.includes("CORS")) {
        setError(
          "We're experiencing technical difficulties. Please try again later or contact support.",
        );
      } else if (err.message?.includes("Failed to fetch")) {
        setError(
          "Unable to connect to our servers. Please check your internet connection.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear email error when user starts typing
    if (name === "emailAddress" && emailError) {
      setEmailError("");
    }
  };

  const handleJobTitleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      jobTitle: value,
    });
    setShowCustomJobTitle(value === "other");
    if (value !== "other") {
      setCustomJobTitle("");
    }
  };

  return (
    <section
      id="beta"
      className="min-h-screen flex items-center pt-40 pb-24 px-6"
    >
      <div className="max-w-2xl mx-auto w-full">
        {!isSubmitted ? (
          <>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Request access to our beta
              </h2>
              <p className="text-xl text-muted-foreground">
                DealQ will be launching soon. Be among the first to try it out!
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-card rounded-2xl shadow-xl border border-border p-8 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium mb-2"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium mb-2"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="emailAddress"
                  className="block text-sm font-medium mb-2"
                >
                  Email Address <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  id="emailAddress"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all ${
                    emailError ? "border-destructive" : "border-input"
                  }`}
                  placeholder="john@company.com"
                />
                {emailError && (
                  <p className="mt-1 text-sm text-destructive">{emailError}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="jobTitle"
                  className="block text-sm font-medium mb-2"
                >
                  Job Title
                </label>
                <select
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleJobTitleChange}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select your role</option>
                  {JOB_TITLES.map((title) => (
                    <option key={title.value} value={title.value}>
                      {title.label}
                    </option>
                  ))}
                </select>
              </div>

              {showCustomJobTitle && (
                <div>
                  <label
                    htmlFor="customJobTitle"
                    className="block text-sm font-medium mb-2"
                  >
                    Please specify your job title
                  </label>
                  <input
                    type="text"
                    id="customJobTitle"
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="Enter your job title"
                  />
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Request beta"
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="rounded-2xl p-8">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg
                  className="w-8 h-8 text-accent-foreground"
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
              </div>
              <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
              <p className="text-muted-foreground">
                We can&apos;t wait to get DealQ in your hands!
                <br />
                You&apos;ll receive an email announcing our launch soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
