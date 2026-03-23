'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUsers, useUpdateUserRole, useDeleteUser } from '@/hooks/use-users';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: users = [], isLoading } = useUsers();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  useEffect(() => {
    if (status === 'authenticated' && session.user.role !== 'admin') {
      router.replace('/bins');
    }
  }, [status, session, router]);

  const handleRoleToggle = async (id: string, current: string) => {
    const next = current === 'admin' ? 'user' : 'admin';
    try {
      await updateRole.mutateAsync({ id, role: next });
      toast.success(`Role updated to ${next}`);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Delete user "${email}" and all their bins?`)) return;
    try {
      await deleteUser.mutateAsync(id);
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  if (isLoading) return <div className="p-6 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold mb-6">User Management</h1>
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
                        onClick={() => handleDelete(user._id, user.email)}
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
    </div>
  );
}
