
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
import { Badge } from '@/components/ui/badge';


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
      // If no checkout data, redirect back to order page
      router.replace('/dashboard/order');
    }
  }, [router]);

  const handlePlaceOrder = async () => {
    if (!authUser || !checkoutData) {
        toast({ variant: 'destructive', title: "Error", description: "Could not place order. Missing user or order data."});
        return;
    }
    
    setIsProcessing(true);

    try {
        if (paymentMethod === 'cash') {
            console.log("Preparing Cash Order...");
            // Store the payment method and redirect to the success page to handle finalization
            const updatedData = {
                ...checkoutData,
                paymentMethod: 'Cash'
            };
            localStorage.setItem('checkoutData', JSON.stringify(updatedData));
            
            // Redirect to success page with synthesized params
            // Using replace to prevent back-navigation to a processed checkout
            router.replace(`/dashboard/order-success?status=SUCCESS&id=CASH_${Date.now()}`);
            return;
        }

        console.log("Frontend: Initiating Online Payment...");
        const origin = window.location.origin;
        
        // Save current selection to persistent storage for retrieval after redirect
        localStorage.setItem('checkoutData', JSON.stringify({
            ...checkoutData,
            paymentMethod: paymentMethod === 'card' ? 'Online' : paymentMethod.toUpperCase()
        }));

        const paymentResponse = await initiatePayment({ 
          amount: checkoutData.cartTotal,
          origin: origin
        });
        
        const { checkoutUrl } = paymentResponse;
        
        console.log("Redirecting to Genie:", checkoutUrl);
        // Redirect the user to Genie's checkout page
        window.location.href = checkoutUrl;

    } catch (error: any) {
        console.error("Error during checkout process: ", error);
        toast({
            variant: "destructive",
            title: "Order Failed",
            description: error.message || "There was a problem processing your order. Please contact support.",
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
  
  const renderPaymentButton = () => {
    if (paymentMethod === 'qr') {
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full">
              <QrCode className="mr-2" />
              Scan QR to Pay
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>Scan QR Code</DialogTitle>
                <DialogDescription>Please scan the merchant QR code to complete your payment.</DialogDescription>
            </DialogHeader>
            <QrScanner />
          </DialogContent>
        </Dialog>
      );
    }
    
    let buttonText = `Proceed to Pay LKR ${checkoutData.cartTotal.toFixed(2)}`;
    if (paymentMethod === 'cash') {
        buttonText = `Confirm Order (Pay at Counter)`;
    } else if (paymentMethod === 'card') {
        buttonText = `Pay Online LKR ${checkoutData.cartTotal.toFixed(2)}`;
    }

    return (
      <Button
        size="lg"
        className="w-full"
        disabled={isProcessing}
        onClick={handlePlaceOrder}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {paymentMethod === 'cash' ? 'Confirming Order...' : 'Processing Payment...'}
          </>
        ) : buttonText}
      </Button>
    );
  };

  const itemDiscount = (checkoutData.birthdayDiscountAmount || 0) + (checkoutData.welcomeDiscountAmount || 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline uppercase tracking-tight">Checkout</h1>
        <p className="text-muted-foreground">Please review your order and complete the payment.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="rounded-[2.5rem]">
            <CardHeader>
                <CardTitle className="uppercase tracking-tight">Order Summary</CardTitle>
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
                        <span className="font-medium">LKR {checkoutData.subtotal.toFixed(2)}</span>
                    </div>
                    {itemDiscount > 0 && (
                    <div className="flex justify-between text-destructive">
                        <span>Item Discounts</span>
                        <span className="font-bold">- LKR {itemDiscount.toFixed(2)}</span>
                    </div>
                    )}
                    {checkoutData.serviceCharge > 0 && (
                    <div className="flex justify-between">
                        <span>Service Charge (10%)</span>
                        <span className="font-medium">LKR {checkoutData.serviceCharge.toFixed(2)}</span>
                    </div>
                    )}
                    {checkoutData.loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-destructive">
                        <span>Points Redemption</span>
                        <span className="font-bold">- LKR {checkoutData.loyaltyDiscount.toFixed(2)}</span>
                    </div>
                    )}
                    <div className="flex justify-between text-xl font-black uppercase text-primary pt-2">
                        <span>Total to Pay</span>
                        <span>LKR {checkoutData.cartTotal.toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card className="rounded-[2.5rem]">
             <CardHeader>
                <CardTitle className="uppercase tracking-tight">Payment</CardTitle>
                <CardDescription>Select a payment method.</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4 mb-6">
                    <Label htmlFor="card" className="flex items-center gap-4 p-4 border rounded-2xl cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary transition-all">
                        <RadioGroupItem value="card" id="card" />
                        <CreditCard className="h-6 w-6 text-primary" />
                        <div className="grid gap-1">
                            <p className="font-bold">Pay Online</p>
                            <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex via Genie</p>
                        </div>
                    </Label>
                    
                    {checkoutData.orderType === 'Dine-in' && (
                        <Label htmlFor="cash" className="flex items-center gap-4 p-4 border rounded-2xl cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary transition-all">
                            <RadioGroupItem value="cash" id="cash" />
                            <Banknote className="h-6 w-6 text-primary" />
                            <div className="grid gap-1">
                                <p className="font-bold">Cash & Card</p>
                                <p className="text-xs text-muted-foreground">Pay directly at the counter</p>
                            </div>
                        </Label>
                    )}

                    <Label htmlFor="qr" className="flex items-center gap-4 p-4 border rounded-2xl cursor-not-allowed opacity-60 transition-all">
                        <RadioGroupItem value="qr" id="qr" disabled />
                        <QrCode className="h-6 w-6 text-muted-foreground" />
                        <div className="flex-1 grid gap-1">
                            <div className="flex items-center justify-between">
                                <p className="font-bold">Pay with QR</p>
                                <Badge variant="secondary" className="text-[10px] h-5">Coming Soon</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">Scan to pay with your mobile</p>
                        </div>
                    </Label>

                    <Label htmlFor="wallet" className="flex items-center gap-4 p-4 border rounded-2xl cursor-not-allowed opacity-60 transition-all">
                        <RadioGroupItem value="wallet" id="wallet" disabled />
                        <Wallet className="h-6 w-6 text-muted-foreground" />
                        <div className="flex-1 grid gap-1">
                            <div className="flex items-center justify-between">
                                <p className="font-bold">Pay with Genie Wallet</p>
                                <Badge variant="secondary" className="text-[10px] h-5">Coming Soon</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">Use your Genie account balance</p>
                        </div>
                    </Label>
                </RadioGroup>

                {renderPaymentButton()}
                <div className="mt-4 text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    {paymentMethod === 'cash' ? 'Please pay the staff after your meal or upon pickup.' : 'You will be redirected to Genie to complete your payment.'}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
