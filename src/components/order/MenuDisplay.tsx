"use client";

import { useState } from 'react';
import Image from "next/image";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { MenuItem, CartItem } from '@/lib/types';
import { PlusCircle, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';

export default function MenuDisplay({ menuItems }: { menuItems: MenuItem[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const { data: categories } = useCollection("categories");

  const getCategoryName = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name;
  }

  const getCategoryType = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.type;
  }
  
  const mainCategories = Array.from(new Set(categories?.map(c => c.type)));

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.menuItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.menuItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { menuItem: item, quantity: 1 }];
    });
    toast({
      title: "Added to order",
      description: `${item.name} is now in your cart.`,
    });
  };

  const updateQuantity = (itemId: string, amount: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.menuItem.id === itemId) {
          const newQuantity = item.quantity + amount;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const cartTotal = cart.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: "Not Logged In", description: "You must be logged in to place an order."});
        return;
    }
    
    const orderData = {
        customerId: user.uid,
        orderDate: serverTimestamp(),
        totalAmount: cartTotal,
        status: "Placed",
        menuItemIds: cart.map(item => item.menuItem.id)
    }

    // Add to user's subcollection for their own history
    await addDoc(collection(firestore, `users/${user.uid}/orders`), orderData);
    
    // Add to root collection for admin analytics
    await addDoc(collection(firestore, 'orders'), orderData);

    // Update user's loyalty points
    const userDocRef = doc(firestore, "users", user.uid);
    await updateDoc(userDocRef, {
      loyaltyPoints: increment(Math.floor(cartTotal))
    })

    toast({
      title: "Order Placed!",
      description: "Your pickup order has been confirmed. You've earned points!",
    });
    setCart([]);
  }

  return (
    <>
      <Tabs defaultValue={mainCategories[0]} className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList>
            {mainCategories.map(categoryType => (
              <TabsTrigger key={categoryType} value={categoryType}>{categoryType}</TabsTrigger>
            ))}
          </TabsList>
        </div>
        {mainCategories.map(categoryType => (
          <TabsContent key={categoryType} value={categoryType}>
             <div className="space-y-8">
               {categories?.filter(c => c.type === categoryType).map(subCategory => (
                <div key={subCategory.id}>
                    <h2 className="text-2xl font-bold font-headline mb-4">{subCategory.name}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {menuItems.filter(item => item.categoryId === subCategory.id).map(item => {
                        return (
                          <Card key={item.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardContent className="p-4 flex-grow">
                              <CardTitle className="font-headline text-xl mb-1">{item.name}</CardTitle>
                              <CardDescription>{item.description}</CardDescription>
                            </CardContent>
                            <CardFooter className="p-4 flex justify-between items-center">
                              <div className="font-bold text-lg text-primary">Rs. {item.price.toFixed(2)}</div>
                              <Button size="sm" onClick={() => addToCart(item)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                </div>
               ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Sheet>
        <SheetTrigger asChild>
          <Button className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-2xl bg-accent hover:bg-accent/90 text-accent-foreground">
            <ShoppingCart className="h-6 w-6" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                {cartItemCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-headline text-2xl">Your Order</SheetTitle>
            <SheetDescription>Review your items before placing your pickup order.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 py-4 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">Your cart is empty.</div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.menuItem.id} className="flex items-center gap-4">
                    <div className="flex-grow">
                      <p className="font-semibold">{item.menuItem.name}</p>
                      <p className="text-sm text-muted-foreground">Rs. {item.menuItem.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.menuItem.id, -1)}>
                        {item.quantity === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.menuItem.id, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <SheetFooter>
            <div className="w-full space-y-4">
                <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>Rs. {cartTotal.toFixed(2)}</span>
                </div>
                <Button size="lg" className="w-full" disabled={cart.length === 0} onClick={handlePlaceOrder}>Place Pickup Order</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}