import MenuHero from "@/components/menu/MenuHero";
import MenuGrid from "@/components/menu/MenuGrid";
import PublicHeader from "@/components/layout/PublicHeader";
import Footer from "@/components/layout/Footer";
import MenuFloatingButtons from "@/components/menu/MenuFloatingButtons";

export default function MenuPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background relative">
      <PublicHeader />
      <main className="flex-1 pt-20">
        <MenuHero />
        <MenuGrid />
      </main>
      <Footer />
      <MenuFloatingButtons />
    </div>
  );
}
