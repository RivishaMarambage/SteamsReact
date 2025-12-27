
import PublicPageLayout from "@/components/layout/PublicPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const newsArticles = [
  {
    title: "New Seasonal Drink: The Lavender Haze Latte",
    date: "July 15, 2024",
    excerpt: "We're excited to introduce our new summer special! A delightful blend of our signature espresso, creamy oat milk, and a hint of homemade lavender syrup. It's the perfect refreshing treat for a warm day."
  },
  {
    title: "Community Spotlight: Supporting Local Artists",
    date: "July 1, 2024",
    excerpt: "This month, our walls feature the stunning work of local painter Jane Doe. Come enjoy a coffee and immerse yourself in the vibrant colors of her latest collection, 'City in Bloom'."
  },
  {
    title: "We're Expanding Our Pastry Selection!",
    date: "June 20, 2024",
    excerpt: "You asked, and we listened! We've partnered with a local artisan bakery to bring you an even wider range of delicious croissants, muffins, and cakes. Come find your new favorite!"
  }
];

export default function NewsPage() {
  return (
    <PublicPageLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-headline">Latest News & Events</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Stay updated with what's brewing at Steamsburry.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {newsArticles.map((article, index) => (
            <Card key={index} className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{article.title}</CardTitle>
                <CardDescription>{article.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{article.excerpt}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PublicPageLayout>
  );
}
