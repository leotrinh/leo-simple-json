'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Braces, Loader2 } from 'lucide-react';
import * as api from '@/lib/api-client';
import { usePublicSettings } from '@/hooks/use-settings';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '' });

  const { data: settings } = usePublicSettings();
  const canRegister = settings?.allowRegistration ?? false;
  const siteName = settings?.siteName || 'JSON Manager';
  const logoUrl = settings?.logoUrl || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        await api.register(form.email, form.name, form.password);
        toast.success('Account created! Please sign in.');
        setMode('login');
        setLoading(false);
        return;
      }
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        router.push('/bins');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/6 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8 gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={siteName}
              width={280}
              height={80}
              className="w-full max-h-16 object-contain"
              unoptimized
            />
          ) : (
            <div className="size-12 rounded-2xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/25 shadow-lg">
              <Braces className="size-6 text-primary" />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">{siteName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'login' ? 'Sign in to your workspace' : 'Create your workspace'}
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-card border border-border/60 rounded-xl p-6 shadow-2xl glow-blue">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="bg-muted/40 border-border/50 h-9 focus-visible:ring-primary/40"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="bg-muted/40 border-border/50 h-9 focus-visible:ring-primary/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="bg-muted/40 border-border/50 h-9 focus-visible:ring-primary/40"
              />
            </div>
            <Button type="submit" className="w-full cursor-pointer mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Please wait...
                </>
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </div>

        {canRegister && (
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Leo —{' '}
          <a
            href="https://github.com/leotrinh"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors underline underline-offset-2"
          >
            github.com/leotrinh
          </a>
        </p>
      </div>
    </div>
  );
}
