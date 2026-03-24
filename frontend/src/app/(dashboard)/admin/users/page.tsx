'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useUsers, useUpdateUserRole, useDeleteUser, useCreateUser } from '@/hooks/use-users';
import type { CreateUserInput } from '@/types';

const EMPTY_FORM: CreateUserInput = { email: '', name: '', password: '', role: 'user' };

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: users = [], isLoading } = useUsers();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const createUser = useCreateUser();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateUserInput>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session.user.role !== 'admin') {
      router.replace('/bins');
    }
  }, [status, session, router]);

  if (status === 'loading') return null;
  if (status === 'authenticated' && session.user.role !== 'admin') {
    return <div className="p-6 text-sm text-destructive">Unauthorized</div>;
  }

  const handleRoleToggle = async (id: string, current: string) => {
    const next = current === 'admin' ? 'user' : 'admin';
    try {
      await updateRole.mutateAsync({ id, role: next });
      toast.success(`Role updated to ${next}`);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createUser.mutateAsync(form);
      toast.success(`User "${form.email}" created`);
      setForm(EMPTY_FORM);
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) return <div className="p-6 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Users</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{users.length} total</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="cursor-pointer gap-1.5">
          <Plus className="size-3.5" />
          Create User
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{user.provider}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {user._id !== session?.user.id && (
                    <>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleRoleToggle(user._id, user.role)}
                      >
                        Make {user.role === 'admin' ? 'User' : 'Admin'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="xs"
                        onClick={() => setDeleteTarget({ id: user._id, email: user.email })}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Full Name
              </Label>
              <Input
                id="new-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Doe"
                required
                className="bg-muted/40 border-border/50 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="new-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@example.com"
                required
                className="bg-muted/40 border-border/50 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                className="bg-muted/40 border-border/50 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-role" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Role
              </Label>
              <select
                id="new-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'user' })}
                className="w-full h-9 rounded-md bg-muted/40 border border-border/50 px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={creating} className="cursor-pointer gap-1.5">
                {creating ? <><Loader2 className="size-3.5 animate-spin" />Creating…</> : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete user confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`Delete user "${deleteTarget?.email}"?`}
        description="This will permanently delete the user and all their bins."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}
