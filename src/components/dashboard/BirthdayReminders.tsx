
'use client';

import { useCollection, useFirestore } from "@/firebase";
import { MenuItem, UserProfile } from "@/lib/types";
import { isWithinInterval, addDays, parseISO, format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Gift, PlusCircle, Ticket, Utensils } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

type RewardType = 'credit' | 'free-item';

export default function BirthdayReminders() {
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>("users");
  const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>('menu_items');
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isRewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [rewardType, setRewardType] = useState<RewardType>('credit');
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [selectedFreebieId, setSelectedFreebieId] = useState<string>('');

  const isLoading = usersLoading || menuLoading;

  const handleOpenRewardDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setRewardDialogOpen(true);
    // Reset form
    setCreditAmount(0);
    setSelectedFreebieId(menuItems?.[0]?.id || '');
    setRewardType('credit');
  };

  const handleGiveReward = async () => {
    if (!selectedUser || !firestore) return;

    const userRef = doc(firestore, 'users', selectedUser.id);
    let rewardData = {};
    let toastDescription = '';

    if (rewardType === 'credit') {
        if (creditAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount', description: 'Credit must be greater than zero.' });
            return;
        }
        rewardData = { birthdayCredit: creditAmount };
        toastDescription = `A credit of Rs. ${creditAmount} has been added to their account.`;
    } else {
        if (!selectedFreebieId) {
            toast({ variant: 'destructive', title: 'No item selected', description: 'Please select a menu item to give.' });
            return;
        }
        rewardData = { birthdayFreebieMenuItemIds: [selectedFreebieId] };
        const itemName = menuItems?.find(item => item.id === selectedFreebieId)?.name;
        toastDescription = `${itemName} has been added to their account as a freebie.`;
    }

    try {
        await updateDoc(userRef, rewardData);
        toast({
            title: 'Reward Sent!',
            description: toastDescription,
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Failed to give reward',
            description: error.message,
        });
    }

    setRewardDialogOpen(false);
  };


  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                </div>
            </CardContent>
        </Card>
    )
  }

  const today = new Date();
  const nextWeek = addDays(today, 7);

  const upcomingBirthdays = users?.filter(user => {
    if (!user.dateOfBirth) return false;
    try {
        const dob = parseISO(user.dateOfBirth);
        
        // Set the year to the current year to check for the upcoming birthday
        const thisYearBirthday = new Date(dob);
        thisYearBirthday.setFullYear(today.getFullYear());

        // If birthday has already passed this year, check for next year's birthday
        const nextYearBirthday = new Date(dob);
        nextYearBirthday.setFullYear(today.getFullYear() + 1);

        return isWithinInterval(thisYearBirthday, { start: today, end: nextWeek }) || isWithinInterval(nextYearBirthday, {start: today, end: nextWeek});
    } catch (e) {
        return false;
    }
  }).sort((a, b) => {
    const dateA = parseISO(a.dateOfBirth!);
    const dateB = parseISO(b.dateOfBirth!);
    dateA.setFullYear(today.getFullYear());
    dateB.setFullYear(today.getFullYear());
    // Basic sort, doesn't handle year wrap around perfectly but good enough for 7 days
    return dateA.getTime() - dateB.getTime();
  });


  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Gift /> Upcoming Birthdays</CardTitle>
        <CardDescription>Customers celebrating their birthday in the next 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingBirthdays && upcomingBirthdays.length > 0 ? (
          <ul className="space-y-3">
            {upcomingBirthdays.map(user => {
                const dob = parseISO(user.dateOfBirth!);
                const birthdayString = format(dob, "MMMM d");
                const hasReward = user.birthdayCredit || (user.birthdayFreebieMenuItemIds && user.birthdayFreebieMenuItemIds.length > 0);

                return (
                    <li key={user.id} className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                       <div>
                            <span className="font-semibold">{user.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">{birthdayString}</span>
                       </div>
                       <Button size="sm" variant={hasReward ? 'secondary' : 'outline'} onClick={() => handleOpenRewardDialog(user)}>
                            {hasReward ? 'Reward Given' : 'Give Reward'}
                       </Button>
                    </li>
                )
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No upcoming birthdays in the next 7 days.</p>
        )}
      </CardContent>
    </Card>

    <Dialog open={isRewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Give Birthday Reward to {selectedUser?.name}</DialogTitle>
                <DialogDescription>Choose a reward to send for their birthday.</DialogDescription>
            </DialogHeader>
            <Tabs value={rewardType} onValueChange={(value) => setRewardType(value as RewardType)}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="credit"><Ticket className="mr-2"/> Credit / Discount</TabsTrigger>
                    <TabsTrigger value="free-item"><Utensils className="mr-2"/> Free Item</TabsTrigger>
                </TabsList>
                <TabsContent value="credit" className="pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="credit-amount">Credit Amount (Rs.)</Label>
                        <Input 
                            id="credit-amount" 
                            type="number"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(Number(e.target.value))}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="free-item" className="pt-4">
                     <div className="space-y-2">
                        <Label htmlFor="free-item-select">Select Menu Item</Label>
                        <Select value={selectedFreebieId} onValueChange={setSelectedFreebieId}>
                            <SelectTrigger id="free-item-select">
                                <SelectValue placeholder="Select a free item" />
                            </SelectTrigger>
                            <SelectContent>
                                {menuItems?.map(item => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {item.name} - Rs. {item.price.toFixed(2)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </TabsContent>
            </Tabs>

            <DialogFooter>
                <Button variant="outline" onClick={() => setRewardDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleGiveReward}>Give Reward</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

