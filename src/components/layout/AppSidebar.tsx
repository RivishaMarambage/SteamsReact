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
import { MOCK_USER } from '@/lib/data';
import { Award, BookMarked, LayoutDashboard, ShoppingCart, User, ScanSearch } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Logo } from '../Logo';
import Link from 'next/link';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/order', label: 'Order Online', icon: ShoppingCart },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
];

const adminMenuItems = [
  { href: '/dashboard/admin/menu', label: 'Menu Management', icon: BookMarked },
  { href: '/dashboard/admin/redeem', label: 'Redeem Points', icon: ScanSearch },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const user = MOCK_USER;

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo link="/dashboard"/>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
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
          {user.role === 'admin' && (
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
