
import PublicPageLayout from "@/components/layout/PublicPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Target, Eye } from "lucide-react";
import FoodCarousel from "@/components/about/FoodCarousel";

export default function AboutPage() {
  return (
    <PublicPageLayout>
      <div className="space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-headline">About Steamsburry</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Founded in 2024, Steamsburry was born from a simple idea: to create a space where the aroma of freshly brewed coffee and the warmth of community come together.
          </p>
        </div>

        <FoodCarousel />

        <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-2"><Eye /> Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">To be the heart of the neighborhood, a welcoming third place where every cup of coffee sparks joy, inspires creativity, and builds lasting connections.</p>
                </CardContent>
            </Card>
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-2"><Target /> Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-lg">To serve exceptional coffee and food with genuine hospitality, while fostering a vibrant community hub and promoting sustainable practices from bean to cup.</p>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-headline">Our Story</h2>
            <p className="text-lg">
            Our journey began with a passion for sourcing the finest beans from around the world and perfecting the art of the roast. We believe that every cup tells a story, and we are dedicated to making each sip a memorable experience. From our classic espressos to our innovative specialty lattes, every drink is crafted with precision and care by our expert baristas.
            </p>
            <p className="text-lg">
            But Steamsburry is more than just coffee. It's a place to connect, to work, to relax, and to be inspired. Our cozy atmosphere, combined with our selection of delicious pastries and savory snacks, makes us the perfect spot for any time of day. We're proud to be a part of this neighborhood and are committed to serving you with a smile.
            </p>
        </div>

      </div>
    </PublicPageLayout>
  );
}
