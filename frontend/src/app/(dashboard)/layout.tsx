'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LogOut, Database, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status === 'loading' || !session) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <Link href="/bins" className="flex items-center gap-2 font-semibold text-sm">
            <Database className="size-4" />
            JSON Manager
          </Link>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          <Link
            href="/bins"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Database className="size-4" />
            My Bins
          </Link>
          <Link
            href="/bins/new"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Plus className="size-4" />
            New Bin
          </Link>
          {session.user.role === 'admin' && (
            <Link
              href="/admin/users"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Users className="size-4" />
              Users
            </Link>
          )}
        </nav>
        <div className="p-3 border-t">
          <div className="text-xs text-muted-foreground truncate mb-2">{session.user.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
