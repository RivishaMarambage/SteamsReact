'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { AreaChart, BookMarked, LayoutDashboard, ShoppingCart, User as UserIcon, ScanSearch, Users, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Logo } from '../Logo';
import Link from 'next/link';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

const customerMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/order', label: 'Order Online', icon: ShoppingCart },
  { href: '/dashboard/profile', label: 'My Profile', icon: UserIcon },
];

const staffMenuItems = [
    { href: '/dashboard/staff/orders', label: 'Manage Orders', icon: ShoppingCart },
    { href: '/dashboard/staff/redeem', label: 'Redeem Points', icon: ScanSearch },
];

const adminMenuItems = [
  { href: '/dashboard/admin/analytics', label: 'Analytics', icon: AreaChart },
  { href: '/dashboard/admin/menu', label: 'Menu Management', icon: BookMarked },
  { href: '/dashboard/admin/users', label: 'Manage Users', icon: Users },
  { href: '/dashboard/admin/roles', label: 'Manage Roles', icon: ShieldCheck },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const userDocRef = authUser ? doc(firestore, 'users', authUser.uid) : null;
  const { data: userProfile } = useDoc(userDocRef);
  const userRole = userProfile?.role;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  let menuItemsToShow: typeof customerMenuItems = [];
  const adminSectionItems: typeof adminMenuItems = [];

  if (userRole === 'customer') {
    menuItemsToShow = customerMenuItems;
  } else if (userRole === 'staff') {
    menuItemsToShow = staffMenuItems;
  } else if (userRole === 'admin') {
    // Admin sees all staff items plus their own admin items.
    menuItemsToShow = staffMenuItems;
    adminSectionItems.push(...adminMenuItems);
  }


  return (
    <Sidebar>
      <SidebarHeader>
        <Logo link="/dashboard"/>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {userRole === 'admin' && (
            <>
                <div className="px-2 py-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                    Staff View
                </div>
            </>
          )}

          {menuItemsToShow.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={isActive(item.href)}
                asChild
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {userRole === 'admin' && (
            <>
              <div className="px-2 py-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                Admin
              </div>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    asChild
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {/* Can add elements to footer here */}
      </SidebarFooter>
    </Sidebar>
  );
}
