import AppSidebar from '@/components/layout/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AuthRedirect } from '@/components/auth/AuthRedirect';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthRedirect>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Mobile-only minimal header for the sidebar trigger since the main header is removed */}
          <div className="flex h-14 items-center px-4 md:hidden border-b border-sidebar-border bg-[#160C08] text-white sticky top-0 z-20">
            <SidebarTrigger />
          </div>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-transparent">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthRedirect>
  );
}
