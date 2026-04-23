'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Shield,
  Search,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { DashboardHeader } from './components/DashboardHeader';
import { SidebarIncidencesNav } from './components/SidebarIncidencesNav';
import { Logo } from '@/components/ui/Logo';
import { IncidenceDetailProvider, useIncidenceDetailContext } from '@/features/incidences/context/IncidenceDetailContext';
import { IncidenceDetailModal } from '@/features/incidences/components/IncidenceDetailModal';

const userNavItems = [
  { label: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Incidencias', href: '/dashboard/incidences/new', icon: FileText },
];

const adminStaticItems = [
  { label: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Buscador Incidencias', href: '/dashboard/incidences/directory', icon: Search },
  { label: 'Gestor Propiedades', href: '/dashboard/admin', icon: Shield },
];

const adminMobileItems = [
  { label: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Incidencias', href: '/dashboard/incidences', icon: FileText },
  { label: 'Buscador', href: '/dashboard/incidences/directory', icon: Search },
  { label: 'Gestor Propiedades', href: '/dashboard/admin', icon: Shield },
];

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isAdmin = user?.role === 'admin';
  const desktopNavItems = React.useMemo(
    () => (isAdmin ? adminStaticItems : userNavItems),
    [isAdmin]
  );
  const mobileNavItems = React.useMemo(
    () => (isAdmin ? adminMobileItems : userNavItems),
    [isAdmin]
  );

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }
    if (!loading && pathname.startsWith('/dashboard/admin') && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [loading, user, isAdmin, pathname, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50 md:flex-row">
      {/* Desktop Sidebar */}
      {isDesktop && (
        <aside className="sticky top-0 flex h-full w-64 flex-col border-r border-gray-200 bg-white">
          <div className="px-6 py-6">
            <Logo size="md" />
            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
              Admin de propiedad
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4">
            {desktopNavItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand/10 text-charcoal'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  ].join(' ')}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && <SidebarIncidencesNav />}
          </nav>

          <div className="border-t border-gray-100 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Header */}
      {!isDesktop && (
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <Logo size="sm" />
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Alternar menú"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>
      )}

      {/* Mobile Menu Overlay */}
      {!isDesktop && mobileMenuOpen && (
        <div className="fixed inset-0 z-20 bg-white pt-14">
          <nav className="space-y-1 px-4 py-4">
            {mobileNavItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={[
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium',
                    active
                      ? 'bg-brand/10 text-charcoal'
                      : 'text-gray-600 hover:bg-gray-50',
                  ].join(' ')}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && <SidebarIncidencesNav />}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-gray-600 hover:bg-gray-50"
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden pb-20 md:pb-0">
        <div className="shrink-0 border-b border-gray-200 bg-white p-4 md:p-6">
          <DashboardHeader />
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
      <GlobalDetailModal />

      {/* Mobile Bottom Navigation */}
      {!isDesktop && (
        <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-around">
            {mobileNavItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'flex flex-1 flex-col items-center justify-center py-2.5 text-xs font-medium',
                    active ? 'text-charcoal' : 'text-gray-500',
                  ].join(' ')}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="mt-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function GlobalDetailModal() {
  const { incidenceId, closeDetail } = useIncidenceDetailContext();
  if (!incidenceId) return null;
  return (
    <div className="relative z-50">
      <IncidenceDetailModal key={incidenceId} incidenceId={incidenceId} onClose={closeDetail} />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IncidenceDetailProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </IncidenceDetailProvider>
  );
}
