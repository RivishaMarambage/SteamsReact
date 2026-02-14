"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { MoreHorizontal, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import type { UserProfile, LoyaltyLevel } from '@/lib/types';
import { collection, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export default function UserManagementTable() {
  const { data: users, isLoading: areUsersLoading } = useCollection<UserProfile>("users");
  const { data: loyaltyLevels, isLoading: areLevelsLoading } = useCollection<LoyaltyLevel>("loyalty_levels");
  const firestore = useFirestore();

  const [isRoleDialogOpen, setRoleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserProfile['role']>('customer');
  const { toast } = useToast();

  const isLoading = areUsersLoading || areLevelsLoading;

  const handleEditRoleClick = (user: UserProfile) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleDeleteClick = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !firestore) return;

    const userRef = doc(firestore, "users", selectedUser.id);
    await setDoc(userRef, { role: selectedRole }, { merge: true });

    toast({
      title: "Role Updated",
      description: `${selectedUser.name}'s role has been updated to ${selectedRole}.`,
    });
    setRoleDialogOpen(false);
    setSelectedUser(null);
  };

  const confirmDelete = async () => {
    if (!selectedUser || !firestore) return;
    await deleteDoc(doc(firestore, "users", selectedUser.id));

    toast({
      title: "User Deleted",
      description: `${selectedUser.name} has been removed from the database.`,
    });
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRoleBadgeVariant = (role: UserProfile['role']) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'staff': return 'secondary';
      default: return 'outline';
    }
  };

  const getLoyaltyLevelName = (levelId?: string) => {
    if (!levelId || !loyaltyLevels) return 'N/A';
    const level = loyaltyLevels.find(l => l.id === levelId);
    return level ? level.name : 'N/A';
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className="capitalize text-xs font-bold">
                    {user.role === 'customer' ? getLoyaltyLevelName(user.loyaltyLevelId) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">{user.loyaltyPoints ?? 0}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditRoleClick(user)}>Edit Role</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(user)}>Delete Profile</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isRoleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedUser?.name}</DialogTitle>
            <DialogDescription>Change system permissions for this user.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserProfile['role'])}>
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
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRoleChange}>Confirm Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanent Deletion</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>This will remove the user's document from the database. This action is irreversible.</p>
              <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold uppercase tracking-widest text-[10px]">Security Note</AlertTitle>
                <AlertDescription className="text-xs">
                  This does NOT delete the user's authentication account. They will still be able to log in but will have no profile.
                </AlertDescription>
              </Alert>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete Data</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}