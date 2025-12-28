
'use client';
import PublicPageLayout from "@/components/layout/PublicPageLayout";
import FoodCarousel from "@/components/about/FoodCarousel";

export default function AboutPage() {
  return (
    <PublicPageLayout title="About Us">
      <div className="space-y-12">
        <section className="text-center">
          <h2 className="text-3xl font-bold font-headline">Our Story</h2>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
            Founded in 2024, Steamsburry was born from a simple idea: to create a cozy space where the community can gather, enjoy high-quality coffee, and indulge in delightful pastries. We believe in the power of a great cup of coffee to start a day, spark a conversation, or offer a quiet moment of reflection.
          </p>
        </section>

        <section>
          <FoodCarousel />
        </section>

        <div className="grid md:grid-cols-2 gap-12">
           <section className="p-8 border rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold font-headline text-primary">Our Mission</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    To serve our community with passion, providing an exceptional coffee experience through meticulously sourced beans, artisanal craftsmanship, and a warm, welcoming atmosphere. We aim to be a positive force, one cup at a time.
                </p>
            </section>

            <section className="p-8 border rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold font-headline text-primary">Our Vision</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    To be the heart of the local coffee scene, known for our commitment to quality, sustainability, and community engagement. We envision a place where every visit feels like coming home.
                </p>
            </section>
        </div>
      </div>
    </PublicPageLayout>
  );
}
