

"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MenuItem, CartItem, Category, Order, UserProfile } from '@/lib/types';
import { PlusCircle, ShoppingCart, Minus, Plus, Trash2, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import Image from 'next/image';


export default function MenuDisplay({ menuItems }: { menuItems: MenuItem[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<Order['orderType']>('Pick up');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const { toast } = useToast();
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  
  const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);
  
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);

  const getCategoryName = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name;
  }

  const getCategoryType = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.type;
  }
  
  const mainCategories = Array.from(new Set(categories?.map(c => c.type).filter(Boolean) as string[]));

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

  const handleRedeemPoints = () => {
    const redeemAmount = Number(pointsToRedeem);
    if (!userProfile || !userProfile.loyaltyPoints) {
      toast({ variant: 'destructive', title: "No points available" });
      return;
    }
    if (redeemAmount <= 0) {
      toast({ variant: 'destructive', title: "Invalid Amount", description: "Please enter a positive number of points." });
      return;
    }
    if (redeemAmount > userProfile.loyaltyPoints) {
      toast({ variant: 'destructive', title: "Not enough points", description: `You only have ${userProfile.loyaltyPoints} points available.` });
      return;
    }
    if (redeemAmount > cartTotal) {
        toast({ variant: 'destructive', title: "Cannot redeem more than total", description: `Your order total is Rs. ${cartTotal.toFixed(2)}.` });
        return;
    }

    // Set points to redeem, the discount will be calculated from this
    setPointsToRedeem(redeemAmount);
    toast({ title: "Points Applied", description: `${redeemAmount} points will be used for a Rs. ${redeemAmount.toFixed(2)} discount.` });
  };


  const subtotal = cart.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
  const discount = Math.min(subtotal, Number(pointsToRedeem) || 0); // Discount cannot be more than the subtotal
  const cartTotal = subtotal - discount;
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!authUser || !firestore || !userProfile) {
        toast({ variant: 'destructive', title: "Not Logged In", description: "You must be logged in to place an order."});
        return;
    }
    
    try {
        const batch = writeBatch(firestore);
        const userDocRef = doc(firestore, "users", authUser.uid);

        // 1. Create a new document ref in the root /orders collection
        const rootOrderRef = doc(collection(firestore, 'orders'));

        const finalDiscount = Number(pointsToRedeem) || 0;
        const finalTotal = subtotal - finalDiscount;

        // 2. Define the data for the order
        const orderData = {
            customerId: authUser.uid,
            orderDate: serverTimestamp(),
            totalAmount: finalTotal,
            status: "Placed" as const,
            menuItemIds: cart.map(item => item.menuItem.id),
            orderType: orderType,
            pointsRedeemed: finalDiscount,
            discountApplied: finalDiscount
        };

        // 3. Set the data for the root order and the user's subcollection order
        batch.set(rootOrderRef, orderData);
        const userOrderRef = doc(firestore, `users/${authUser.uid}/orders`, rootOrderRef.id);
        batch.set(userOrderRef, orderData);

        // 4. Update loyalty points
        let pointsToEarn = 0;
        if (subtotal > 5000) {
          pointsToEarn = 5;
        } else if (subtotal > 1000) {
          pointsToEarn = 2;
        } else if (subtotal > 100) {
          pointsToEarn = 1;
        }
        
        // The total point change is new points earned minus points redeemed
        const netPointChange = pointsToEarn - finalDiscount;
        batch.update(userDocRef, {
            loyaltyPoints: increment(netPointChange)
        });
        
        // 6. Commit the batch
        await batch.commit();

        toast({
            title: "Order Placed!",
            description: `Your ${orderType} order is confirmed. You earned ${pointsToEarn} points and redeemed ${finalDiscount} points.`,
        });
        setCart([]);
        setPointsToRedeem(0);

    } catch (error) {
        console.error("Error placing order: ", error);
        toast({
            variant: "destructive",
            title: "Order Failed",
            description: "There was a problem placing your order. Please try again.",
        });
    }
}


  return (
    <>
      <div className="mb-8">
        <Card>
            <CardHeader>
                <CardTitle>Order Type</CardTitle>
                <CardDescription>Select how you'd like to receive your order.</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup defaultValue="Pick up" value={orderType} onValueChange={(value: Order['orderType']) => setOrderType(value)} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Dine-in" id="dine-in" />
                        <Label htmlFor="dine-in">Dine-in</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Pick up" id="pick-up" />
                        <Label htmlFor="pick-up">Pick up</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Takeway" id="takeway" />
                        <Label htmlFor="takeway">Takeway</Label>
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>
      </div>

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
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle className="font-headline text-2xl">Your Order</SheetTitle>
            <SheetDescription>Review your items before placing your {orderType} order.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 py-4 overflow-y-auto -mx-6 px-6">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                <ShoppingCart className="w-16 h-16 mb-4 text-muted-foreground/50" />
                <p>Your cart is empty.</p>
                <p className="text-sm">Add items from the menu to get started.</p>
                </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.menuItem.id} className="flex items-center gap-4 pr-2">
                    <Image
                        src={`https://picsum.photos/seed/${item.menuItem.id}/100/100`}
                        alt={item.menuItem.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                        data-ai-hint="food item"
                    />
                    <div className="flex-grow grid gap-1">
                      <p className="font-semibold leading-tight">{item.menuItem.name}</p>
                      <p className="text-sm text-muted-foreground">Rs. {item.menuItem.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.menuItem.id, -1)}>
                        {item.quantity === 1 ? <Trash2 className="h-4 w-4 text-destructive" /> : <Minus className="h-4 w-4" />}
                      </Button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.menuItem.id, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <SheetFooter className="flex-col space-y-4 pt-4">
            {cart.length > 0 && (
                <>
                <Separator />
                 <div className="space-y-4">
                    <h3 className="font-headline text-lg">Redeem Points</h3>
                    <div className='text-sm text-primary font-bold'>You have {userProfile?.loyaltyPoints ?? 0} points available.</div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor='redeem-points' className='sr-only'>Points to redeem</Label>
                        <Input 
                            id="redeem-points"
                            type="number"
                            placeholder="Points to use"
                            value={pointsToRedeem || ''}
                            onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                            max={userProfile?.loyaltyPoints ?? 0}
                            min={0}
                        />
                        <Button variant="secondary" onClick={handleRedeemPoints}><Ticket className='mr-2 h-4 w-4' /> Apply</Button>
                    </div>
                </div>
                <Separator />
                <div className="w-full space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>Rs. {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-destructive">
                        <span>Discount:</span>
                        <span>- Rs. {discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>Rs. {cartTotal.toFixed(2)}</span>
                    </div>
                </div>
                </>
            )}
            <Button size="lg" className="w-full" disabled={cart.length === 0 || !firestore} onClick={handlePlaceOrder}>Place {orderType} Order</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
