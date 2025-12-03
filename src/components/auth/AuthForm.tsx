
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, useFirestore } from '@/firebase';
import { getDashboardPathForRole } from '@/lib/auth/paths';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, writeBatch, query, limit, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import type { Category, LoyaltyLevel } from '@/lib/types';

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

const DEMO_ACCOUNTS = {
    customer: { email: 'customer@example.com', password: 'password123', name: 'Demo Customer' },
    staff: { email: 'staff@example.com', password: 'password123', name: 'Demo Staff' },
    admin: { email: 'admin@example.com', password: 'password123', name: 'Demo Admin' },
}

const SEED_CATEGORIES: Omit<Category, 'id'>[] = [
    { name: 'Coffee Classics', type: 'coffee' },
    { name: 'Specialty Lattes', type: 'coffee' },
    { name: 'Matcha & Tea', type: 'match' },
    { name: 'Pastries & Bakes', type: 'breakfast' },
    { name: 'Savory Snacks', type: 'snacks' },
    { name: 'Lunch Specials', type: 'lunch' },
];

const SEED_LOYALTY_LEVELS: Omit<LoyaltyLevel, 'id'>[] = [
    { name: 'Member', minimumPoints: 0 },
    { name: 'Standard', minimumPoints: 100 },
    { name: 'Bronze', minimumPoints: 300 },
    { name: 'Silver', minimumPoints: 500 },
    { name: 'Gold', minimumPoints: 1000 },
    { name: 'Platinum', minimumPoints: 2000 },
]

export function AuthForm({ authType, role }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '', fullName: '', mobileNumber: '', cafeNickname: '', privacyPolicy: false },
  });

  const demoAccount = DEMO_ACCOUNTS[role];

  useEffect(() => {
    // This effect ensures our demo users are pre-populated in Firebase Auth
    // so that testers can log in without signing up.
    const ensureDemoUserExists = async () => {
      if (!auth || !firestore || authType !== 'login') return;

      try {
        const methods = await fetchSignInMethodsForEmail(auth, demoAccount.email);
        if (methods.length === 0) {
          // User does not exist, so create them
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, demoAccount.email, demoAccount.password);
            const user = userCredential.user;

            const userProfile = {
              id: user.uid,
              email: demoAccount.email,
              name: demoAccount.name,
              role,
              loyaltyPoints: role === 'customer' ? 125 : 0,
              loyaltyLevelId: role === 'customer' ? "standard" : "member",
            };
            
            await setDoc(doc(firestore, "users", user.uid), userProfile);
            console.log(`Created demo user: ${demoAccount.email}`);

            // It's good practice to sign the user out immediately after creation
            // so the login form is fresh for the user to try.
            await auth.signOut();
          } catch (creationError: any) {
              if (creationError.code !== 'auth/email-already-in-use') {
                console.error(`Failed to create demo user ${demoAccount.email}:`, creationError);
              }
          }
        }
      } catch (error) {
        console.error(`Failed to check for demo user ${demoAccount.email}:`, error);
      }
    };
    
    ensureDemoUserExists();
  }, [auth, firestore, authType, demoAccount, role]);

  useEffect(() => {
    // This effect seeds the database with essential data if it's empty.
    const seedDatabase = async () => {
        if (!firestore) return;

        // Seed Categories
        const categoriesRef = collection(firestore, 'categories');
        const categorySnapshot = await getDocs(query(categoriesRef, limit(1)));
        if (categorySnapshot.empty) {
            console.log("Categories collection is empty. Seeding...");
            const categoryBatch = writeBatch(firestore);
            SEED_CATEGORIES.forEach(category => {
                const docRef = doc(categoriesRef); // Create a new doc with a generated ID
                categoryBatch.set(docRef, category);
            });
            await categoryBatch.commit();
            console.log("Seeded categories.");
        }

        // Seed Loyalty Levels
        const loyaltyLevelsRef = collection(firestore, 'loyalty_levels');
        // Check a specific doc to see if seeding happened.
        const memberDoc = await getDoc(doc(loyaltyLevelsRef, 'member'));

        if (!memberDoc.exists()) {
            console.log("Loyalty levels collection is missing or outdated. Seeding...");
            const loyaltyBatch = writeBatch(firestore);
            // Delete existing documents to prevent conflicts if any partial data exists
            const existingLevels = await getDocs(loyaltyLevelsRef);
            existingLevels.docs.forEach(d => loyaltyBatch.delete(d.ref));
            
            SEED_LOYALTY_LEVELS.forEach(level => {
                const docRef = doc(loyaltyLevelsRef, level.name.toLowerCase()); // Use name as ID
                loyaltyBatch.set(docRef, level);
            });
            await loyaltyBatch.commit();
            console.log("Seeded loyalty levels.");
        }
    };

    if (firestore) {
      seedDatabase().catch(console.error);
    }
  }, [firestore]);


  const onSubmit = async (data: AuthFormValues) => {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Firebase not initialized.' });
      return;
    }

    if (authType === 'signup') {
      if (!data.fullName) {
        form.setError('fullName', { type: 'manual', message: 'Full name is required.' });
        return;
      }
      if (role === 'customer' && !data.privacyPolicy) {
        form.setError('privacyPolicy', { type: 'manual', message: 'You must accept the privacy policy.' });
        return;
      }
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        const userProfile = {
          id: user.uid,
          email: data.email,
          name: data.fullName,
          role,
          mobileNumber: data.mobileNumber || '',
          cafeNickname: data.cafeNickname || '',
          loyaltyPoints: 0,
          loyaltyLevelId: "member", // Default loyalty level
        };

        await setDoc(doc(firestore, "users", user.uid), userProfile);
        
        toast({
          title: 'Account Created!',
          description: "Welcome! Please log in to continue.",
        });
        router.push(`/login/${role}`);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description: error.message,
        });
      }
      
    } else { // Login
      try {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        // onAuthStateChanged in provider will handle redirect
        const targetPath = getDashboardPathForRole(role);
        router.push(targetPath);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Invalid email or password. Please try again.',
        });
      }
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
          {authType === 'login' && demoAccount && (
             <Alert className="mb-4 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600"/>
                <AlertTitle className="text-blue-800">Demo Account</AlertTitle>
                <AlertDescription className="text-blue-700 text-xs">
                  <p><strong>Email:</strong> {demoAccount.email}</p>
                  <p><strong>Password:</strong> {demoAccount.password}</p>
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

    
