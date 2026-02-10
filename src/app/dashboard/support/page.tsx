'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, MessageSquare, Mail, HelpCircle, ArrowRight, ExternalLink } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";

const FAQS = [
  {
    q: "How do I track my order?",
    a: "You can track your active orders directly from your Dashboard under the 'Recent Orders' section. Once our baristas mark it as 'Ready for Pickup', you'll receive a notification and hear a bell sound if the app is open."
  },
  {
    q: "How are Steam Points calculated?",
    a: "Points are earned based on your total bill. For most orders, you earn 1 point for every LKR 200 spent. If your bill is over LKR 10,000, you earn double points! Check the 'Rewards' page for full details."
  },
  {
    q: "When can I redeem my points?",
    a: "Redemption is unlocked once you reach the Bronze Tier (100 Lifetime Points). Once unlocked, you can use your points at checkout to pay for your drinks and snacks. 1 Point = LKR 1."
  },
  {
    q: "My points haven't updated yet, what should I do?",
    a: "Points are usually awarded instantly after an order is marked as 'Completed' by our staff. If you don't see them after 24 hours, please contact us with your Order ID."
  },
  {
    q: "Can I cancel my order?",
    a: "Orders can be canceled only if they are still in the 'Placed' status. Once our team starts 'Processing' your order, we cannot accept cancellations as the food or beverage is already being prepared."
  }
];

export default function SupportPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto pb-20">
      <div className="text-center space-y-2">
        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <LifeBuoy className="text-primary h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold font-headline uppercase tracking-tight">How can we help?</h1>
        <p className="text-muted-foreground text-lg">We're here to ensure your Steamsbury experience is perfect.</p>
      </div>

      {/* Direct Contact Methods */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="rounded-[2rem] shadow-lg border-0 bg-[#25D366] text-white overflow-hidden group">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <FaWhatsapp className="h-10 w-10" />
              <div className="bg-white/20 p-1 rounded-full"><ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></div>
            </div>
            <CardTitle className="text-2xl font-headline mt-4">WhatsApp Support</CardTitle>
            <CardDescription className="text-white/80">Typical response time: 5-10 minutes.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button asChild className="w-full bg-white text-[#25D366] hover:bg-white/90 rounded-full font-bold h-12">
              <Link href="https://wa.me/94740479838" target="_blank">
                Chat with us <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] shadow-lg border-0 bg-[#2c1810] text-white overflow-hidden group">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <Mail className="h-10 w-10 text-primary" />
              <div className="bg-white/10 p-1 rounded-full"><ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-primary" /></div>
            </div>
            <CardTitle className="text-2xl font-headline mt-4">Email Inquiries</CardTitle>
            <CardDescription className="text-white/60">For formal requests and feedback.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button asChild className="w-full bg-primary text-white hover:bg-primary/90 border-none rounded-full font-bold h-12">
              <Link href="mailto:hello@steamsbury.com">
                Send an Email
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <HelpCircle className="text-primary h-6 w-6" />
          <h2 className="text-2xl font-bold font-headline uppercase tracking-tight">Common Questions</h2>
        </div>
        
        <Card className="rounded-[2rem] shadow-md border-0 bg-white overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-0 border-muted">
                  <AccordionTrigger className="text-left font-bold text-lg hover:no-underline py-6">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Still need help? */}
      <Card className="rounded-[2rem] border-2 border-primary/20 bg-primary/5 p-8 text-center space-y-4">
        <MessageSquare className="h-10 w-10 text-primary mx-auto opacity-50" />
        <h3 className="text-xl font-bold font-headline">Still have questions?</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">Our physical studio is open daily from 7 AM to 7 PM in Battaramulla. Feel free to visit us!</p>
        <Button variant="link" asChild className="text-primary font-black uppercase tracking-widest">
          <Link href="/about#hero">View Studio Location</Link>
        </Button>
      </Card>
    </div>
  );
}
