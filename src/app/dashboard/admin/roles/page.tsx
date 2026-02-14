
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, Coffee, UserCog, ArrowRight, ShieldAlert, BadgeCheck } from "lucide-react";
import Link from "next/link";

export default function AdminRolesPage() {
  const roles = [
    {
      title: "Customer",
      icon: Coffee,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      description: "Default role for all registered users.",
      permissions: [
        "Place orders and track status",
        "Earn and redeem loyalty points",
        "Access Game Zone rewards",
        "Manage personal profile",
        "View active offers"
      ]
    },
    {
      title: "Staff",
      icon: BadgeCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "For cafe employees and baristas.",
      permissions: [
        "Manage incoming customer orders",
        "Update order status (Processing, Ready, etc.)",
        "Redeem customer points at the counter",
        "View menu items and categories",
        "Access staff-specific tools"
      ]
    },
    {
      title: "Admin",
      icon: ShieldAlert,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Full control over the system.",
      permissions: [
        "View sales analytics and reports",
        "Manage menu items and categories",
        "Configure daily and birthday offers",
        "Assign and manage user roles",
        "Perform database maintenance"
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold font-headline uppercase tracking-tight">Role Management</h1>
        <p className="text-muted-foreground">Understand and manage system permissions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.title} className="border-none shadow-lg overflow-hidden">
            <CardHeader className={role.bgColor}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white shadow-sm ${role.color}`}>
                  <role.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="font-headline text-xl">{role.title}</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase opacity-70">Permission Group</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{role.description}"
              </p>
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Capabilities:</p>
                <ul className="space-y-2">
                  {role.permissions.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-medium">
                      <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${role.color.replace('text', 'bg')}`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-2 border-primary/20 bg-primary/5 shadow-xl rounded-[2rem]">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <UserCog className="text-primary" /> How to Assign Roles
          </CardTitle>
          <CardDescription>Follow these steps to change a user's permissions.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-black shrink-0">1</div>
              <div>
                <p className="font-bold">Visit User Management</p>
                <p className="text-sm text-muted-foreground">Go to the "Manage Users" page to see a full list of registered members.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-black shrink-0">2</div>
              <div>
                <p className="font-bold">Locate the User</p>
                <p className="text-sm text-muted-foreground">Use the search bar to find the specific individual by their name or email address.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-black shrink-0">3</div>
              <div>
                <p className="font-bold">Edit via Actions</p>
                <p className="text-sm text-muted-foreground">Click the three-dot "Actions" menu on the right side of the user's row and select "Edit Role".</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center p-8 bg-white rounded-3xl border shadow-inner text-center space-y-4">
            <Users className="h-16 w-16 text-primary opacity-20" />
            <div className="space-y-2">
              <h3 className="font-headline text-xl">Ready to manage users?</h3>
              <p className="text-sm text-muted-foreground">Head over to the user dashboard to start assigning roles.</p>
            </div>
            <Button asChild size="lg" className="rounded-full px-8 shadow-lg hover:scale-105 transition-transform">
              <Link href="/dashboard/admin/users">
                Go to User Management <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
