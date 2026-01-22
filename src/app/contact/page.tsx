
import PublicPageLayout from "@/components/layout/PublicPageLayout";
import Image from "next/image";

export default function ContactPage() {
  return (
    <PublicPageLayout title="Get in Touch">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <p className="text-lg text-muted-foreground">
            We'd love to hear from you! Whether you have a question about our menu, a suggestion, or just want to say hello, feel free to visit us or drop a line. For specific inquiries, please use the contact form on our About Us page.
          </p>
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
           <Image
              src="https://picsum.photos/seed/map/800/600"
              alt="Map showing cafe location"
              fill
              className="object-cover"
              data-ai-hint="city map"
           />
        </div>
      </div>
    </PublicPageLayout>
  );
}
