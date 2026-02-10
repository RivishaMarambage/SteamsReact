"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import type { CartItem } from '@/lib/types';
import { Loader2, CreditCard, QrCode, Wallet, Banknote } from 'lucide-react';
import { initiatePayment } from '@/ai/flows/payment-flow';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import QrScanner from '@/components/wallet/QrScanner';

export default function CheckoutPage() {
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser } = useUser();

  useEffect(() => {
    const data = localStorage.getItem('checkoutData');
    if (data) {
      setCheckoutData(JSON.parse(data));
    } else {
      router.replace('/dashboard/order');
    }
  }, [router]);

  const handlePlaceOrder = async () => {
    if (!authUser || !checkoutData) {
        toast({ variant: 'destructive', title: "Error", description: "Could not place order. Missing data."});
        return;
    }
    
    setIsProcessing(true);

    try {
        if (paymentMethod === 'cash') {
            const updatedData = { ...checkoutData, paymentMethod: 'Cash' };
            localStorage.setItem('checkoutData', JSON.stringify(updatedData));
            router.replace(`/dashboard/order-success?status=SUCCESS&id=CASH_${Date.now()}`);
            return;
        }

        const origin = window.location.origin;
        localStorage.setItem('checkoutData', JSON.stringify({
            ...checkoutData,
            paymentMethod: paymentMethod === 'card' ? 'Online' : paymentMethod.toUpperCase()
        }));

        const paymentResponse = await initiatePayment({ 
          amount: checkoutData.cartTotal,
          origin: origin
        });
        
        window.location.href = paymentResponse.checkoutUrl;

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Order Failed",
            description: error.message || "Problem processing your order.",
        });
        setIsProcessing(false);
    }
  }

  if (!checkoutData) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  const itemDiscount = (checkoutData.birthdayDiscountAmount || 0) + (checkoutData.welcomeDiscountAmount || 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline uppercase tracking-tight">Checkout</h1>
        <p className="text-muted-foreground">Complete your payment below.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {checkoutData.cart.map((item: CartItem) => (
                         <div key={item.id} className="flex justify-between items-start">
                            <div>
                                <p className="font-bold">{item.quantity}x {item.menuItem.name}</p>
                                {item.addons.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {item.addons.map(a => `+ ${a.name}`).join(', ')}
                                </p>
                                )}
                            </div>
                            <p className="font-bold">LKR {(item.totalPrice * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                </div>
                <Separator />
                 <div className="w-full space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>LKR {checkoutData.subtotal.toFixed(2)}</span>
                    </div>
                    {itemDiscount > 0 && (
                    <div className="flex justify-between text-destructive font-bold">
                        <span>Discounts</span>
                        <span>- LKR {itemDiscount.toFixed(2)}</span>
                    </div>
                    )}
                    {checkoutData.serviceCharge > 0 && (
                    <div className="flex justify-between">
                        <span>Service Charge</span>
                        <span>LKR {checkoutData.serviceCharge.toFixed(2)}</span>
                    </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-primary pt-2">
                        <span>Total to Pay</span>
                        <span>LKR {checkoutData.cartTotal.toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card>
             <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Select how you'd like to pay.</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4 mb-6">
                    <Label htmlFor="card" className="flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="card" id="card" />
                        <CreditCard className="h-6 w-6 text-primary" />
                        <div className="grid gap-1">
                            <p className="font-bold">Pay Online</p>
                            <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex</p>
                        </div>
                    </Label>
                    
                    {checkoutData.orderType === 'Dine-in' && (
                        <Label htmlFor="cash" className="flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value="cash" id="cash" />
                            <Banknote className="h-6 w-6 text-primary" />
                            <div className="grid gap-1">
                                <p className="font-bold">Cash at Counter</p>
                                <p className="text-xs text-muted-foreground">Pay staff after your meal</p>
                            </div>
                        </Label>
                    )}
                </RadioGroup>

                <Button
                    size="lg"
                    className="w-full"
                    disabled={isProcessing}
                    onClick={handlePlaceOrder}
                >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Pay LKR ${checkoutData.cartTotal.toFixed(2)}`}
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}