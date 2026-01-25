import AppHeader from '@/components/layout/AppHeader';
import AppSidebar from '@/components/layout/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AuthRedirect } from '@/components/auth/AuthRedirect';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthRedirect>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-transparent">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthRedirect>
  );
}
