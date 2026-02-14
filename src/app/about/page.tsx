'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Award, Users, Diamond, ArrowRight, MapPin, Clock, Mail, Instagram, Twitter, Linkedin, Facebook, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Footer from '@/components/layout/Footer';
import PublicHeader from '@/components/layout/PublicHeader';

export default function AboutExperience() {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [subject, setSubject] = useState('general');

    useEffect(() => {
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observerRef.current?.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.reveal').forEach((el) => {
            observerRef.current?.observe(el);
        });

        return () => observerRef.current?.disconnect();
    }, []);

    const teamMembers = [
        { name: 'Marcus Chen', role: 'Head Roaster', image: PlaceHolderImages.find(p => p.id === 'team-marcus') },
        { name: 'Sarah Jenkins', role: 'Lead Barista', image: PlaceHolderImages.find(p => p.id === 'team-sarah') },
        { name: 'David Steams', role: 'Founder', image: PlaceHolderImages.find(p => p.id === 'team-david') },
        { name: 'Elena Rossi', role: 'Community', image: PlaceHolderImages.find(p => p.id === 'team-elena') }
    ];

    return (
        <div className="bg-[#1a110a] min-h-screen text-white overflow-x-hidden">
            <PublicHeader />

            {/* Hero Section - Welcome to Steamsbury */}
            <section id="hero" className="bg-[#f2efe9] text-[#1a110a] py-20 lg:py-28 relative overflow-hidden mt-20">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Text Content */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <span className="h-[2px] w-8 bg-[#d97706]"></span>
                                <span className="text-[#d97706] font-bold text-xs tracking-widest uppercase">Our Story</span>
                            </div>

                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-black leading-[1.1]">
                                Welcome to <br />
                                <span className="text-[#6b584b]">Steamsbury</span>
                            </h1>

                            <div className="space-y-6 text-lg text-[#6b584b] leading-relaxed">
                                <p>
                                    Steamsbury was born from a simple idea to create a space where people can slow down, feel at
                                    home and enjoy truly good tea, coffee and food made with care, quality ingredients and a personal
                                    touch.
                                    Rooted in Sri Lanka’s rich heritage, Steamsbury proudly celebrates Ceylon tea and coffee, sourcing
                                    the finest leaves and beans to craft beverages that are both comforting and refined. Every cup
                                    served reflects our respect for tradition, our attention to detail and our passion for authentic flavour.
                                </p>
                                <p>
                                    At our core, Steamsbury is about people; our guests, our team, and the communities we serve. We
                                    believe a café should feel like a second home, a place to relax, connect, work, celebrate or simply
                                    enjoy a quiet moment with a perfectly brewed cup.
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6 pt-2">
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-3 rounded-full bg-[#d97706]/10 text-[#d97706]">
                                        <div className="w-6 h-6 flex items-center justify-center font-bold text-xl">☕</div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">Artisan Roasts</h3>
                                        <p className="text-sm text-[#6b584b] leading-tight">Small batch roasted daily for peak flavor.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-3 rounded-full bg-[#d97706]/10 text-[#d97706]">
                                        <div className="w-6 h-6 flex items-center justify-center font-bold text-xl">📶</div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">Cozy Workspace</h3>
                                        <p className="text-sm text-[#6b584b] leading-tight">Free high-speed WiFi and plenty of outlets.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button variant="link" className="text-[#1a110a] font-bold text-lg p-0 hover:no-underline group" asChild>
                                    <Link href="#journey" className="flex items-center gap-2">
                                        Read Our Full Story <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Image Side */}
                        <div className="relative delay-200">
                            <div className="relative aspect-square md:aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl">
                                <Image
                                    src="/IMG_2747.webp"
                                    alt="Steamsbury Cafe Exterior"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>

                            {/* Floating Review Card */}
                            <div className="absolute -bottom-6 -left-6 md:bottom-10 md:-left-10 bg-white p-6 rounded-2xl shadow-xl max-w-xs border border-gray-100 animate-float">
                                <div className="flex gap-1 text-[#f59e0b] mb-2">
                                    <div className="w-4 h-4 fill-current">★</div>
                                    <div className="w-4 h-4 fill-current">★</div>
                                    <div className="w-4 h-4 fill-current">★</div>
                                    <div className="w-4 h-4 fill-current">★</div>
                                    <div className="w-4 h-4 fill-current">★</div>
                                </div>
                                <p className="text-[#1a110a] font-medium text-sm leading-relaxed">
                                    "A cozy spot with tasty drinks, food, and fun for everyone."
                                </p>
                            </div>

                            {/* Decorative background blob */}
                            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#d97706]/5 rounded-full blur-3xl"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Story Grid */}
            <section id="journey" className="py-24 container mx-auto px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <h2 className="text-4xl md:text-5xl font-headline font-bold">The Journey</h2>
                        <div className="space-y-6 text-lg text-white/70 leading-relaxed">
                            <p>
                                Rooted in Sri Lanka’s rich heritage, Steamsbury proudly celebrates Ceylon tea and coffee, sourcing
                                the finest leaves and beans to craft beverages that are both comforting and refined. Every cup
                                served reflects our respect for tradition, our attention to detail and our passion for authentic flavour.
                            </p>
                            <p>
                                Steamsbury is developed and operated under the guidance of Santhiyagu Ceylon Trading Company,
                                a Sri Lankan enterprise engaged in food commodity trading, exports and supply chain
                                operations. With experience in sourcing, quality assurance and internationally aligned food
                                safety standards, Santhiyagu Ceylon Trading Company provides the operational foundation that
                                supports Steamsbury’s commitment to consistency, quality and reliability across all its locations.
                            </p>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-4xl font-headline font-bold text-[#d97706]">10+</span>
                                <span className="text-sm font-bold tracking-widest uppercase text-white/50">Years Brewing</span>
                            </div>
                            <div className="w-[1px] bg-white/10 h-16"></div>
                            <div className="flex flex-col gap-2">
                                <span className="text-4xl font-headline font-bold text-[#d97706]">50k+</span>
                                <span className="text-sm font-bold tracking-widest uppercase text-white/50">Cups Served</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 delay-200">
                        <div className="space-y-4 translate-y-12">
                            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                                <Image
                                    src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop"
                                    alt="Coffee Sacks"
                                    fill
                                    className="object-cover hover:scale-110 transition-transform duration-700"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                                <Image
                                    src="/THE jOURNY.webp"
                                    alt="Latte Art"
                                    fill
                                    className="object-cover hover:scale-110 transition-transform duration-700"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Commitment to Excellence Section */}
            <section className="py-24 bg-[#f9f8f6] text-[#1a110a] relative overflow-hidden">
                <div className="container mx-auto px-4 md:px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-headline font-bold mb-4 text-[#2c1810]">Commitment to Excellence</h2>
                        <p className="text-[#6b584b] text-lg">The pillars that define our daily ritual.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: "☕",
                                title: "Uncompromising Quality",
                                desc: "We source only the top 5% of specialty-grade beans from sustainable farms globally."
                            },
                            {
                                icon: "🌍",
                                title: "Ethical Sourcing",
                                desc: "Direct-trade relationships ensure farmers receive above-market prices for their dedication."
                            },
                            {
                                icon: "👥",
                                title: "Local Community",
                                desc: "Our space is designed for connection, hosting local artists and neighborhood gatherings."
                            },
                            {
                                icon: "🌍",
                                title: "Sustainability",
                                desc: "From compostable cups to zero-waste roasting, we protect the planet we harvest from."
                            }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group border border-transparent hover:border-[#d97706]/10" style={{ transitionDelay: `${i * 100}ms` }}>
                                <div className="text-4xl mb-6 text-[#d97706] group-hover:scale-110 transition-transform duration-300 inline-block">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold font-headline mb-4 text-[#2c1810]">{item.title}</h3>
                                <p className="text-[#6b584b] leading-relaxed text-sm">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-24 container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-headline font-bold mb-6">Meet the Maestros</h2>
                    <p className="text-white/60 max-w-2xl mx-auto">
                        The passionate experts behind your daily cup.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    {teamMembers.map((member, i) => member.image && (
                        <div key={i} className="group relative" style={{ transitionDelay: `${i * 100}ms` }}>
                            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 border border-white/5 bg-white/5">
                                <Image
                                    src={member.image.imageUrl}
                                    alt={member.image.description}
                                    fill
                                    className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:sepia-[.5]"
                                    data-ai-hint={member.image.imageHint}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:bg-white hover:text-black rounded-full transition-colors text-white"><Instagram className="w-4 h-4" /></button>
                                        <button className="p-2 hover:bg-white hover:text-black rounded-full transition-colors text-white"><Twitter className="w-4 h-4" /></button>
                                        <button className="p-2 hover:bg-white hover:text-black rounded-full transition-colors text-white"><Linkedin className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg leading-tight">{member.name}</h3>
                            <p className="text-[#d97706] text-sm font-medium uppercase tracking-wider mt-1">{member.role}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Location & Contact */}
            <section className="py-24 bg-[#eae7e1] text-[#1a110a]">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid lg:grid-cols-2 gap-16">
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-headline font-bold mb-4">Visit Us</h2>
                                <p className="text-[#6b584b] text-lg">We're located in the heart of Battaramulla.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <MapPin className="w-6 h-6 text-[#d97706] shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-bold text-xl mb-1">Our Studio</h3>
                                        <p className="text-[#6b584b] leading-relaxed">911, Electricity board road,<br /> Battaramulla - Pannipitiya Rd</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Clock className="w-6 h-6 text-[#d97706] shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-bold text-xl mb-1">Opening Hours</h3>
                                        <p className="text-[#6b584b]">Mon - Fri: 7am - 7pm</p>
                                        <p className="text-[#6b584b]">Sat - Sun: 8am - 6pm</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Mail className="w-6 h-6 text-[#d97706] shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-bold text-xl mb-1">Say Hello</h3>
                                        <p className="text-[#6b584b]">hello@steamsburry.com</p>
                                    </div>
                                </div>
                            </div>

                            <Card className="bg-white border-[#d97706]/20 shadow-xl overflow-hidden mt-8">
                                <CardHeader className="bg-[#f2efe9] border-b border-[#e5e7eb] px-6 py-4">
                                    <CardTitle className="text-[#1a110a] text-lg">Quick Message</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input id="name" placeholder="Your name" className="bg-white border-gray-300" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" placeholder="you@example.com" className="bg-white border-gray-300" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Select value={subject} onValueChange={setSubject}>
                                            <SelectTrigger id="subject" className="bg-white border-gray-300">
                                                <SelectValue placeholder="Select a subject" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="general">General Inquiries</SelectItem>
                                                <SelectItem value="event">Private Event</SelectItem>
                                                <SelectItem value="job">Job Opportunities</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {subject === 'job' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <Label htmlFor="cv">Upload CV (PDF preferred)</Label>
                                            <div className="flex items-center justify-center w-full">
                                                <label htmlFor="cv" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                        <p className="text-xs text-gray-400">PDF, DOC or DOCX (MAX. 5MB)</p>
                                                    </div>
                                                    <Input id="cv" type="file" className="hidden" accept=".pdf,.doc,.docx" />
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea id="message" placeholder={subject === 'job' ? "Tell us about yourself and the role you're interested in..." : "How can we help?"} className="bg-white border-gray-300 min-h-[100px]" />
                                    </div>
                                    <Button className="w-full bg-[#d97706] hover:bg-[#b45309] text-white">
                                        {subject === 'job' ? 'Submit Application' : 'Send Message'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="h-full min-h-[500px] rounded-3xl overflow-hidden shadow-2xl relative delay-200 border-4 border-white/50">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.787144869857!2d79.919339775875!3d6.915993518475263!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2570006aabb6d%3A0x14590eb0b2ce876f!2sSteamsbury%20Tea%20%26%20Coffee%20House!5e0!3m2!1sen!2slk!4v1710000000000!5m2!1sen!2slk"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Steamsbury Cafe Location"
                                className="grayscale hover:grayscale-0 transition-all duration-700"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}