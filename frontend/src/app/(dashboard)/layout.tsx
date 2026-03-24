'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Database, Users, Plus, Braces, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePublicSettings } from '@/hooks/use-settings';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { data: settings } = usePublicSettings();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  const siteName = settings?.siteName || 'JSON Manager';
  const logoUrl = settings?.logoUrl || '';

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/bins', label: 'My Bins', icon: Database },
    { href: '/bins/new', label: 'New Bin', icon: Plus },
    ...(session.user.role === 'admin'
      ? [
          { href: '/admin/users', label: 'Users', icon: Users },
          { href: '/admin/settings', label: 'Settings', icon: Settings },
        ]
      : []),
  ];

  const initial = (session.user.name?.[0] ?? session.user.email?.[0] ?? '?').toUpperCase();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border/50 bg-sidebar flex flex-col">
        {/* Brand */}
        <div className="px-4 pt-4 pb-3 border-b border-border/50">
          <Link href="/bins" className="flex flex-col items-start gap-1.5 cursor-pointer">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={siteName}
                width={200}
                height={48}
                className="w-full h-10 object-contain object-left"
                unoptimized
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-primary/15 flex items-center justify-center ring-1 ring-primary/25 shrink-0">
                  <Braces className="size-3.5 text-primary" />
                </div>
                <span className="font-semibold text-sm tracking-tight">{siteName}</span>
              </div>
            )}
            {logoUrl && (
              <span className="text-xs font-semibold tracking-tight text-foreground">{siteName}</span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/bins'
                ? pathname === '/bins' || (pathname.startsWith('/bins/') && pathname !== '/bins/new')
                : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 cursor-pointer',
                  isActive
                    ? 'bg-primary/15 text-primary ring-1 ring-inset ring-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
                )}
              >
                <Icon className={cn('size-4 shrink-0', isActive ? 'text-primary' : '')} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-border/50 space-y-1.5">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-sidebar-accent/60">
            <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 ring-1 ring-primary/20">
              <span className="text-xs font-bold text-primary">{initial}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{session.user.name ?? 'User'}</p>
              <p className="text-[11px] text-muted-foreground truncate">{session.user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground h-8 cursor-pointer"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main + Footer */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto bg-background">{children}</main>
        <footer className="shrink-0 border-t border-border/40 bg-muted/30 px-6 py-2 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Leo —{' '}
          <a
            href="https://github.com/leotrinh"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors underline underline-offset-2"
          >
            github.com/leotrinh
          </a>
        </footer>
      </div>
    </div>
  );
}
