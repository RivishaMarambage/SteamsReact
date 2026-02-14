
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { sendEmailVerification } from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/lib/types";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "../ui/calendar";
import { CalendarIcon, ShieldCheck, ShieldOff, MailCheck, MailWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  cafeNickname: z.string().optional(),
  email: z.string().email(),
  dateOfBirth: z.date().optional(),
  mobileNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm({ userProfile }: { userProfile: UserProfile }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const auth = useAuth();


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userProfile.name,
      cafeNickname: userProfile.cafeNickname || '',
      email: userProfile.email,
      mobileNumber: userProfile.mobileNumber || '',
      dateOfBirth: userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth) : undefined,
    },
    mode: "onChange",
  });

  async function onSubmit(data: ProfileFormValues) {
    if (!firestore || !userProfile) return;
    const userRef = doc(firestore, "users", userProfile.id);

    // Sync email verification status from auth to firestore
    await authUser?.reload();
    const isEmailVerified = authUser?.emailVerified ?? false;

    const profileData = {
      ...data,
      dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString() : '',
      emailVerified: isEmailVerified,
    };
    await setDoc(userRef, profileData, { merge: true });

    toast({
      title: "Profile Updated",
      description: "Your information has been saved successfully.",
    });
  }

  const handleSendVerificationEmail = async () => {
    if (authUser && !authUser.emailVerified) {
      try {
        await sendEmailVerification(authUser);
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox to verify your email address.",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      }
    }
  };

  const isEmailVerified = authUser?.emailVerified ?? false;
  // Placeholder for mobile verification logic
  const isMobileVerified = false;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
                <FormLabel className="text-[#2c1810] font-bold text-base ml-1">Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your full name"
                    {...field}
                    className="h-14 bg-white/50 border-[#2c1810]/10 rounded-2xl focus-visible:ring-[#d97706] focus-visible:ring-offset-2 focus-visible:border-transparent transition-all duration-300 text-base shadow-sm hover:shadow-md hover:border-[#d97706]/30"
                  />
                </FormControl>
                <FormMessage className="ml-1" />
              </FormItem>
            )}
          />
          {userProfile.role === 'customer' && (
            <>
              <FormField
                control={form.control}
                name="cafeNickname"
                render={({ field }) => (
                  <FormItem className="animate-in fade-in slide-in-from-right-4 duration-500 delay-300">
                    <FormLabel className="text-[#2c1810] font-bold text-base ml-1">Cafe Nickname</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your cafe nickname"
                        {...field}
                        className="h-14 bg-white/50 border-[#2c1810]/10 rounded-2xl focus-visible:ring-[#d97706] focus-visible:ring-offset-2 focus-visible:border-transparent transition-all duration-300 text-base shadow-sm hover:shadow-md hover:border-[#d97706]/30"
                      />
                    </FormControl>
                    <FormDescription className="text-[#6b584b] text-xs font-medium ml-1">This is how we'll call out your order.</FormDescription>
                    <FormMessage className="ml-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="animate-in fade-in slide-in-from-left-4 duration-500 delay-400">
                    <FormLabel className="text-[#2c1810] font-bold text-base ml-1">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your email address"
                        {...field}
                        readOnly
                        disabled
                        className="h-14 bg-[#2c1810]/5 border-[#2c1810]/5 rounded-2xl text-[#6b584b] cursor-not-allowed italic"
                      />
                    </FormControl>
                    <FormDescription className="text-[#6b584b] text-xs font-medium ml-1">Used for login and receipts. Cannot be changed.</FormDescription>
                    <FormMessage className="ml-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem className="animate-in fade-in slide-in-from-right-4 duration-500 delay-500">
                    <FormLabel className="text-[#2c1810] font-bold text-base ml-1">Mobile Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your mobile number"
                        {...field}
                        readOnly
                        disabled
                        className="h-14 bg-[#2c1810]/5 border-[#2c1810]/5 rounded-2xl text-[#6b584b] cursor-not-allowed italic"
                      />
                    </FormControl>
                    <FormDescription className="text-[#6b584b] text-xs font-medium ml-1">Your mobile number cannot be changed.</FormDescription>
                    <FormMessage className="ml-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500 delay-600">
                    <FormLabel className="text-[#2c1810] font-bold text-base ml-1">Date of birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-4 text-left font-normal h-14 bg-white/50 border-[#2c1810]/10 rounded-2xl hover:bg-white hover:border-[#d97706] transition-all duration-300 shadow-sm hover:shadow-md",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={!!userProfile.dateOfBirth}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span className="text-base text-gray-400">Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-5 w-5 text-[#d97706] opacity-70" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-0" align="start">
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
                          className="rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="text-[#6b584b] text-xs font-medium ml-1">
                      {userProfile.dateOfBirth
                        ? "Your date of birth cannot be changed."
                        : "Your date of birth is used to send you birthday wishes."
                      }
                    </FormDescription>
                    <FormMessage className="ml-1" />
                  </FormItem>
                )}
              />
            </>
          )}
          {userProfile.role !== 'customer' && (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2c1810] font-bold text-base">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Your email address" {...field} readOnly disabled className="h-12 bg-[#FDFBF7]/50 border-[#2c1810]/5 rounded-xl text-[#6b584b] cursor-not-allowed" />
                  </FormControl>
                  <FormDescription className="text-[#6b584b] text-xs font-medium">Used for login. Cannot be changed.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {userProfile.role === 'customer' && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white/50 to-white/20 backdrop-blur-md rounded-[2rem] overflow-hidden mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700">
            <CardHeader className="border-b border-[#2c1810]/5 pb-6 bg-white/30">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#d97706]/60 rounded-full"></div>
                <CardTitle className="font-headline text-xl text-[#2c1810]">Account Verification</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-8 bg-white/10">
              <Alert variant={isEmailVerified ? 'default' : 'destructive'}
                className={cn(
                  "relative border transition-all duration-500 rounded-2xl overflow-hidden group",
                  isEmailVerified
                    ? "bg-emerald-50/80 border-emerald-200/50 text-emerald-900 shadow-[0_4px_20px_rgba(16,185,129,0.1)]"
                    : "bg-rose-50/80 border-rose-200/50 text-rose-950 shadow-[0_4px_20px_rgba(244,63,94,0.1)]"
                )}
              >
                {/* Background Glow */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                  isEmailVerified ? "bg-emerald-400/5" : "bg-rose-400/5"
                )}></div>

                <div className="relative z-10 flex">
                  {isEmailVerified ? <MailCheck className="h-6 w-6 text-emerald-500 shrink-0" /> : <MailWarning className="h-6 w-6 text-rose-500 shrink-0" />}
                  <div className="ml-4 w-full">
                    <AlertTitle className="font-bold text-lg mb-1 leading-none">{isEmailVerified ? 'Email Verified' : 'Email Not Verified'}</AlertTitle>
                    <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mt-2">
                      <span className="text-sm font-medium opacity-80 leading-relaxed max-w-md">
                        {isEmailVerified ? 'Excellent! Your email address is secure and verified.' : 'Verification is required to unlock premium features and claim your welcome offer.'}
                      </span>
                      {!isEmailVerified && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSendVerificationEmail}
                          className="bg-white/80 backdrop-blur-sm text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white font-bold rounded-xl shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap"
                        >
                          Resend Verification
                        </Button>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>

              <Alert variant={isMobileVerified ? 'default' : 'destructive'}
                className={cn(
                  "relative border transition-all duration-500 rounded-2xl overflow-hidden group",
                  isMobileVerified
                    ? "bg-emerald-50/80 border-emerald-200/50 text-emerald-900 shadow-[0_4px_20px_rgba(16,185,129,0.1)]"
                    : "bg-[#2c1810]/5 border-[#2c1810]/5 text-[#2c1810]/80 shadow-none"
                )}
              >
                {/* Background Glow */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                  isMobileVerified ? "bg-emerald-400/5" : "bg-[#2c1810]/5"
                )}></div>

                <div className="relative z-10 flex">
                  {isMobileVerified ? <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0" /> : <ShieldOff className="h-6 w-6 text-[#2c1810]/40 shrink-0" />}
                  <div className="ml-4 w-full">
                    <AlertTitle className="font-bold text-lg mb-1 leading-none">{isMobileVerified ? 'Mobile Verified' : 'Mobile Not Verified'}</AlertTitle>
                    <AlertDescription className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium opacity-80 leading-relaxed">
                        {isMobileVerified ? 'Your mobile connectivity is fully verified.' : 'Secure mobile verification will be available in the next major update.'}
                      </span>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000">
          <Button
            type="submit"
            className="group relative bg-[#2c1810] hover:bg-[#d97706] text-white px-10 h-14 rounded-2xl font-bold text-lg shadow-xl shadow-[#2c1810]/10 hover:shadow-[#d97706]/30 transition-all duration-500 overflow-hidden"
          >
            {/* Button Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>

            <span className="relative z-10 flex items-center gap-2">
              Update Profile
              <div className="w-1.5 h-1.5 rounded-full bg-[#d97706] group-hover:bg-white transition-colors duration-500"></div>
            </span>
          </Button>
        </div>
      </form>
    </Form>
  );
}
