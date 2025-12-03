'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, DollarSign } from 'lucide-react';
import { Skeleton } from "../ui/skeleton";
import { collection, query } from "firebase/firestore";

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
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const ordersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'orders')) : null, [firestore]);

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  
  // This is not efficient for large scale, but works for this demo.
  // A better approach would be to use a cloud function to aggregate this data.
  const { data: allOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  const totalUsers = users?.length ?? 0;
  const totalOrders = allOrders?.length ?? 0;
  const totalRevenue = allOrders?.reduce((acc, order) => acc + order.totalAmount, 0) ?? 0;

  const isLoading = isUserLoading || usersLoading || ordersLoading;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard title="Total Users" value={totalUsers} icon={Users} isLoading={isLoading} />
      <StatCard title="Total Orders" value={totalOrders} icon={ShoppingCart} isLoading={isLoading} />
      <StatCard title="Total Revenue" value={`Rs. ${totalRevenue.toFixed(2)}`} icon={DollarSign} isLoading={isLoading} />
    </div>
  );
}
