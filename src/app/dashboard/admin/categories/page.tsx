import CategoryTable from "@/components/admin/CategoryTable";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Category Management</h1>
        <p className="text-muted-foreground">Add, edit, or remove menu categories.</p>
      </div>
      <CategoryTable />
    </div>
  );
}
