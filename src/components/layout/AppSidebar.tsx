
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
import { cn } from '@/lib/utils';
import { AreaChart, BookMarked, LayoutDashboard, ShoppingCart, User as UserIcon, ScanSearch, Users, ShieldCheck, FolderPlus, Tag, Wallet, Blocks, Gift, AppWindow } from 'lucide-react';
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
  const { setOpen, setOpenMobile, isMobile } = useSidebar();

  const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);
  const userRole = userProfile?.role;
  const isLoading = isUserLoading || isProfileLoading;

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  };

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
    <Sidebar collapsible="icon" className="border-r-0 bg-[#160C08] text-[#FDFBF7]">
      <SidebarRail className="hover:after:bg-[#d97706]" />
      <SidebarHeader className="bg-[#160C08] py-4">
        <Logo link="/dashboard" className="text-[#FDFBF7]" />
      </SidebarHeader>
      <SidebarContent className="bg-[#160C08] px-2">
        {isLoading ? (
          <div className="p-2 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-full bg-[#d97706]/10 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <SidebarMenu className="gap-2">
            {userRole === 'admin' && (
              <>
                <div className="px-4 py-2 text-xs font-bold text-[#d97706] uppercase tracking-widest group-data-[collapsible=icon]:hidden animate-in fade-in slide-in-from-left-2">
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
                  className={cn(
                    "h-12 w-full justify-start gap-4 rounded-xl px-4 transition-all duration-300 md:w-full group/btn",
                    isActive(item.href)
                      ? "bg-[#d97706] text-white shadow-[0_0_15px_rgba(217,119,6,0.5)] font-bold hover:bg-[#b45309]"
                      : "text-[#FDFBF7]/60 hover:text-white hover:bg-[#d97706]/10 hover:pl-6 focus:bg-[#d97706]/10"
                  )}
                >
                  <Link href={item.href} onClick={handleNavigate} className="flex items-center gap-3">
                    <item.icon className={cn("h-5 w-5 transition-transform duration-300 group-hover/btn:scale-110", isActive(item.href) && "animate-pulse-slow")} />
                    <span className="text-base tracking-wide">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {userRole === 'admin' && (
              <>
                <div className="mt-6 px-4 py-2 text-xs font-bold text-[#d97706] uppercase tracking-widest group-data-[collapsible=icon]:hidden animate-in fade-in slide-in-from-left-2 delay-100">
                  Admin
                </div>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      asChild
                      tooltip={item.label}
                      className={cn(
                        "h-12 w-full justify-start gap-4 rounded-xl px-4 transition-all duration-300 md:w-full group/btn",
                        isActive(item.href)
                          ? "bg-[#d97706] text-white shadow-[0_0_15px_rgba(217,119,6,0.5)] font-bold hover:bg-[#b45309]"
                          : "text-[#FDFBF7]/60 hover:text-white hover:bg-[#d97706]/10 hover:pl-6 focus:bg-[#d97706]/10"
                      )}
                    >
                      <Link href={item.href} onClick={handleNavigate} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 transition-transform duration-300 group-hover/btn:scale-110" />
                        <span className="text-base tracking-wide">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </>
            )}
          </SidebarMenu>
        )}
      </SidebarContent>
      <SidebarFooter className="bg-[#160C08] p-4">
        {userProfile && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#d97706]/5 border border-[#d97706]/10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
            <div className="h-10 w-10 rounded-full bg-[#d97706] flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
              {userProfile.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden transition-all duration-300">
              <span className="text-sm font-bold text-white truncate">{userProfile.name}</span>
              <span className="text-xs text-[#d97706] truncate capitalize">{userProfile.role}</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}