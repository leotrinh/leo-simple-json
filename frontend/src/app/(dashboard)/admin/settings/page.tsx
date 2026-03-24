'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAdminSettings, useUpdateSetting } from '@/hooks/use-settings';

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: settings = [] } = useAdminSettings();
  const updateSetting = useUpdateSetting();

  useEffect(() => {
    if (status === 'authenticated' && session.user.role !== 'admin') {
      router.replace('/bins');
    }
  }, [status, session, router]);

  if (status === 'loading') return null;
  if (status === 'authenticated' && session.user.role !== 'admin') {
    return <div className="p-6 text-sm text-destructive">Unauthorized</div>;
  }

  const getSetting = (key: string) => settings.find((s) => s.key === key)?.value;
  const allowRegistration = getSetting('allowRegistration') as boolean | undefined;
  const logoUrl = (getSetting('logoUrl') as string) ?? '';
  const siteName = (getSetting('siteName') as string) ?? '';

  const handleToggle = async (checked: boolean) => {
    try {
      await updateSetting.mutateAsync({ key: 'allowRegistration', value: checked });
      toast.success(`Registration ${checked ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update setting');
    }
  };

  const handleBlur = async (key: string, value: string, fallback?: string) => {
    try {
      await updateSetting.mutateAsync({ key, value: value.trim() || fallback || '' });
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-base font-semibold">Site Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Configure site appearance and access controls</p>
      </div>

      {/* Branding */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branding</h2>
        <div className="rounded-lg border border-border/60 bg-card p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="site-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Site Name
              </Label>
              <Input
                id="site-name"
                defaultValue={siteName}
                placeholder="JSON Manager"
                className="bg-muted/40 border-border/50 h-9 focus-visible:ring-primary/40"
                onBlur={(e) => handleBlur('siteName', e.target.value, 'JSON Manager')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="logo-url" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Logo URL <span className="normal-case font-normal">(optional)</span>
              </Label>
              <Input
                id="logo-url"
                defaultValue={logoUrl}
                placeholder="https://example.com/logo.png"
                className="bg-muted/40 border-border/50 h-9 focus-visible:ring-primary/40 font-mono text-xs"
                onBlur={(e) => handleBlur('logoUrl', e.target.value)}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">Logo and site name are shown on the login page and sidebar. Leave Logo URL blank to use the default icon.</p>
        </div>
      </section>

      {/* Access Control */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Access Control</h2>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Allow Public Registration</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                When off, only admins can create new accounts via the Users page
              </p>
            </div>
            <Switch
              checked={!!allowRegistration}
              onCheckedChange={handleToggle}
              disabled={updateSetting.isPending}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
