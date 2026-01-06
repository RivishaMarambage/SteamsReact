
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Check, Clipboard, Copy, Gift, Link as LinkIcon, MessageSquare, Star, UserPlus, Wallet as WalletIcon } from 'lucide-react';
import { useState } from 'react';

const POINT_REWARDS = {
    REFERRAL: 50,
    LINK_SOCIALS: 25,
    LEAVE_REVIEW: 30,
};

export default function WalletPage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);

    const userDocRef = useMemoFirebase(() => (authUser ? doc(firestore, 'users', authUser.uid) : null), [authUser, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

    const isLoading = isUserLoading || isProfileLoading;

    // Generate a referral code if it doesn't exist
    const referralCode = useMemoFirebase(() => {
        if (userProfile && !userProfile.referralCode) {
            const newCode = `STM-${authUser?.uid.substring(0, 5).toUpperCase()}`;
            if(userDocRef) {
                updateDoc(userDocRef, { referralCode: newCode });
            }
            return newCode;
        }
        return userProfile?.referralCode;
    }, [userProfile, authUser, userDocRef]);


    const handleCopy = () => {
        if (!referralCode) return;
        navigator.clipboard.writeText(referralCode);
        setIsCopied(true);
        toast({ title: 'Copied!', description: 'Referral code copied to clipboard.' });
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleClaimPoints = async (action: 'linkSocials' | 'leaveReview') => {
        if (!userDocRef || !userProfile) return;

        let fieldToUpdate: 'hasLinkedSocials' | 'hasLeftReview';
        let pointsToAward: number;

        if (action === 'linkSocials') {
            if (userProfile.hasLinkedSocials) {
                toast({ variant: 'destructive', title: 'Already Claimed', description: 'You have already claimed points for this action.' });
                return;
            }
            fieldToUpdate = 'hasLinkedSocials';
            pointsToAward = POINT_REWARDS.LINK_SOCIALS;
        } else { // leaveReview
            if (userProfile.hasLeftReview) {
                toast({ variant: 'destructive', title: 'Already Claimed', description: 'You have already claimed points for this action.' });
                return;
            }
            fieldToUpdate = 'hasLeftReview';
            pointsToAward = POINT_REWARDS.LEAVE_REVIEW;
        }

        try {
            await updateDoc(userDocRef, {
                [fieldToUpdate]: true,
                loyaltyPoints: increment(pointsToAward),
                lifetimePoints: increment(pointsToAward),
            });
            toast({
                title: 'Points Awarded!',
                description: `You've earned ${pointsToAward} points.`,
            });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };


    if (isLoading) {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
                <Skeleton className="h-64" />
            </div>
        );
    }
    
    if (!userProfile) {
        return <p>Could not load user profile.</p>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Wallet</h1>
                <p className="text-muted-foreground">Manage your points and earn more rewards.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><WalletIcon /> Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-5xl font-bold text-primary">{userProfile.loyaltyPoints ?? 0}</p>
                        <p className="text-muted-foreground">Redeemable Points</p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg bg-primary/5 border-primary/20">
                     <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">Top Up Your Wallet</CardTitle>
                        <CardDescription>Add funds to use for future purchases.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Input type="number" placeholder="LKR Amount" disabled />
                            <Button disabled>Top Up</Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Wallet top-up functionality is coming soon.</p>
                    </CardContent>
                </Card>
            </div>

             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Star /> Earn More Points</CardTitle>
                    <CardDescription>Complete actions to boost your point balance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Refer a Friend */}
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold flex items-center gap-2"><UserPlus/> Refer a Friend</h3>
                        <p className="text-sm text-muted-foreground mb-4">Share your code with a friend. When they sign up, you'll both get {POINT_REWARDS.REFERRAL} points!</p>
                         <div className="flex items-center gap-2">
                            <Input value={referralCode || 'Generating...'} readOnly />
                            <Button variant="secondary" onClick={handleCopy} disabled={!referralCode}>
                                {isCopied ? <Check className="text-green-500" /> : <Copy />}
                            </Button>
                        </div>
                    </div>

                    {/* Engage & Earn */}
                     <div className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-semibold">Engage &amp; Earn</h3>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-muted/50 rounded-md">
                            <div>
                                <p className="font-medium flex items-center gap-2"><LinkIcon /> Link Your Social Media</p>
                                <p className="text-sm text-muted-foreground">Earn {POINT_REWARDS.LINK_SOCIALS} points instantly.</p>
                            </div>
                            <Button 
                                size="sm" 
                                onClick={() => handleClaimPoints('linkSocials')}
                                disabled={userProfile.hasLinkedSocials}
                            >
                                {userProfile.hasLinkedSocials ? <Check /> : 'Claim'}
                            </Button>
                        </div>
                         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-muted/50 rounded-md">
                            <div>
                                <p className="font-medium flex items-center gap-2"><MessageSquare /> Leave a Google Review</p>
                                <p className="text-sm text-muted-foreground">Earn {POINT_REWARDS.LEAVE_REVIEW} points for your feedback.</p>
                            </div>
                             <Button 
                                size="sm" 
                                onClick={() => handleClaimPoints('leaveReview')}
                                disabled={userProfile.hasLeftReview}
                            >
                                {userProfile.hasLeftReview ? <Check /> : 'Claim'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
             </Card>
        </div>
    );
}
