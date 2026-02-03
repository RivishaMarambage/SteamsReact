'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { placeOrderAfterPayment } from '@/ai/flows/payment-flow';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser } = useUser();
  const hasProcessed = useRef(false);

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processOrder = async () => {
      // Prevent double-processing if useEffect runs twice
      if (hasProcessed.current) return;
      
      console.log("OrderSuccess: Checking payment redirect parameters...");
      
      // Genie returns transaction details. We check various possible parameter names.
      const transactionId = searchParams.get('id') || searchParams.get('transactionId') || searchParams.get('orderId');
      const paymentStatus = searchParams.get('state') || searchParams.get('status');

      console.log("Params found:", { transactionId, paymentStatus });

      if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
        setErrorMessage(`Payment was not successful. Status: ${paymentStatus}`);
        setStatus('error');
        return;
      }
      
      const checkoutDataString = localStorage.getItem('checkoutData');
      
      if (!checkoutDataString) {
        setErrorMessage('We couldn\'t find your order data in this session. Please contact support if your payment was deducted.');
        setStatus('error');
        return;
      }

      if (!authUser) {
        // Wait for auth to be available
        return;
      }

      hasProcessed.current = true;

      try {
        const checkoutData = JSON.parse(checkoutDataString);
        
        const placeOrderInput = {
          userId: authUser.uid,
          checkoutData,
          transactionId: transactionId || `txn_${Date.now()}`,
        };

        console.log("Finalizing order in database...");
        await placeOrderAfterPayment(placeOrderInput);

        // Success! Clear the local data
        localStorage.removeItem('checkoutData');
        setStatus('success');
        
      } catch (error: any) {
        console.error("Error finalizing order:", error);
        setErrorMessage(error.message || "An unexpected error occurred while finalizing your order.");
        setStatus('error');
      }
    };

    processOrder();
  }, [searchParams, authUser, router]);

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-2xl font-bold font-headline">Finalizing Your Order</h2>
        <p className="text-muted-foreground">We're recording your transaction and preparing your receipt. Please stay on this page.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
       <Card className="w-full max-w-lg mx-auto border-destructive shadow-xl">
          <CardHeader className="text-center">
            <div className="bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-headline text-destructive">Order Completion Failed</CardTitle>
            <CardDescription>Something went wrong after your payment was processed.</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="p-4 bg-muted rounded-md text-sm text-left font-mono break-all">
                {errorMessage}
            </div>
            <p className="text-sm text-muted-foreground">
                If money was deducted from your account, please keep your transaction ID handy and contact our staff.
            </p>
            <div className="flex flex-col gap-2">
                <Button asChild variant="default">
                    <Link href="/dashboard/order">Try Ordering Again</Link>
                </Button>
                <Button asChild variant="ghost">
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
          </CardContent>
        </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto border-green-500 shadow-2xl overflow-hidden">
      <div className="h-2 bg-green-500 w-full" />
      <CardHeader className="text-center pt-8">
         <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
         </div>
        <CardTitle className="text-3xl font-headline text-green-700">Order Confirmed!</CardTitle>
        <CardDescription>Thank you for your purchase.</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-6 pb-8">
        <div className="space-y-2">
            <p className="text-lg">Your coffee journey continues!</p>
            <p className="text-muted-foreground">Your order has been sent to our baristas. You'll receive a notification when it's ready for pickup.</p>
        </div>
        
        <div className="p-4 bg-muted/50 rounded-lg text-sm">
            <p className="font-semibold text-primary">Steam Points Earned!</p>
            <p>Check your dashboard to see your new loyalty balance.</p>
        </div>

         <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button asChild className="px-8">
                <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
             <Button asChild variant="outline">
                <Link href="/dashboard/order">Order More</Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}


export default function OrderSuccessPage() {
    return (
        <div className="container mx-auto flex items-center justify-center min-h-[80vh] p-4">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <h2 className="text-2xl font-bold font-headline">Loading...</h2>
                </div>
            }>
                <OrderSuccessContent />
            </Suspense>
        </div>
    );
}
