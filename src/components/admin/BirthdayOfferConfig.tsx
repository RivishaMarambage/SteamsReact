
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Gift, Percent, Ticket, Utensils } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MenuItem } from '@/lib/types';
import { useCollection, useFirestore } from '@/firebase';
import { Skeleton } from '../ui/skeleton';

type RewardType = 'credit' | 'free-item';
type DiscountType = 'fixed' | 'percentage';

export default function BirthdayOfferConfig() {
    const [rewardType, setRewardType] = useState<RewardType>('credit');
    const [discountType, setDiscountType] = useState<DiscountType>('fixed');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [selectedFreebieId, setSelectedFreebieId] = useState<string>('');
    const { toast } = useToast();

    const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>('menu_items');

    const handleSaveChanges = () => {
        // In a real application, this would save to a global config document in Firestore.
        // For this demo, we'll just show a toast.
        console.log({
            rewardType,
            discountType,
            discountValue,
            selectedFreebieId,
        });

        toast({
            title: "Settings Saved (Demo)",
            description: "Birthday offer configuration has been saved. Automatic granting is not yet implemented.",
        });
    };
    
    if (menuLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                 <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><Gift /> Birthday Offer Configuration</CardTitle>
                <CardDescription>
                    Set the default reward for customers on their birthday. This is not yet automatically granted.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-base">Reward Type</Label>
                    <RadioGroup value={rewardType} onValueChange={(v) => setRewardType(v as RewardType)} className="flex gap-4">
                        <Label htmlFor="credit" className="flex items-center gap-2 p-4 border rounded-lg flex-1 cursor-pointer has-[:checked]:border-primary">
                            <RadioGroupItem value="credit" id="credit" />
                            <Ticket className="h-5 w-5" /> Credit / Discount
                        </Label>
                         <Label htmlFor="free-item" className="flex items-center gap-2 p-4 border rounded-lg flex-1 cursor-pointer has-[:checked]:border-primary">
                            <RadioGroupItem value="free-item" id="free-item" />
                            <Utensils className="h-5 w-5" /> Free Menu Item
                        </Label>
                    </RadioGroup>
                </div>

                {rewardType === 'credit' && (
                    <div className="p-4 border rounded-lg space-y-4">
                        <Label className="text-base">Discount Details</Label>
                        <RadioGroup value={discountType} onValueChange={(v) => setDiscountType(v as DiscountType)} className="flex gap-4">
                           <Label htmlFor="fixed" className='flex items-center gap-2 p-3 border rounded-md has-[:checked]:border-primary'>
                                <RadioGroupItem value="fixed" id="fixed" />
                                <span className="font-bold">LKR</span> Fixed
                            </Label>
                            <Label htmlFor="percentage" className='flex items-center gap-2 p-3 border rounded-md has-[:checked]:border-primary'>
                                <RadioGroupItem value="percentage" id="percentage" />
                                <Percent className="h-4 w-4"/> Percentage
                            </Label>
                        </RadioGroup>
                        <div className="space-y-2">
                            <Label htmlFor="discount-value">
                                {discountType === 'fixed' ? 'Credit Amount (LKR)' : 'Discount Percentage (%)'}
                            </Label>
                            <Input 
                                id="discount-value" 
                                type="number"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                placeholder={discountType === 'fixed' ? 'e.g. 500' : 'e.g. 15'}
                            />
                        </div>
                    </div>
                )}

                {rewardType === 'free-item' && (
                     <div className="p-4 border rounded-lg space-y-4">
                        <Label className="text-base">Free Item Details</Label>
                         <div className="space-y-2">
                            <Label htmlFor="free-item-select">Select Menu Item</Label>
                            <Select value={selectedFreebieId} onValueChange={setSelectedFreebieId}>
                                <SelectTrigger id="free-item-select">
                                    <SelectValue placeholder="Select a free item to give" />
                                </SelectTrigger>
                                <SelectContent>
                                    {menuItems?.map(item => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.name} - LKR {item.price.toFixed(2)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <Button onClick={handleSaveChanges}>Save Birthday Offer Settings</Button>
            </CardContent>
        </Card>
    )
}

    