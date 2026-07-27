import SmoothScroll from "@/components/landing/SmoothScroll";
import AmbientCanvas from "@/components/landing/AmbientCanvas";
import RoadJourney from "@/components/landing/RoadJourney";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import UpcomingEvents from "@/components/landing/UpcomingEvents";
import AppJourney from "@/components/landing/AppJourney";
import Community from "@/components/landing/Community";
import CTA from "@/components/landing/CTA";

export default function Home() {
  return (
    <>
      <AmbientCanvas />
      <SmoothScroll>
        <Navbar />
        <main className="relative">
          <RoadJourney />
          <Hero />
          <Features />
          <UpcomingEvents />
          <AppJourney />
          <Community />
          <CTA />
        </main>
      </SmoothScroll>
    </>
  );
}
