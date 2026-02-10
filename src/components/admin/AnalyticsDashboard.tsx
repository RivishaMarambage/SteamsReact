'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, ShoppingCart, DollarSign, Coins, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { Skeleton } from "../ui/skeleton";
import { collection, query, doc } from "firebase/firestore";
import type { UserProfile, Order } from "@/lib/types";
import { useMemo } from "react";
import { Badge } from "../ui/badge";

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
  const { data: allOrders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

  // --- Calculations ---
  const stats = useMemo(() => {
    if (!allOrders) return { totalRevenue: 0, monthlyRedeemables: 0, itemSales: [] };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let totalRevenue = 0;
    let monthlyRedeemables = 0;
    const salesMap: Record<string, { name: string, count: number }> = {};

    allOrders.forEach(order => {
      // Revenue
      totalRevenue += (order.totalAmount || 0);

      // Monthly points (1:1 conversion as requested)
      const orderDate = order.orderDate?.toDate();
      if (orderDate && orderDate >= startOfMonth) {
        monthlyRedeemables += (order.pointsRedeemed ?? 0);
      }

      // Item Sales counts
      order.orderItems?.forEach(item => {
        const key = item.menuItemId || item.menuItemName;
        if (!salesMap[key]) {
          salesMap[key] = { name: item.menuItemName, count: 0 };
        }
        salesMap[key].count += (item.quantity || 0);
      });
    });

    const itemSales = Object.values(salesMap).sort((a, b) => b.count - a.count);

    return { totalRevenue, monthlyRedeemables, itemSales };
  }, [allOrders]);

  const mostSold = stats.itemSales.slice(0, 5);
  const leastSold = [...stats.itemSales].reverse().slice(0, 5);

  const totalUsers = users?.length ?? 0;
  const totalOrders = allOrders?.length ?? 0;

  const isLoading = isUserLoading || isProfileLoading || usersLoading || ordersLoading;

  return (
    <div className="space-y-8">
      {/* Top Level Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={totalUsers} icon={Users} isLoading={isLoading} />
        <StatCard title="Total Orders" value={totalOrders} icon={ShoppingCart} isLoading={isLoading} />
        <StatCard title="Total Revenue" value={`LKR ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} isLoading={isLoading} />
        <StatCard title="Monthly Redeemables" value={`LKR ${stats.monthlyRedeemables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Coins} isLoading={isLoading} />
      </div>

      {/* Product Performance Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Most Sold */}
        <Card className="shadow-lg border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-green-50/50 rounded-t-xl">
            <div className="space-y-1">
              <CardTitle className="text-xl font-headline flex items-center gap-2 text-green-700">
                <TrendingUp className="h-5 w-5" /> Most Sold Items
              </CardTitle>
              <CardDescription>Top performing products by volume</CardDescription>
            </div>
            <Package className="h-8 w-8 text-green-200" />
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : mostSold.length > 0 ? (
              <div className="space-y-4">
                {mostSold.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-muted hover:border-green-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </div>
                      <span className="font-bold text-sm truncate max-w-[150px]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-primary">{item.count}</span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Units</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No sales data available yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Least Sold */}
        <Card className="shadow-lg border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-red-50/50 rounded-t-xl">
            <div className="space-y-1">
              <CardTitle className="text-xl font-headline flex items-center gap-2 text-red-700">
                <TrendingDown className="h-5 w-5" /> Least Sold Items
              </CardTitle>
              <CardDescription>Items needing more attention</CardDescription>
            </div>
            <Package className="h-8 w-8 text-red-200" />
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : leastSold.length > 0 ? (
              <div className="space-y-4">
                {leastSold.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-muted hover:border-red-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                        {stats.itemSales.length - idx}
                      </div>
                      <span className="font-bold text-sm truncate max-w-[150px]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-primary">{item.count}</span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Units</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No sales data available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
