
'use client';
import PublicPageLayout from "@/components/layout/PublicPageLayout";
import FoodCarousel from "@/components/about/FoodCarousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
        
        <section className="border-t pt-12">
            <h2 className="text-3xl font-bold font-headline text-center mb-8">Get in Touch</h2>
             <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <p className="text-lg text-muted-foreground">
                    We'd love to hear from you! Whether you have a question about our menu, a suggestion, or just want to say hello, feel free to reach out.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold">Our Address</h3>
                      <p className="text-muted-foreground">123 Coffee Lane, Colombo, Sri Lanka</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Opening Hours</h3>
                      <p className="text-muted-foreground">Monday - Friday: 7:00 AM - 7:00 PM</p>
                      <p className="text-muted-foreground">Saturday - Sunday: 8:00 AM - 6:00 PM</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Email</h3>
                      <p className="text-muted-foreground">hello@steamsburry.com</p>
                    </div>
                  </div>
                </div>
                <div>
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="font-headline text-2xl">Send us a Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="first-name">First Name</Label>
                            <Input id="first-name" placeholder="John" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="last-name">Last Name</Label>
                            <Input id="last-name" placeholder="Doe" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="john@example.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">Message</Label>
                          <Textarea id="message" placeholder="Your message..." />
                        </div>
                        <Button type="submit">Send Message</Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
        </section>

      </div>
    </PublicPageLayout>
  );
}
