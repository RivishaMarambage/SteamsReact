import AppSidebar from '@/components/layout/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AuthRedirect } from '@/components/auth/AuthRedirect';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthRedirect>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Mobile Only Floating Trigger */}
          <div className="flex items-center gap-2 p-4 md:hidden border-b bg-background sticky top-0 z-50">
            <SidebarTrigger />
            <span className="font-headline font-black text-lg tracking-tighter uppercase text-[#2c1810]">Dashboard</span>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 overflow-x-hidden">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthRedirect>
  );
}