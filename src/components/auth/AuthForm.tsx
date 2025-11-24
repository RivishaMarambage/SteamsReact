'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { useAuth, initiateEmailSignUp, initiateEmailSignIn } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  fullName: z.string().optional(),
});

type AuthFormValues = z.infer<typeof formSchema>;

interface AuthFormProps {
  authType: 'login' | 'signup';
  role: 'customer' | 'staff' | 'admin';
}

const DEMO_CREDENTIALS = {
  customer: { email: 'customer@example.com' },
  staff: { email: 'staff@example.com' },
  admin: { email: 'admin@example.com' },
};

export function AuthForm({ authType, role }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '', fullName: '' },
  });

  const handleAuthError = (error: any) => {
    console.error(error);
    let description = 'An unexpected error occurred.';
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      description = 'Invalid email or password. Please try again.';
    } else if (error.code === 'auth/email-already-in-use') {
      description = 'This email address is already in use.';
    }
    toast({
      variant: 'destructive',
      title: 'Authentication Error',
      description,
    });
  }

  const onSubmit = async (data: AuthFormValues) => {
    if (authType === 'signup') {
      if (!data.fullName) {
        form.setError('fullName', { type: 'manual', message: 'Full name is required.' });
        return;
      }
      initiateEmailSignUp(auth, data.email, data.password, {
        onSuccess: (userCredential) => {
          const user = userCredential.user;
          const userDocRef = doc(firestore, "users", user.uid);
          setDocumentNonBlocking(userDocRef, {
            id: user.uid,
            email: user.email,
            role: role,
            name: data.fullName,
          }, { merge: true });

          if (role === 'customer') {
            const profileDocRef = doc(firestore, "customer_profiles", user.uid);
            setDocumentNonBlocking(profileDocRef, {
              id: user.uid,
              email: user.email,
              name: data.fullName,
              mobileNumber: '',
              cafeNickname: '',
              loyaltyPoints: 0,
              loyaltyLevelId: 'None',
            }, { merge: true });
            
            const userUpdateRef = doc(firestore, "users", user.uid);
            setDocumentNonBlocking(userUpdateRef, { customerProfileId: user.uid }, { merge: true });
          } else if (role === 'staff') {
            const staffRoleRef = doc(firestore, "roles_staff", user.uid);
            setDocumentNonBlocking(staffRoleRef, { id: user.uid, email: user.email, role: 'staff' }, {});
          } else if (role === 'admin') {
            const adminRoleRef = doc(firestore, "roles_admin", user.uid);
            setDocumentNonBlocking(adminRoleRef, { id: user.uid, email: user.email, role: 'admin' }, {});
          }

          toast({
            title: 'Account Created!',
            description: "Welcome! Please log in to continue.",
          });
          router.push(`/login/${role}`);
        },
        onError: handleAuthError
      });
      
    } else { // Login
      initiateEmailSignIn(auth, data.email, data.password, {
        onSuccess: () => {
          // onAuthStateChanged in AuthRedirect will handle the redirection.
          // No need to do anything here.
        },
        onError: handleAuthError,
      });
    }
  };

  const title = authType === 'login' ? 'Log In' : 'Sign Up';
  const description =
    authType === 'login'
      ? `Enter your credentials to access your ${role} account.`
      : `Create your ${role} account to get started.`;
  const buttonText = authType === 'login' ? 'Log In' : 'Sign Up';

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm mx-auto shadow-xl">
        <CardHeader className="text-center space-y-4">
          <Logo className="justify-center" />
          <div className="space-y-1">
            <CardTitle className="text-3xl font-headline">
              {role.charAt(0).toUpperCase() + role.slice(1)} {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {authType === 'login' && (
             <Alert className="mb-4 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600"/>
                <AlertTitle className="text-blue-800">Demo Account</AlertTitle>
                <AlertDescription className="text-blue-700">
                  <p>First, <Link href={`/signup/${role}`} className="font-bold underline">sign up</Link> with the email below. Then you can log in.</p>
                  <p className="mt-2">
                    <strong>Email:</strong> {DEMO_CREDENTIALS[role].email}<br/>
                    <strong>Password:</strong> Use any password (min. 6 characters)
                  </p>
                </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              {authType === 'signup' && (
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Alex Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                {buttonText}
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            {authType === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <Link href={`/signup/${role}`} className="underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href={`/login/${role}`} className="underline">
                  Log in
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
