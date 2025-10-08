
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Solution from "@/components/landing/Solution";
import WhoItIsFor from "@/components/landing/WhoItIsFor";
import WhyInteract from "@/components/landing/WhyInteract";
import HowItWorks from "@/components/landing/HowItWorks";
import ByTheNumbers from "@/components/landing/ByTheNumbers";
import Founder from "@/components/landing/Founder";
import CallToAction from "@/components/landing/CallToAction";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <WhoItIsFor />
        <WhyInteract />
        <HowItWorks />
        <ByTheNumbers />
        <Founder />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
