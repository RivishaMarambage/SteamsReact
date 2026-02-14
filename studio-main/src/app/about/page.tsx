import AboutExperience from "@/components/about/AboutExperience";
import PublicHeader from "@/components/layout/PublicHeader";
import Footer from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-[#1a110a]">
      <PublicHeader />
      <main className="flex-1">
        <AboutExperience />
      </main>
      <Footer />
    </div>
  );
}
