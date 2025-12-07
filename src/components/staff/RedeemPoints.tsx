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
  const [searchTerm, setSearchTerm] = useState('');
  const [customer, setCustomer] = useState<UserProfile | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;
    setIsLoading(true);
    setCustomer(null);

    const usersRef = collection(firestore, 'users');
    const emailQuery = query(usersRef, where('email', '==', searchTerm), where('role', '==', 'customer'));
    const mobileQuery = query(usersRef, where('mobileNumber', '==', searchTerm), where('role', '==', 'customer'));
    
    try {
      const [emailSnapshot, mobileSnapshot] = await Promise.all([
        getDocs(emailQuery),
        getDocs(mobileQuery),
      ]);
      
      const allResults = [...emailSnapshot.docs, ...mobileSnapshot.docs];
      
      if (allResults.length === 0) {
        toast({ variant: 'destructive', title: 'Customer not found' });
      } else {
        // Use a map to handle cases where a user might be found by both email and mobile
        const customerMap = new Map();
        allResults.forEach(doc => {
            if (!customerMap.has(doc.id)) {
                customerMap.set(doc.id, { ...(doc.data() as UserProfile), id: doc.id });
            }
        });
        const uniqueCustomers = Array.from(customerMap.values());
        setCustomer(uniqueCustomers[0]); // Display the first unique customer found
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error searching for customer' });
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleRedeem = async () => {
    if (!customer || pointsToRedeem <= 0 || !firestore) {
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
        <CardDescription>Search for a customer by email or mobile number to redeem their points.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSearch} className="flex items-end gap-2">
          <div className="flex-grow">
            <Label htmlFor="search-term">Customer Email or Mobile</Label>
            <Input
              id="search-term"
              type="text"
              placeholder="customer@example.com or 555-123-4567"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                 {customer.mobileNumber && <p className="text-sm text-muted-foreground">{customer.mobileNumber}</p>}
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
