
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
import { CalendarIcon, Info, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { getDashboardPathForRole } from '@/lib/auth/paths';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, fetchSignInMethodsForEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, linkWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, writeBatch, query, limit, getDoc, where, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Category, LoyaltyLevel, UserProfile, MenuItem, Addon, AddonCategory } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { FaGoogle } from "react-icons/fa";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().optional(),
  fullName: z.string().optional(),
  mobileNumber: z.string().optional(),
  countryCode: z.string().optional(),
  cafeNickname: z.string().optional(),
  dateOfBirth: z.date().optional(),
  privacyPolicy: z.boolean().default(false),
  rememberMe: z.boolean().default(false),
});

const genericSignupSchema = formSchema.extend({
    confirmPassword: z.string().min(6, { message: 'Please confirm your password.' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});


const customerSignupSchema = genericSignupSchema.extend({
    fullName: z.string().min(1, { message: "Full name is required." }),
    mobileNumber: z.string().min(9, { message: "Please enter a valid phone number." }),
    countryCode: z.string(),
    dateOfBirth: z.date({ required_error: "Date of birth is required." }),
    privacyPolicy: z.literal(true, {
        errorMap: () => ({ message: "You must accept the privacy policy." }),
    }),
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
    { name: 'Coffee Classics', type: 'Beverages' },
    { name: 'Specialty Lattes', type: 'Beverages' },
    { name: 'Matcha & Tea', type: 'Beverages' },
    { name: 'Pastries & Bakes', type: 'Food' },
    { name: 'Savory Snacks', type: 'Food' },
    { name: 'Lunch Specials', type: 'Food' },
    { name: 'Custom Creations', type: 'Beverages' },
];

const SEED_LOYALTY_LEVELS: Omit<LoyaltyLevel, 'id'>[] = [
    { name: 'Member', minimumPoints: 0 },
    { name: 'Bronze', minimumPoints: 100 },
    { name: 'Silver', minimumPoints: 500 },
    { name: 'Gold', minimumPoints: 2000 },
    { name: 'Platinum', minimumPoints: 5000 },
]

const SEED_ADDON_CATEGORIES: Omit<AddonCategory, 'id'>[] = [
    { name: 'Milk Options', description: 'Choose your preferred milk' },
    { name: 'Syrups', description: 'Add a touch of sweetness' },
    { name: 'Toppings', description: 'Finish your drink with a flourish' },
];

export function AuthForm({ authType, role }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getSchema = () => {
    if (authType === 'login') {
      return formSchema;
    }
    // It's a signup
    if (role === 'customer') {
      return customerSignupSchema;
    }
    return genericSignupSchema; // For admin/staff signup
  };

  const currentFormSchema = getSchema();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: { email: '', password: '', fullName: '', mobileNumber: '', countryCode: '+94', cafeNickname: '', privacyPolicy: false, rememberMe: false },
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

            const userProfile: Omit<UserProfile, 'id'> & { id: string } = {
              id: user.uid,
              email: demoAccount.email,
              name: demoAccount.name,
              role: role, // Use the role from the props for the current form
              loyaltyPoints: role === 'customer' ? 125 : 0,
              lifetimePoints: role === 'customer' ? 125 : 0,
              loyaltyLevelId: "bronze",
              orderCount: role === 'customer' ? 1 : 0,
              emailVerified: true, // Demo users are pre-verified
            };
            
            await setDoc(doc(firestore, "users", user.uid), userProfile);
            console.log(`Created demo user: ${demoAccount.email}`);

            // It's good practice to sign the user out immediately after creation
            // so the login form is fresh for the user to try.
            if (auth.currentUser) {
              await auth.signOut();
            }
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

        let customCreationsCategoryId = '';

        // Seed Categories
        const categoriesRef = collection(firestore, 'categories');
        getDocs(query(categoriesRef, limit(1))).then(async categorySnapshot => {
            if (categorySnapshot.empty) {
                console.log("Categories collection is empty. Seeding...");
                const categoryBatch = writeBatch(firestore);
                for (const category of SEED_CATEGORIES) {
                    const docRef = doc(categoriesRef); // Create a new doc with a generated ID
                    categoryBatch.set(docRef, category);
                     if (category.name === 'Custom Creations') {
                      customCreationsCategoryId = docRef.id;
                    }
                }
                await categoryBatch.commit().catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'categories', operation: 'write', requestResourceData: SEED_CATEGORIES }));
                });
                console.log("Seeded categories.");
            } else {
                 const q = query(categoriesRef, where('name', '==', 'Custom Creations'), limit(1));
                 const snapshot = await getDocs(q);
                 if (!snapshot.empty) {
                    customCreationsCategoryId = snapshot.docs[0].id;
                 }
            }

            // Seed Add-on Categories
            const addonCategoriesRef = collection(firestore, 'addon_categories');
            const addonCategorySnapshot = await getDocs(query(addonCategoriesRef, limit(1))).catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'addon_categories', operation: 'list' }));
                return null;
            });
            if (!addonCategorySnapshot) return;

            const addonCategoryIds: Record<string, string> = {};

            if (addonCategorySnapshot.empty) {
                console.log("Add-on categories collection is empty. Seeding...");
                const batch = writeBatch(firestore);
                for (const category of SEED_ADDON_CATEGORIES) {
                    const docRef = doc(addonCategoriesRef);
                    batch.set(docRef, category);
                    addonCategoryIds[category.name] = docRef.id;
                }
                await batch.commit().catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'addon_categories', operation: 'write', requestResourceData: SEED_ADDON_CATEGORIES }));
                });
                console.log("Seeded add-on categories.");
            } else {
                const allAddonCategories = await getDocs(addonCategoriesRef).catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'addon_categories', operation: 'list' }));
                    return null;
                });
                if (!allAddonCategories) return;
                allAddonCategories.forEach(doc => {
                    const data = doc.data() as AddonCategory;
                    addonCategoryIds[data.name] = doc.id;
                });
            }
            
            // Seed Add-ons
            const addonsRef = collection(firestore, 'addons');
            const addonSnapshot = await getDocs(query(addonsRef, limit(1))).catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'addons', operation: 'list' }));
                return null;
            });
            if (!addonSnapshot) return;

            const addonIds: string[] = [];
            if (addonSnapshot.empty) {
                console.log("Addons collection is empty. Seeding...");
                const batch = writeBatch(firestore);
                const SEED_ADDONS: Omit<Addon, 'id'>[] = [
                    { name: "Extra Espresso Shot", price: 100, addonCategoryId: addonCategoryIds['Toppings'] },
                    { name: "Almond Milk", price: 80, addonCategoryId: addonCategoryIds['Milk Options'] },
                    { name: "Oat Milk", price: 80, addonCategoryId: addonCategoryIds['Milk Options'] },
                    { name: "Soy Milk", price: 70, addonCategoryId: addonCategoryIds['Milk Options'] },
                    { name: "Whipped Cream", price: 50, addonCategoryId: addonCategoryIds['Toppings'] },
                    { name: "Caramel Drizzle", price: 60, addonCategoryId: addonCategoryIds['Syrups'] },
                    { name: "Chocolate Syrup", price: 60, addonCategoryId: addonCategoryIds['Syrups'] },
                ];
                SEED_ADDONS.forEach(addon => {
                    const docRef = doc(addonsRef);
                    batch.set(docRef, addon);
                    addonIds.push(docRef.id);
                });
                await batch.commit().catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'addons', operation: 'write', requestResourceData: SEED_ADDONS }));
                });
                console.log("Seeded addons.");
            } else {
                const allAddons = await getDocs(addonsRef).catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'addons', operation: 'list' }));
                    return null;
                });
                if (!allAddons) return;
                allAddons.forEach(doc => addonIds.push(doc.id));
            }


            // Seed Custom Menu Items
            const menuItemsRef = collection(firestore, 'menu_items');
            const customCoffeeDoc = await getDoc(doc(menuItemsRef, 'custom-coffee-base')).catch(error => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'menu_items/custom-coffee-base', operation: 'get' }));
                 return null;
            });
            if (!customCoffeeDoc) return;

            if (!customCoffeeDoc.exists() && customCreationsCategoryId && addonIds.length > 0) {
                console.log("Seeding custom menu items...");
                const batch = writeBatch(firestore);
                const coffeeBase: Omit<MenuItem, 'id'> = {
                    name: 'Custom Coffee Base',
                    description: 'Your own coffee creation.',
                    price: 250,
                    categoryId: customCreationsCategoryId,
                    isOutOfStock: false,
                    addonGroups: [
                        { addonCategoryId: addonCategoryIds['Milk Options'], isRequired: true, minSelection: 1, maxSelection: 1 },
                        { addonCategoryId: addonCategoryIds['Syrups'], isRequired: false, minSelection: 0, maxSelection: 2 },
                        { addonCategoryId: addonCategoryIds['Toppings'], isRequired: false, minSelection: 0, maxSelection: 3 },
                    ]
                };
                 const teaBase: Omit<MenuItem, 'id'> = {
                    name: 'Custom Tea Base',
                    description: 'Your own tea creation.',
                    price: 200,
                    categoryId: customCreationsCategoryId,
                    isOutOfStock: false,
                    addonGroups: [
                        { addonCategoryId: addonCategoryIds['Milk Options'], isRequired: false, minSelection: 0, maxSelection: 1 },
                        { addonCategoryId: addonCategoryIds['Syrups'], isRequired: false, minSelection: 0, maxSelection: 2 },
                    ]
                };
                batch.set(doc(menuItemsRef, 'custom-coffee-base'), coffeeBase);
                batch.set(doc(menuItemsRef, 'custom-tea-base'), teaBase);
                await batch.commit().catch(error => {
                     errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'menu_items', operation: 'write', requestResourceData: { coffeeBase, teaBase } }));
                });
                console.log("Seeded custom menu items.");
            }


            // Seed Loyalty Levels
            const loyaltyLevelsRef = collection(firestore, 'loyalty_levels');
            const memberDoc = await getDoc(doc(loyaltyLevelsRef, 'member')).catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'loyalty_levels/member', operation: 'get' }));
                return null;
            });
            if (!memberDoc) return;

            if (!memberDoc.exists()) {
                console.log("Loyalty levels collection is missing or outdated. Seeding...");
                const loyaltyBatch = writeBatch(firestore);
                const existingLevels = await getDocs(loyaltyLevelsRef).catch(() => null);
                if(existingLevels) {
                    existingLevels.docs.forEach(d => loyaltyBatch.delete(d.ref));
                }
                
                SEED_LOYALTY_LEVELS.forEach(level => {
                    const docRef = doc(loyaltyLevelsRef, level.name.toLowerCase());
                    loyaltyBatch.set(docRef, level);
                });
                await loyaltyBatch.commit().catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'loyalty_levels', operation: 'write', requestResourceData: SEED_LOYALTY_LEVELS }));
                });
                console.log("Seeded loyalty levels.");
            }
        }).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'categories', operation: 'list' }));
        });
    };

    if (firestore) {
      seedDatabase();
    }
  }, [firestore]);


  const onSubmit = async (data: AuthFormValues) => {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Firebase not initialized.' });
      return;
    }

    if (authType === 'signup') {
        try {
            // 1. Check for existing email
            const signInMethods = await fetchSignInMethodsForEmail(auth, data.email);
            if (signInMethods.length > 0) {
                form.setError('email', { type: 'manual', message: 'This email address is already in use.' });
                return;
            }
            
            const fullMobileNumber = data.countryCode && data.mobileNumber ? `${data.countryCode}${data.mobileNumber.replace(/^0+/, '')}` : undefined;

            // 3. If all checks pass, create the user
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;

            // Send verification email
            await sendEmailVerification(user);

            // 4. Create user profile
            const userDocRef = doc(firestore, "users", user.uid);
            
            const userProfile: UserProfile = {
              id: user.uid,
              email: data.email,
              name: data.fullName!,
              role,
              mobileNumber: fullMobileNumber,
              cafeNickname: data.cafeNickname || '',
              dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString() : '',
              loyaltyPoints: 0,
              lifetimePoints: 0,
              loyaltyLevelId: "member",
              orderCount: 0,
              emailVerified: user.emailVerified,
            };

            await setDoc(userDocRef, userProfile).catch((error) => {
                 throw new FirestorePermissionError({
                    path: `users/${user.uid}`,
                    operation: 'create',
                    requestResourceData: userProfile
                });
            });


            toast({
              title: 'Account Created!',
              description: "Welcome! Please check your email to verify your account and then log in.",
            });
            router.push(`/login/${role}`);

        } catch (error: any) {
            // This will catch errors from any of the await calls
            if (error instanceof FirestorePermissionError) {
                errorEmitter.emit('permission-error', error);
            } else {
                 toast({
                  variant: 'destructive',
                  title: 'Sign Up Failed',
                  description: error.message || 'An unexpected error occurred.',
                });
            }
        }
      
    } else { // Login
        const persistence = data.rememberMe ? browserLocalPersistence : browserSessionPersistence;
        setPersistence(auth, persistence).then(() => {
            return signInWithEmailAndPassword(auth, data.email, data.password)
        })
        .then(userCredential => {
            const userDocRef = doc(firestore, 'users', userCredential.user.uid);
            getDoc(userDocRef)
            .then(userDocSnap => {
                if (userDocSnap.exists()) {
                    const userProfile = userDocSnap.data() as UserProfile;
                    if (userProfile.role === role) {
                        const targetPath = getDashboardPathForRole(role);
                        router.push(targetPath);
                    } else {
                        auth.signOut();
                        toast({
                            variant: 'destructive',
                            title: 'Access Denied',
                            description: `You are not authorized to log in as a ${role}. Please use the correct login page for your role.`,
                        });
                    }
                } else {
                    auth.signOut();
                    toast({
                        variant: 'destructive',
                        title: 'Login Failed',
                        description: 'User profile not found. Please contact support.',
                    });
                }
            })
            .catch(error => {
                const contextualError = new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', contextualError);
            });
        })
        .catch(error => {
            toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Invalid email or password. Please try again.',
            });
        });
    }
  };

  const handlePasswordReset = async () => {
    if (!auth) return;
    if (!resetEmail) {
        toast({
            variant: 'destructive',
            title: 'Email required',
            description: 'Please enter your email address to reset your password.',
        });
        return;
    }
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({
            title: 'Password Reset Email Sent',
            description: 'Please check your inbox for instructions to reset your password.',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message,
        });
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const additionalUserInfo = getAdditionalUserInfo(result);

        const userDocRef = doc(firestore, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (additionalUserInfo?.isNewUser || !userDocSnap.exists()) {
            // New user, create a profile
            const userProfile: UserProfile = {
                id: user.uid,
                email: user.email!,
                name: user.displayName!,
                role,
                loyaltyPoints: 0,
                lifetimePoints: 0,
                loyaltyLevelId: "member",
                orderCount: 0,
                emailVerified: user.emailVerified,
            };
            await setDoc(userDocRef, userProfile);
             toast({ title: 'Account Created!', description: `Welcome, ${user.displayName}!` });
        } else {
             // Existing user, just log them in and check role
            const userProfile = userDocSnap.data() as UserProfile;
             if (userProfile.role !== role) {
                await auth.signOut();
                toast({
                    variant: 'destructive',
                    title: 'Access Denied',
                    description: `You are not authorized to log in as a ${role}.`,
                });
                return;
            }
             toast({ title: `Welcome back, ${user.displayName}!` });
        }

        const targetPath = getDashboardPathForRole(role);
        router.push(targetPath);

    } catch (error: any) {
        // Handle specific errors, like account-exists-with-different-credential
        if (error.code === 'auth/account-exists-with-different-credential' && error.customData.email) {
            const email = error.customData.email;
            const methods = await fetchSignInMethodsForEmail(auth, email);

            if (methods[0] === 'password') {
                // Prompt user to sign in with email/password to link accounts
                const password = prompt('It looks like you already have an account with this email. Please enter your password to link your Google account.');
                if (password) {
                    try {
                        const userCredential = await signInWithEmailAndPassword(auth, email, password);
                        const googleCredential = GoogleAuthProvider.credentialFromError(error);
                        if (userCredential && googleCredential) {
                            await linkWithCredential(userCredential.user, googleCredential);
                            toast({ title: 'Accounts Linked!', description: 'You can now sign in with Google.' });
                            const targetPath = getDashboardPathForRole(role);
                            router.push(targetPath);
                        }
                    } catch (linkError: any) {
                        toast({ variant: 'destructive', title: 'Linking Failed', description: linkError.message });
                    }
                }
            } else {
                toast({ variant: 'destructive', title: 'Sign-in Failed', description: `You have previously signed in with ${methods[0]}. Please use that method.` });
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'Google Sign-In Failed',
                description: error.message,
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
                       <div className="flex gap-2">
                        <FormField
                            control={form.control}
                            name="countryCode"
                            render={({ field }) => (
                            <FormItem className="w-1/3">
                                <FormLabel>Code</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Code" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="+94">+94 (LK)</SelectItem>
                                    <SelectItem value="+1">+1 (US)</SelectItem>
                                    <SelectItem value="+44">+44 (UK)</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mobileNumber"
                            render={({ field }) => (
                            <FormItem className="w-2/3">
                                <FormLabel>Mobile Number</FormLabel>
                                <FormControl>
                                <Input type="tel" placeholder="771234567" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>
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
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date of birth</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  captionLayout="dropdown-buttons"
                                  fromYear={1920}
                                  toYear={new Date().getFullYear()}
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
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
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          className="pr-10"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground"
                          onClick={() => setShowPassword((prev) => !prev)}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {authType === 'signup' && (
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            className="pr-10"
                            {...field}
                          />
                           <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {authType === 'login' && role === 'customer' && (
                <div className="flex items-center justify-between">
                    <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Remember me</FormLabel>
                        </div>
                        </FormItem>
                    )}
                    />
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="link" className="p-0 h-auto text-sm">Forgot password?</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reset Password</DialogTitle>
                                <DialogDescription>
                                    Enter your email address and we will send you a link to reset your password.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                <Label htmlFor="reset-email">Email</Label>
                                <Input
                                    id="reset-email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                                </DialogClose>
                                <DialogClose asChild>
                                <Button onClick={handlePasswordReset}>Send Reset Link</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
              )}
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
            </form>
             <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                <FaGoogle className="mr-2 h-4 w-4" />
                Google
            </Button>
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
