
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const updatesItems = [
  {
    id: 1,
    title: "Announcing Our New Seasonal Drink: The Lavender Haze Latte",
    date: "July 15, 2024",
    excerpt: "Discover the floral and sweet notes of our latest creation, available for a limited time only. It's the perfect summer refreshment!",
    imageUrl: "https://picsum.photos/seed/news1/600/400",
    imageHint: "latte art"
  },
  {
    id: 2,
    title: "Steamsburry partners with local artists for in-house gallery",
    date: "July 5, 2024",
    excerpt: "We're excited to showcase the amazing talent from our community. Come enjoy a coffee and some beautiful art.",
    imageUrl: "https://picsum.photos/seed/news2/600/400",
    imageHint: "art gallery"
  },
  {
    id: 3,
    title: "Loyalty Program Update: Earn Double Points on Mondays!",
    date: "June 28, 2024",
    excerpt: "We're making Mondays a little brighter. All loyalty members will now earn double the points on all purchases every Monday.",
    imageUrl: "https://picsum.photos/seed/news3/600/400",
    imageHint: "coffee beans"
  },
];


export default function UpdatesPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Latest Updates</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {updatesItems.map(item => (
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
                <CardTitle>{item.title}</CardTitle>
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
    </div>
  );
}
