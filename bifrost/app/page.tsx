import Hero from "@/components/home/Hero";
import LandingFooterGraphic from "@/components/templates/landing/footer";

export default function Home() {
  return (
    <main className="bg-white text-[#5D6673]">
      <div className="max-w-8xl mx-auto">
        <Hero />
      </div>
    </main>
  );
}

const PhDate = new Date("2024-08-20T07:00:00.000Z");
