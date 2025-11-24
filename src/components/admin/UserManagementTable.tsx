"use client";

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMockData } from '@/lib/auth/provider';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { MoreHorizontal, UserCog, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function UserManagementTable() {
  const { users, isLoading, updateUser, deleteUser } = useMockData();
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<User['role']>('customer');
  const { toast } = useToast();

  const sortedUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => {
      const roleOrder = { admin: 0, staff: 1, customer: 2 };
      return roleOrder[a.role] - roleOrder[b.role];
    });
  }, [users]);

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setFormOpen(true);
  };
  
  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setAlertOpen(true);
  }

  const confirmDelete = () => {
    if (!selectedUser) return;
    deleteUser(selectedUser.id);
    toast({ title: "User Deleted", description: `${selectedUser.name} has been removed.` });
    setAlertOpen(false);
    setSelectedUser(null);
  }

  const handleRoleChangeSubmit = () => {
    if (!selectedUser) return;
    updateUser({ ...selectedUser, role: selectedRole });
    toast({ title: "Role Updated", description: `${selectedUser.name}'s role has been changed to ${selectedRole}.` });
    setFormOpen(false);
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
        <Card className="shadow-lg">
            <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </CardContent>
        </Card>
    )
  }

  const getRoleVariant = (role: string): "default" | "secondary" | "outline" => {
    switch(role) {
        case 'admin': return 'default';
        case 'staff': return 'secondary';
        default: return 'outline';
    }
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden sm:table-cell">Contact</TableHead>
                <TableHead className="text-right">Loyalty Points</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{user.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                      <div>{user.email}</div>
                      <div className="text-muted-foreground">{user.mobileNumber}</div>
                  </TableCell>
                  <TableCell className="text-right">{user.points ?? 'N/A'}</TableCell>
                   <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditRole(user)}><UserCog className="mr-2 h-4 w-4"/>Edit Role</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user)}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline">Edit Role for {selectedUser?.name}</DialogTitle>
            <DialogDescription>Change the user's role below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={(value: User['role']) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleRoleChangeSubmit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete {selectedUser?.name}'s account.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
