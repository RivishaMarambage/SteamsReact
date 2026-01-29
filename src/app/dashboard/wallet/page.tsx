'use client';

import {
  useCollection,
  useDoc,
  useFirestore,
  useMemoFirebase,
  useUser,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import {
  doc,
  updateDoc,
  increment,
  collection,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Check,
  Copy,
  Link as LinkIcon,
  MessageSquare,
  Star,
  UserPlus,
  Wallet as WalletIcon,
  ArrowDown,
  ArrowUp,
  History,
  ShoppingBag,
  Receipt,
  QrCode,
  CreditCard,
} from 'lucide-react';
import { useState } from 'react';
import type { Order, PointTransaction, UserProfile } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import QrScanner from '@/components/wallet/QrScanner';

const POINT_REWARDS = {
  REFERRAL: 50,
  LINK_SOCIALS: 25,
  LEAVE_REVIEW: 30,
};

/**
 * A robust, cross-browser function to copy text to the clipboard.
 * Tries the modern Clipboard API first, with a fallback to the legacy
 * document.execCommand for older browsers or restricted environments.
 * @param text The string to copy to the clipboard.
 * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
 */
async function safeCopyToClipboard(text: string): Promise<boolean> {
  // Modern async API
  if (typeof window !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // The modern API can fail if the document is not focused or due to permissions.
      // We'll swallow this error and let the legacy method try.
      console.warn("Clipboard API failed, falling back to legacy method.", err);
    }
  }

  // Legacy fallback
  if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed'; // Prevent scrolling to bottom of page in MS Edge.
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        return successful;
      } catch (err) {
        console.error("Legacy clipboard method failed.", err);
        document.body.removeChild(textarea);
        return false;
      }
  }
  
  return false;
}


function HistorySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export default function WalletPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  const userDocRef = useMemoFirebase(
    () => (authUser ? doc(firestore, 'users', authUser.uid) : null),
    [authUser, firestore]
  );

  const { data: userProfile, isLoading: isProfileLoading } =
    useDoc<UserProfile>(userDocRef);

  const isLoading = isUserLoading || isProfileLoading;

  const handleCopy = async () => {
    if (!userProfile || !authUser || !userDocRef) return;

    let codeToCopy = userProfile.referralCode;

    if (!codeToCopy) {
      codeToCopy = `STM-${authUser.uid.substring(0, 5).toUpperCase()}`;
      try {
        await updateDoc(userDocRef, { referralCode: codeToCopy });
      } catch (error) {
        const contextualError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: { referralCode: codeToCopy },
        });
        errorEmitter.emit('permission-error', contextualError);
        return;
      }
    }

    const success = await safeCopyToClipboard(codeToCopy);

    if (success) {
      setIsCopied(true);
      toast({
        title: 'Copied!',
        description: 'Referral code copied to clipboard.',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy to clipboard. Please copy it manually.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!userProfile) {
    return <p>Could not load user profile.</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">My Wallet</h1>

      {/* REFER A FRIEND */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus /> Refer a Friend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={userProfile.referralCode || 'Click to generate & copy'}
              readOnly
            />
            <Button variant="secondary" onClick={handleCopy}>
              {isCopied ? <Check className="text-green-500" /> : <Copy />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
