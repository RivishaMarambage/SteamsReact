'use client';

import BeverageBuilder from "@/components/create/BeverageBuilder";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Addon, MenuItem } from "@/lib/types";
import { collection, doc } from "firebase/firestore";

function CreatorPageContent() {
    const firestore = useFirestore();

    const coffeeBaseQuery = useMemoFirebase(() => firestore ? doc(firestore, 'menu_items/custom-coffee-base') : null, [firestore]);
    const teaBaseQuery = useMemoFirebase(() => firestore ? doc(firestore, 'menu_items/custom-tea-base') : null, [firestore]);
    const addonsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'addons') : null, [firestore]);

    const { data: coffeeBase, isLoading: coffeeLoading } = useDoc<MenuItem>(coffeeBaseQuery);
    const { data: teaBase, isLoading: teaLoading } = useDoc<MenuItem>(teaBaseQuery);
    const { data: allAddons, isLoading: addonsLoading } = useCollection<Addon>(addonsQuery);

    const isLoading = coffeeLoading || teaLoading || addonsLoading;
    
    if (isLoading) {
        return (
            <div className="space-y-8">
                 <div>
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </div>
                 <div className="grid md:grid-cols-2 gap-8">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
            </div>
        )
    }

    if (!coffeeBase || !teaBase || !allAddons) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="bg-destructive/10 p-4 rounded-full">
                    <p className="text-destructive font-bold text-xl">Beverage Creator Unavailable</p>
                </div>
                <p className="text-muted-foreground max-w-md">
                    The custom drink bases could not be found in the database. 
                    If you are an admin, please ensure you have signed up at the login page to trigger the initial database seeding.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry Loading
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Create Your Own Drink</h1>
                <p className="text-muted-foreground">Feeling creative? Build your perfect custom drink from scratch.</p>
            </div>
            <BeverageBuilder 
                coffeeBase={coffeeBase}
                teaBase={teaBase}
                allAddons={allAddons}
            />
        </div>
    )

}

export default function CreatorPage() {
    return <CreatorPageContent />
}
