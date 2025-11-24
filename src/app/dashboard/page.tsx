import LoyaltyStatus from "@/components/dashboard/LoyaltyStatus";
import RecentOrders from "@/components/dashboard/RecentOrders";
import { MOCK_USER } from "@/lib/data";

export default function DashboardPage() {
  const user = MOCK_USER;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome back, {user.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here's a look at your loyalty journey with us.</p>
      </div>

      <div className="grid gap-8">
        <LoyaltyStatus user={user} />
        <RecentOrders user={user} />
      </div>
    </div>
  );
}
