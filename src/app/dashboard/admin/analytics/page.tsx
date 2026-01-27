import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import BirthdayReminders from "@/components/dashboard/BirthdayReminders";
import GameWinnerVerification from "@/components/admin/GameWinnerVerification";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Analytics</h1>
        <p className="text-muted-foreground">
          Insights into your cafe's performance.
        </p>
      </div>
      <AnalyticsDashboard />
      <GameWinnerVerification />
      <div className="mt-8">
        <BirthdayReminders />
      </div>
    </div>
  );
}
