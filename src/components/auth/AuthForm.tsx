'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Eye, EyeOff, Mail, Lock, Coffee, User, Phone, Loader2 } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { getDashboardPathForRole } from '@/lib/auth/paths';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, writeBatch, query, limit, getDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Category, LoyaltyLevel, UserProfile, AddonCategory } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { FaGoogle } from "react-icons/fa";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '../ui/checkbox';
import LoginImg from '../../assets/login.webp';

const BASE_SIGNUP_POINTS = 50;

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

const loginSchema = formSchema.pick({ email: true, password: true });

const genericSignupSchema = formSchema.pick({ email: true, password: true, confirmPassword: true, fullName: true })
    .extend({
        fullName: z.string().min(1, { message: "Full name is required." }),
        confirmPassword: z.string().min(6, { message: 'Please confirm your password.' }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

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

export function AuthForm({ authType, role }: AuthFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const auth = useAuth();
    const firestore = useFirestore();
    const [resetEmail, setResetEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (role !== 'customer' && authType === 'signup') {
            router.replace(`/login/${role}`);
        }
    }, [role, authType, router]);

    const currentFormSchema = authType === 'login' ? loginSchema : (role === 'customer' ? customerSignupSchema : genericSignupSchema);

    const form = useForm<AuthFormValues>({
        resolver: zodResolver(currentFormSchema),
        defaultValues: { email: '', password: '', confirmPassword: '', fullName: '', mobileNumber: '', countryCode: '+94', cafeNickname: '', dateOfBirth: undefined, agreeToTerms: false },
    });

    const seedDatabase = async () => {
        if (!firestore) return;

        const SEED_CATEGORIES: Omit<Category, 'id'>[] = [
            { name: 'Coffee Classics', type: 'Beverages', displayOrder: 0 },
            { name: 'Specialty Lattes', type: 'Beverages', displayOrder: 1 },
            { name: 'Matcha & Tea', type: 'Beverages', displayOrder: 2 },
            { name: 'Pastries & Bakes', type: 'Food', displayOrder: 3 },
            { name: 'Savory Snacks', type: 'Food', displayOrder: 4 },
            { name: 'Custom Creations', type: 'Beverages', displayOrder: 5 },
        ];

        const SEED_LOYALTY_LEVELS: Omit<LoyaltyLevel, 'id'>[] = [
            { name: 'Member', minimumPoints: 0 },
            { name: 'Bronze', minimumPoints: 100 },
            { name: 'Silver', minimumPoints: 500 },
            { name: 'Gold', minimumPoints: 2000 },
            { name: 'Platinum', minimumPoints: 5000 },
        ];

        const SEED_ADDON_CATEGORIES: Omit<AddonCategory, 'id'>[] = [
            { name: 'Milk Options', description: 'Choose your preferred milk' },
            { name: 'Syrups', description: 'Add a touch of sweetness' },
            { name: 'Toppings', description: 'Finish your drink with a flourish' },
        ];

        try {
            const batch = writeBatch(firestore);
            SEED_CATEGORIES.forEach(category => {
                batch.set(doc(collection(firestore, 'categories')), category);
            });
            SEED_LOYALTY_LEVELS.forEach(level => {
                batch.set(doc(firestore, 'loyalty_levels', level.name.toLowerCase()), level);
            });
            SEED_ADDON_CATEGORIES.forEach(category => {
                batch.set(doc(collection(firestore, 'addon_categories')), category);
            });
            await batch.commit();
        } catch (e: any) {
            console.error("Database Seeding Failed:", e);
        }
    };

    const onSubmit = async (data: AuthFormValues) => {
        if (!auth || !firestore) return;
        setIsProcessing(true);

        if (authType === 'signup') {
            try {
                // 1. Create Auth Account FIRST to establish permissions
                const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
                const user = userCredential.user;

                // 2. Perform existence checks now that we are authenticated
                const usersRef = collection(firestore, "users");
                const adminQuery = query(usersRef, where("role", "==", "admin"), limit(1));
                const adminSnapshot = await getDocs(adminQuery);

                if (role !== 'customer' && !adminSnapshot.empty) {
                    await user.delete();
                    toast({ variant: 'destructive', title: 'Restricted Action', description: 'Staff accounts must be created by an administrator.' });
                    setIsProcessing(false);
                    return;
                }

                if (role === 'admin' && adminSnapshot.empty) {
                    await seedDatabase();
                }

                await sendEmailVerification(user);

                const fullMobileNumber = data.countryCode && data.mobileNumber ? `${data.countryCode}${data.mobileNumber.replace(/^0+/, '')}` : undefined;

                const userProfile: UserProfile = {
                    id: user.uid,
                    email: data.email,
                    name: data.fullName!,
                    role: role,
                    mobileNumber: fullMobileNumber,
                    cafeNickname: data.cafeNickname || '',
                    dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString() : '',
                    loyaltyPoints: BASE_SIGNUP_POINTS,
                    lifetimePoints: BASE_SIGNUP_POINTS,
                    loyaltyLevelId: "member",
                    orderCount: 0,
                    emailVerified: user.emailVerified,
                };

                await setDoc(doc(firestore, "users", user.uid), userProfile);
                toast({ title: 'Account Created!', description: "Welcome! Please verify your email." });
                router.replace(getDashboardPathForRole(role));

            } catch (error: any) {
                setIsProcessing(false);
                toast({ variant: 'destructive', title: 'Sign Up Failed', description: error.message });
            }
        } else {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
                const userDocSnap = await getDoc(doc(firestore, 'users', userCredential.user.uid));

                if (userDocSnap.exists() && (userDocSnap.data() as UserProfile).role === role) {
                    router.replace(getDashboardPathForRole(role));
                } else {
                    await auth.signOut();
                    setIsProcessing(false);
                    toast({ variant: 'destructive', title: 'Access Denied', description: `Invalid role for this portal.` });
                }
            } catch (error: any) {
                setIsProcessing(false);
                toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid email or password.' });
            }
        }
    };

    const handleGoogleSignIn = async () => {
        if (!auth || !firestore) return;
        setIsProcessing(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const userDocRef = doc(firestore, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
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
            } else {
                const userProfile = userDocSnap.data() as UserProfile;
                if (userProfile.role !== role) {
                    await auth.signOut();
                    setIsProcessing(false);
                    toast({ variant: 'destructive', title: 'Access Denied', description: `Invalid role for this portal.` });
                    return;
                }
            }
            router.replace(getDashboardPathForRole(role));
        } catch (error: any) {
            setIsProcessing(false);
            if (error.code !== 'auth/popup-closed-by-user') {
                toast({ variant: 'destructive', title: 'Sign-In Failed', description: error.message });
            }
        }
    };

    const handlePasswordReset = async () => {
        if (!auth || !resetEmail) return;
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            toast({ title: 'Reset Email Sent' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden bg-[#fff8f0]">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#fff8f0] via-[#fef3c7] to-[#fff7ed] animate-gradient-x bg-[length:400%_400%]" />
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#fcd34d]/20 rounded-full blur-[80px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#fbbf24]/10 rounded-full blur-[100px] animate-pulse delay-1000" />
                </div>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm border border-white/40 relative z-10 animate-in zoom-in-95 duration-500">
                <div className="relative p-8 text-white hidden md:flex flex-col justify-between">
                    <div className="absolute inset-0">
                        <Image src={LoginImg} alt="Steamsbury" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-4xl font-bold font-headline text-accent">STEAMSBURY</h2>
                        <p className="text-sm">by SANTHIYAGU</p>
                    </div>
                    <div className="relative z-10 space-y-4">
                        <Coffee className="w-12 h-12 text-accent" />
                        <h3 className="text-3xl font-bold font-headline">Morning brew, on us.</h3>
                        <p className="text-white/80">Join our rewards program today. Earn points for every purchase and enjoy exclusive member benefits.</p>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto">
                    <div className="flex flex-col h-full justify-center">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold font-headline">{authType === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
                            <p className="text-muted-foreground">{authType === 'login' ? 'Sign in to access your rewards.' : 'Start your journey with Steamsbury.'}</p>
                        </div>

                        {role === 'customer' ? (
                            <Tabs value={authType} className="w-full" onValueChange={(value) => router.replace(`/${value}/${role}`)}>
                                <TabsList className="grid w-full grid-cols-2 mb-6 rounded-full p-1 bg-stone-200/50">
                                    <TabsTrigger className="rounded-full" value="login">Login</TabsTrigger>
                                    <TabsTrigger className="rounded-full" value="signup">Sign Up</TabsTrigger>
                                </TabsList>

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
                                                                <div className="relative">
                                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                    <Input placeholder="John Doe" className="pl-10 h-12 rounded-xl" {...field} />
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
                                                                        <FormItem className="w-[100px]">
                                                                            <FormControl>
                                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="+94" /></SelectTrigger>
                                                                                    <SelectContent><SelectItem value="+94">+94</SelectItem></SelectContent>
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
                                                                                    <Input placeholder="77 123 4567" className="pl-10 h-12 rounded-xl" {...field} />
                                                                                </div>
                                                                            </FormControl>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>
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
                                                                        <Button variant={"outline"} className={cn("w-full h-12 rounded-xl pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <Calendar mode="single" captionLayout="dropdown-buttons" fromYear={1920} toYear={new Date().getFullYear()} selected={field.value} onSelect={field.onChange} initialFocus />
                                                                </PopoverContent>
                                                            </Popover>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
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
                                                            <Input type="email" placeholder="name@example.com" className="pl-10 h-12 rounded-xl" {...field} />
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
                                                                    <Button variant="link" className="p-0 h-auto text-xs">Forgot Password?</Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Reset Password</DialogTitle>
                                                                        <DialogDescription>Enter your email to receive a reset link.</DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="grid gap-2"><Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="m@example.com" /></div>
                                                                    <DialogFooter>
                                                                        <DialogClose asChild><Button onClick={handlePasswordReset}>Send Link</Button></DialogClose>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        )}
                                                    </div>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input type={showPassword ? 'text' : 'password'} className="pl-10 pr-10 h-12 rounded-xl" {...field} />
                                                            <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-10 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                                                {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
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
                                                name="agreeToTerms"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                        <div className="space-y-1 leading-none"><FormLabel>I agree to the <Link href="/privacy" className="underline">Privacy Policy</Link></FormLabel></div>
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                        <Button type="submit" className="w-full h-12 rounded-xl font-bold mt-2" size="lg" disabled={isProcessing}>
                                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (authType === 'login' ? 'Sign In' : 'Create Account')}
                                        </Button>
                                    </form>
                                </Form>
                            </Tabs>
                        ) : (
                            <div className="w-full space-y-6">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl><Input type="email" className="h-12 rounded-xl" {...field} /></FormControl>
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
                                                    <FormControl><Input type="password" className="h-12 rounded-xl" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" className="w-full h-12 rounded-xl font-bold" size="lg" disabled={isProcessing}>
                                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
                                        </Button>
                                    </form>
                                </Form>
                            </div>
                        )}

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
                        </div>
                        <Button variant="outline" className="w-full h-12 rounded-xl font-bold" onClick={handleGoogleSignIn} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><FaGoogle className="mr-2 h-4 w-4" /> Continue with Google</>}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}