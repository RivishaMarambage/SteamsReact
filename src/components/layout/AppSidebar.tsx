
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { AreaChart, BookMarked, Calendar, LayoutDashboard, ShoppingCart, User as UserIcon, ScanSearch, Users, ShieldCheck, FolderPlus, Tag, Wallet, Blocks, Gift, AppWindow, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '../Logo';
import Link from 'next/link';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';

const customerMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/order', label: 'Menu', icon: BookMarked },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/event', label: 'Event', icon: Calendar },
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
  const router = useRouter();
  const { user: authUser, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();

  const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);
  const userRole = userProfile?.role;
  const isLoading = isUserLoading || isProfileLoading;

  const handleLogout = async () => {
    if(auth) {
      await auth.signOut();
    }
    router.push('/');
  };

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  let menuItemsToShow: (typeof customerMenuItems | typeof staffMenuItems) = [];
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
    <Sidebar collapsible="icon">
      <SidebarRail />
      <SidebarHeader className="bg-sidebar-border rounded-lg m-2 p-2 group-data-[collapsible=icon]:m-0 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:rounded-none">
        <Logo link="/dashboard"/>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <div className="p-2 space-y-2">
            <div className="h-8 w-full bg-sidebar-accent/50 animate-pulse rounded-md" />
            <div className="h-8 w-full bg-sidebar-accent/50 animate-pulse rounded-md" />
            <div className="h-8 w-full bg-sidebar-accent/50 animate-pulse rounded-md" />
          </div>
        ) : (
        <SidebarMenu>
          {userRole === 'customer' && (
            <div className="px-2 py-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                Main
            </div>
          )}
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
                <Link href={item.href} onClick={handleNavigate} className="relative">
                  <item.icon />
                  <span>{item.label}</span>
                  {userRole === 'customer' && isActive(item.href) && <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-sidebar-accent-foreground group-data-[collapsible=icon]:hidden" />}
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
      <SidebarFooter className="border-t border-sidebar-border mt-auto">
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                    <LogOut />
                    <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
