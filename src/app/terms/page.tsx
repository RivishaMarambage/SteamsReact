'use client';

import React from 'react';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TermsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-[#FDFBF7]">
            <PublicHeader />
            
            <main className="flex-1 pt-32 pb-20">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight text-[#2c1810] mb-4">
                            Terms & <span className="text-[#d97706]">Conditions</span>
                        </h1>
                        <p className="text-[#6b584b] text-lg font-medium">Loyalty Points & Membership Tiers Policy</p>
                    </div>

                    <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-md">
                        <CardContent className="p-8 md:p-12 space-y-10 text-[#2c1810]">
                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706]">1. Overview of the Steamsbury Loyalty Programme</h2>
                                <p className="leading-relaxed">
                                    Steamsbury (Pvt) Ltd operates a customer loyalty programme designed to reward repeat patronage and long-term engagement. Under this programme, registered members earn loyalty points based on the value of their purchases. These points can be redeemed for monetary discounts and also contribute toward the customer’s loyalty tier status, which unlocks exclusive offers and benefits.
                                </p>
                                <p className="leading-relaxed">
                                    Participation in the loyalty programme is voluntary and available only to registered Steamsbury members.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706]">2. Earning Loyalty Points</h2>
                                <p className="leading-relaxed">
                                    Loyalty points are earned on eligible bills based on the total bill value at the time of purchase. Points are calculated automatically according to the following structure:
                                </p>
                                <div className="rounded-3xl border-2 border-[#d97706]/10 overflow-hidden mt-4">
                                    <Table>
                                        <TableHeader className="bg-[#d97706]/5">
                                            <TableRow>
                                                <TableHead className="font-bold text-[#2c1810]">Bill Value (LKR)</TableHead>
                                                <TableHead className="font-bold text-[#2c1810]">Points Earned</TableHead>
                                                <TableHead className="font-bold text-[#2c1810]">Calculation Basis</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>LKR 0 - 999</TableCell>
                                                <TableCell className="font-bold">1 point</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">per LKR 400 (Approx. 0.25%)</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>LKR 1,000 - 4,999</TableCell>
                                                <TableCell className="font-bold">1 point</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">per LKR 200 (Approx. 0.50%)</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>LKR 5,000 - 9,999</TableCell>
                                                <TableCell className="font-bold">1 point</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">per LKR 100 (Approx. 1.00%)</TableCell>
                                            </TableRow>
                                            <TableRow className="bg-[#d97706]/10">
                                                <TableCell className="font-black">LKR 10,000 and above</TableCell>
                                                <TableCell className="font-black text-[#d97706]">2 points</TableCell>
                                                <TableCell className="text-[#2c1810] font-bold text-sm">per LKR 100 (Approx. 2.00%)</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                                <p className="text-sm italic text-[#6b584b] mt-4">
                                    Points are calculated proportionately on the final bill value. Fractions of points may be rounded down at Steamsbury’s discretion unless otherwise specified in a promotional campaign.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706]">3. Points Value and Redemption</h2>
                                <ul className="list-disc pl-6 space-y-3 leading-relaxed">
                                    <li><strong>Point Value:</strong> Each loyalty point is equivalent to LKR 1.</li>
                                    <li><strong>Redeemable Wallet:</strong> Earned points are credited into the member’s loyalty wallet. Members may redeem available points partially or fully against eligible purchases, subject to any applicable promotional conditions.</li>
                                    <li><strong>Minimum Tier Requirement:</strong> Points can only be redeemed once the customer reaches the Bronze Tier or above.</li>
                                    <li><strong>Redemption Does Not Affect Tier Status:</strong> Redeeming points will not reduce or downgrade a customer’s loyalty tier. Tier eligibility is based on total lifetime points earned, not the current wallet balance.</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706]">4. Loyalty Tiers and Accumulated Points</h2>
                                <p className="leading-relaxed">
                                    Loyalty tiers are determined based on the total accumulated points earned over the entire membership period, regardless of whether those points have been redeemed.
                                </p>
                                <div className="rounded-3xl border-2 border-[#d97706]/10 overflow-hidden mt-4">
                                    <Table>
                                        <TableHeader className="bg-[#d97706]/5">
                                            <TableRow>
                                                <TableHead className="font-bold text-[#2c1810]">Loyalty Tier</TableHead>
                                                <TableHead className="font-bold text-[#2c1810]">Total Points Earned</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-bold">Member</TableCell>
                                                <TableCell>0 - 99 points</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-bold text-[#cd7f32]">Bronze</TableCell>
                                                <TableCell>100 - 499 points</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-bold text-[#9ca3af]">Silver</TableCell>
                                                <TableCell>500 - 1,999 points</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-bold text-[#d97706]">Gold</TableCell>
                                                <TableCell>2,000 - 4,999 points</TableCell>
                                            </TableRow>
                                            <TableRow className="bg-[#2c1810] text-white">
                                                <TableCell className="font-black">Platinum</TableCell>
                                                <TableCell className="font-medium">5,000 points and above</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                                <p className="leading-relaxed mt-4">
                                    Tier upgrades occur automatically once the required accumulated points threshold is reached. Loyalty tiers do not expire unless otherwise stated in a future policy update.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706]">5. Tier-Based Benefits and Offers</h2>
                                <p className="leading-relaxed">
                                    Steamsbury may introduce exclusive offers, promotions, discounts, early access privileges, or complimentary items based on a customer’s loyalty tier. Higher tiers may receive enhanced benefits as a recognition of long-term loyalty.
                                </p>
                                <p className="leading-relaxed">
                                    The nature, frequency, and availability of tier-based offers are determined solely by Steamsbury and may vary from time to time without prior notice.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706]">6. General Conditions</h2>
                                <ul className="list-disc pl-6 space-y-3 leading-relaxed">
                                    <li>Loyalty points are non-transferable and cannot be exchanged for cash.</li>
                                    <li>Points may not be earned or redeemed on certain promotional items, third-party products, or special offers unless explicitly stated.</li>
                                    <li>Steamsbury reserves the right to amend, suspend, or terminate the loyalty programme, point structure, or tier benefits at its discretion, subject to applicable laws.</li>
                                    <li>Any misuse, manipulation, or abuse of the loyalty system may result in suspension or termination of membership benefits.</li>
                                </ul>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    );
}
