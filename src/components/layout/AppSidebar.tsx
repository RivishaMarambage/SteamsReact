'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { AreaChart, BookMarked, LayoutDashboard, ShoppingCart, User as UserIcon, ScanSearch, Users, ShieldCheck, FolderPlus, Wallet, AppWindow, Blocks, Gift, Settings, LifeBuoy, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '../Logo';
import Link from 'next/link';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';

const customerMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/order', label: 'Order Now', icon: ShoppingCart },
  { href: '/dashboard/wallet', label: 'My Wallet', icon: Wallet },
  { href: '/dashboard/profile', label: 'My Profile', icon: UserIcon },
  { href: '#', label: 'Settings', icon: Settings },
  { href: '#', label: 'Support', icon: LifeBuoy },
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
  const auth = useAuth();
  const router = useRouter();
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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Using router.replace ensures the dashboard isn't in history
      router.replace('/');
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback redirect
      window.location.href = '/';
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
    <Sidebar collapsible="icon" className="border-r-0 shadow-2xl">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-6">
          <Logo link="/dashboard" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded-full" />
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded-full" />
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded-full" />
          </div>
        ) : (
          <SidebarMenu className="px-2">
            {userRole === 'admin' && (
              <div className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-50">
                Staff View
              </div>
            )}

            {menuItemsToShow.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  isActive={isActive(item.href)}
                  asChild
                  tooltip={item.label}
                  className="font-bold py-6 px-4 rounded-xl"
                >
                  <Link href={item.href} onClick={handleNavigate}>
                    <item.icon className="size-5" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            
            {userRole === 'admin' && (
              <>
                <div className="mt-8 px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-50">
                  Admin Control
                </div>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      asChild
                      tooltip={item.label}
                      className="font-bold py-6 px-4 rounded-xl"
                    >
                      <Link href={item.href} onClick={handleNavigate}>
                        <item.icon className="size-5" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </>
            )}
          </SidebarMenu>
        )}
      </SidebarContent>
      
      {!isLoading && userProfile && (
        <SidebarFooter className="p-4">
          <Separator className="mb-4 opacity-10" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={`https://avatar.vercel.sh/${userProfile.email}.png`} />
                <AvatarFallback>{userProfile.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-black truncate">{userProfile.name}</span>
                <span className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-widest">{userProfile.role}</span>
              </div>
            </div>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 font-black rounded-xl py-6 px-4"
              tooltip="Log Out"
            >
              <LogOut className="size-5" />
              <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
            </SidebarMenuButton>
          </div>
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
