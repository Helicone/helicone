import Hero from "@/components/home/Hero";
import Prototype from "@/components/home/Prototype";

export const ISLAND_WIDTH =
  " w-full px-4 sm:px-16 md:px-24 2xl:px-40 max-w-[2000px] mx-auto";

export default function Home() {
  return (
    <main className="bg-white text-[#5D6673]">
      <div className="max-w-8xl mx-auto">
        <Hero />
        <Prototype />
      </div>
    </main>
  );
}
