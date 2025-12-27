
import PublicPageLayout from "@/components/layout/PublicPageLayout";

export default function AboutPage() {
  return (
    <PublicPageLayout>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold font-headline">About Steamsburry</h1>
        <p className="text-lg text-muted-foreground">
          Founded in 2024, Steamsburry was born from a simple idea: to create a space where the aroma of freshly brewed coffee and the warmth of community come together.
        </p>
        <p className="text-lg">
          Our journey began with a passion for sourcing the finest beans from around the world and perfecting the art of the roast. We believe that every cup tells a story, and we are dedicated to making each sip a memorable experience. From our classic espressos to our innovative specialty lattes, every drink is crafted with precision and care by our expert baristas.
        </p>
        <p className="text-lg">
          But Steamsburry is more than just coffee. It's a place to connect, to work, to relax, and to be inspired. Our cozy atmosphere, combined with our selection of delicious pastries and savory snacks, makes us the perfect spot for any time of day. We're proud to be a part of this neighborhood and are committed to serving you with a smile.
        </p>
      </div>
    </PublicPageLayout>
  );
}
