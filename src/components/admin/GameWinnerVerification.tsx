
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { DailyGameWinners, UserProfile } from "@/lib/types";
import { doc, collection } from "firebase/firestore";
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Dices, Ticket, Trophy, User as UserIcon, Mail } from "lucide-react";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const GAME_INFO = {
    spinWinner: { title: "Spin to Win", icon: Dices },
    scratchWinner: { title: "Silver Ticket Scratch", icon: Ticket },
    triviaWinner: { title: "Trivia Quest", icon: Trophy },
};

function WinnerDisplay({ userId, users }: { userId: string | null; users: UserProfile[] | null }) {
    if (!userId) {
        return <p className="text-sm text-muted-foreground">No winner today.</p>;
    }

    const winnerProfile = users?.find(u => u.id === userId);

    if (!winnerProfile) {
        return <p className="text-sm text-muted-foreground">Winner profile not found (ID: {userId.substring(0, 7)}...).</p>;
    }

    return (
        <div className="flex items-center gap-4">
            <Avatar>
                <AvatarImage src={`https://avatar.vercel.sh/${winnerProfile.email}.png`} alt={winnerProfile.name} />
                <AvatarFallback>{winnerProfile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold">{winnerProfile.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {winnerProfile.email}</p>
            </div>
        </div>
    )
}

export default function GameWinnerVerification() {
    const firestore = useFirestore();
    const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

    const winnersDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'daily_game_winners', today) : null, [firestore, today]);
    const { data: winners, isLoading: winnersLoading } = useDoc<DailyGameWinners>(winnersDocRef);

    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

    const isLoading = winnersLoading || usersLoading;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Today's Grand Prize Winners</CardTitle>
                <CardDescription>Verification for daily game zone winners. ({today})</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="grid md:grid-cols-3 gap-4">
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-4">
                        {Object.keys(GAME_INFO).map(key => {
                            const gameKey = key as keyof DailyGameWinners;
                            const game = GAME_INFO[gameKey];
                            const winnerId = winners?.[gameKey] || null;

                            return (
                                <Card key={gameKey} className="bg-muted/50">
                                    <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
                                        <game.icon className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold">{game.title}</h3>
                                    </CardHeader>
                                    <CardContent>
                                        <WinnerDisplay userId={winnerId} users={users} />
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
