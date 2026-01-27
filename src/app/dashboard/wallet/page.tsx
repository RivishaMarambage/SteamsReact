'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc, increment, collection, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Check, Copy, Gift, Link as LinkIcon, MessageSquare, Star, UserPlus, Wallet as WalletIcon, ArrowDown, ArrowUp, History, ShoppingBag, Receipt, QrCode, CreditCard } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Order, PointTransaction, UserProfile } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import QrScanner from '@/components/wallet/QrScanner';
import { Label } from '../ui/label';


const POINT_REWARDS = {
    REFERRAL: 50,
    LINK_SOCIALS: 25,
    LEAVE_REVIEW: 30,
};

function HistorySkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

export default function WalletPage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);

    const userDocRef = useMemoFirebase(() => (authUser ? doc(firestore, 'users', authUser.uid) : null), [authUser, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const pointHistoryQuery = useMemoFirebase(() => authUser ? query(collection(firestore, `users/${authUser.uid}/point_transactions`), orderBy('date', 'desc')) : null, [authUser, firestore]);
    const { data: pointHistory, isLoading: isPointHistoryLoading } = useCollection<PointTransaction>(pointHistoryQuery);

    const orderHistoryQuery = useMemoFirebase(() => authUser ? query(collection(firestore, `users/${authUser.uid}/orders`), orderBy('orderDate', 'desc')) : null, [authUser, firestore]);
    const { data: orderHistory, isLoading: isOrderHistoryLoading } = useCollection<Order>(orderHistoryQuery);

    const isLoading = isUserLoading || isProfileLoading;

    // We get the referral code, but we don't create it here anymore to avoid writes in render.
    const referralCode = userProfile?.referralCode;

    const handleCopy = async () => {
        if (!userProfile || !authUser || !firestore || !userDocRef) return;

        let codeToCopy = userProfile.referralCode;

        // If the code doesn't exist, create it, save it, and then copy it.
        if (!codeToCopy) {
            codeToCopy = `STM-${authUser.uid.substring(0, 5).toUpperCase()}`;
            const updateData = { referralCode: codeToCopy };
            
            updateDoc(userDocRef, updateData)
                .catch(error => {
                    const contextualError = new FirestorePermissionError({
                        path: userDocRef.path,
                        operation: 'update',
                        requestResourceData: updateData,
                    });
                    errorEmitter.emit('permission-error', contextualError);
                });
        }
        
        if (!codeToCopy) return;

        navigator.clipboard.writeText(codeToCopy);
        setIsCopied(true);
        toast({ title: 'Copied!', description: 'Referral code copied to clipboard.' });
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleClaimPoints = async (action: 'linkSocials' | 'leaveReview') => {
        if (!userDocRef || !userProfile || !firestore) return;

        let fieldToUpdate: 'hasLinkedSocials' | 'hasLeftReview';
        let pointsToAward: number;
        let description: string;

        if (action === 'linkSocials') {
            if (userProfile.hasLinkedSocials) {
                toast({ variant: 'destructive', title: 'Already Claimed', description: 'You have already claimed points for this action.' });
                return;
            }
            fieldToUpdate = 'hasLinkedSocials';
            pointsToAward = POINT_REWARDS.LINK_SOCIALS;
            description = 'Linked Social Media Accounts';
        } else { // leaveReview
            if (userProfile.hasLeftReview) {
                toast({ variant: 'destructive', title: 'Already Claimed', description: 'You have already claimed points for this action.' });
                return;
            }
            fieldToUpdate = 'hasLeftReview';
            pointsToAward = POINT_REWARDS.LEAVE_REVIEW;
            description = 'Left a Google Review';
        }

        const batch = writeBatch(firestore);

        const profileUpdate = {
            [fieldToUpdate]: true,
            loyaltyPoints: increment(pointsToAward),
            lifetimePoints: increment(pointsToAward),
        };

        batch.update(userDocRef, profileUpdate);
        
        const transactionRef = doc(collection(firestore, `users/${userProfile.id}/point_transactions`));
        const transactionData: Omit<PointTransaction, 'id'> = {
            date: serverTimestamp() as any,
            description,
            amount: pointsToAward,
            type: 'earn'
        };
        batch.set(transactionRef, transactionData);

        // No await here, chain the .catch block.
        batch.commit()
            .then(() => {
                toast({
                    title: 'Points Awarded!',
                    description: `You've earned ${pointsToAward} points.`,
                });
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: userDocRef.path, // The primary path being written to.
                    operation: 'write', // Batches are generic writes
                    requestResourceData: { profileUpdate, transactionData },
                });

                // Emit the error with the global error emitter
                errorEmitter.emit('permission-error', permissionError);
            });
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

            <div className="grid md:grid-cols-3 gap-8">
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
                        <CardTitle className="font-headline flex items-center gap-2"><QrCode /> Scan &amp; Pay</CardTitle>
                        <CardDescription>Use your loyalty points to pay in-store instantly.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button className="w-full">Open Scanner</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <QrScanner />
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><CreditCard /> Top Up Balance</CardTitle>
                        <CardDescription>Add credit to your account for faster checkout.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" disabled>Coming Soon</Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><History/> History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="points">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="points"><Receipt className="mr-2"/> Points History</TabsTrigger>
                            <TabsTrigger value="transactions"><ShoppingBag className="mr-2"/> Transaction History</TabsTrigger>
                        </TabsList>
                        <TabsContent value="points" className="mt-4">
                            <ScrollArea className="h-72">
                                <div className="space-y-3 pr-4">
                                {isPointHistoryLoading ? (
                                    <HistorySkeleton />
                                ) : pointHistory && pointHistory.length > 0 ? (
                                    pointHistory.map(tx => (
                                        <div key={tx.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                {tx.type === 'earn' ? (
                                                     <div className="p-2 bg-green-500/20 rounded-full"><ArrowUp className="h-4 w-4 text-green-600"/></div>
                                                ) : (
                                                    <div className="p-2 bg-red-500/20 rounded-full"><ArrowDown className="h-4 w-4 text-red-600"/></div>
                                                )}
                                                <div>
                                                    <p className="font-medium">{tx.description}</p>
                                                    <p className="text-xs text-muted-foreground">{tx.date ? tx.date.toDate().toLocaleString() : 'Date pending...'}</p>
                                                </div>
                                            </div>
                                            <p className={cn("font-bold text-lg", tx.type === 'earn' ? 'text-green-600' : 'text-red-600')}>
                                                {tx.type === 'earn' ? '+' : '-'}{Math.abs(tx.amount)}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">No point history yet.</p>
                                )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="transactions" className="mt-4">
                              <ScrollArea className="h-72">
                                <div className="space-y-3 pr-4">
                                {isOrderHistoryLoading ? (
                                    <HistorySkeleton />
                                ) : orderHistory && orderHistory.length > 0 ? (
                                    orderHistory.map(order => (
                                         <div key={order.id} className="p-3 bg-muted/50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <div>
                                                    <p className="font-semibold">Order #{order.id.substring(0,7).toUpperCase()}</p>
                                                    <p className="text-xs text-muted-foreground">{order.orderDate ? order.orderDate.toDate().toLocaleString() : 'Date pending...'}</p>
                                                </div>
                                                <p className="font-bold text-lg text-primary">LKR {order.totalAmount.toFixed(2)}</p>
                                            </div>
                                            <div className="text-xs space-y-1">
                                                {order.orderItems?.map((item, index) => (
                                                    <div key={index} className="flex justify-between">
                                                        <span>{item.quantity}x {item.menuItemName}</span>
                                                        <span>LKR {(item.totalPrice * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                         </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">No transaction history yet.</p>
                                )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

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
                            <Input value={referralCode || 'Click to generate & copy'} readOnly />
                            <Button variant="secondary" onClick={handleCopy}>
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
                                {userProfile.hasLinkedSocials ? 'Claimed' : 'Claim'}
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
                                {userProfile.hasLeftReview ? 'Claimed' : 'Claim'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
             </Card>
        </div>
    );
}
