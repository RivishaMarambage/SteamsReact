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
import { Award, BookMarked, LayoutDashboard, ShoppingCart, User as UserIcon, ScanSearch, Users, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Logo } from '../Logo';
import Link from 'next/link';
import { useUser } from '@/firebase';

const customerMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/order', label: 'Order Online', icon: ShoppingCart },
  { href: '/dashboard/profile', label: 'My Profile', icon: UserIcon },
];

const staffMenuItems = [
    { href: '/dashboard/staff/orders', label: 'Manage Orders', icon: ShoppingCart },
];

const adminMenuItems = [
  { href: '/dashboard/admin/menu', label: 'Menu Management', icon: BookMarked },
  { href: '/dashboard/admin/redeem', label: 'Redeem Points', icon: ScanSearch },
  { href: '/dashboard/admin/users', label: 'Manage Users', icon: Users },
  { href: '/dashboard/admin/roles', label: 'Manage Roles', icon: ShieldCheck },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { userDoc } = useUser(); // Use the global user document
  const userRole = userDoc?.role;

  const isActive = (href: string) => {
    // Exact match for the main dashboard page
    if (href === '/dashboard' && pathname === href) {
        return true;
    }
    // Starts-with match for all other dashboard sub-pages
    return href !== '/dashboard' && pathname.startsWith(href);
  };

  let menuItemsToShow = customerMenuItems;
  let sectionTitle = '';
  let sectionItems: typeof adminMenuItems = [];

  if (userRole === 'staff') {
    menuItemsToShow = staffMenuItems;
  }
  
  if (userRole === 'admin') {
    // Admins see their own menu, not the customer or staff menu
    menuItemsToShow = [];
    sectionTitle = 'Admin';
    sectionItems = adminMenuItems;
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo link="/dashboard"/>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
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
          {sectionItems.length > 0 && (
            <>
              <div className="px-2 py-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                {sectionTitle}
              </div>
              {sectionItems.map((item) => (
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
