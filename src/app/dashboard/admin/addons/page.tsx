
import AddonTable from "@/components/admin/AddonTable";

export default function AdminAddonsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Add-on Management</h1>
        <p className="text-muted-foreground">Create and manage customization add-ons for your menu items.</p>
      </div>
      <AddonTable />
    </div>
  );
}
