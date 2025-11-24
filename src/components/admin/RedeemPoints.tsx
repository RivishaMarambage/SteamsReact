"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/lib/types';
import { Search, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoyaltyStatus from '../dashboard/LoyaltyStatus';
import { useMockData } from '@/lib/auth/provider';

export default function RedeemPoints() {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [redeemAmount, setRedeemAmount] = useState(0);
  const { toast } = useToast();
  const { findUser, updateUser } = useMockData();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const user = findUser(searchQuery);
    if (user) {
      setFoundUser(user);
    } else {
      setFoundUser(null);
      toast({
        variant: "destructive",
        title: "User Not Found",
        description: "No customer found with that email or mobile number.",
      });
    }
  };

  const handleRedeem = () => {
    if (foundUser && redeemAmount > 0 && foundUser.points && redeemAmount <= foundUser.points) {
      // Simulate point redemption
      const updatedUser = { ...foundUser, points: foundUser.points - redeemAmount };
      updateUser(updatedUser);
      setFoundUser(updatedUser);
      toast({
        title: "Points Redeemed",
        description: `${redeemAmount} points have been redeemed for ${foundUser.name}.`,
      });
      setRedeemAmount(0);
    } else {
      toast({
        variant: "destructive",
        title: "Redemption Failed",
        description: "Invalid amount or insufficient points.",
      });
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Find Customer</CardTitle>
          <CardDescription>Search by email or mobile to redeem their points.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Email or mobile number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {foundUser && (
        <div className="space-y-8 md:col-span-2">
            <LoyaltyStatus user={foundUser} />
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Redeem Points</CardTitle>
                    <CardDescription>Apply points for discounts or rewards.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="grid gap-2 flex-grow w-full sm:w-auto">
                        <Label htmlFor="redeem-amount">Points to Redeem</Label>
                        <Input
                            id="redeem-amount"
                            type="number"
                            value={redeemAmount > 0 ? redeemAmount : ''}
                            onChange={(e) => setRedeemAmount(Number(e.target.value))}
                            placeholder={`Max ${foundUser.points}`}
                            max={foundUser.points}
                        />
                    </div>
                    <Button onClick={handleRedeem} disabled={redeemAmount <= 0 || (foundUser.points && redeemAmount > foundUser.points)}>
                        <Sparkles className="mr-2 h-4 w-4" /> Redeem
                    </Button>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
