'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LifeBuoy, LogOut, Settings, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '../Logo';
import { useAuth, useUser } from '@/firebase';

function getPageTitle(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1 && segments[0] === 'dashboard') return 'Dashboard';
  const title = segments[segments.length - 1];
  return title.charAt(0).toUpperCase() + title.slice(1).replace('-', ' ');
}

export default function AppHeader() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();


  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <div className="hidden md:block">
          <Logo link="/dashboard" />
        </div>
        <h1 className="text-xl font-semibold md:hidden">{pageTitle}</h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-sidebar-accent">
              <Avatar className="h-10 w-10">
                {user && <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.displayName || user.email || ''} />}
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.displayName || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                 <p className="text-xs leading-none text-muted-foreground pt-1 font-mono">{user?.uid}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <UserIcon /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="#">
                <Settings /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="#">
                <LifeBuoy /> Support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}