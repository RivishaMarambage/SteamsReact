
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { placeOrderAfterPayment } from '@/ai/flows/payment-flow';
import { Loader2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user: authUser } = useUser();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processOrder = async () => {
      // Genie will likely return transaction details in the query params.
      // We need to know what they are. I'll assume 'transactionId' and 'status' for now.
      // You may need to adjust this based on Genie's documentation.
      const transactionId = searchParams.get('orderId') || searchParams.get('transactionId') || `unknown_txn_${Date.now()}`;
      const paymentStatus = searchParams.get('status');

      if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
        setErrorMessage('Payment was not successful. Please try again.');
        setStatus('error');
        return;
      }
      
      const checkoutDataString = localStorage.getItem('checkoutData');
      if (!checkoutDataString || !authUser) {
        setErrorMessage('Session expired or user not found. Please try creating the order again.');
        setStatus('error');
        return;
      }
      
      const checkoutData = JSON.parse(checkoutDataString);

      try {
        const placeOrderInput = {
          userId: authUser.uid,
          checkoutData,
          transactionId,
        };

        await placeOrderAfterPayment(placeOrderInput);

        localStorage.removeItem('checkoutData');
        setStatus('success');
        
      } catch (error: any) {
        console.error("Error placing order after payment:", error);
        setErrorMessage(error.message || "An unexpected error occurred while finalizing your order.");
        setStatus('error');
      }
    };

    if(authUser) {
        processOrder();
    }
  }, [searchParams, authUser, router, toast]);

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-2xl font-semibold">Processing Your Order...</h2>
        <p className="text-muted-foreground">Please do not refresh this page.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
       <Card className="w-full max-w-lg mx-auto border-destructive">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Order Placement Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>{errorMessage}</p>
            <Button asChild>
                <Link href="/dashboard/order">Try Again</Link>
            </Button>
          </CardContent>
        </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto border-green-500">
      <CardHeader className="text-center">
         <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <CardTitle className="text-2xl text-green-600">Order Placed Successfully!</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p>Your order has been confirmed and is now being prepared. Thank you for your purchase!</p>
         <div className="flex justify-center gap-4">
            <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
             <Button asChild variant="outline">
                <Link href="/dashboard/order">Place Another Order</Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}


export default function OrderSuccessPage() {
    return (
        <div className="flex items-center justify-center h-full p-4">
            <Suspense fallback={<div className="flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-2xl font-semibold">Loading...</h2>
            </div>}>
                <OrderSuccessContent />
            </Suspense>
        </div>
    );
}
