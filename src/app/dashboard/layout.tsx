import AppSidebar from '@/components/layout/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AuthRedirect } from '@/components/auth/AuthRedirect';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthRedirect>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="overflow-hidden">
          {/* Mobile-only header for sidebar trigger */}
          <div className="flex h-14 items-center px-4 md:hidden border-b border-sidebar-border bg-[#160C08] text-white sticky top-0 z-20 shrink-0">
            <SidebarTrigger />
          </div>
          <div className="flex-1 overflow-y-auto w-full">
            <main className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthRedirect>
  );
}
