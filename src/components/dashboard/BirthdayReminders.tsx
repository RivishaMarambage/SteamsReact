
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { MenuItem, UserProfile } from "@/lib/types";
import { isWithinInterval, addDays, parseISO, format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Gift, Percent, Tag, Ticket, Utensils, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { doc, updateDoc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

type RewardType = 'credit' | 'free-item';
type DiscountType = 'fixed' | 'percentage';

export default function BirthdayReminders() {
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);
  
  const userRole = userProfile?.role;
  const canFetchUsers = userRole === 'admin';

  const usersQuery = useMemoFirebase(() => canFetchUsers ? collection(firestore, "users") : null, [firestore, canFetchUsers]);
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>('menu_items');
  
  const { toast } = useToast();

  const [isRewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [rewardType, setRewardType] = useState<RewardType>('credit');
  const [discountType, setDiscountType] = useState<DiscountType>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [selectedFreebieId, setSelectedFreebieId] = useState<string>('');

  const isLoading = isAuthLoading || isProfileLoading || (canFetchUsers && usersLoading) || menuLoading;

  const handleOpenRewardDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setRewardDialogOpen(true);
    // Reset form to defaults or current user values
    setDiscountValue(user.birthdayDiscountValue || 0);
    setSelectedFreebieId(user.birthdayFreebieMenuItemIds?.[0] || menuItems?.[0]?.id || '');
    setRewardType(user.birthdayFreebieMenuItemIds?.length ? 'free-item' : 'credit');
    setDiscountType(user.birthdayDiscountType || 'fixed');
  };

  const handleGiveReward = async () => {
    if (!selectedUser || !firestore) return;

    const userRef = doc(firestore, 'users', selectedUser.id);
    let rewardData: Partial<UserProfile> = {};
    let toastDescription = '';

    if (rewardType === 'credit') {
        if (discountValue <= 0) {
            toast({ variant: 'destructive', title: 'Invalid value', description: 'Discount value must be greater than zero.' });
            return;
        }
        rewardData = { 
            birthdayDiscountType: discountType,
            birthdayDiscountValue: discountValue,
            birthdayFreebieMenuItemIds: [], 
        };
        toastDescription = `A ${discountType === 'fixed' ? `LKR ${discountValue}` : `${discountValue}%`} discount has been added.`;
    } else {
        if (!selectedFreebieId) {
            toast({ variant: 'destructive', title: 'No item selected', description: 'Please select a menu item.' });
            return;
        }
        rewardData = { 
            birthdayFreebieMenuItemIds: [selectedFreebieId],
            birthdayDiscountType: null,
            birthdayDiscountValue: null,
        };
        const itemName = menuItems?.find(item => item.id === selectedFreebieId)?.name;
        toastDescription = `${itemName} has been added as a freebie.`;
    }

    try {
        await updateDoc(userRef, rewardData);
        toast({ title: 'Reward Sent!', description: toastDescription });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to give reward', description: error.message });
    }

    setRewardDialogOpen(false);
  };

  const handleRevokeReward = async () => {
    if (!selectedUser || !firestore) return;
    const userRef = doc(firestore, 'users', selectedUser.id);
    try {
        await updateDoc(userRef, {
            birthdayDiscountValue: null,
            birthdayDiscountType: null,
            birthdayFreebieMenuItemIds: []
        });
        toast({ title: 'Reward Revoked', description: `Birthday rewards for ${selectedUser.name} have been cleared.` });
        setRewardDialogOpen(false);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Revoke Failed', description: e.message });
    }
  };

  if (!userRole || (userRole !== 'staff' && userRole !== 'admin')) return null;

  if (isLoading) {
    return (
        <Card className="rounded-[2.5rem]">
            <CardHeader><Skeleton className="h-7 w-2/3" /><Skeleton className="h-4 w-1/2" /></CardHeader>
            <CardContent><div className="space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div></CardContent>
        </Card>
    )
  }

  const today = new Date();
  const nextWeek = addDays(today, 7);

  // Unique list filter to prevent "several times" display bug
  const upcomingBirthdays = Array.from(new Set(users?.filter(user => {
    if (!user.dateOfBirth) return false;
    try {
        const dob = parseISO(user.dateOfBirth);
        const thisYearBirthday = new Date(dob);
        thisYearBirthday.setFullYear(today.getFullYear());
        const nextYearBirthday = new Date(dob);
        nextYearBirthday.setFullYear(today.getFullYear() + 1);
        return isWithinInterval(thisYearBirthday, { start: today, end: nextWeek }) || 
               isWithinInterval(nextYearBirthday, {start: today, end: nextWeek});
    } catch (e) { return false; }
  }).map(u => u.id))).map(id => users?.find(u => u.id === id)!).sort((a, b) => {
    const dateA = parseISO(a.dateOfBirth!);
    const dateB = parseISO(b.dateOfBirth!);
    dateA.setFullYear(today.getFullYear());
    dateB.setFullYear(today.getFullYear());
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <>
    <Card className="rounded-[2.5rem]">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Gift className="text-primary" /> Upcoming Birthdays</CardTitle>
        <CardDescription>Celebrations in the next 7 days. Manage and revoke rewards here.</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingBirthdays.length > 0 ? (
          <ul className="space-y-3">
            {upcomingBirthdays.map(user => {
                const dob = parseISO(user.dateOfBirth!);
                const hasReward = user.birthdayDiscountValue || (user.birthdayFreebieMenuItemIds && user.birthdayFreebieMenuItemIds.length > 0);
                return (
                    <li key={user.id} className="flex justify-between items-center bg-muted/50 p-4 rounded-[1.5rem]">
                       <div>
                            <p className="font-bold">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{format(dob, "MMMM d")}</p>
                       </div>
                       <Button size="sm" variant={hasReward ? 'secondary' : 'outline'} className="rounded-full" onClick={() => handleOpenRewardDialog(user)}>
                            {hasReward ? 'Manage Reward' : 'Give Reward'}
                       </Button>
                    </li>
                )
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-4">No birthdays in the next 7 days.</p>
        )}
      </CardContent>
    </Card>

    <Dialog open={isRewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent className="rounded-[2rem]">
            <DialogHeader>
                <DialogTitle>Manage Birthday Reward: {selectedUser?.name}</DialogTitle>
                <DialogDescription>Assign a one-time reward or revoke existing ones.</DialogDescription>
            </DialogHeader>
            <Tabs value={rewardType} onValueChange={(value) => setRewardType(value as RewardType)}>
                <TabsList className="grid w-full grid-cols-2 rounded-full">
                    <TabsTrigger value="credit" className="rounded-full"><Ticket className="mr-2 h-4 w-4"/> Discount</TabsTrigger>
                    <TabsTrigger value="free-item" className="rounded-full"><Utensils className="mr-2 h-4 w-4"/> Free Item</TabsTrigger>
                </TabsList>
                <TabsContent value="credit" className="pt-4 space-y-4">
                     <RadioGroup value={discountType} onValueChange={(value) => setDiscountType(value as DiscountType)} className="flex gap-4">
                        <Label htmlFor="fixed" className='flex items-center gap-2 p-3 border rounded-xl flex-1 has-[:checked]:border-primary'>
                            <RadioGroupItem value="fixed" id="fixed" />
                            <span className="font-bold">LKR</span> Fixed
                        </Label>
                        <Label htmlFor="percentage" className='flex items-center gap-2 p-3 border rounded-xl flex-1 has-[:checked]:border-primary'>
                            <RadioGroupItem value="percentage" id="percentage" />
                            <Percent className="h-4 w-4"/> %
                        </Label>
                    </RadioGroup>
                    <div className="space-y-2">
                        <Label htmlFor="discount-value">Amount / Percentage</Label>
                        <Input id="discount-value" type="number" className="rounded-full" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} />
                    </div>
                </TabsContent>
                <TabsContent value="free-item" className="pt-4">
                     <div className="space-y-2">
                        <Label htmlFor="free-item-select">Select Menu Item</Label>
                        <Select value={selectedFreebieId} onValueChange={setSelectedFreebieId}>
                            <SelectTrigger id="free-item-select" className="rounded-full">
                                <SelectValue placeholder="Select a free item" />
                            </SelectTrigger>
                            <SelectContent>
                                {menuItems?.map(item => (
                                    <SelectItem key={item.id} value={item.id}>{item.name} (LKR {item.price.toFixed(2)})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </TabsContent>
            </Tabs>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button variant="destructive" onClick={handleRevokeReward} className="rounded-full flex-1">
                    <Trash2 className="mr-2 h-4 w-4" /> Revoke All
                </Button>
                <div className="flex gap-2 flex-1">
                    <Button variant="outline" onClick={() => setRewardDialogOpen(false)} className="rounded-full flex-1">Cancel</Button>
                    <Button onClick={handleGiveReward} className="rounded-full flex-1">Apply Reward</Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
