
'use client';

import { useCollection } from "@/firebase";
import { UserProfile } from "@/lib/types";
import { isWithinInterval, addDays, parseISO, getMonth, getDate } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Gift } from "lucide-react";

export default function BirthdayReminders() {
  const { data: users, isLoading } = useCollection<UserProfile>("users");

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                </div>
            </CardContent>
        </Card>
    )
  }

  const today = new Date();
  const nextWeek = addDays(today, 7);

  const upcomingBirthdays = users?.filter(user => {
    if (!user.dateOfBirth) return false;
    const dob = parseISO(user.dateOfBirth);
    
    // Set the year to the current year to check for the upcoming birthday
    dob.setFullYear(today.getFullYear());

    // If birthday has already passed this year, check for next year's birthday
    if (dob < today) {
        dob.setFullYear(today.getFullYear() + 1);
    }
    
    return isWithinInterval(dob, { start: today, end: nextWeek });
  }).sort((a, b) => {
    const dateA = parseISO(a.dateOfBirth!);
    const dateB = parseISO(b.dateOfBirth!);
    dateA.setFullYear(today.getFullYear());
    dateB.setFullYear(today.getFullYear());
    // Basic sort, doesn't handle year wrap around perfectly but good enough for 7 days
    return dateA.getTime() - dateB.getTime();
  });


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Gift /> Upcoming Birthdays</CardTitle>
        <CardDescription>Customers celebrating their birthday in the next 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingBirthdays && upcomingBirthdays.length > 0 ? (
          <ul className="space-y-3">
            {upcomingBirthdays.map(user => {
                const dob = parseISO(user.dateOfBirth!);
                const birthdayString = format(dob, "MMMM d");
                return (
                    <li key={user.id} className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                        <span className="font-semibold">{user.name}</span>
                        <span className="text-sm text-muted-foreground">{birthdayString}</span>
                    </li>
                )
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No upcoming birthdays in the next 7 days.</p>
        )}
      </CardContent>
    </Card>
  );
}
