'use client';

import { UserProfile, MenuItem } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Gift } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { useCollection } from "@/firebase";

interface BirthdayRewardProps {
    user: UserProfile;
}

export default function BirthdayReward({ user }: BirthdayRewardProps) {
    const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>('menu_items');

    const hasCredit = user.birthdayCredit && user.birthdayCredit > 0;
    const hasFreebie = user.birthdayFreebieMenuItemIds && user.birthdayFreebieMenuItemIds.length > 0;

    if (!hasCredit && !hasFreebie) {
        return null;
    }

    if (menuLoading) {
        return null; // Don't show anything while loading menu items to avoid flicker
    }

    const freebieId = hasFreebie ? user.birthdayFreebieMenuItemIds![0] : null;
    const freebieItem = freebieId ? menuItems?.find(item => item.id === freebieId) : null;

    return (
        <Card className="bg-accent/10 border-accent/30 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-accent"><Gift /> Happy Birthday!</CardTitle>
                <CardDescription>You have a special birthday reward from us. Enjoy!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {hasCredit && (
                    <div>
                        <p className="font-semibold">Rs. {user.birthdayCredit?.toFixed(2)} Store Credit</p>
                        <p className="text-sm text-muted-foreground">This will be automatically applied to your next order.</p>
                    </div>
                )}
                {freebieItem && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                            <p className="font-semibold">Your free item: {freebieItem.name}</p>
                            <p className="text-sm text-muted-foreground">Click the button to start an order and claim it.</p>
                        </div>
                        <Button asChild>
                            <Link href={`/dashboard/order?claimFreebie=${freebieItem.id}`}>Claim & Order</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
