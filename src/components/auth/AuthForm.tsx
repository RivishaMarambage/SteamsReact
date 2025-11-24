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
import { Checkbox } from '@/components/ui/checkbox';
import type { User } from '@/lib/types';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  fullName: z.string().optional(),
  mobileNumber: z.string().optional(),
  cafeNickname: z.string().optional(),
  privacyPolicy: z.boolean().default(false),
});

type AuthFormValues = z.infer<typeof formSchema>;

interface AuthFormProps {
  authType: 'login' | 'signup';
  role: 'customer' | 'staff' | 'admin';
}

export function AuthForm({ authType, role }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '', fullName: '', mobileNumber: '', cafeNickname: '', privacyPolicy: false },
  });

  const handleAuthError = (error: any) => {
    let description = 'An unexpected error occurred.';
    let title = 'Authentication Error';

    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      title = 'Login Failed';
      description = 'Invalid email or password. Please try again.';
    } else if (error.code === 'auth/email-already-in-use') {
      title = 'Email In Use'
      description = 'This email address is already registered. Please log in instead.';
    } else if (error.code === 'auth/network-request-failed') {
      title = 'Network Error';
      description = 'Could not connect to Firebase. Please check your network connection.';
    } else {
       console.error("Authentication Error:", error);
    }
    
    toast({
      variant: 'destructive',
      title: title,
      description,
    });
  }

  const onSubmit = async (data: AuthFormValues) => {
    if (authType === 'signup') {
      if (!data.fullName) {
        form.setError('fullName', { type: 'manual', message: 'Full name is required.' });
        return;
      }
      if (role === 'customer' && !data.privacyPolicy) {
        form.setError('privacyPolicy', { type: 'manual', message: 'You must accept the privacy policy.' });
        return;
      }

      initiateEmailSignUp(auth, data.email, data.password, {
        onSuccess: (userCredential) => {
          const authUser = userCredential.user;
          
          // Create the unified /users/{userId} document
          const userDocRef = doc(firestore, "users", authUser.uid);
          
          const userData: User = {
            id: authUser.uid,
            email: authUser.email!,
            role: role,
            name: data.fullName!,
          };
          
          // Add customer-specific fields
          if (role === 'customer') {
            userData.mobileNumber = data.mobileNumber || '';
            userData.cafeNickname = data.cafeNickname || '';
            userData.points = 0;
            userData.loyaltyLevel = 'None';
          }
          
          setDocumentNonBlocking(userDocRef, userData, { merge: true });

          // Create role-specific documents in /roles_* collections for admin/staff
          if (role === 'admin' || role === 'staff') {
            const roleCollection = role === 'admin' ? 'roles_admin' : 'roles_staff';
            const roleDocRef = doc(firestore, roleCollection, authUser.uid);
            // This document's existence grants the role. Content can be minimal.
            setDocumentNonBlocking(roleDocRef, {
              id: authUser.uid,
              email: authUser.email,
              createdAt: new Date().toISOString()
            }, { merge: true });
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
          // onAuthStateChanged in the FirebaseProvider and the AuthRedirect component
          // will handle the redirection after a successful login.
          // No immediate redirect here.
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
  
  const showSignupLink = role === 'customer';

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
                  <p>First, please sign up for the role you want to test. Then you can log in with those credentials.</p>
                  <p className="mt-2">
                    <strong>Password:</strong> Use any password (min. 6 characters)
                  </p>
                </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              {authType === 'signup' && (
                <>
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
                  {role === 'customer' && (
                    <>
                      <FormField
                        control={form.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="555-123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cafeNickname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cafe Nickname (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Lex" {...field} />
                            </FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </>
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
               {authType === 'signup' && role === 'customer' && (
                <FormField
                  control={form.control}
                  name="privacyPolicy"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I agree to the <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              )}
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
                {showSignupLink && (
                  <>
                    Don&apos;t have an account?{' '}
                    <Link href={`/signup/${role}`} className="underline">
                      Sign up
                    </Link>
                  </>
                )}
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
    