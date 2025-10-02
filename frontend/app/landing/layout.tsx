import Header from "@/marketing/header";
import Footer from "@/marketing/footer";
import GradientBackground from "@/marketing/gradient-background";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="flex flex-col min-h-screen relative">
            <GradientBackground />
            <Header />
            <main className="flex-grow relative z-0 pt-24">{children}</main>
            <Footer />
      </div>
    </>
  )
}
