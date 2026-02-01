'use client';

import { Addon, CartItem, MenuItem } from "@/lib/types";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import Image from "next/image";
import { Coffee, PlusCircle, ShoppingCart, TestTube2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Separator } from "../ui/separator";

interface BeverageBuilderProps {
    coffeeBase: MenuItem;
    teaBase: MenuItem;
    allAddons: Addon[];
}

type BaseType = 'coffee' | 'tea';

export default function BeverageBuilder({ coffeeBase, teaBase, allAddons }: BeverageBuilderProps) {
    const [base, setBase] = useState<BaseType>('coffee');
    const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
    const { toast } = useToast();

    const currentBaseItem = base === 'coffee' ? coffeeBase : teaBase;

    if (!currentBaseItem) {
        return (
            <Card>
                <CardContent>
                    <p className="p-4 text-destructive">Could not load the base beverage. Please try refreshing.</p>
                </CardContent>
            </Card>
        )
    }

    const basePrice = currentBaseItem.price;

    const handleAddonToggle = (addon: Addon) => {
        setSelectedAddons(prev => {
            if (prev.find(a => a.id === addon.id)) {
                return prev.filter(a => a.id !== addon.id);
            }
            return [...prev, addon];
        });
    };

    const addonPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    const totalPrice = basePrice + addonPrice;

    const handleAddToCart = () => {
        if (!currentBaseItem) return;

        // This is a placeholder for adding to a global cart state
        // For now, we'll just log it and show a toast
        console.log({
            base: currentBaseItem.name,
            addons: selectedAddons.map(a => a.name),
            totalPrice
        });
        
        toast({
            title: "Added to Order!",
            description: "Your custom creation has been added to the cart."
        });

        // In a real app, you'd call a function here to update a global cart state.
        // For this demo, we can just reset the state after adding.
        setSelectedAddons([]);
    };


    return (
        <div className="grid md:grid-cols-2 gap-8 items-start">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">1. Choose Your Base</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <Card 
                        className={`cursor-pointer transition-all ${base === 'coffee' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}
                        onClick={() => setBase('coffee')}
                    >
                        <CardHeader className="items-center">
                            <Coffee className="h-10 w-10 text-primary mb-2" />
                            <CardTitle className="font-headline">Coffee</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="font-bold text-lg">LKR {coffeeBase.price.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                     <Card 
                        className={`cursor-pointer transition-all ${base === 'tea' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}
                        onClick={() => setBase('tea')}
                    >
                        <CardHeader className="items-center">
                            <TestTube2 className="h-10 w-10 text-primary mb-2" />
                            <CardTitle className="font-headline">Tea</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="font-bold text-lg">LKR {teaBase.price.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">2. Select Add-ons</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-64 rounded-md border p-4">
                        <div className="space-y-2">
                            {allAddons.map(addon => (
                                <div key={addon.id} className="flex items-center space-x-3 p-3 rounded-md has-[:checked]:bg-muted/50">
                                    <Checkbox
                                        id={`addon-creator-${addon.id}`}
                                        checked={!!selectedAddons.find(a => a.id === addon.id)}
                                        onCheckedChange={() => handleAddonToggle(addon)}
                                    />
                                    <Label htmlFor={`addon-creator-${addon.id}`} className="flex-grow text-base">
                                        {addon.name}
                                    </Label>
                                    <span className="font-semibold">+ LKR {addon.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
            
            <div className="md:col-span-2">
                 <Card className="shadow-xl bg-muted/50">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">3. Review Your Creation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between font-semibold">
                            <span>Base: {currentBaseItem.name}</span>
                            <span>LKR {basePrice.toFixed(2)}</span>
                        </div>
                        {selectedAddons.length > 0 && (
                            <>
                            <Separator />
                            <div className="space-y-2">
                                {selectedAddons.map(addon => (
                                     <div key={addon.id} className="flex justify-between text-sm">
                                        <span>+ {addon.name}</span>
                                        <span>LKR {addon.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                             <Separator />
                             </>
                        )}
                        <div className="flex justify-between text-xl font-bold text-primary">
                            <span>Total Price</span>
                            <span>LKR {totalPrice.toFixed(2)}</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button size="lg" className="w-full" onClick={handleAddToCart}>
                            <PlusCircle className="mr-2" /> Add to Order
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
