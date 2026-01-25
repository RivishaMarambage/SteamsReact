import RedeemPoints from "@/components/admin/RedeemPoints";

export default function AdminRedeemPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Redeem Customer Points</h1>
        <p className="text-muted-foreground">Find a customer and apply their loyalty points to their purchase.</p>
      </div>
      <RedeemPoints />
    </div>
  );
}
