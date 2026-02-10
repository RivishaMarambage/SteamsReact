
'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, DollarSign, Coins } from 'lucide-react';
import { Skeleton } from "../ui/skeleton";
import { collection, query, doc } from "firebase/firestore";
import type { UserProfile, Order } from "@/lib/types";

function StatCard({ title, value, icon: Icon, isLoading }: { title: string, value: string | number, icon: React.ComponentType<{className?: string}>, isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/2" />
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsDashboard() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || userProfile?.role !== 'admin') return null;
    return query(collection(firestore, 'users'));
  }, [firestore, userProfile]);
  
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || userProfile?.role !== 'admin') return null;
    return query(collection(firestore, 'orders'));
  }, [firestore, userProfile]);

  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
  
  // This is not efficient for large scale, but works for this demo.
  // A better approach would be to use a cloud function to aggregate this data.
  const { data: allOrders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

  const totalUsers = users?.length ?? 0;
  const totalOrders = allOrders?.length ?? 0;
  const totalRevenue = allOrders?.reduce((acc, order) => acc + (order.totalAmount || 0), 0) ?? 0;

  // Monthly Redeemables Calculation (Points redeemed this month)
  // 1 point = 1 Rupee (LKR)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyRedeemablesPoints = allOrders?.reduce((acc, order) => {
    const orderDate = order.orderDate?.toDate();
    if (orderDate && orderDate >= startOfMonth) {
      return acc + (order.pointsRedeemed ?? 0);
    }
    return acc;
  }, 0) ?? 0;

  const monthlyRedeemablesValue = monthlyRedeemablesPoints; // 1:1 conversion

  const isLoading = isUserLoading || isProfileLoading || usersLoading || ordersLoading;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total Users" value={totalUsers} icon={Users} isLoading={isLoading} />
      <StatCard title="Total Orders" value={totalOrders} icon={ShoppingCart} isLoading={isLoading} />
      <StatCard title="Total Revenue" value={`LKR ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} isLoading={isLoading} />
      <StatCard title="Monthly Redeemables" value={`LKR ${monthlyRedeemablesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Coins} isLoading={isLoading} />
    </div>
  );
}
