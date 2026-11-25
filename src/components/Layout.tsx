import { useLocation, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

/**
 * Shared shell for protected routes. Supports two modes:
 *  1. **Layout route mode** (RR `<Route element={<Layout/>}>`): nested routes
 *     render through `<Outlet />`. Sidebar shows for normal app pages.
 *  2. **Direct children mode** (legacy): pass `children` and they render
 *     in place of the Outlet. The `noLayoutPages` filter still applies.
 *
 * Routes that should NOT show the sidebar (`/`, `/auth`, `/onboarding`)
 * render bare, with just a page-transition wrapper.
 */
interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const noLayoutPages = ["/", "/auth", "/onboarding"];
  const shouldShowLayout = !noLayoutPages.includes(location.pathname);

  if (!shouldShowLayout) {
    return <div className="page-transition">{children ?? <Outlet />}</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full min-w-0 overflow-x-hidden bg-gradient-hero">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="h-14 flex items-center border-b border-border/50 bg-card/40 backdrop-blur-lg px-6 shadow-soft">
            <SidebarTrigger className="hover:bg-muted/50 rounded-lg transition-all" />
          </header>
          <main className="min-w-0 flex-1 overflow-auto page-transition">
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};