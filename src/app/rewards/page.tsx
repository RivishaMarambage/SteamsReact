
import PublicPageLayout from "@/components/layout/PublicPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function RewardsPage() {
  return (
    <PublicPageLayout title="The Steamsbury Club">
      <div className="space-y-12">
        <section className="text-center">
          <h2 className="text-3xl font-bold font-headline">Loyalty & Rewards Program</h2>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
            Welcome to The Steamsbury Club, our exclusive loyalty program designed to reward your repeat visits and long-term engagement.
          </p>
        </section>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>What Are Steam Points?</CardTitle>
            <CardDescription>
              Steam Points are the official currency of The Steamsbury Club. Each point has a value of LKR 1 and is credited automatically to your loyalty wallet after eligible purchases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 mt-1 text-primary shrink-0" />
                <span><span className="font-semibold text-foreground">Redeemable Rewards:</span> Steam Points can be redeemed partially or fully on future purchases once you reach the Bronze Tier or higher.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 mt-1 text-primary shrink-0" />
                <span><span className="font-semibold text-foreground">Tier Status:</span> Redeeming points does not affect your tier status – tiers are based on total lifetime points earned.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 mt-1 text-primary shrink-0" />
                <span><span className="font-semibold text-foreground">Non-Transferable:</span> Points are non-transferable and cannot be exchanged for cash.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <section>
          <h2 className="text-3xl font-bold font-headline text-center mb-8">How to Join – Simple Steps</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4 text-2xl font-bold">1</div>
              <h3 className="font-semibold text-lg mb-2">Visit or Sign Up</h3>
              <p className="text-muted-foreground">Visit any Steamsbury outlet or sign up online via our website.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4 text-2xl font-bold">2</div>
              <h3 className="font-semibold text-lg mb-2">Register</h3>
              <p className="text-muted-foreground">Complete the registration form with your name, phone number, and email.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4 text-2xl font-bold">3</div>
              <h3 className="font-semibold text-lg mb-2">Get Your ID</h3>
              <p className="text-muted-foreground">Receive your membership ID instantly, either digitally or via a physical card.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4 text-2xl font-bold">4</div>
              <h3 className="font-semibold text-lg mb-2">Start Earning</h3>
              <p className="text-muted-foreground">Start earning Steam Points immediately with your first eligible purchase.</p>
            </div>
          </div>
          <p className="text-center mt-6 text-muted-foreground">Membership is free and open to all Steamsbury patrons.</p>
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>How to Earn Steam Points</CardTitle>
                    <CardDescription>Points are calculated automatically on your eligible bill value.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bill Value (LKR)</TableHead>
                                <TableHead>Points Earned</TableHead>
                                <TableHead className="text-right">Approx. Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>0 – 999</TableCell>
                                <TableCell>1 point per LKR 400</TableCell>
                                <TableCell className="text-right">~0.25%</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>1,000 – 4,999</TableCell>
                                <TableCell>1 point per LKR 200</TableCell>
                                <TableCell className="text-right">~0.50%</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>5,000 – 9,999</TableCell>
                                <TableCell>1 point per LKR 100</TableCell>
                                <TableCell className="text-right">~1.00%</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>10,000 and above</TableCell>
                                <TableCell>2 points per LKR 100</TableCell>
                                <TableCell className="text-right">~2.00%</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                     <p className="text-xs text-muted-foreground mt-4">
                        Points are not earned on certain promotional items or third-party products unless explicitly stated. Fractions of points may be rounded down.
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Loyalty Tiers & Accumulated Points</CardTitle>
                    <CardDescription>Your tier is determined by lifetime points earned.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tier</TableHead>
                                <TableHead className="text-right">Total Points Earned</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Member</TableCell>
                                <TableCell className="text-right">0 – 99 points</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Bronze</TableCell>
                                <TableCell className="text-right">100 – 499 points</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Silver</TableCell>
                                <TableCell className="text-right">500 – 1,999 points</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Gold</TableCell>
                                <TableCell className="text-right">2,000 – 4,999 points</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Platinum</TableCell>
                                <TableCell className="text-right">5,000 points and above</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                     <p className="text-xs text-muted-foreground mt-4">
                        Tier upgrades are automatic. Tiers do not expire unless stated in future updates.
                    </p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Tier-Based Benefits & General Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-semibold mb-2">Benefits & Offers</h3>
                    <p className="text-muted-foreground">Steamsbury may offer exclusive benefits depending on your loyalty tier, such as special promotions, discounts, or complimentary items. The nature, frequency, and availability of tier-based offers are determined solely by Steamsbury and may vary without prior notice.</p>
                </div>
                 <div>
                    <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                     <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                        <li>Steam Points are non-transferable and cannot be redeemed for cash.</li>
                        <li>Points may not be earned or redeemed on certain promotions or third-party products unless explicitly stated.</li>
                        <li>Steamsbury reserves the right to amend, suspend, or terminate the loyalty program, point structure, or tier benefits at its discretion.</li>
                        <li>Misuse, manipulation, or abuse of the system may result in suspension or termination of membership benefits.</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
        
        <section className="text-center bg-muted/50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold font-headline mb-2">Why Join The Steamsbury Club?</h2>
            <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
               Membership turns your visits into rewards, unlocking benefits that recognize your loyalty and engagement. With Steam Points, your purchases contribute not only to rewards but also to higher-tier privileges, ensuring every visit counts.
            </p>
            <div className="mt-6">
                 <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href="/signup/customer">Join The Steamsbury Club Today</Link>
                </Button>
            </div>
        </section>
      </div>
    </PublicPageLayout>
  );
}
