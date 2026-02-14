import MenuTable from "@/components/admin/MenuTable";

export default function AdminMenuPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Menu Management</h1>
        <p className="text-muted-foreground">Add, edit, or remove items from your cafe's menu.</p>
      </div>
      <MenuTable />
    </div>
  );
}
