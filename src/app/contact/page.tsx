
import PublicPageLayout from "@/components/layout/PublicPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  return (
    <PublicPageLayout>
      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold font-headline">Get in Touch</h1>
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
    </PublicPageLayout>
  );
}
