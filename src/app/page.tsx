'use client';

import dynamic from 'next/dynamic';

const Navigation = dynamic(() => import('@/components/common/Navigation'), {
  ssr: true,
});
const Hero = dynamic(() => import('@/components/home/Hero'), {
  ssr: true,
});
const Stats = dynamic(() => import('@/components/home/Stats'), {
  ssr: true,
});
const Features = dynamic(() => import('@/components/home/Features'), {
  ssr: true,
});
const HowItWorks = dynamic(() => import('@/components/home/HowItWorks'), {
  ssr: true,
});
const TechStack = dynamic(() => import('@/components/home/TechStack'), {
  ssr: true,
});
const Testimonials = dynamic(() => import('@/components/home/Testimonials'), {
  ssr: true,
});
const CTA = dynamic(() => import('@/components/home/CTA'), {
  ssr: true,
});
const Footer = dynamic(() => import('@/components/common/Footer'), {
  ssr: true,
});

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <TechStack />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
