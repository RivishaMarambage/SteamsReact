

"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MenuItem, CartItem, Category, Order, UserProfile, DailyOffer, LoyaltyLevel, Addon, CartItemAddon, OrderItem, AddonCategory, MenuItemAddonGroup, PointTransaction } from '@/lib/types';
import { PlusCircle, ShoppingCart, Minus, Plus, Trash2, Ticket, Gift, Tag, Utensils, ShoppingBag, Percent, Sparkles, X, MailWarning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment, writeBatch, query, where } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';

interface MenuDisplayProps {
  menuItems: MenuItem[];
  dailyOffers: DailyOffer[];
  freebieToClaim: string | null;
}

const WELCOME_OFFERS = [
    { order: 0, discount: 10 }, // 1st order (orderCount is 0)
    { order: 1, discount: 5 },  // 2nd order (orderCount is 1)
    { order: 2, discount: 15 }, // 3rd order (orderCount is 2)
];


export default function MenuDisplay({ menuItems, dailyOffers, freebieToClaim }: MenuDisplayProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<Order['orderType']>('Takeaway');
  const [tableNumber, setTableNumber] = useState('');
  const [pointsToRedeemInput, setPointsToRedeemInput] = useState<number | string>('');
  const [appliedPoints, setAppliedPoints] = useState(0);
  
  const router = useRouter();
  const pathname = usePathname();

  const [isCustomizationOpen, setCustomizationOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<{menuItem: MenuItem, displayPrice: number, appliedDailyOfferId?: string} | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isEmailVerified, setIsEmailVerified] = useState(false);


  const { toast } = useToast();
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  
  const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);
  
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, "categories") : null, [firestore]);
  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);
  
  const addonsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'addons') : null, [firestore]);
  const { data: allAddons, isLoading: areAddonsLoading } = useCollection<Addon>(addonsQuery);

  const addonCategoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'addon_categories') : null, [firestore]);
  const { data: addonCategories, isLoading: areAddonCategoriesLoading } = useCollection<AddonCategory>(addonCategoriesQuery);

  const loyaltyLevelsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "loyalty_levels")) : null, [firestore]);
  const { data: loyaltyLevels, isLoading: areLevelsLoading } = useCollection<LoyaltyLevel>(loyaltyLevelsQuery);

  useEffect(() => {
    const checkVerification = async () => {
        if (authUser) {
            await authUser.reload();
            setIsEmailVerified(authUser.emailVerified);
        }
    };
    checkVerification();
  }, [authUser]);

  const canRedeemPoints = useMemo(() => {
    if (!userProfile || !loyaltyLevels) return false;
    const bronzeTier = loyaltyLevels.find(l => l.id === 'bronze');
    if (!bronzeTier) return false;
    return (userProfile.lifetimePoints ?? 0) >= bronzeTier.minimumPoints;
  }, [userProfile, loyaltyLevels]);
  
  const potentialWelcomeOffer = useMemo(() => {
     if (!userProfile || (userProfile.orderCount ?? 0) >= 3) {
      return null;
    }
    return WELCOME_OFFERS.find(offer => offer.order === (userProfile.orderCount ?? 0)) || null;
  }, [userProfile]);

  const applicableWelcomeOffer = useMemo(() => {
    if (!isEmailVerified) return null;
    return potentialWelcomeOffer;
  }, [isEmailVerified, potentialWelcomeOffer]);


  const getCategoryName = (categoryId: string, source: 'menu' | 'addon') => {
    if (source === 'menu') {
        return categories?.find(c => c.id === categoryId)?.name;
    }
    return addonCategories?.find(c => c.id === categoryId)?.name;
  }
  
  const handleOpenCustomization = (item: MenuItem, displayPrice: number, appliedDailyOfferId?: string) => {
    setCustomizingItem({menuItem: item, displayPrice, appliedDailyOfferId});
    setSelectedAddons([]);
    setValidationErrors({});
    setCustomizationOpen(true);
  }

  const handleAddonToggle = (addon: Addon) => {
    setSelectedAddons(prev => {
        if(prev.find(a => a.id === addon.id)) {
            return prev.filter(a => a.id !== addon.id);
        }
        return [...prev, addon];
    })
  }

  const validateAddonSelection = () => {
    if (!customizingItem?.menuItem.addonGroups) {
        return true;
    }
    
    const errors: Record<string, string> = {};

    for (const group of customizingItem.menuItem.addonGroups) {
        const selectedInGroup = selectedAddons.filter(sa => sa.addonCategoryId === group.addonCategoryId).length;

        if (group.isRequired && selectedInGroup === 0) {
            errors[group.addonCategoryId] = "At least one selection is required.";
        } else if (selectedInGroup < group.minSelection) {
            errors[group.addonCategoryId] = `Please select at least ${group.minSelection} option(s).`;
        }
        
        if (group.maxSelection > 0 && selectedInGroup > group.maxSelection) {
            errors[group.addonCategoryId] = `You can select up to ${group.maxSelection} option(s).`;
        }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  useEffect(() => {
    validateAddonSelection();
  }, [selectedAddons, customizingItem]);


  const confirmAddToCart = () => {
    if(!customizingItem || !validateAddonSelection()) {
        toast({
            variant: "destructive",
            title: "Customization Incomplete",
            description: "Please check the requirements for each add-on group.",
        });
        return;
    }

    const cartId = `${customizingItem.menuItem.id}-${Date.now()}`;
    const addonPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    const finalPrice = customizingItem.displayPrice + addonPrice;

    const newCartItem: CartItem = {
        id: cartId,
        menuItem: customizingItem.menuItem,
        addons: selectedAddons,
        quantity: 1,
        totalPrice: finalPrice,
        appliedDailyOfferId: customizingItem.appliedDailyOfferId,
    };

    setCart(prev => [...prev, newCartItem]);
    toast({
        title: "Added to order",
        description: `${customizingItem.menuItem.name} with customizations is now in your cart.`,
    });

    setCustomizationOpen(false);
    setCustomizingItem(null);
    setSelectedAddons([]);
  };

  const addToCart = (item: MenuItem, displayPrice: number, appliedDailyOfferId?: string) => {
    // If no addon groups, add directly to cart
    if(!item.addonGroups || item.addonGroups.length === 0) {
        const cartId = `${item.id}-${Date.now()}`;
        const newCartItem: CartItem = {
            id: cartId,
            menuItem: item,
            addons: [],
            quantity: 1,
            totalPrice: displayPrice,
            appliedDailyOfferId: appliedDailyOfferId,
        };
        setCart(prev => [...prev, newCartItem]);
        toast({
            title: "Added to order",
            description: `${item.name} is now in your cart.`,
        });
        return;
    }
    // Otherwise, open customization dialog
    handleOpenCustomization(item, displayPrice, appliedDailyOfferId);
  };


  useEffect(() => {
    if (freebieToClaim && menuItems.length > 0 && userProfile && !isProfileLoading) {
        const freebieInProfile = userProfile.birthdayFreebieMenuItemIds?.includes(freebieToClaim);
        if (!freebieInProfile) return;

        const alreadyInCart = cart.some(item => item.menuItem.id === freebieToClaim && item.totalPrice === 0);
        if (alreadyInCart) return;
        
        const freebieItem = menuItems.find(item => item.id === freebieToClaim);
        if (freebieItem) {
             const cartId = `${freebieItem.id}-${Date.now()}`;
             const newCartItem: CartItem = {
                id: cartId,
                menuItem: freebieItem,
                addons: [],
                quantity: 1,
                totalPrice: 0
            };
            setCart(prev => [...prev, newCartItem]);
            if (userDocRef) {
                updateDoc(userDocRef, { birthdayFreebieMenuItemIds: [] });
            }
            toast({
                title: "Birthday Reward Added!",
                description: `Your free ${freebieItem.name} has been added to your cart.`,
            });
        }
    }
  }, [freebieToClaim, menuItems, userProfile, isProfileLoading, cart, userDocRef]);

  const updateQuantity = (cartItemId: string, amount: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === cartItemId);
      if (!existingItem) return prevCart;

      const newQuantity = existingItem.quantity + amount;

      if (newQuantity <= 0) {
        // Remove item from cart if quantity is zero or less
        return prevCart.filter(item => item.id !== cartItemId);
      }
      
      // Update quantity
      return prevCart.map(item =>
        item.id === cartItemId
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  };

  const subtotal = cart.reduce((total, item) => total + (item.totalPrice * item.quantity), 0);
  const serviceCharge = orderType === 'Dine-in' ? subtotal * 0.10 : 0;
  
  const calculateBirthdayDiscount = () => {
    if (!userProfile?.birthdayDiscountValue || userProfile.birthdayDiscountValue <= 0) {
        return 0;
    }

    if (userProfile.birthdayDiscountType === 'percentage') {
        return subtotal * (userProfile.birthdayDiscountValue / 100);
    }
    // 'fixed'
    return userProfile.birthdayDiscountValue;
  }
  
  const birthdayDiscountAmount = calculateBirthdayDiscount();
  
  const totalBeforeDiscounts = subtotal + serviceCharge;

  const handleRedeemPoints = () => {
    const availablePoints = userProfile?.loyaltyPoints ?? 0;
    const redeemAmount = Number(pointsToRedeemInput);
    
    if (!userProfile || !canRedeemPoints) {
      toast({ variant: 'destructive', title: "Redemption Not Allowed", description: "You must be in the Bronze tier or higher to redeem points." });
      return;
    }
    if (availablePoints <= 0) {
      toast({ variant: 'destructive', title: "No points available" });
      return;
    }
    if (isNaN(redeemAmount) || redeemAmount <= 0) {
      toast({ variant: 'destructive', title: "Invalid Amount", description: "Please enter a positive number of points." });
      return;
    }
    if (redeemAmount > availablePoints) {
      toast({ variant: 'destructive', title: "Not enough points", description: `You only have ${availablePoints} points available.` });
      return;
    }
    if (redeemAmount > (totalBeforeDiscounts - birthdayDiscountAmount)) {
        toast({ variant: 'destructive', title: "Cannot redeem more than total", description: `Your order total after other discounts is LKR ${(totalBeforeDiscounts - birthdayDiscountAmount).toFixed(2)}.` });
        return;
    }

    setAppliedPoints(redeemAmount);
    toast({ title: "Points Applied", description: `${redeemAmount} points will be used for a LKR ${redeemAmount.toFixed(2)} discount.` });
  };
  
  const loyaltyDiscount = Math.min(totalBeforeDiscounts - birthdayDiscountAmount, appliedPoints);

  const calculateWelcomeDiscount = () => {
    if (!applicableWelcomeOffer) return 0;
    return (subtotal + serviceCharge) * (applicableWelcomeOffer.discount / 100);
  };
  
  const welcomeDiscountAmount = calculateWelcomeDiscount();
  const totalDiscount = loyaltyDiscount + birthdayDiscountAmount + welcomeDiscountAmount;
  const cartTotal = totalBeforeDiscounts - totalDiscount;
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!authUser || !firestore || !userProfile) {
        toast({ variant: 'destructive', title: "Not Logged In", description: "You must be logged in to place an order."});
        return;
    }
    
    try {
        const batch = writeBatch(firestore);
        
        if (!userDocRef) return;

        const rootOrderRef = doc(collection(firestore, 'orders'));

        let pointsToEarn = 0;
        if (cartTotal > 10000) {
            pointsToEarn = Math.floor(cartTotal / 100) * 2;
        } else if (cartTotal >= 5000) {
            pointsToEarn = Math.floor(cartTotal / 100);
        } else if (cartTotal >= 1000) {
            pointsToEarn = Math.floor(cartTotal / 200);
        } else if (cartTotal > 0) {
            pointsToEarn = Math.floor(cartTotal / 400);
        }

        const orderItems: OrderItem[] = cart.map(cartItem => {
          const item: OrderItem = {
            menuItemId: cartItem.menuItem.id,
            menuItemName: cartItem.menuItem.name,
            quantity: cartItem.quantity,
            basePrice: cartItem.menuItem.price,
            addons: cartItem.addons.map(addon => ({
                addonId: addon.id,
                addonName: addon.name,
                addonPrice: addon.price
            })),
            totalPrice: cartItem.totalPrice,
          };
          // Only add appliedDailyOfferId if it's not undefined
          if (cartItem.appliedDailyOfferId) {
            item.appliedDailyOfferId = cartItem.appliedDailyOfferId;
          }
          return item;
        });
        
        let birthdayDiscountAppliedValue: Order['birthdayDiscountApplied'] = null;
        if (birthdayDiscountAmount > 0) {
           birthdayDiscountAppliedValue = {
             type: userProfile.birthdayDiscountType!,
             value: userProfile.birthdayDiscountValue!,
           }
        } else if (freebieToClaim && userProfile.birthdayFreebieMenuItemIds?.includes(freebieToClaim)) {
            birthdayDiscountAppliedValue = {
                type: 'free-item',
                menuItemIds: userProfile.birthdayFreebieMenuItemIds,
            }
        }


        const orderData: Omit<Order, 'id' | 'orderDate'> & { orderDate: any } = {
            customerId: authUser.uid,
            orderDate: serverTimestamp(),
            totalAmount: cartTotal,
            status: "Placed" as const,
            orderItems: orderItems,
            orderType: orderType,
            pointsRedeemed: loyaltyDiscount,
            discountApplied: totalDiscount,
            serviceCharge: serviceCharge,
            pointsToEarn: pointsToEarn,
            birthdayDiscountApplied: birthdayDiscountAppliedValue,
            tableNumber: orderType === 'Dine-in' ? tableNumber : undefined,
        };
        
        // This loop removes any keys with `undefined` values from the top level of orderData
        Object.keys(orderData).forEach(keyStr => {
            const key = keyStr as keyof typeof orderData;
            if (orderData[key] === undefined) {
                delete (orderData as any)[key];
            }
        });


        batch.set(rootOrderRef, orderData);
        const userOrderRef = doc(firestore, `users/${authUser.uid}/orders`, rootOrderRef.id);
        batch.set(userOrderRef, orderData);

        // Point spending and offer redemption logic
        const updates: any = {
            loyaltyPoints: increment(-loyaltyDiscount),
        };
        
        if (loyaltyDiscount > 0) {
            const transactionRef = doc(collection(firestore, `users/${authUser.uid}/point_transactions`));
            const transactionData: Omit<PointTransaction, 'id'> = {
                date: serverTimestamp() as any,
                description: `Redeemed on Order #${rootOrderRef.id.substring(0, 7).toUpperCase()}`,
                amount: -loyaltyDiscount,
                type: 'redeem'
            };
            batch.set(transactionRef, transactionData);
        }

        if (birthdayDiscountAmount > 0) {
            updates.birthdayDiscountValue = null;
            updates.birthdayDiscountType = null;
        }

        if (applicableWelcomeOffer) {
            updates.orderCount = increment(1);
        }
        
        const redeemedDailyOffers = orderItems
            .map(item => item.appliedDailyOfferId)
            .filter((id): id is string => !!id);
        
        if (redeemedDailyOffers.length > 0) {
            const todayString = format(new Date(), 'yyyy-MM-dd');
            redeemedDailyOffers.forEach(offerId => {
                updates[`dailyOffersRedeemed.${offerId}`] = todayString;
            });
        }


        batch.update(userDocRef, updates);
        
        await batch.commit();

        toast({
            title: "Order Placed!",
            description: `Your ${orderType} order is confirmed.`,
        });
        setCart([]);
        setPointsToRedeemInput('');
        setTableNumber('');
        setAppliedPoints(0);
        
        const params = new URLSearchParams(window.location.search);
        params.delete('claimFreebie');
        router.replace(`${pathname}?${params.toString()}`);

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
                <RadioGroup value={orderType} onValueChange={(value: Order['orderType']) => setOrderType(value)} className="grid grid-cols-2 gap-4">
                    <div>
                        <RadioGroupItem value="Dine-in" id="dine-in" className="peer sr-only" />
                        <Label htmlFor="dine-in" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <Utensils className="mb-2 h-6 w-6" />
                            Dine-in
                        </Label>
                    </div>
                     <div>
                        <RadioGroupItem value="Takeaway" id="takeaway" className="peer sr-only" />
                        <Label htmlFor="takeaway" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <ShoppingBag className="mb-2 h-6 w-6" />
                            Takeaway
                        </Label>
                    </div>
                </RadioGroup>
                {orderType === 'Dine-in' && (
                    <div className="mt-6">
                        <Label className="text-lg font-semibold mb-4 block">Select Table Number</Label>
                        <RadioGroup value={tableNumber} onValueChange={setTableNumber} className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                             {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                                <div key={num}>
                                    <RadioGroupItem value={String(num)} id={`table-${num}`} className="peer sr-only" />
                                    <Label htmlFor={`table-${num}`} className="flex h-12 w-full items-center justify-center rounded-md border-2 border-muted bg-popover text-lg font-semibold hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                        {num}
                                    </Label>
                                </div>
                             ))}
                        </RadioGroup>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={categories?.[0]?.id} className="w-full">
        <div className="flex justify-center mb-6 overflow-x-auto">
          <TabsList>
            {categories?.map(category => (
              <TabsTrigger key={category.id} value={category.id}>{category.name}</TabsTrigger>
            ))}
          </TabsList>
        </div>
        {categories?.map(subCategory => (
          <TabsContent key={subCategory.id} value={subCategory.id}>
             <div className="space-y-8">
                <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {menuItems.filter(item => item.categoryId === subCategory.id).map(item => {
                        const today = new Date();
                        const todayString = format(today, 'yyyy-MM-dd');
                        
                        const offer = dailyOffers.find(o => {
                            if (!o.offerStartDate || !o.offerEndDate) return false;
                            if (o.menuItemId !== item.id) return false;
                            if (o.orderType !== orderType) return false;
                            
                            const isOfferActive = isWithinInterval(today, {
                                start: parseISO(o.offerStartDate),
                                end: parseISO(o.offerEndDate),
                            });
                           
                            return isOfferActive;
                        });

                        const alreadyRedeemed = offer && userProfile?.dailyOffersRedeemed?.[offer.id] === todayString;
                        
                        const originalPrice = item.price;
                        let displayPrice = originalPrice;
                        let isOfferApplied = false;
                        let appliedOfferId;
                        
                        if (offer && userProfile?.loyaltyLevelId && !alreadyRedeemed) {
                            const userTierDiscount = offer.tierDiscounts?.[userProfile.loyaltyLevelId];
                            if (typeof userTierDiscount === 'number' && userTierDiscount > 0) {
                                if (offer.discountType === 'percentage') {
                                    displayPrice = originalPrice - (originalPrice * userTierDiscount / 100);
                                } else { // fixed
                                    displayPrice = originalPrice - userTierDiscount;
                                }
                                isOfferApplied = true;
                                appliedOfferId = offer.id;
                            }
                        }

                        // Ensure price is not negative
                        displayPrice = Math.max(0, displayPrice);

                        return (
                          <Card key={item.id} className={cn("flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300", item.isOutOfStock && "opacity-60")}>
                             <div className="relative w-full h-40">
                                <Image
                                    src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    data-ai-hint="food item"
                                />
                                {item.isOutOfStock && (
                                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Badge variant="destructive">Out of Stock</Badge>
                                    </div>
                                )}
                                {isOfferApplied && !item.isOutOfStock && (
                                    <Badge variant="destructive" className="absolute top-2 right-2 flex items-center gap-1">
                                    <Tag className="h-3 w-3"/> Daily Special
                                    </Badge>
                                )}
                            </div>
                            <CardContent className="p-4 flex-grow">
                              <CardTitle className="font-headline text-xl mb-1">{item.name}</CardTitle>
                              <CardDescription>{item.description}</CardDescription>
                            </CardContent>
                            <CardFooter className="p-4 flex justify-between items-center">
                              <div className="font-bold text-lg text-primary">
                                {isOfferApplied && <span className="text-sm font-normal text-muted-foreground line-through mr-2">LKR {originalPrice.toFixed(2)}</span>}
                                LKR {displayPrice.toFixed(2)}
                              </div>
                              <Button size="sm" onClick={() => addToCart(item, displayPrice, appliedOfferId)} disabled={item.isOutOfStock}>
                                {item.isOutOfStock ? "Unavailable" : <><PlusCircle className="mr-2 h-4 w-4" /> Add</>}
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                </div>
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
        <SheetContent className="flex h-full flex-col w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-headline text-2xl">Your Order</SheetTitle>
            <SheetDescription>Review your items before placing your {orderType} order.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 py-4 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                <ShoppingCart className="w-16 h-16 mb-4 text-muted-foreground/50" />
                <p>Your cart is empty.</p>
                <p className="text-sm">Add items from the menu to get started.</p>
                </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                        <Image
                            src={item.menuItem.imageUrl || `https://picsum.photos/seed/${item.menuItem.id}/100/100`}
                            alt={item.menuItem.name}
                            fill
                            className="object-cover"
                            data-ai-hint="food item"
                        />
                    </div>
                    <div className="flex-grow grid gap-1">
                      <p className="font-semibold leading-tight">{item.menuItem.name}</p>
                       {item.addons.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                            {item.addons.map(addon => `+ ${addon.name}`).join(', ')}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">LKR {item.totalPrice.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.id, -1)}>
                        {item.quantity === 1 ? <Trash2 className="h-4 w-4 text-destructive" /> : <Minus className="h-4 w-4" />}
                      </Button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cart.length > 0 && (
            <SheetFooter className="pt-4 border-t">
              <div className="w-full space-y-4">
                  {potentialWelcomeOffer && !isEmailVerified && (
                     <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <h3 className="font-headline text-lg text-yellow-600 flex items-center gap-2"><MailWarning /> Verify Your Email</h3>
                      <p className="text-sm text-muted-foreground">
                        You have a <span className="font-bold">{potentialWelcomeOffer.discount}% welcome discount</span> waiting! Please verify your email to apply it to this order.
                      </p>
                    </div>
                  )}

                  {applicableWelcomeOffer && (
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <h3 className="font-headline text-lg text-blue-600 flex items-center gap-2"><Percent /> Welcome Offer Applied!</h3>
                      <p className="text-sm text-muted-foreground">
                        Your <span className='font-bold'>{applicableWelcomeOffer.discount}%</span> discount for your{' '}
                        {
                            {0: 'first', 1: 'second', 2: 'third'}[applicableWelcomeOffer.order]
                        }{' '}
                        order has been automatically applied.
                      </p>
                    </div>
                  )}
                  
                  {birthdayDiscountAmount > 0 && (
                     <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <h3 className="font-headline text-lg text-accent flex items-center gap-2"><Gift /> Birthday Discount Applied!</h3>
                      <p className="text-sm text-muted-foreground">Your <span className="font-bold">LKR {birthdayDiscountAmount.toFixed(2)}</span> discount has been automatically applied.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                      <h3 className="font-headline text-lg">Redeem Points</h3>
                       {!canRedeemPoints && userProfile && (
                        <p className="text-xs text-destructive">You must be in the Bronze tier or higher to redeem points.</p>
                       )}
                      <div className='text-sm text-primary font-bold'>You have {userProfile?.loyaltyPoints ?? 0} points available.</div>
                      <div className="flex items-center gap-2">
                          <Label htmlFor='redeem-points' className='sr-only'>Points to redeem</Label>
                          <Input 
                              id="redeem-points"
                              type="number"
                              placeholder="Points to use"
                              value={pointsToRedeemInput}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || (Number(val) >= 0 && Number(val) <= (userProfile?.loyaltyPoints ?? 0))) {
                                    setPointsToRedeemInput(val);
                                }
                              }}
                              max={userProfile?.loyaltyPoints ?? 0}
                              min={0}
                              disabled={!canRedeemPoints}
                          />
                          <Button variant="secondary" onClick={handleRedeemPoints} disabled={!canRedeemPoints}><Ticket className='mr-2 h-4 w-4' /> Apply</Button>
                      </div>
                  </div>
                  <Separator />
                  <div className="w-full space-y-2 text-sm">
                      <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>LKR {subtotal.toFixed(2)}</span>
                      </div>
                      {serviceCharge > 0 && (
                        <div className="flex justify-between">
                            <span>Service Charge (10%)</span>
                            <span>LKR {serviceCharge.toFixed(2)}</span>
                        </div>
                      )}
                      {totalDiscount > 0 && (
                        <div className="flex justify-between text-destructive">
                            <span>Discount</span>
                            <span>- LKR {totalDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      {loyaltyDiscount > 0 && (
                        <div className="flex justify-between text-xs pl-4 text-destructive">
                            <span>(Points Redemption)</span>
                            <span>- LKR {loyaltyDiscount.toFixed(2)}</span>
                        </div>
                      )}
                       {welcomeDiscountAmount > 0 && (
                        <div className="flex justify-between text-xs pl-4 text-destructive">
                            <span>(Welcome Offer)</span>
                            <span>- LKR {welcomeDiscountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {birthdayDiscountAmount > 0 && (
                        <div className="flex justify-between text-xs pl-4 text-destructive">
                            <span>(Birthday Reward)</span>
                            <span>- LKR {birthdayDiscountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>LKR {cartTotal.toFixed(2)}</span>
                      </div>
                  </div>
                  <Button size="lg" className="w-full" disabled={cart.length === 0 || !firestore} onClick={handlePlaceOrder}>Place {orderType} Order</Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isCustomizationOpen} onOpenChange={setCustomizationOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Customize {customizingItem?.menuItem.name}</DialogTitle>
            <DialogDescription>
                Make it just right. The final price will be calculated based on your selections.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="py-4 space-y-6">
                {customizingItem?.menuItem.addonGroups?.map((group) => {
                    const categoryName = getCategoryName(group.addonCategoryId, 'addon');
                    const availableAddons = allAddons?.filter(addon => addon.addonCategoryId === group.addonCategoryId);
                    const selectedCount = selectedAddons.filter(sa => sa.addonCategoryId === group.addonCategoryId).length;

                    if (!availableAddons || availableAddons.length === 0) return null;
                    
                    return (
                        <div key={group.addonCategoryId}>
                            <h4 className="font-semibold text-lg mb-2 sticky top-0 bg-background py-2 flex justify-between items-center">
                                <span>{categoryName}</span>
                                <span className="text-sm font-normal text-muted-foreground">({selectedCount} / {group.maxSelection || 'any'})</span>
                            </h4>
                            {validationErrors[group.addonCategoryId] && (
                                <p className="text-sm text-destructive mb-2">{validationErrors[group.addonCategoryId]}</p>
                            )}
                            <div className="space-y-2">
                                {availableAddons.map(addon => {
                                    const isChecked = !!selectedAddons.find(a => a.id === addon.id);
                                    const isDisabled = !isChecked && group.maxSelection > 0 && selectedCount >= group.maxSelection;
                                    return (
                                        <div key={addon.id} className={cn("flex items-center space-x-3 p-3 rounded-md border has-[:checked]:border-primary has-[:checked]:bg-muted/50", isDisabled && "opacity-50")}>
                                            <Checkbox
                                                id={`addon-check-${addon.id}`}
                                                checked={isChecked}
                                                onCheckedChange={() => handleAddonToggle(addon)}
                                                disabled={isDisabled}
                                            />
                                            <Label htmlFor={`addon-check-${addon.id}`} className={cn("flex-grow text-base", isDisabled && "cursor-not-allowed")}>
                                                {addon.name}
                                            </Label>
                                            <span className="font-semibold">+ LKR {addon.price.toFixed(2)}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomizationOpen(false)}>Cancel</Button>
            <Button onClick={confirmAddToCart}>Add to Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    

    
