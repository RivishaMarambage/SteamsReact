
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarIcon, Info, Eye, EyeOff, Mail, Lock, Coffee, Award, User, Phone, Edit3 } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '../ui/checkbox';
import LoginImg from '../../assets/login.webp';


// Base schema with all possible fields as optional
const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().optional(),
  fullName: z.string().optional(),
  mobileNumber: z.string().optional(),
  countryCode: z.string().optional(),
  cafeNickname: z.string().optional(),
  dateOfBirth: z.date().optional(),
  agreeToTerms: z.boolean().optional(),
});

// Schema for just login
const loginSchema = formSchema.pick({ email: true, password: true });

// Schema for admin/staff signup
const genericSignupSchema = formSchema.pick({ email: true, password: true, confirmPassword: true, fullName: true })
  .extend({
    fullName: z.string().min(1, { message: "Full name is required." }),
    confirmPassword: z.string().min(6, { message: 'Please confirm your password.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Schema for customer signup, based on new design
const customerSignupSchema = formSchema.pick({ email: true, password: true, confirmPassword: true, fullName: true, mobileNumber: true, countryCode: true, cafeNickname: true, dateOfBirth: true, agreeToTerms: true })
  .extend({
    fullName: z.string().min(1, { message: "Full name is required." }),
    mobileNumber: z.string().min(9, { message: "Please enter a valid mobile number." }),
    countryCode: z.string(),
    cafeNickname: z.string().optional(),
    dateOfBirth: z.date({ required_error: "Date of birth is required." }),
    agreeToTerms: z.literal(true, {
        errorMap: () => ({ message: "You must agree to the Privacy Policy." }),
    }),
    confirmPassword: z.string().min(6, { message: 'Please confirm your password.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
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
      return loginSchema;
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
    defaultValues: { email: '', password: '', confirmPassword: '', fullName: '', mobileNumber: '', countryCode: '+94', cafeNickname: '', dateOfBirth: undefined, agreeToTerms: false },
  });

  const demoAccount = DEMO_ACCOUNTS[role];

  useEffect(() => {
    const ensureDemoUserExists = async () => {
      if (!auth || !firestore || authType !== 'login') return;

      try {
        const methods = await fetchSignInMethodsForEmail(auth, demoAccount.email);
        if (methods.length === 0) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, demoAccount.email, demoAccount.password);
            const user = userCredential.user;

            const userProfile: Omit<UserProfile, 'id'> & { id: string } = {
              id: user.uid,
              email: demoAccount.email,
              name: demoAccount.name,
              role: role,
              loyaltyPoints: role === 'customer' ? 125 : 0,
              lifetimePoints: role === 'customer' ? 125 : 0,
              loyaltyLevelId: "bronze",
              orderCount: role === 'customer' ? 1 : 0,
              emailVerified: true,
            };
            
            await setDoc(doc(firestore, "users", user.uid), userProfile);
            console.log(`Created demo user: ${demoAccount.email}`);

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

  const seedDatabase = async () => {
    if (!firestore) return;

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
    
    try {
        const batch = writeBatch(firestore);
        console.log("Seeding initial data...");
        let customCreationsCategoryId = '';
        const categoriesRef = collection(firestore, 'categories');
        SEED_CATEGORIES.forEach(category => {
            const docRef = doc(categoriesRef);
            if(category.name === 'Custom Creations') {
                customCreationsCategoryId = docRef.id;
            }
            batch.set(docRef, category);
        });

        const loyaltyLevelsRef = collection(firestore, 'loyalty_levels');
        SEED_LOYALTY_LEVELS.forEach(level => {
            const docRef = doc(loyaltyLevelsRef, level.name.toLowerCase());
            batch.set(docRef, level);
        });
        
        const addonCategoriesRef = collection(firestore, 'addon_categories');
        const addonCategoryRefs: Record<string, string> = {};
        SEED_ADDON_CATEGORIES.forEach(category => {
            const docRef = doc(addonCategoriesRef);
            batch.set(docRef, category);
            addonCategoryRefs[category.name] = docRef.id;
        });

        await batch.commit(); 

        const addonBatch = writeBatch(firestore);
        const addonsRef = collection(firestore, 'addons');
        
        const SEED_ADDONS: Omit<Addon, 'id' | 'addonCategoryId'> & { categoryName: string }[] = [
            { name: "Extra Espresso Shot", price: 100, categoryName: "Toppings" },
            { name: "Almond Milk", price: 80, categoryName: "Milk Options" },
            { name: "Oat Milk", price: 80, categoryName: "Milk Options" },
            { name: "Soy Milk", price: 70, categoryName: "Milk Options" },
            { name: "Whipped Cream", price: 50, categoryName: "Toppings" },
            { name: "Caramel Drizzle", price: 60, categoryName: "Syrups" },
            { name: "Chocolate Syrup", price: 60, categoryName: "Syrups" },
        ];

        SEED_ADDONS.forEach(addon => {
            const categoryId = addonCategoryRefs[addon.categoryName];
            if (categoryId) {
                const docRef = doc(addonsRef);
                const { categoryName, ...addonData } = addon;
                addonBatch.set(docRef, { ...addonData, addonCategoryId: categoryId });
            }
        });
        
        if(customCreationsCategoryId) {
            const menuItemsRef = collection(firestore, 'menu_items');
            const coffeeBase: Omit<MenuItem, 'id'> = {
                name: 'Custom Coffee Base',
                description: 'Your own coffee creation.',
                price: 250,
                categoryId: customCreationsCategoryId,
                isOutOfStock: false,
                addonGroups: [
                    { addonCategoryId: addonCategoryRefs['Milk Options'], isRequired: true, minSelection: 1, maxSelection: 1 },
                    { addonCategoryId: addonCategoryRefs['Syrups'], isRequired: false, minSelection: 0, maxSelection: 2 },
                    { addonCategoryId: addonCategoryRefs['Toppings'], isRequired: false, minSelection: 0, maxSelection: 3 },
                ]
            };
             const teaBase: Omit<MenuItem, 'id'> = {
                name: 'Custom Tea Base',
                description: 'Your own tea creation.',
                price: 200,
                categoryId: customCreationsCategoryId,
                isOutOfStock: false,
                addonGroups: [
                    { addonCategoryId: addonCategoryRefs['Milk Options'], isRequired: false, minSelection: 0, maxSelection: 1 },
                    { addonCategoryId: addonCategoryRefs['Syrups'], isRequired: false, minSelection: 0, maxSelection: 2 },
                ]
            };
            addonBatch.set(doc(menuItemsRef, 'custom-coffee-base'), coffeeBase);
            addonBatch.set(doc(menuItemsRef, 'custom-tea-base'), teaBase);
        }

        await addonBatch.commit();
        console.log("Database seeded successfully.");
    } catch (e: any) {
        if (e instanceof FirestorePermissionError) {
            errorEmitter.emit('permission-error', e);
        } else {
            console.error("Error seeding database: ", e);
            toast({
                variant: 'destructive',
                title: 'Database Seeding Failed',
                description: "Could not set up initial data. Please check Firestore rules.",
            });
        }
    }
  };


  const onSubmit = async (data: AuthFormValues) => {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Firebase not initialized.' });
      return;
    }

    if (authType === 'signup') {
        try {
            const signInMethods = await fetchSignInMethodsForEmail(auth, data.email);
            if (signInMethods.length > 0) {
                form.setError('email', { type: 'manual', message: 'This email address is already in use.' });
                return;
            }
            
            const fullMobileNumber = data.countryCode && data.mobileNumber ? `${data.countryCode}${data.mobileNumber.replace(/^0+/, '')}` : undefined;

            if (role === 'admin') {
                const usersRef = collection(firestore, "users");
                const q = query(usersRef, where("role", "==", "admin"), limit(1));
                const adminSnapshot = await getDocs(q);
                if (adminSnapshot.empty) {
                    await seedDatabase();
                }
            }

            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;
            await sendEmailVerification(user);
            const userDocRef = doc(firestore, "users", user.uid);
            
            const userProfile: UserProfile = {
              id: user.uid,
              email: data.email,
              name: data.fullName!,
              role,
              mobileNumber: fullMobileNumber,
              cafeNickname: data.cafeNickname || '',
              dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString() : '',
              loyaltyPoints: 50,
              lifetimePoints: 50,
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
              description: "Welcome! We've sent you a verification email. Please check your inbox, then log in.",
            });
            router.push(`/login/${role}`);

        } catch (error: any) {
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
      
    } else {
        const persistence = browserLocalPersistence;
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
                            description: `You are not authorized to log in as a ${role}. Please use the correct login page.`,
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
        toast({ variant: 'destructive', title: 'Email required', description: 'Please enter your email to reset your password.' });
        return;
    }
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({ title: 'Password Reset Email Sent', description: 'Please check your inbox.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
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
            const userProfile: UserProfile = {
                id: user.uid,
                email: user.email!,
                name: user.displayName!,
                role,
                loyaltyPoints: 50,
                lifetimePoints: 50,
                loyaltyLevelId: "member",
                orderCount: 0,
                emailVerified: user.emailVerified,
            };
            await setDoc(userDocRef, userProfile);
            toast({ title: 'Account Created!', description: `Welcome, ${user.displayName}!` });
        } else {
            const userProfile = userDocSnap.data() as UserProfile;
             if (userProfile.role !== role) {
                await auth.signOut();
                toast({ variant: 'destructive', title: 'Access Denied', description: `You are not authorized to log in as a ${role}.` });
                return;
            }
             toast({ title: `Welcome back, ${user.displayName}!` });
        }

        const targetPath = getDashboardPathForRole(role);
        router.push(targetPath);

    } catch (error: any) {
        if (error.code === 'auth/account-exists-with-different-credential' && error.customData.email) {
            const email = error.customData.email;
            const methods = await fetchSignInMethodsForEmail(auth, email);

            if (methods[0] === 'password') {
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
                toast({ variant: 'destructive', title: 'Sign-in Failed', description: `You have previously signed in with ${methods[0]}.` });
            }
        } else {
            toast({ variant: 'destructive', title: 'Google Sign-In Failed', description: error.message });
        }
    }
  };

  const title = authType === 'login' ? 'Welcome Back' : 'Create an Account';
  const description = authType === 'login' ? 'Please enter your details to sign in.' : 'Join us for exclusive rewards.';

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden bg-card">
        {/* Left Panel */}
        <div className="relative p-8 text-white hidden md:flex flex-col justify-between">
            <div className="absolute inset-0">
        <Image
            src={LoginImg} 
            alt="Steamsbury Cafe" 
            className="absolute inset-0 w-full h-full object-cover" 
            data-ai-hint="cafe exterior night" 
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1200";
            }}
          />
                <div className="absolute inset-0 bg-black/60" />
            </div>
            <div className="relative z-10">
                <h2 className="text-4xl font-bold font-headline">STEAMSBURY</h2>
                <p className="text-sm">by SANTHIYAGU</p>
            </div>
             <div className="relative z-10 space-y-4">
                <Coffee className="w-12 h-12 text-accent" />
                <h3 className="text-3xl font-bold font-headline">Morning brew, on us.</h3>
                <p className="text-muted-foreground text-white/80">Join our rewards program today. Earn points for every purchase and get a free drink after just 5 visits.</p>
                 <div className="inline-flex items-center gap-2 p-2 pr-4 rounded-full bg-black/50 border border-white/20">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-accent-foreground">
                        <Award className="h-5 w-5"/>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Panel */}
        <div className="p-8">
            <div className="flex flex-col h-full justify-center">
                 <div className="mb-6">
                    <h1 className="text-3xl font-bold font-headline">{title}</h1>
                    <p className="text-muted-foreground">{description}</p>
                </div>
                
                <Tabs defaultValue={authType} className="w-full" onValueChange={(value) => router.push(`/${value}/${role}`)}>
                    <TabsList className="grid w-full grid-cols-2 mb-6 rounded-full p-1 bg-stone-200/50 transition-all">
                        <TabsTrigger className="rounded-full transition-all duration-300 ease-in-out 
                     data-[state=active]:bg-[#6F4E37] data-[state=active]:text-white data-[state=active]:shadow-md
                     hover:text-[#6F4E37] data-[state=active]:hover:text-white" value="login">Login</TabsTrigger>
                        <TabsTrigger className="rounded-full transition-all duration-300 ease-in-out 
                     data-[state=active]:bg-[#6F4E37] data-[state=active]:text-white data-[state=active]:shadow-md
                     hover:text-[#6F4E37] data-[state=active]:hover:text-white" value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                        {authType === 'signup' && role === 'customer' && (
                           <>
                             <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="John Doe" className="pl-10" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="mobileNumber"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>Mobile Number</FormLabel>
                                        <div className="flex gap-2">
                                            <FormField
                                                control={form.control}
                                                name="countryCode"
                                                render={({ field }) => (
                                                    <FormItem className="w-1/3">
                                                        <FormControl>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <SelectTrigger><SelectValue placeholder="+94" /></SelectTrigger>
                                                                <SelectContent><SelectItem value="+94">+94 (LK)</SelectItem></SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="mobileNumber"
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                             <div className="relative">
                                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                <Input placeholder="77 123 4567" className="pl-10" {...field} />
                                                            </div>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormMessage>{form.formState.errors.mobileNumber?.message}</FormMessage>
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="cafeNickname"
                                render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center">
                                        <FormLabel>Nickname</FormLabel>
                                        <span className="text-xs text-muted-foreground">Optional</span>
                                    </div>
                                    <FormControl>
                                        <div className="relative">
                                            <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Enter your nickname" className="pl-10" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="dateOfBirth"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date of Birth</FormLabel>
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
                                        fromYear={new Date().getFullYear() - 100}
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

                        {authType === 'signup' && role !== 'customer' && (
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input placeholder="Alex Doe" {...field} />
                                        </div>
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
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input type="email" placeholder="name@example.com" className="pl-10" {...field} />
                                </div>
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
                                <div className="flex justify-between items-center">
                                    <FormLabel>Password</FormLabel>
                                    {authType === 'login' && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="link" className="p-0 h-auto text-sm">Forgot Password?</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Reset Password</DialogTitle>
                                                    <DialogDescription>
                                                        Enter your email and we will send you a link to reset your password.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-2">
                                                <Label htmlFor="reset-email">Email</Label>
                                                <Input id="reset-email" type="email" placeholder="m@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                                    <DialogClose asChild><Button onClick={handlePasswordReset}>Send Reset Link</Button></DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>
                                <FormControl>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input type={showPassword ? 'text' : 'password'} className="pl-10" placeholder="Create a password" {...field} />
                                    <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground" onClick={() => setShowPassword((prev) => !prev)} tabIndex={-1}>
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type={showConfirmPassword ? 'text' : 'password'} className="pl-10" placeholder="Confirm your password" {...field} />
                                        <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground" onClick={() => setShowConfirmPassword((prev) => !prev)} tabIndex={-1}>
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        )}
                        {authType === 'signup' && role === 'customer' && (
                             <FormField
                                control={form.control}
                                name="agreeToTerms"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                        I agree to the <Link href="#" className="underline">Privacy Policy</Link>
                                        </FormLabel>
                                        <FormMessage />
                                    </div>
                                    </FormItem>
                                )}
                            />
                        )}
                        <Button type="submit" className="w-full" size="lg">
                            {authType === 'login' ? 'Sign In' : 'Create Account'}
                        </Button>
                        </form>
                    </Form>
                </Tabs>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                        <FaGoogle className="mr-2 h-4 w-4" />
                        Google
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
