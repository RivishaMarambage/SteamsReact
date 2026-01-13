
import AddonCategoryTable from "@/components/admin/AddonCategoryTable";

export default function AdminAddonCategoriesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Add-on Category Management</h1>
        <p className="text-muted-foreground">Group your add-ons into categories like "Syrups" or "Milk Options".</p>
      </div>
      <AddonCategoryTable />
    </div>
  );
}
