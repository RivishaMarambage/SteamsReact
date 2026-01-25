
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                    <Input placeholder="Your full name" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            {userProfile.role === 'customer' && (
              <>
                <FormField
                control={form.control}
                name="cafeNickname"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cafe Nickname</FormLabel>
                    <FormControl>
                        <Input placeholder="Your cafe nickname" {...field} />
                    </FormControl>
                    <FormDescription>This is how we'll call out your order.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                          <Input placeholder="Your email address" {...field} readOnly disabled />
                      </FormControl>
                      <FormDescription>Used for login and receipts. Cannot be changed.</FormDescription>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                 <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                            <Input placeholder="Your mobile number" {...field} readOnly disabled />
                        </FormControl>
                        <FormDescription>Your mobile number cannot be changed.</FormDescription>
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
                                disabled={!!userProfile.dateOfBirth} // Disable if dateOfBirth already exists
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
                         <FormDescription>
                           {userProfile.dateOfBirth
                            ? "Your date of birth cannot be changed."
                            : "Your date of birth is used to send you birthday wishes."
                           }
                         </FormDescription>
                        <FormMessage />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input placeholder="Your email address" {...field} readOnly disabled />
                    </FormControl>
                     <FormDescription>Used for login. Cannot be changed.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}
        </div>

        {userProfile.role === 'customer' && (
          <Card>
            <CardHeader>
              <CardTitle>Account Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant={isEmailVerified ? 'default' : 'destructive'} className={cn(isEmailVerified && "bg-green-50 border-green-200")}>
                {isEmailVerified ? <MailCheck className="h-4 w-4 text-green-600" /> : <MailWarning className="h-4 w-4" />}
                <AlertTitle className={cn(isEmailVerified && "text-green-800")}>{isEmailVerified ? 'Email Verified' : 'Email Not Verified'}</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span className={cn(isEmailVerified && "text-green-700")}>
                    {isEmailVerified ? 'Your email is verified.' : 'Verify your email to unlock all features, including the welcome offer.'}
                  </span>
                  {!isEmailVerified && (
                    <Button type="button" size="sm" onClick={handleSendVerificationEmail}>
                      Resend Verification
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
              <Alert variant={isMobileVerified ? 'default' : 'destructive'} className={cn(isMobileVerified && "bg-green-50 border-green-200")}>
                 {isMobileVerified ? <ShieldCheck className="h-4 w-4 text-green-600" /> : <ShieldOff className="h-4 w-4" />}
                <AlertTitle className={cn(isMobileVerified && "text-green-800")}>{isMobileVerified ? 'Mobile Verified' : 'Mobile Not Verified'}</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                   <span className={cn(isMobileVerified && "text-green-700")}>
                     {isMobileVerified ? 'Your mobile number is verified.' : 'Mobile verification is coming soon.'}
                   </span>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        <Button type="submit">Update Profile</Button>
      </form>
    </Form>
  );
}
