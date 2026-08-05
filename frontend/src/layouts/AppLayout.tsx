import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { SidebarContent } from '@/components/layout/SidebarContent';
import { Navbar } from '@/components/layout/Navbar';

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar fixe — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card lg:block">
        <SidebarContent />
      </aside>

      {/* Sidebar — tiroir mobile */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="lg:hidden">
          <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
          <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <Navbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="container py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
