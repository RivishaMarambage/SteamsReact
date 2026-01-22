'use client';
import Image from "next/image";
import { Award, Users, Check, Diamond, FileText } from "lucide-react";
import PublicPageLayout from "@/components/layout/PublicPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function AboutPage() {
  const [subject, setSubject] = useState('General Inquiries');

  const aboutMainImage = PlaceHolderImages.find(p => p.id === 'about-main');
  const earlyDaysImage = PlaceHolderImages.find(p => p.id === 'about-early-days');
  const sourcingRootsImage = PlaceHolderImages.find(p => p.id === 'about-sourcing-roots');
  const sensory1Image = PlaceHolderImages.find(p => p.id === 'sensory-1');
  const sensory2Image = PlaceHolderImages.find(p => p.id === 'sensory-2');
  const sensory3Image = PlaceHolderImages.find(p => p.id === 'sensory-3');
  const sensory4Image = PlaceHolderImages.find(p => p.id === 'sensory-4');
  
  const sensoryImages = [sensory1Image, sensory2Image, sensory3Image, sensory4Image];
  
  const teamMembers = [
    { name: 'Marcus Chen', role: 'Head Roaster', image: PlaceHolderImages.find(p => p.id === 'team-marcus') },
    { name: 'Sarah Jenkins', role: 'Lead Barista', image: PlaceHolderImages.find(p => p.id === 'team-sarah') },
    { name: 'David Steams', role: 'Founder', image: PlaceHolderImages.find(p => p.id === 'team-david') },
    { name: 'Elena Rossi', role: 'Community Manager', image: PlaceHolderImages.find(p => p.id === 'team-elena') }
  ];

  const galleryImages = [
    PlaceHolderImages.find(p => p.id === 'gallery-interior-1'),
    PlaceHolderImages.find(p => p.id === 'gallery-lattes'),
    PlaceHolderImages.find(p => p.id === 'gallery-iced-coffee'),
    PlaceHolderImages.find(p => p.id === 'gallery-interior-2'),
    PlaceHolderImages.find(p => p.id === 'gallery-bread'),
    PlaceHolderImages.find(p => p.id === 'gallery-sign')
  ];

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

        {/* Meet the Team Section */}
        <section className="text-center">
            <h2 className="text-4xl font-bold font-headline">Meet the Team</h2>
            <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
                The passionate experts behind your daily cup.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
                {teamMembers.map(member => member.image && (
                    <div key={member.name} className="flex flex-col items-center">
                        <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden shadow-lg mb-4">
                            <Image src={member.image.imageUrl} alt={member.image.description} fill className="object-cover" data-ai-hint={member.image.imageHint} />
                        </div>
                        <h3 className="font-semibold text-lg">{member.name}</h3>
                        <p className="text-sm text-primary">{member.role}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* Gallery Section */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryImages.map((img, index) => img && (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                <Image src={img.imageUrl} alt={img.description} fill className="object-cover" data-ai-hint={img.imageHint} />
              </div>
            ))}
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="text-center space-y-12">
            <div>
                <h2 className="text-4xl font-bold font-headline">Contact & Location</h2>
                <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
                    Find us at our Battaramulla location or send us a message.
                </p>
            </div>
             <div className="grid md:grid-cols-2 gap-12 text-left items-center">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div>
                        <h3 className="text-xl font-semibold">Our Address</h3>
                        <p className="text-muted-foreground">911, Electricity board road, Battaramulla - Pannipitiya Rd, Battaramulla</p>
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
                 <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-lg">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.787144869857!2d79.919339775875!3d6.915993518475263!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2570006aabb6d%3A0x14590eb0b2ce876f!2sSteamsbury%20Tea%20%26%20Coffee%20House!5e0!3m2!1sen!2slk!4v1710000000000!5m2!1sen!2slk"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Steamsbury Cafe Location"
                        className="transition-all duration-700 hover:contrast-125"
                    ></iframe>
                </div>
            </div>
            
            <div className="max-w-3xl mx-auto text-left">
              <p className="text-lg text-muted-foreground text-center mb-8">
                  We'd love to hear from you! Whether you have a question about our menu, a suggestion, or want to discuss opportunities, feel free to reach out using the form below.
              </p>
                <Card className="shadow-lg">
                    <CardHeader>
                    <CardTitle className="font-headline text-2xl">Send us a Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <Label htmlFor="subject">Subject</Label>
                            <Select onValueChange={setSubject} defaultValue={subject}>
                                <SelectTrigger id="subject">
                                    <SelectValue placeholder="Select a subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="General Inquiries">General Inquiries</SelectItem>
                                    <SelectItem value="Job Opportunities/Career">Job Opportunities/Career</SelectItem>
                                    <SelectItem value="Private Events">Private Events</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {subject === 'Job Opportunities/Career' && (
                            <div className="space-y-2 rounded-md border border-dashed p-4">
                                <Label htmlFor="cv" className="flex items-center gap-2 text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                    Upload your CV (PDF only)
                                </Label>
                                <Input id="cv" type="file" accept=".pdf" />
                            </div>
                        )}

                        <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea id="message" placeholder="Your message..." />
                        </div>
                        <Button type="submit">Send Message</Button>
                    </form>
                    </CardContent>
                </Card>
            </div>
        </section>

        {/* CTA Section */}
        <section className="bg-accent text-accent-foreground p-12 rounded-2xl text-center">
            <h2 className="text-4xl font-bold font-headline">Experience Steamsbury Today</h2>
            <p className="mt-2 max-w-2xl mx-auto">
                Whether you're looking for your morning jolt or a peaceful afternoon retreat, we have a seat waiting for you.
            </p>
            <div className="mt-8 flex justify-center gap-4">
                
                <Button asChild variant="outline" className="bg-transparent border-accent-foreground text-accent-foreground hover:bg-accent-foreground hover:text-accent">
                    <Link href="/menu">Order Online</Link>
                </Button>
            </div>
        </section>
      </div>
    </PublicPageLayout>
  );
}
