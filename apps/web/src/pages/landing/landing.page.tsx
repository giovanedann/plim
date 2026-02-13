import {
  AiDisclaimerSection,
  CtaSection,
  FeaturesShowcase,
  HeroSection,
  LandingFooter,
  LandingHeader,
  OnboardingSection,
  PricingSection,
  SecuritySection,
  TestimonialsSection,
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

        {/* Security */}
        <SecuritySection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* AI Disclaimer */}
        <AiDisclaimerSection />

        {/* Pricing */}
        <PricingSection />

        {/* Final CTA */}
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  )
}
