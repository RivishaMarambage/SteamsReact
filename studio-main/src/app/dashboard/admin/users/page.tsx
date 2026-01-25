import UserManagementTable from "@/components/admin/UserManagementTable";

export default function AdminUsersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">User Management</h1>
        <p className="text-muted-foreground">View and manage all users in the system.</p>
      </div>
      <UserManagementTable />
    </div>
  );
}
