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
        <HeroSection />
        <OnboardingSection />
        <FeaturesShowcase />
        <SecuritySection />
        <TestimonialsSection />
        <AiDisclaimerSection />
        <PricingSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  )
}
