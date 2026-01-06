
'use client';

import { UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Percent } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { useUser } from "@/firebase";

interface WelcomeOfferProps {
    user: UserProfile;
}

export default function WelcomeOffer({ user }: WelcomeOfferProps) {
    const { user: authUser } = useUser();
    const canClaim = !user.welcomeOfferRedeemed && (user.emailVerified || authUser?.emailVerified);

    if (!canClaim) {
        return null;
    }

    return (
        <Card className="bg-blue-500/10 border-blue-500/20 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-blue-600"><Percent /> Your Welcome Offer Awaits!</CardTitle>
                <CardDescription>As a new member, you get 10% off any single item on your first order.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                        <p className="font-semibold">Claim Your 10% Discount</p>
                        <p className="text-sm text-muted-foreground">Click the button to start an order and claim your offer.</p>
                    </div>
                    <Button asChild>
                        <Link href={`/dashboard/order?claimWelcomeOffer=true`}>Claim Offer & Order</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
