'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, ShoppingCart, DollarSign, Coins, TrendingUp, TrendingDown, Package, Download, Calendar as CalendarIcon, FileBarChart } from 'lucide-react';
import { Skeleton } from "../ui/skeleton";
import { collection, query, doc } from "firebase/firestore";
import type { UserProfile, Order } from "@/lib/types";
import { useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

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

  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

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

  const customerNames = useMemo(() => {
    if (!users) return {};
    return users.reduce((acc, user) => {
        acc[user.id] = user.name;
        return acc;
    }, {} as Record<string, string>);
  }, [users]);

  // --- Calculations ---
  const stats = useMemo(() => {
    if (!allOrders) return { totalRevenue: 0, monthlyRedeemables: 0, itemSales: [] };

    const now = new Date();
    const startOfMonthDate = startOfMonth(now);
    
    let totalRevenue = 0;
    let monthlyRedeemables = 0;
    const salesMap: Record<string, { name: string, count: number }> = {};

    allOrders.forEach(order => {
      // Revenue
      totalRevenue += (order.totalAmount || 0);

      // Monthly points
      const orderDate = order.orderDate?.toDate();
      if (orderDate && orderDate >= startOfMonthDate) {
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

  const handleExportCSV = () => {
    if (!allOrders || !date?.from || !date?.to) return;

    const filteredOrders = allOrders.filter(order => {
        const orderDate = order.orderDate?.toDate();
        if (!orderDate) return false;
        return isWithinInterval(orderDate, { start: date.from!, end: date.to! });
    }).sort((a, b) => b.orderDate.toMillis() - a.orderDate.toMillis());

    if (filteredOrders.length === 0) {
        alert("No orders found for the selected date range.");
        return;
    }

    const headers = ["Order ID", "Date", "Customer", "Type", "Payment", "Items", "Total (LKR)", "Points Redeemed", "Points Earned"];
    const rows = filteredOrders.map(order => [
        order.id.substring(0, 7).toUpperCase(),
        order.orderDate ? format(order.orderDate.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A',
        customerNames[order.customerId] || 'Guest',
        order.orderType,
        order.paymentMethod || 'Online',
        order.orderItems.map(item => `${item.quantity}x ${item.menuItemName}`).join('; '),
        order.totalAmount.toFixed(2),
        order.pointsRedeemed || 0,
        order.pointsToEarn || 0
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Steamsbury_Report_${format(date.from!, 'yyyy-MM-dd')}_to_${format(date.to!, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const setRange = (type: 'week' | 'month') => {
    const now = new Date();
    if (type === 'week') {
        setDate({ from: startOfWeek(now), to: endOfWeek(now) });
    } else {
        setDate({ from: startOfMonth(now), to: endOfMonth(now) });
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Level Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={totalUsers} icon={Users} isLoading={isLoading} />
        <StatCard title="Total Orders" value={totalOrders} icon={ShoppingCart} isLoading={isLoading} />
        <StatCard title="Total Revenue" value={`LKR ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} isLoading={isLoading} />
        <StatCard title="Monthly Redeemables" value={`LKR ${stats.monthlyRedeemables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Coins} isLoading={isLoading} />
      </div>

      {/* Reports & Export */}
      <Card className="shadow-lg border-none bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
                <CardTitle className="text-xl font-headline flex items-center gap-2 text-primary">
                    <FileBarChart className="h-5 w-5" /> Sales Reports
                </CardTitle>
                <CardDescription>Generate and download CSV reports for your accounting.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-muted rounded-lg p-1 mr-2">
                    <Button variant="ghost" size="sm" onClick={() => setRange('week')} className="h-8 text-xs font-bold px-3">Weekly</Button>
                    <Button variant="ghost" size="sm" onClick={() => setRange('month')} className="h-8 text-xs font-bold px-3">Monthly</Button>
                </div>
                <div className={cn("grid gap-2")}>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-[300px] justify-start text-left font-normal bg-background",
                            !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                            date.to ? (
                                <>
                                {format(date.from, "LLL dd, y")} -{" "}
                                {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Pick a range</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                <Button onClick={handleExportCSV} disabled={isLoading || !allOrders} className="bg-primary hover:bg-primary/90 text-white font-bold h-10 px-6 rounded-xl">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>
        </CardHeader>
      </Card>

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