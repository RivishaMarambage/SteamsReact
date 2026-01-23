
import PublicMenuDisplay from "@/components/order/PublicMenuDisplay";

export default function MenuPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
       <h1 className="text-4xl font-bold mb-8">Our Menu</h1>
       <PublicMenuDisplay />
    </div>
  );
}
