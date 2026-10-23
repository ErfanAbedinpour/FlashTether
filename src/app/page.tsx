"use client";

import { useState } from "react";
import { Header }             from "@/components/Header";
import { HeroSection }        from "@/components/HeroSection";
import { FlashGenerator }     from "@/components/FlashGenerator";
import { PaymentModal }       from "@/components/PaymentModal";
import { FlashStatus }        from "@/components/FlashStatus";
import { UseCases }           from "@/components/UseCases";
import { HowItWorks }         from "@/components/HowItWorks";
import { FAQ }                from "@/components/FAQ";
import { TransactionHistory } from "@/components/TransactionHistory";
import { Footer }             from "@/components/Footer";
import { useFlashGenerator }  from "@/hooks/useFlashGenerator";

export default function Home() {
  const gen                     = useFlashGenerator();
  const [modalOpen, setModalOpen] = useState(false);

  // When user clicks "Buy Flash TETHER" in the generator, open the payment modal
  const handleOpenPayment = () => {
    gen.openPayment();
    setModalOpen(true);
  };

  // Close modal and reset stage back to configuring if still at awaiting_payment
  const handleCloseModal = () => {
    setModalOpen(false);
    if (gen.stage === "awaiting_payment") {
      gen.reset();
    }
  };

  // Active stages that show the status panel instead of the generator
  const showStatus =
    gen.stage === "verifying" ||
    gen.stage === "minting"   ||
    gen.stage === "success"   ||
    gen.stage === "error";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <HeroSection />

        {/* Generator / Status panel */}
        <section className="py-8 px-4" id="generator">
          <div className="max-w-lg mx-auto">
            {showStatus ? (
              <FlashStatus gen={gen} />
            ) : (
              <FlashGenerator
                gen={{
                  ...gen,
                  openPayment: handleOpenPayment,
                }}
              />
            )}
          </div>
        </section>

        {/* Content sections */}
        <UseCases />
        <HowItWorks />
        <TransactionHistory />
        <FAQ />
      </main>

      <Footer />

      {/* Payment modal — rendered at root so it overlays everything */}
      {modalOpen && gen.stage === "awaiting_payment" && (
        <PaymentModal gen={gen} onClose={handleCloseModal} />
      )}
    </div>
  );
}
