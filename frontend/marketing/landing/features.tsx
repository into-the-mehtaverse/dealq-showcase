import { Clock, CheckCircle, FileSpreadsheet, FileText } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "5-10 Minute Workflows",
    description:
      "Transform 3-4 hour manual processes into automated workflows that take just minutes",
  },
  {
    icon: CheckCircle,
    title: "Zero Errors",
    description:
      "Eliminate human error in data transcription with our automated extraction technology",
  },
  {
    icon: FileSpreadsheet,
    title: "Professional Models",
    description:
      "Access to institutional-quality Excel underwriting models used by top firms",
  },
  {
    icon: FileText,
    title: "Automated LOIs",
    description:
      "Generate purchase price suggestions and professional LOIs with one click",
  },
];

export default function Features() {
  return (
    <section id="features" className="pt-40 pb-20 bg-muted/25">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Why The Best Multi-family Investors Use DealQ
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stop wasting time on manual data entry. Start closing more deals
            with confidence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-background rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 bg-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
