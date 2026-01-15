
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
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import type { UserProfile, LoyaltyLevel } from '@/lib/types';
import { collection, doc, deleteDoc, setDoc } from 'firebase/firestore';

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
    
    // Note: This deletes the Firestore user document, but not the Firebase Auth user.
    // For a production app, you'd want a Cloud Function to handle full user deletion.
    await deleteDoc(doc(firestore, "users", selectedUser.id));

    toast({
      title: "User Deleted",
      description: `${selectedUser.name} has been removed from the system.`,
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
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRoleBadgeVariant = (role: UserProfile['role']) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'staff':
        return 'secondary';
      default:
        return 'outline';
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
                <TableHead>Loyalty Level</TableHead>
                <TableHead>Order Count</TableHead>
                <TableHead>Linked Socials</TableHead>
                <TableHead>Left Review</TableHead>
                <TableHead>Redeemable Points</TableHead>
                <TableHead>Lifetime Points</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {user.role === 'customer' ? getLoyaltyLevelName(user.loyaltyLevelId) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.role === 'customer' ? user.orderCount ?? 0 : 'N/A'}
                  </TableCell>
                   <TableCell>
                    {user.role === 'customer' ? (
                      <Badge variant={user.hasLinkedSocials ? "secondary" : "outline"}>
                        {user.hasLinkedSocials ? 'Yes' : 'No'}
                      </Badge>
                    ) : 'N/A'}
                  </TableCell>
                   <TableCell>
                    {user.role === 'customer' ? (
                      <Badge variant={user.hasLeftReview ? "secondary" : "outline"}>
                        {user.hasLeftReview ? 'Yes' : 'No'}
                      </Badge>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">{user.loyaltyPoints ?? 0}</TableCell>
                  <TableCell className="text-right">{user.lifetimePoints ?? 0}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEditRoleClick(user)}>Edit Role</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(user)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role for {selectedUser?.name}</DialogTitle>
            <DialogDescription>Select a new role for this user.</DialogDescription>
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
            <Button onClick={handleRoleChange}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user's data from the database.
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

    