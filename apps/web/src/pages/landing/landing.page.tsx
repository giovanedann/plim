import {
  CtaSection,
  FeaturesShowcase,
  HeroSection,
  LandingFooter,
  LandingHeader,
  OnboardingSection,
  PricingSection,
  TestimonialsSection,
  TrustSection,
} from './components'

export function LandingPage() {
  return (
    <div className="landing-container overflow-x-hidden">
      <LandingHeader />

      <main>
        <HeroSection />
        <OnboardingSection />
        <FeaturesShowcase />
        <TestimonialsSection />
        <TrustSection />
        <PricingSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  )
}
