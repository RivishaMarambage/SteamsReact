'use client';
import Image from "next/image";
import { Award, Users, Check, Diamond } from "lucide-react";
import PublicPageLayout from "@/components/layout/PublicPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function AboutPage() {

  const aboutMainImage = PlaceHolderImages.find(p => p.id === 'about-main');
  const earlyDaysImage = PlaceHolderImages.find(p => p.id === 'about-early-days');
  const sourcingRootsImage = PlaceHolderImages.find(p => p.id === 'about-sourcing-roots');
  const sensory1Image = PlaceHolderImages.find(p => p.id === 'sensory-1');
  const sensory2Image = PlaceHolderImages.find(p => p.id === 'sensory-2');
  const sensory3Image = PlaceHolderImages.find(p => p.id === 'sensory-3');
  const sensory4Image = PlaceHolderImages.find(p => p.id === 'sensory-4');
  
  const sensoryImages = [sensory1Image, sensory2Image, sensory3Image, sensory4Image];

  return (
    <PublicPageLayout title="About Us">
      <div className="space-y-24">
        
        {/* Our Story Section */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-sm font-semibold text-primary tracking-widest">SINCE 2012</span>
            <h2 className="text-4xl font-bold font-headline">Our Story</h2>
            <p className="text-muted-foreground text-lg">
              From a single small roaster in a dusty garage to a beloved community hub, our journey has been fueled by a relentless passion for the perfect cup. We believe that coffee is more than a beverage; it's a catalyst for connection.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              {earlyDaysImage && (
                <div className="space-y-2">
                  <div className="aspect-square relative rounded-lg overflow-hidden">
                     <Image src={earlyDaysImage.imageUrl} alt={earlyDaysImage.description} fill className="object-cover" data-ai-hint={earlyDaysImage.imageHint} />
                  </div>
                  <p className="text-sm text-center font-medium text-muted-foreground">The Early Days</p>
                </div>
              )}
              {sourcingRootsImage && (
                 <div className="space-y-2">
                   <div className="aspect-square relative rounded-lg overflow-hidden">
                     <Image src={sourcingRootsImage.imageUrl} alt={sourcingRootsImage.description} fill className="object-cover" data-ai-hint={sourcingRootsImage.imageHint} />
                   </div>
                   <p className="text-sm text-center font-medium text-muted-foreground">Sourcing Roots</p>
                </div>
              )}
            </div>
          </div>
          <div>
            {aboutMainImage && (
              <div className="relative h-[500px] w-full rounded-lg overflow-hidden shadow-lg">
                <Image src={aboutMainImage.imageUrl} alt={aboutMainImage.description} fill className="object-cover" data-ai-hint={aboutMainImage.imageHint} />
              </div>
            )}
          </div>
        </section>

        {/* Our Values Section */}
        <section className="text-center">
          <h2 className="text-4xl font-bold font-headline">Our Values</h2>
          <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
            The principles that guide every roast and every pour we make.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12 text-left">
            <Card className="shadow-md hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary"><Award className="h-6 w-6"/></div>
                <CardTitle className="font-headline text-2xl pt-2">Quality First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We never compromise on the roast. Each batch is micro-roasted to perfection, ensuring the richest flavor profile possible.
                </p>
              </CardContent>
            </Card>
             <Card className="shadow-md hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-start gap-4">
                 <div className="p-3 bg-primary/10 rounded-lg text-primary"><Diamond className="h-6 w-6"/></div>
                <CardTitle className="font-headline text-2xl pt-2">Ethical Sourcing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                   Direct trade relationships and fair wages for farmers are at the core of our supply chain. Respecting the seed to the cup.
                </p>
              </CardContent>
            </Card>
             <Card className="shadow-md hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-start gap-4">
                 <div className="p-3 bg-primary/10 rounded-lg text-primary"><Users className="h-6 w-6"/></div>
                <CardTitle className="font-headline text-2xl pt-2">Community Space</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Creating a warm 'third space' for everyone to connect, work, or simply breathe in the aroma of fresh beans.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Sensory Science Section */}
        <section className="grid md:grid-cols-2 gap-16 items-center bg-foreground text-background p-12 rounded-2xl">
           <div className="grid grid-cols-2 gap-4">
              {sensoryImages.map((img, index) => (
                img && <div key={index} className="relative aspect-square rounded-lg overflow-hidden"><Image src={img.imageUrl} alt={img.description} fill className="object-cover" data-ai-hint={img.imageHint} /></div>
              ))}
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl font-bold font-headline">Sensory Science</h2>
              <p className="text-muted-foreground text-lg">
                Roasting is where chemistry meets art. Our roast masters monitor the temperature and timing of every batch to highlight the unique terroir of the beans, from the citrus notes of Ethiopia to the chocolate undertones of Brazil.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <div>
                    <span className="font-semibold">Light Roasts:</span> Vibrant, high acidity, floral
                  </div>
                </li>
                 <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <div>
                    <span className="font-semibold">Medium Roasts:</span> Balanced, caramel notes
                  </div>
                </li>
                 <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <div>
                    <span className="font-semibold">Dark Roasts:</span> Bold, smoky, full-bodied
                  </div>
                </li>
              </ul>
            </div>
        </section>

      </div>
    </PublicPageLayout>
  );
}
