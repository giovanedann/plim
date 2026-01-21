import {
  CtaSection,
  FeaturesShowcase,
  HeroSection,
  LandingFooter,
  LandingHeader,
  PricingSection,
} from './components'

export function LandingPage() {
  return (
    <div className="landing-container">
      <LandingHeader />

      <main>
        {/* Hero */}
        <HeroSection />

        {/* Features with swapping animation */}
        <FeaturesShowcase />

        {/* Pricing */}
        <PricingSection />

        {/* Final CTA */}
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  )
}
