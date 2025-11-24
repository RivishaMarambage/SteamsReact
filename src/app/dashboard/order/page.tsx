import MenuDisplay from "@/components/order/MenuDisplay";
import { MENU_ITEMS } from "@/lib/data";

export default function OrderPage() {
  const menuItems = MENU_ITEMS;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Order for Pickup</h1>
        <p className="text-muted-foreground">Select your favorites and we'll have them ready for you.</p>
      </div>
      <MenuDisplay menuItems={menuItems} />
    </div>
  );
}
