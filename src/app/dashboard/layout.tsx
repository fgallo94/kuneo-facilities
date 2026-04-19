'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { DashboardHeader } from './components/DashboardHeader';
import { IncidenceDetailProvider, useIncidenceDetailContext } from '@/features/incidences/context/IncidenceDetailContext';
import { IncidenceDetailModal } from '@/features/incidences/components/IncidenceDetailModal';

const userNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Incidencias', href: '/dashboard/incidences/new', icon: FileText },
];

const adminNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Incidencias', href: '/dashboard/incidences', icon: FileText },
  { label: 'Admin', href: '/dashboard/admin', icon: Shield },
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
  const navItems = React.useMemo(
    () => (isAdmin ? adminNavItems : userNavItems),
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-900" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      {/* Desktop Sidebar */}
      {isDesktop && (
        <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
          <div className="px-6 py-6">
            <div className="text-lg font-bold text-blue-900">Kuneo</div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Property Admin
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  ].join(' ')}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Header */}
      {!isDesktop && (
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="text-lg font-bold text-blue-900">Kuneo</div>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>
      )}

      {/* Mobile Menu Overlay */}
      {!isDesktop && mobileMenuOpen && (
        <div className="fixed inset-0 z-20 bg-white pt-14">
          <nav className="space-y-1 px-4 py-4">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={[
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium',
                    active
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="border-b border-slate-200 bg-white p-4 md:p-6">
          <DashboardHeader />
        </div>
        {children}
      </main>
      <GlobalDetailModal />

      {/* Mobile Bottom Navigation */}
      {!isDesktop && (
        <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'flex flex-1 flex-col items-center justify-center py-2.5 text-xs font-medium',
                    active ? 'text-blue-900' : 'text-slate-500',
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
