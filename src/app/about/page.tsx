'use client';
import Image from "next/image";
import { Award, Users, Check, Diamond, FileText, Mail, MapPin, Clock } from "lucide-react";
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
            <h2 className="text-4xl font-bold font-headline text-[#1a110a]">Our Story</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              From a single small roaster in a dusty garage to a beloved community hub, our journey has been fueled by a relentless passion for the perfect cup. We believe that coffee is more than a beverage; it's a catalyst for connection.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              {earlyDaysImage && (
                <div className="space-y-2">
                  <div className="aspect-square relative rounded-lg overflow-hidden border border-border">
                     <Image src={earlyDaysImage.imageUrl} alt={earlyDaysImage.description} fill className="object-cover hover:scale-105 transition-transform duration-500" data-ai-hint={earlyDaysImage.imageHint} />
                  </div>
                  <p className="text-xs text-center font-bold text-muted-foreground uppercase tracking-tighter">The Early Days</p>
                </div>
              )}
              {sourcingRootsImage && (
                 <div className="space-y-2">
                   <div className="aspect-square relative rounded-lg overflow-hidden border border-border">
                     <Image src={sourcingRootsImage.imageUrl} alt={sourcingRootsImage.description} fill className="object-cover hover:scale-105 transition-transform duration-500" data-ai-hint={sourcingRootsImage.imageHint} />
                   </div>
                   <p className="text-xs text-center font-bold text-muted-foreground uppercase tracking-tighter">Sourcing Roots</p>
                </div>
              )}
            </div>
          </div>
          <div>
            {aboutMainImage && (
              <div className="relative h-[500px] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <Image src={aboutMainImage.imageUrl} alt={aboutMainImage.description} fill className="object-cover" data-ai-hint={aboutMainImage.imageHint} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            )}
          </div>
        </section>

        {/* Our Values Section */}
        <section className="text-center">
          <h2 className="text-4xl font-bold font-headline text-[#1a110a]">Our Values</h2>
          <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
            The principles that guide every roast and every pour we make.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12 text-left">
            <Card className="shadow-md hover:shadow-xl transition-all duration-300 border-none bg-muted/30">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary"><Award className="h-6 w-6"/></div>
                <CardTitle className="font-headline text-2xl pt-2">Quality First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We never compromise on the roast. Each batch is micro-roasted to perfection, ensuring the richest flavor profile possible.
                </p>
              </CardContent>
            </Card>
             <Card className="shadow-md hover:shadow-xl transition-all duration-300 border-none bg-muted/30">
              <CardHeader className="flex flex-row items-start gap-4">
                 <div className="p-3 bg-primary/10 rounded-xl text-primary"><Diamond className="h-6 w-6"/></div>
                <CardTitle className="font-headline text-2xl pt-2">Ethical Sourcing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                   Direct trade relationships and fair wages for farmers are at the core of our supply chain. Respecting the seed to the cup.
                </p>
              </CardContent>
            </Card>
             <Card className="shadow-md hover:shadow-xl transition-all duration-300 border-none bg-muted/30">
              <CardHeader className="flex flex-row items-start gap-4">
                 <div className="p-3 bg-primary/10 rounded-xl text-primary"><Users className="h-6 w-6"/></div>
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
        <section className="grid md:grid-cols-2 gap-16 items-center bg-[#1a110a] text-white p-8 md:p-16 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
           <div className="grid grid-cols-2 gap-4 relative z-10">
              {sensoryImages.map((img, index) => (
                img && (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                    <Image src={img.imageUrl} alt={img.description} fill className="object-cover transition-transform duration-700 group-hover:scale-110" data-ai-hint={img.imageHint} />
                  </div>
                )
              ))}
            </div>
            <div className="space-y-6 relative z-10">
              <span className="text-primary font-bold tracking-widest text-xs uppercase">The Roast Profile</span>
              <h2 className="text-4xl md:text-5xl font-bold font-headline leading-tight">Sensory Science</h2>
              <p className="text-white/60 text-lg leading-relaxed">
                Roasting is where chemistry meets art. Our roast masters monitor the temperature and timing of every batch to highlight the unique terroir of the beans.
              </p>
              <ul className="space-y-4">
                {[
                  { title: "Light Roasts", desc: "Vibrant, high acidity, floral" },
                  { title: "Medium Roasts", desc: "Balanced, caramel notes" },
                  { title: "Dark Roasts", desc: "Bold, smoky, full-bodied" },
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-bold text-white block mb-0.5">{item.title}</span>
                      <span className="text-sm text-white/50">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
        </section>

        {/* Meet the Team Section */}
        <section className="text-center">
            <h2 className="text-4xl font-bold font-headline text-[#1a110a]">Meet the Team</h2>
            <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
                The passionate experts behind your daily cup.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
                {teamMembers.map(member => member.image && (
                    <div key={member.name} className="flex flex-col items-center group">
                        <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden shadow-lg mb-4 border-4 border-background ring-1 ring-border group-hover:ring-primary/50 transition-all duration-500">
                            <Image src={member.image.imageUrl} alt={member.image.description} fill className="object-cover group-hover:scale-110 transition-transform duration-700" data-ai-hint={member.image.imageHint} />
                        </div>
                        <h3 className="font-bold text-lg text-[#1a110a]">{member.name}</h3>
                        <p className="text-sm font-semibold text-primary/80 uppercase tracking-wider">{member.role}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* Contact Us Section */}
        <section className="text-center space-y-16">
            <div>
                <h2 className="text-4xl font-bold font-headline text-[#1a110a]">Connect With Us</h2>
                <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
                    Visit our Battaramulla location or reach out digitally.
                </p>
            </div>
             <div className="grid md:grid-cols-2 gap-12 text-left items-start">
                <div className="space-y-8">
                    <div className="grid gap-6">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><MapPin /></div>
                          <div>
                            <h3 className="text-xl font-bold font-headline mb-1">Our Address</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">911, Electricity board road,<br/>Battaramulla - Pannipitiya Rd, Battaramulla</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Clock /></div>
                          <div>
                            <h3 className="text-xl font-bold font-headline mb-1">Opening Hours</h3>
                            <p className="text-muted-foreground text-sm">Mon - Fri: 7:00 AM - 7:00 PM</p>
                            <p className="text-muted-foreground text-sm">Sat - Sun: 8:00 AM - 6:00 PM</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Mail /></div>
                          <div>
                            <h3 className="text-xl font-bold font-headline mb-1">Email</h3>
                            <p className="text-muted-foreground text-sm font-medium">hello@steamsbury.com</p>
                          </div>
                        </div>
                    </div>
                    
                    <div className="relative h-80 w-full rounded-3xl overflow-hidden shadow-2xl border border-border group">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.787144869857!2d79.919339775875!3d6.915993518475263!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2570006aabb6d%3A0x14590eb0b2ce876f!2sSteamsbury%20Tea%20%26%20Coffee%20House!5e0!3m2!1sen!2slk!4v1710000000000!5m2!1sen!2slk"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Steamsbury Cafe Location"
                            className="transition-all duration-700 hover:contrast-125 group-hover:scale-105"
                        ></iframe>
                    </div>
                </div>
                
                <div className="max-w-xl w-full">
                    <Card className="shadow-2xl border-none bg-background rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-muted/30 p-8 border-b border-border/50">
                          <CardTitle className="font-headline text-3xl text-[#1a110a]">Send a Message</CardTitle>
                          <CardDescription>We'll get back to you within 24 hours.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="first-name">First Name</Label>
                                  <Input id="first-name" placeholder="John" className="rounded-xl h-12" />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="last-name">Last Name</Label>
                                  <Input id="last-name" placeholder="Doe" className="rounded-xl h-12" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input id="email" type="email" placeholder="john@example.com" className="rounded-xl h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Select onValueChange={setSubject} defaultValue={subject}>
                                    <SelectTrigger id="subject" className="rounded-xl h-12">
                                        <SelectValue placeholder="Select a subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="General Inquiries">General Inquiries</SelectItem>
                                        <SelectItem value="Private Events">Private Events</SelectItem>
                                        <SelectItem value="Job Opportunities">Job Opportunities</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {subject === 'Job Opportunities' && (
                                <div className="space-y-2 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-6 animate-in fade-in slide-in-from-top-2">
                                    <Label htmlFor="cv" className="flex items-center gap-3 text-primary font-bold mb-2">
                                        <FileText className="h-5 w-5" />
                                        Upload your CV (PDF)
                                    </Label>
                                    <Input id="cv" type="file" accept=".pdf" className="bg-background cursor-pointer rounded-xl h-auto py-2" />
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-2">Maximum file size: 5MB</p>
                                </div>
                            )}

                            <div className="space-y-2">
                              <Label htmlFor="message">Message</Label>
                              <Textarea id="message" placeholder="How can we help you?" className="min-h-[120px] rounded-2xl" />
                            </div>
                            <Button type="submit" className="w-full h-14 rounded-full text-lg font-bold bg-[#d97706] hover:bg-[#b45309] shadow-lg hover:shadow-primary/20 transition-all">
                              Send Message
                            </Button>
                        </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="bg-accent text-accent-foreground p-12 md:p-20 rounded-[3rem] text-center relative overflow-hidden shadow-xl border border-white/10">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-6xl font-bold font-headline leading-tight">Experience Steamsbury Today</h2>
              <p className="text-lg md:text-xl text-accent-foreground/80 leading-relaxed">
                  Whether you're looking for your morning jolt or a peaceful afternoon retreat, we have a seat waiting for you.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button asChild size="lg" className="rounded-full h-16 px-10 bg-accent-foreground text-accent hover:opacity-90 font-bold text-lg shadow-2xl">
                      <Link href="/menu">Order Online Now</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full h-16 px-10 bg-transparent border-accent-foreground/30 text-accent-foreground hover:bg-accent-foreground/10 font-bold text-lg">
                      <Link href="/rewards">Join Rewards Club</Link>
                  </Button>
              </div>
            </div>
        </section>
      </div>
    </PublicPageLayout>
  );
}