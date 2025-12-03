"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { useFirestore } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  cafeNickname: z.string().optional(),
  email: z.string().email(),
  mobileNumber: z.string().min(10, { message: "Please enter a valid mobile number." }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm({ userProfile }: { userProfile: UserProfile }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userProfile.name,
      cafeNickname: userProfile.cafeNickname || '',
      email: userProfile.email,
      mobileNumber: userProfile.mobileNumber || '',
    },
    mode: "onChange",
  });

  async function onSubmit(data: ProfileFormValues) {
    const userRef = doc(firestore, "users", userProfile.id);
    await setDoc(userRef, data, { merge: true });
    
    toast({
      title: "Profile Updated",
      description: "Your information has been saved successfully.",
    });
  }

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
                          <Input placeholder="Your mobile number" {...field} />
                      </FormControl>
                      <FormDescription>Used for order notifications.</FormDescription>
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
        <Button type="submit">Update Profile</Button>
      </form>
    </Form>
  );
}
