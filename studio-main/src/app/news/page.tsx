
import PublicPageLayout from "@/components/layout/PublicPageLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const newsItems = [
  {
    id: 1,
    title: "Announcing Our New Seasonal Drink: The Lavender Haze Latte",
    date: "July 15, 2024",
    excerpt: "Discover the floral and sweet notes of our latest creation, available for a limited time only. It's the perfect summer refreshment!",
    imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1900&auto=format&fit=crop",
    imageHint: "latte art"
  },
  {
    id: 2,
    title: "Steamsburry partners with local artists for in-house gallery",
    date: "July 5, 2024",
    excerpt: "We're excited to showcase the amazing talent from our community. Come enjoy a coffee and some beautiful art.",
    imageUrl: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=1900&auto=format&fit=crop",
    imageHint: "art gallery"
  },
  {
    id: 3,
    title: "Loyalty Program Update: Earn Double Points on Mondays!",
    date: "June 28, 2024",
    excerpt: "We're making Mondays a little brighter. All loyalty members will now earn double the points on all purchases every Monday.",
    imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1900&auto=format&fit=crop",
    imageHint: "coffee beans"
  },
];


export default function NewsPage() {
  return (
    <PublicPageLayout title="Latest News">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {newsItems.map(item => (
          <Card key={item.id} className="flex flex-col overflow-hidden shadow-lg">
            <div className="relative h-56 w-full">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
                data-ai-hint={item.imageHint}
              />
            </div>
            <CardHeader>
              <CardTitle className="font-headline text-xl">{item.title}</CardTitle>
              <CardDescription>{item.date}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">{item.excerpt}</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="link" className="p-0">
                <Link href="#">Read More</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </PublicPageLayout>
  );
}
