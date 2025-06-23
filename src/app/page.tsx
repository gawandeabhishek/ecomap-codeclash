import { Benefits } from '@/components/benefits';
import { CTA } from '@/components/cta';
import { Features } from '@/components/features';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { Pricing } from '@/components/pricing';
import { Testimonials } from '@/components/testimonials';

export default function Home() {

  return (
    <div>
      <Header />
      <Hero />
      <Features />
      <Benefits />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
  </div>
  );
}
