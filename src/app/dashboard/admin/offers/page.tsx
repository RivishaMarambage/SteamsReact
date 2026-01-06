
import BirthdayOfferConfig from "@/components/admin/BirthdayOfferConfig";
import DailyOfferTable from "@/components/admin/DailyOfferTable";
import BirthdayReminders from "@/components/dashboard/BirthdayReminders";

export default function AdminOffersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Offer Management</h1>
        <p className="text-muted-foreground">Create and manage special offers for your customers.</p>
      </div>
      <BirthdayOfferConfig />
      <DailyOfferTable />
      <BirthdayReminders />
    </div>
  );
}


    