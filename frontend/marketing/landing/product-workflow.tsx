import {
    Send,
    Upload,
    Database,
    BarChart,
    Download,
    FileCheck,
  } from "lucide-react";
  import Link from "next/link";

  const steps = [
    {
      icon: Send,
      title: "Broker Sends Deal",
      description: "The broker sends you a compelling deal",
    },
    {
      icon: Upload,
      title: "Upload Documents",
      description: "Drop OM, RR, T-12 or any relevant documents into DealQ",
    },
    {
      icon: Database,
      title: "Extract Data",
      description:
        "DealQ extracts all relevant information - RR, T-12, Asking Price, Vintage, etc",
    },
    {
      icon: BarChart,
      title: "Deal Review",
      description:
        "DealQ organizes relevant information to the deal including core metrics, financial summary, and deep market research",
    },
    {
      icon: Download,
      title: "Download Model",
      description:
        "Download your completed Excel institutional underwriting model",
    },
    {
      icon: FileCheck,
      title: "Submit LOI",
      description:
        "Submit your auto-generated LOI & close on the property with confidence",
    },
  ];

  export default function ProductWorkflow() {
    return (
      <section id="workflow" className="pt-40 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How DealQ Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From deal receipt to LOI submission in six simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isInFirstRow = index < 3;
              const isInSecondRow = index >= 3;
              const isLastInRow = (isInFirstRow && index === 2) || (isInSecondRow && index === 5);

              return (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                        <Icon className="w-8 h-8 text-accent-foreground" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>

                  {/* Horizontal connector line - only between items in the same row */}
                  {!isLastInRow && (
                    <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-muted-foreground mb-8">
              Ready to transform your underwriting process?
            </p>
            <Link
              href="/#beta"
              className="inline-flex items-center px-8 py-3 bg-accent text-accent-foreground rounded-full text-base font-medium hover:bg-accent/90 transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started Today
            </Link>
          </div>
        </div>
      </section>
    );
  }
