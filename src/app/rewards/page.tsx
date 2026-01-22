
import PublicPageLayout from "@/components/layout/PublicPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Gem, Gift, Shield, Star, Trophy, UserPlus } from "lucide-react";
import Link from "next/link";

const tiers = [
    { name: "Member", points: 0, icon: Star, color: "text-gray-500" },
    { name: "Bronze", points: 100, icon: Shield, color: "text-amber-700" },
    { name: "Silver", points: 500, icon: Gem, color: "text-slate-500" },
    { name: "Gold", points: 2000, icon: Trophy, color: "text-yellow-500" },
    { name: "Platinum", points: 5000, icon: Crown, color: "text-violet-500" },
]

export default function RewardsPage() {
  return (
    <PublicPageLayout >
      <div className="space-y-12">
        <section className="text-center">
            <h2 className="text-3xl font-bold font-headline">Join the Steamsbury Club</h2>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
                Our loyalty program is designed to give back to our amazing community. Earn points on every purchase, unlock exclusive rewards, and enjoy special treats on us. It's our way of saying thank you!
            </p>
            <div className="mt-8">
                 <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href="/signup/customer">Sign Up & Start Earning</Link>
                </Button>
            </div>
        </section>

        <section>
            <h2 className="text-3xl font-bold font-headline text-center mb-8">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
                <Card className="text-center">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">1. Sign Up & Earn</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Create an account and automatically start earning points with every purchase you make. Plus, get special welcome offers just for joining!</p>
                    </CardContent>
                </Card>
                 <Card className="text-center">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">2. Level Up Your Tier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>The more points you earn, the higher your loyalty tier. Each tier unlocks new benefits and better rewards.</p>
                    </CardContent>
                </Card>
                 <Card className="text-center">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">3. Redeem & Enjoy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Use your points to get discounts on your favorite coffee and food. Simply apply your points at checkout.</p>
                    </CardContent>
                </Card>
            </div>
        </section>
        
        <section>
             <h2 className="text-3xl font-bold font-headline text-center mb-8">Our Loyalty Tiers</h2>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {tiers.map(tier => (
                    <Card key={tier.name} className="text-center shadow-lg">
                        <CardHeader className="items-center">
                            <tier.icon className={`h-12 w-12 mb-2 ${tier.color}`} />
                            <CardTitle className="font-headline text-2xl">{tier.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-bold">{tier.points}+ <span className="font-normal text-sm">Points</span></p>
                        </CardContent>
                    </Card>
                ))}
             </div>
        </section>

        <section>
            <h2 className="text-3xl font-bold font-headline text-center mb-8">More Ways to Earn</h2>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="p-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Trophy /> Welcome Offers</h3>
                    <p className="text-muted-foreground">Get a warm welcome with tiered discounts on your first three orders: <span className="font-bold">10% off</span> your first, <span className="font-bold">5% off</span> your second, and a huge <span className="font-bold">15% off</span> your third!</p>
                </Card>
                <Card className="p-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><UserPlus /> Refer a Friend</h3>
                    <p className="text-muted-foreground">Share your unique referral code. When your friends sign up, you'll both receive <span className="font-bold">50 bonus points</span>.</p>
                </Card>
                 <Card className="p-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Gift /> Birthday Treat</h3>
                    <p className="text-muted-foreground">Add your birthday to your profile and we'll send you a special reward to help you celebrate your big day.</p>
                </Card>
            </div>
        </section>

      </div>
    </PublicPageLayout>
  );
}
