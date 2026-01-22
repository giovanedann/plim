import {
  CtaSection,
  FeaturesShowcase,
  HeroSection,
  LandingFooter,
  LandingHeader,
  OnboardingSection,
  PricingSection,
} from './components'

export function LandingPage() {
  return (
    <div className="landing-container overflow-x-hidden">
      <LandingHeader />

      <main>
        {/* Hero */}
        <HeroSection />

        {/* Onboarding steps */}
        <OnboardingSection />

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
