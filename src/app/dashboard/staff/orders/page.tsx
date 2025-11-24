import MenuTable from "@/components/admin/MenuTable";

export default function StaffOrdersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Order Management</h1>
        <p className="text-muted-foreground">View and manage incoming customer orders.</p>
      </div>
      {/* A component to manage orders would go here. Reusing MenuTable as a placeholder. */}
      <MenuTable />
    </div>
  );
}
