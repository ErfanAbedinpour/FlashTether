"use client";

import { Header }             from "@/components/Header";
import { HeroSection }        from "@/components/HeroSection";
import { FlashGenerator }     from "@/components/FlashGenerator";
import { FlashStatus }        from "@/components/FlashStatus";
import { UseCases }           from "@/components/UseCases";
import { HowItWorks }         from "@/components/HowItWorks";
import { FAQ }                from "@/components/FAQ";
import { TransactionHistory } from "@/components/TransactionHistory";
import { Footer }             from "@/components/Footer";
import { useFlashGenerator }  from "@/hooks/useFlashGenerator";

export default function Home() {
  const gen = useFlashGenerator();

  const showStatus =
    gen.stage === "minting"  ||
    gen.stage === "success"  ||
    gen.stage === "error";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <HeroSection />

        <section className="py-8 px-4" id="generator">
          <div className="max-w-lg mx-auto">
            {showStatus ? (
              <FlashStatus gen={gen} />
            ) : (
              <FlashGenerator gen={gen} />
            )}
          </div>
        </section>

        <UseCases />
        <HowItWorks />
        <TransactionHistory />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
