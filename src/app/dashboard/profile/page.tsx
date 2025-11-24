import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { MOCK_USER } from "@/lib/data";

export default function ProfilePage() {
  const user = MOCK_USER;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and preferences.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Keep your details up to date.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
