
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc, increment, collection, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Check, Copy, Gift, Link as LinkIcon, MessageSquare, Star, UserPlus, Wallet as WalletIcon, ArrowDown, ArrowUp, History, ShoppingBag, Receipt } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Order, PointTransaction, UserProfile } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';


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
        <div className="space-y-8 min-h-screen bg-[#FDFBF7] p-6 lg:p-10 transition-colors duration-500">
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-4xl lg:text-5xl font-black font-headline tracking-tight text-[#2c1810]">
                    My Wallet
                </h1>
                <p className="text-[#6b584b] text-lg mt-2 font-medium">Manage your points and earn more rewards.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                <Card className="shadow-lg border-0 bg-[#2c1810] text-[#FDFBF7] group hover:shadow-2xl hover:shadow-[#2c1810]/30 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden rounded-3xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#d97706]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <CardHeader className="relative z-10">
                        <CardTitle className="font-headline flex items-center gap-2 text-2xl"><WalletIcon className="text-[#d97706]" /> Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <p className="text-7xl font-black font-headline text-white drop-shadow-md">{userProfile.loyaltyPoints ?? 0}</p>
                        <p className="text-[#FDFBF7]/60 font-medium uppercase tracking-wider text-sm mt-1">Redeemable Points</p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-md group hover:shadow-2xl hover:shadow-[#d97706]/10 transition-all duration-300 hover:-translate-y-1 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2 text-2xl text-[#2c1810]">Top Up Your Wallet</CardTitle>
                        <CardDescription className="text-[#6b584b]">Add funds to use for future purchases.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Input
                                type="number"
                                placeholder="LKR Amount"
                                disabled
                                className="h-12 bg-[#FDFBF7] border-[#2c1810]/10 rounded-xl focus-visible:ring-[#d97706] text-lg"
                            />
                            <Button disabled className="h-12 px-8 rounded-xl bg-[#2c1810] text-white font-bold opacity-50 cursor-not-allowed">Top Up</Button>
                        </div>
                        <p className="text-xs text-[#d97706] font-bold mt-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-[#d97706] rounded-full animate-pulse" />
                            Wallet top-up functionality is coming soon.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-lg border-0 bg-white/60 backdrop-blur-md rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2 text-2xl text-[#2c1810]"><History className="text-[#d97706]" /> History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="points" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-[#2c1810]/5 p-1 rounded-2xl mb-6">
                            <TabsTrigger
                                value="points"
                                className="rounded-xl py-3 font-bold data-[state=active]:bg-white data-[state=active]:text-[#d97706] data-[state=active]:shadow-md transition-all duration-300"
                            >
                                <Receipt className="mr-2 w-4 h-4" /> Points History
                            </TabsTrigger>
                            <TabsTrigger
                                value="transactions"
                                className="rounded-xl py-3 font-bold data-[state=active]:bg-white data-[state=active]:text-[#d97706] data-[state=active]:shadow-md transition-all duration-300"
                            >
                                <ShoppingBag className="mr-2 w-4 h-4" /> Transaction History
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="points" className="animate-in fade-in slide-in-from-bottom-2">
                            <ScrollArea className="h-96 pr-4">
                                <div className="space-y-3">
                                    {isPointHistoryLoading ? (
                                        <HistorySkeleton />
                                    ) : pointHistory && pointHistory.length > 0 ? (
                                        pointHistory.map(tx => (
                                            <div key={tx.id} className="flex justify-between items-center p-4 bg-white/80 rounded-2xl hover:shadow-md transition-shadow duration-300 border border-[#2c1810]/5">
                                                <div className="flex items-center gap-4">
                                                    {tx.type === 'earn' ? (
                                                        <div className="p-3 bg-green-100 rounded-full shadow-sm"><ArrowUp className="h-5 w-5 text-green-600" /></div>
                                                    ) : (
                                                        <div className="p-3 bg-red-100 rounded-full shadow-sm"><ArrowDown className="h-5 w-5 text-red-600" /></div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-[#2c1810] text-base">{tx.description}</p>
                                                        <p className="text-xs text-[#6b584b] font-medium">{tx.date ? tx.date.toDate().toLocaleString() : 'Date pending...'}</p>
                                                    </div>
                                                </div>
                                                <p className={cn("font-black text-xl", tx.type === 'earn' ? 'text-green-600' : 'text-red-600')}>
                                                    {tx.type === 'earn' ? '+' : '-'}{Math.abs(tx.amount)}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <div className="w-16 h-16 bg-[#2c1810]/5 rounded-full flex items-center justify-center mb-4">
                                                <History className="w-8 h-8 text-[#2c1810]/20" />
                                            </div>
                                            <p className="text-[#6b584b] font-medium">No point history yet.</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="transactions" className="animate-in fade-in slide-in-from-bottom-2">
                            <ScrollArea className="h-96 pr-4">
                                <div className="space-y-3">
                                    {isOrderHistoryLoading ? (
                                        <HistorySkeleton />
                                    ) : orderHistory && orderHistory.length > 0 ? (
                                        orderHistory.map(order => (
                                            <div key={order.id} className="p-5 bg-white/80 rounded-2xl border border-[#2c1810]/5 hover:shadow-md transition-shadow duration-300">
                                                <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#2c1810]/5">
                                                    <div>
                                                        <p className="font-bold text-[#2c1810]">Order #{order.id.substring(0, 7).toUpperCase()}</p>
                                                        <p className="text-xs text-[#6b584b] font-medium">{order.orderDate ? order.orderDate.toDate().toLocaleString() : 'Date pending...'}</p>
                                                    </div>
                                                    <p className="font-black text-xl text-[#d97706]">LKR {order.totalAmount.toFixed(2)}</p>
                                                </div>
                                                <div className="text-sm space-y-2">
                                                    {order.orderItems?.map((item, index) => (
                                                        <div key={index} className="flex justify-between items-center text-[#6b584b]">
                                                            <span className="font-medium"><span className="text-[#2c1810] font-bold">{item.quantity}x</span> {item.menuItemName}</span>
                                                            <span>LKR {(item.totalPrice * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <div className="w-16 h-16 bg-[#2c1810]/5 rounded-full flex items-center justify-center mb-4">
                                                <ShoppingBag className="w-8 h-8 text-[#2c1810]/20" />
                                            </div>
                                            <p className="text-[#6b584b] font-medium">No transaction history yet.</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-br from-[#ffffff] to-[#fff8e1] rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2 text-2xl text-[#2c1810]"><Star className="text-[#d97706] fill-current" /> Earn More Points</CardTitle>
                    <CardDescription className="text-[#6b584b]">Complete actions to boost your point balance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Refer a Friend */}
                    <div className="p-6 border border-[#d97706]/20 bg-[#d97706]/5 rounded-2xl hover:bg-[#d97706]/10 transition-colors duration-300">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-[#2c1810] mb-2"><UserPlus className="text-[#d97706]" /> Refer a Friend</h3>
                        <p className="text-[#6b584b] mb-4 font-medium">Share your code with a friend. When they sign up, you'll both get <span className="text-[#d97706] font-bold">{POINT_REWARDS.REFERRAL} points!</span></p>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <Input
                                    value={referralCode || 'Click to generate & copy'}
                                    readOnly
                                    className="h-12 bg-white border-[#d97706]/20 font-mono text-center text-lg tracking-widest text-[#2c1810] rounded-xl focus-visible:ring-[#d97706]"
                                />
                            </div>
                            <Button
                                variant="secondary"
                                className="h-12 w-12 rounded-xl bg-[#2c1810] hover:bg-[#d97706] text-white transition-colors duration-300 shadow-md"
                                onClick={handleCopy}
                            >
                                {isCopied ? <Check /> : <Copy />}
                            </Button>
                        </div>
                    </div>

                    {/* Engage & Earn */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-[#2c1810]">Engage &amp; Earn</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex flex-col justify-between p-5 bg-white border border-[#2c1810]/5 rounded-2xl shadow-sm hover:shadow-md hover:border-[#d97706]/30 transition-all duration-300 group">
                                <div className="mb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                                        <LinkIcon className="text-blue-600 w-5 h-5" />
                                    </div>
                                    <p className="font-bold text-[#2c1810] text-lg">Link Social Media</p>
                                    <p className="text-sm text-[#6b584b] mt-1">Earn <span className="font-bold text-[#d97706]">{POINT_REWARDS.LINK_SOCIALS} points</span> instantly.</p>
                                </div>
                                <Button
                                    className="w-full rounded-xl font-bold transition-all duration-300"
                                    onClick={() => handleClaimPoints('linkSocials')}
                                    disabled={userProfile.hasLinkedSocials}
                                    variant={userProfile.hasLinkedSocials ? "outline" : "default"}
                                >
                                    {userProfile.hasLinkedSocials ? (
                                        <span className="flex items-center gap-2 text-green-600"><Check className="w-4 h-4" /> Claimed</span>
                                    ) : (
                                        'Claim Reward'
                                    )}
                                </Button>
                            </div>

                            <div className="flex flex-col justify-between p-5 bg-white border border-[#2c1810]/5 rounded-2xl shadow-sm hover:shadow-md hover:border-[#d97706]/30 transition-all duration-300 group">
                                <div className="mb-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
                                        <MessageSquare className="text-orange-600 w-5 h-5" />
                                    </div>
                                    <p className="font-bold text-[#2c1810] text-lg">Leave a Review</p>
                                    <p className="text-sm text-[#6b584b] mt-1">Earn <span className="font-bold text-[#d97706]">{POINT_REWARDS.LEAVE_REVIEW} points</span> for your feedback.</p>
                                </div>
                                <Button
                                    className="w-full rounded-xl font-bold transition-all duration-300"
                                    onClick={() => handleClaimPoints('leaveReview')}
                                    disabled={userProfile.hasLeftReview}
                                    variant={userProfile.hasLeftReview ? "outline" : "default"}
                                >
                                    {userProfile.hasLeftReview ? (
                                        <span className="flex items-center gap-2 text-green-600"><Check className="w-4 h-4" /> Claimed</span>
                                    ) : (
                                        'Claim Reward'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}