
import PublicMenuDisplay from "@/components/order/PublicMenuDisplay";
import PublicPageLayout from "@/components/layout/PublicPageLayout";

export default function MenuPage() {
  return (
    <PublicPageLayout title="Our Menu">
      <PublicMenuDisplay />
    </PublicPageLayout>
  );
}
