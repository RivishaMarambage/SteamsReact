"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMockData } from '@/lib/auth/provider';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';

export default function UserManagementTable() {
  const { users, isLoading } = useMockData();

  const sortedUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => {
      const roleOrder = { admin: 0, staff: 1, customer: 2 };
      return roleOrder[a.role] - roleOrder[b.role];
    });
  }, [users]);
  
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
