'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Eye, Lock, Trash2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleRequestDeletion = () => {
    setIsDeleting(true);
    // Simulate API call
    setTimeout(() => {
      setIsDeleting(false);
      toast({
        title: "Deletion Request Sent",
        description: "Your request has been received. Our team will contact you within 48 hours to confirm the process.",
      });
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold font-headline uppercase tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and app experience.</p>
      </div>

      <div className="grid gap-6">
        {/* Notifications Section */}
        <Card className="rounded-[2rem] shadow-md border-0 bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="text-primary h-5 w-5" />
              <CardTitle className="text-xl font-headline">Notifications</CardTitle>
            </div>
            <CardDescription>Control how we contact you about your orders and rewards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive receipts and point updates via email.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Get instant alerts when your order is ready.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">SMS Alerts</Label>
                <p className="text-sm text-muted-foreground">Receive important alerts on your mobile device.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Display & Language */}
        <Card className="rounded-[2rem] shadow-md border-0 bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="text-primary h-5 w-5" />
              <CardTitle className="text-xl font-headline">Display & Language</CardTitle>
            </div>
            <CardDescription>Personalize your interface.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold">App Theme</Label>
                <Select defaultValue="system">
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                    <SelectItem value="system">System Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="si">Sinhala (coming soon)</SelectItem>
                    <SelectItem value="ta">Tamil (coming soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card className="rounded-[2rem] shadow-md border-0 bg-white overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="text-primary h-5 w-5" />
              <CardTitle className="text-xl font-headline">Security & Privacy</CardTitle>
            </div>
            <CardDescription>Keep your data safe and protected.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-muted">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-green-600 h-5 w-5" />
                <div>
                  <p className="font-bold">Account Verification</p>
                  <p className="text-xs text-muted-foreground">Your account is fully verified and secure.</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">Secure</Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" className="rounded-full h-12 flex-1 font-bold">
                Change Password
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="rounded-full h-12 flex-1 font-bold text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2.5rem]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-headline text-2xl">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will send a formal request to delete your Steamsbury account. You will lose all your accumulated Steam Points, loyalty tier benefits, and order history. This process is irreversible once finalized.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full h-12 font-bold px-6">Keep My Account</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleRequestDeletion}
                      className="rounded-full h-12 font-bold px-6 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Processing..." : "Yes, Request Deletion"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} className="rounded-full px-10 h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl">
            Save All Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
