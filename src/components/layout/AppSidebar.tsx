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
import { AreaChart, BookMarked, LayoutDashboard, ShoppingCart, User as UserIcon, ScanSearch, Users, ShieldCheck, FolderPlus, Tag, Wallet, Blocks, Gift, AppWindow, LogOut, Dices, Settings, LifeBuoy } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '../Logo';
import Link from 'next/link';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';

const customerPrimaryItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/order', label: 'Order', icon: ShoppingCart },
  { href: '/dashboard/game-zone', label: 'Game Zone', icon: Dices },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/profile', label: 'My Profile', icon: UserIcon },
];

const customerSupportItems = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
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
  const auth = useAuth();
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();

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
    await auth.signOut();
    router.replace('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-[#160C08] text-[#FDFBF7] shadow-2xl">
      <SidebarRail className="hover:after:bg-[#d97706]" />
      <SidebarHeader className="bg-[#160C08] py-8 px-6">
        <Logo link="/dashboard" className="text-[#FDFBF7] transition-transform duration-500 hover:scale-105" />
      </SidebarHeader>
      <SidebarContent className="bg-[#160C08] px-3">
        {isLoading ? (
          <div className="p-2 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-full bg-[#d97706]/5 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <SidebarMenu className="gap-2">
            {/* STAFF & ADMIN PRIMARY SECTION */}
            {(userRole === 'staff' || userRole === 'admin') && (
              <>
                {userRole === 'admin' && (
                  <div className="px-4 py-3 text-[10px] font-black text-[#d97706] uppercase tracking-[0.2em] group-data-[collapsible=icon]:hidden animate-in fade-in slide-in-from-left-4 duration-700">
                    Staff Operations
                  </div>
                )}
                {staffMenuItems.map((item, index) => (
                  <SidebarMenuItem key={item.href} className="animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      asChild
                      tooltip={item.label}
                      className={cn(
                        "h-14 w-full justify-start gap-4 rounded-xl px-4 transition-all duration-300 group/btn",
                        isActive(item.href)
                          ? "bg-[#d97706] text-white shadow-[0_10px_20px_rgba(217,119,6,0.3)] font-bold hover:bg-[#b45309] hover:text-white"
                          : "text-[#FDFBF7]/50 hover:text-white hover:bg-[#d97706]/10 hover:pl-6 focus:bg-[#d97706]/10"
                      )}
                    >
                      <Link href={item.href} onClick={handleNavigate} className="flex items-center gap-3">
                        <item.icon className={cn("h-5 w-5 transition-transform duration-500 group-hover/btn:scale-125 group-hover/btn:rotate-6", isActive(item.href) && "animate-pulse")} />
                        <span className="text-base tracking-wide">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </>
            )}

            {/* ADMIN SPECIFIC SECTION */}
            {userRole === 'admin' && (
              <>
                <div className="mt-8 px-4 py-3 text-[10px] font-black text-[#d97706] uppercase tracking-[0.2em] group-data-[collapsible=icon]:hidden animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
                  Administrative
                </div>
                {adminMenuItems.map((item, index) => (
                  <SidebarMenuItem key={item.href} className="animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${(index + staffMenuItems.length) * 50}ms` }}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      asChild
                      tooltip={item.label}
                      className={cn(
                        "h-14 w-full justify-start gap-4 rounded-xl px-4 transition-all duration-300 group/btn",
                        isActive(item.href)
                          ? "bg-[#d97706] text-white shadow-[0_10px_20px_rgba(217,119,6,0.3)] font-bold hover:bg-[#b45309] hover:text-white"
                          : "text-[#FDFBF7]/50 hover:text-white hover:bg-[#d97706]/10 hover:pl-6 focus:bg-[#d97706]/10"
                      )}
                    >
                      <Link href={item.href} onClick={handleNavigate} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 transition-transform duration-500 group-hover/btn:scale-125 group-hover/btn:-rotate-6" />
                        <span className="text-base tracking-wide">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </>
            )}

            {/* CUSTOMER SECTION */}
            {userRole === 'customer' && (
              <>
                {customerPrimaryItems.map((item, index) => (
                  <SidebarMenuItem key={item.href} className="animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      asChild
                      tooltip={item.label}
                      className={cn(
                        "h-14 w-full justify-start gap-4 rounded-xl px-4 transition-all duration-300 group/btn",
                        isActive(item.href)
                          ? "bg-[#d97706] text-white shadow-[0_10px_20px_rgba(217,119,6,0.3)] font-bold hover:bg-[#b45309] hover:text-white"
                          : "text-[#FDFBF7]/50 hover:text-white hover:bg-[#d97706]/10 hover:pl-6 focus:bg-[#d97706]/10"
                      )}
                    >
                      <Link href={item.href} onClick={handleNavigate} className="flex items-center gap-3">
                        <item.icon className={cn("h-5 w-5 transition-transform duration-500 group-hover/btn:scale-125 group-hover/btn:rotate-6", isActive(item.href) && "animate-pulse")} />
                        <span className="text-base tracking-wide">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                <div className="mt-8 px-4 py-3 text-[10px] font-black text-[#d97706] uppercase tracking-[0.2em] group-data-[collapsible=icon]:hidden animate-in fade-in slide-in-from-left-4 duration-700">
                  Settings & Help
                </div>

                {customerSupportItems.map((item, index) => (
                  <SidebarMenuItem key={item.href} className="animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${(index + customerPrimaryItems.length) * 50}ms` }}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      asChild
                      tooltip={item.label}
                      className={cn(
                        "h-14 w-full justify-start gap-4 rounded-xl px-4 transition-all duration-300 group/btn",
                        isActive(item.href)
                          ? "bg-[#d97706] text-white shadow-[0_10px_20px_rgba(217,119,6,0.3)] font-bold hover:bg-[#b45309] hover:text-white"
                          : "text-[#FDFBF7]/50 hover:text-white hover:bg-[#d97706]/10 hover:pl-6 focus:bg-[#d97706]/10"
                      )}
                    >
                      <Link href={item.href} onClick={handleNavigate} className="flex items-center gap-3">
                        <item.icon className={cn("h-5 w-5 transition-transform duration-500 group-hover/btn:scale-125 group-hover/btn:rotate-6", isActive(item.href) && "animate-pulse")} />
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
      <SidebarFooter className="bg-[#160C08] p-4 space-y-2">
        {userProfile && (
          <>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 transition-all duration-300 hover:bg-white/10">
              <div className="h-10 w-10 rounded-full bg-[#d97706] flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0 border-2 border-white/10">
                {userProfile.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-bold text-white truncate">{userProfile.name}</span>
                <span className="text-[10px] font-black text-[#d97706] truncate uppercase tracking-widest">{userProfile.role}</span>
              </div>
            </div>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="h-12 w-full justify-start gap-4 rounded-xl px-4 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300 group/logout"
              tooltip="Log Out"
            >
              <LogOut className="h-5 w-5 transition-transform group-hover/logout:-translate-x-1" />
              <span className="font-bold group-data-[collapsible=icon]:hidden">Sign Out</span>
            </SidebarMenuButton>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
