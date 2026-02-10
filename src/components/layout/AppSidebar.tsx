'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { AreaChart, BookMarked, LayoutDashboard, ShoppingCart, User as UserIcon, ScanSearch, Users, ShieldCheck, FolderPlus, Wallet, AppWindow, Blocks, Gift } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Logo } from '../Logo';
import Link from 'next/link';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const customerMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/order', label: 'Order', icon: ShoppingCart },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/profile', label: 'My Profile', icon: UserIcon },
];

const staffMenuItems = [
  { href: '/dashboard/staff/orders', label: 'Manage Orders', icon: ShoppingCart },
  { href: '/dashboard/staff/redeem', label: 'Redeem Points', icon: ScanSearch },
  { href: '/dashboard/admin/categories', label: 'Menu Categories', icon: FolderPlus },
  { href: '/dashboard/admin/menu', label: 'Menu Management', icon: BookMarked },
];

const adminMenuItems = [
  { href: '/dashboard/admin/analytics', label: 'Analytics', icon: AreaChart },
  { href: '/dashboard/admin/offers', label: 'Offers', icon: Gift },
  { href: '/dashboard/admin/addon-categories', label: 'Add-on Categories', icon: AppWindow },
  { href: '/dashboard/admin/addons', label: 'Add-ons', icon: Blocks },
  { href: '/dashboard/admin/users', label: 'Manage Users', icon: Users },
  { href: '/dashboard/admin/roles', label: 'Manage Roles', icon: ShieldCheck },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { setOpenMobile, isMobile } = useSidebar();

  const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<any>(userDocRef);
  const userRole = userProfile?.role;
  const isLoading = isUserLoading || isProfileLoading;

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  let menuItemsToShow: any[] = [];

  if (userRole === 'customer') {
    menuItemsToShow = customerMenuItems;
  } else if (userRole === 'staff') {
    menuItemsToShow = staffMenuItems;
  } else if (userRole === 'admin') {
    menuItemsToShow = staffMenuItems;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <Logo link="/dashboard" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <SidebarMenu>
            {userRole === 'admin' && (
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Staff View
              </div>
            )}

            {menuItemsToShow.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  isActive={isActive(item.href)}
                  asChild
                  tooltip={item.label}
                >
                  <Link href={item.href} onClick={handleNavigate}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            
            {userRole === 'admin' && (
              <>
                <div className="mt-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin Control
                </div>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      asChild
                      tooltip={item.label}
                    >
                      <Link href={item.href} onClick={handleNavigate}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </>
            )}
          </SidebarMenu>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}