'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

export default function RedeemPoints() {
  const [email, setEmail] = useState('');
  const [customer, setCustomer] = useState<UserProfile | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCustomer(null);

    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('email', '==', email), where('role', '==', 'customer'));
    
    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        toast({ variant: 'destructive', title: 'Customer not found' });
      } else {
        const customerData = querySnapshot.docs[0].data() as UserProfile;
        setCustomer({ ...customerData, id: querySnapshot.docs[0].id });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error searching for customer' });
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleRedeem = async () => {
    if (!customer || pointsToRedeem <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Redemption',
        description: 'Please find a customer and enter a valid number of points to redeem.',
      });
      return;
    }
    
    if ((customer.loyaltyPoints ?? 0) < pointsToRedeem) {
        toast({
            variant: 'destructive',
            title: 'Insufficient Points',
            description: 'The customer does not have enough points for this redemption.',
        });
        return;
    }

    setIsLoading(true);
    const userDocRef = doc(firestore, 'users', customer.id);
    
    try {
      await updateDoc(userDocRef, {
        loyaltyPoints: increment(-pointsToRedeem)
      });
      
      // Refresh customer data
      setCustomer(prev => prev ? { ...prev, loyaltyPoints: (prev.loyaltyPoints ?? 0) - pointsToRedeem } : null);

      toast({
        title: 'Points Redeemed!',
        description: `${pointsToRedeem} points have been redeemed for ${customer.name}.`,
      });
      setPointsToRedeem(0);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error redeeming points' });
      console.error(error);
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redeem Loyalty Points</CardTitle>
        <CardDescription>Search for a customer by email to redeem their points.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSearch} className="flex items-end gap-2">
          <div className="flex-grow">
            <Label htmlFor="email">Customer Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {customer && (
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{customer.name}</h3>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              </div>
              <div className="text-2xl font-bold text-primary">
                {customer.loyaltyPoints ?? 0} <span className="text-sm font-normal">Points Available</span>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <Label htmlFor="points">Points to Redeem</Label>
                  <Input
                    id="points"
                    type="number"
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(parseInt(e.target.value, 10) || 0)}
                    max={customer.loyaltyPoints}
                    min={0}
                  />
                </div>
                <Button onClick={handleRedeem} disabled={isLoading || pointsToRedeem <= 0}>
                  {isLoading ? 'Redeeming...' : 'Redeem'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
