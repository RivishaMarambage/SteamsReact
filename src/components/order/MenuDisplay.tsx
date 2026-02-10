
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MenuItem, CartItem, Category, Order, UserProfile, DailyOffer, LoyaltyLevel, Addon, CartItemAddon, OrderItem, AddonCategory, MenuItemAddonGroup, PointTransaction } from '@/lib/types';
import { PlusCircle, ShoppingCart, Minus, Plus, Trash2, Ticket, Gift, Tag, Utensils, ShoppingBag, Percent, Sparkles, X, MailWarning, ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment, writeBatch, query, where, getDoc, orderBy } from 'firebase/firestore';
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
  offerToClaim: string | null;
}

const WELCOME_OFFERS = [
    { order: 0, discount: 10 }, // 1st order (orderCount is 0)
    { order: 1, discount: 5 },  // 2nd order (orderCount is 1)
    { order: 2, discount: 15 }, // 3rd order (orderCount is 2)
];

export default function MenuDisplay({ menuItems, dailyOffers, freebieToClaim, offerToClaim }: MenuDisplayProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<Order['orderType'] | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [pointsToRedeemInput, setPointsToRedeemInput] = useState<number | string>('');
  const [appliedPoints, setAppliedPoints] = useState(0);
  const [activeTab, setActiveTab] = useState<string | undefined>();
  
  const router = useRouter();
  const pathname = usePathname();
  const processedFreebieIdRef = useRef<string | null>(null);
  const processedOfferIdRef = useRef<string | null>(null);
  const processedReorderRef = useRef(false);

  const [isCustomizationOpen, setCustomizationOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<{menuItem: MenuItem, displayPrice: number, appliedDailyOfferId?: string} | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isOrderTypeDialogOpen, setOrderTypeDialogOpen] = useState(true);
  const [dialogStep, setDialogStep] = useState<'type' | 'table'>('type');


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

  const sortedMenuItems = useMemo(() => {
    return [...menuItems].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [menuItems]);

  const handleTypeSelect = (type: Order['orderType']) => {
    if (type === 'Dine-in') {
      setOrderType('Dine-in');
      setDialogStep('table');
    } else { // Takeaway
      setOrderType('Takeaway');
      setOrderTypeDialogOpen(false);
    }
  };


  const handleTableSelect = (table: string) => {
      setTableNumber(table);
      setOrderTypeDialogOpen(false);
  };


  useEffect(() => {
    const checkVerification = async () => {
        if (authUser) {
            await authUser.reload();
            setIsEmailVerified(authUser.emailVerified);
        }
    };
    checkVerification();
  }, [authUser]);

  useEffect(() => {
    if (!activeTab && categories && categories.length > 0) {
      setActiveTab(categories[0].id);
    }
  }, [categories, activeTab]);

  // Reorder handling logic
  useEffect(() => {
    if (processedReorderRef.current || menuItems.length === 0) return;

    const reorderDataString = localStorage.getItem('reorder_items');
    if (reorderDataString) {
        processedReorderRef.current = true;
        try {
            const reorderItems = JSON.parse(reorderDataString);
            const newCartItems: CartItem[] = [];
            let itemsSkipped = 0;

            reorderItems.forEach((item: any) => {
                const menuItem = menuItems.find(m => m.id === item.menuItemId);
                if (menuItem && !menuItem.isOutOfStock) {
                    newCartItems.push({
                        id: `${menuItem.id}-${Date.now()}-${Math.random()}`,
                        menuItem,
                        quantity: item.quantity,
                        addons: item.addons,
                        totalPrice: item.totalPrice,
                        appliedDailyOfferId: item.appliedDailyOfferId
                    });
                } else {
                    itemsSkipped++;
                }
            });

            if (newCartItems.length > 0) {
                setCart(prev => [...prev, ...newCartItems]);
                toast({
                    title: "Reorder items added",
                    description: `${newCartItems.length} items added to your cart.${itemsSkipped > 0 ? ` ${itemsSkipped} item(s) skipped as they are currently unavailable.` : ''}`,
                });
            } else if (itemsSkipped > 0) {
                toast({
                    variant: "destructive",
                    title: "Reorder unavailable",
                    description: "The items in your previous order are currently out of stock.",
                });
            }
        } catch (e) {
            console.error("Failed to process reorder data", e);
        } finally {
            localStorage.removeItem('reorder_items');
        }
    }
  }, [menuItems, toast]);

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
  
  const handleOpenCustomization = useCallback((item: MenuItem, displayPrice: number, appliedDailyOfferId?: string) => {
    setCustomizingItem({menuItem: item, displayPrice, appliedDailyOfferId});
    setSelectedAddons([]);
    setValidationErrors({});
    setCustomizationOpen(true);
  }, []);

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

  const addToCart = useCallback((item: MenuItem, displayPrice: number, appliedDailyOfferId?: string) => {
    const category = categories?.find(c => c.id === item.categoryId);
    const isBeverage = category?.type === 'Beverages';

    if (!item.addonGroups || item.addonGroups.length === 0) {
      if (isBeverage) {
        const isInCart = cart.some(cartItem => cartItem.menuItem.id === item.id);
        if (isInCart) {
          setTimeout(() => {
            toast({
              title: "Item already in order",
              description: "Beverages can only be ordered in single quantities.",
            });
          }, 0);
          return;
        }
      }

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
      setTimeout(() => {
        toast({
          title: "Added to order",
          description: `${item.name} is now in your cart.`,
        });
      }, 0);
      return;
    }
    
    handleOpenCustomization(item, displayPrice, appliedDailyOfferId);
  }, [categories, cart, toast, handleOpenCustomization]);

  useEffect(() => {
    if (freebieToClaim && freebieToClaim !== processedFreebieIdRef.current && menuItems.length > 0 && userProfile && !isProfileLoading) {
        processedFreebieIdRef.current = freebieToClaim;
        const freebieInProfile = userProfile.birthdayFreebieMenuItemIds?.includes(freebieToClaim);
        if (!freebieInProfile) return;
        
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
            setTimeout(() => {
                toast({
                    title: "Birthday Reward Added!",
                    description: `Your free ${freebieItem.name} has been added to your cart.`,
                });
            }, 0);
             const params = new URLSearchParams(window.location.search);
            params.delete('claimFreebie');
            router.replace(`${pathname}?${params.toString()}`);
        }
    }
  }, [freebieToClaim, menuItems, userProfile, isProfileLoading, userDocRef, router, pathname, toast]);

  useEffect(() => {
    if (offerToClaim && offerToClaim !== processedOfferIdRef.current && menuItems.length > 0 && dailyOffers.length > 0 && userProfile && !isProfileLoading) {
        processedOfferIdRef.current = offerToClaim;
        const offer = dailyOffers.find(o => o.id === offerToClaim);
        if (!offer) return;

        if (offer.orderType !== orderType) {
            setTimeout(() => {
                toast({
                    variant: "destructive",
                    title: "Offer Not Applicable",
                    description: `This offer is only valid for ${offer.orderType} orders. You have selected a ${orderType} order.`,
                });
            }, 0);
            const params = new URLSearchParams(window.location.search);
            params.delete('addOffer');
            router.replace(`${pathname}?${params.toString()}`);
            return;
        }

        const menuItem = menuItems.find(item => item.id === offer.menuItemId);
        if (!menuItem) return;

        const userTierDiscount = offer.tierDiscounts?.[userProfile.loyaltyLevelId] || 0;
        
        let displayPrice = menuItem.price;
        if (userTierDiscount > 0) {
            if (offer.discountType === 'percentage') {
                displayPrice = menuItem.price - (menuItem.price * userTierDiscount / 100);
            } else { // fixed
                displayPrice = menuItem.price - userTierDiscount;
            }
        }
        displayPrice = Math.max(0, displayPrice);

        addToCart(menuItem, displayPrice, offer.id);

        const params = new URLSearchParams(window.location.search);
        params.delete('addOffer');
        router.replace(`${pathname}?${params.toString()}`);
    }
  }, [offerToClaim, menuItems, dailyOffers, userProfile, isProfileLoading, addToCart, router, pathname, orderType, toast]);

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
  
  // Calculate birthday discount amount from subtotal
  const calculateBirthdayDiscount = () => {
    if (!userProfile?.birthdayDiscountValue || userProfile.birthdayDiscountValue <= 0) return 0;
    if (userProfile.birthdayDiscountType === 'percentage') return subtotal * (userProfile.birthdayDiscountValue / 100);
    return userProfile.birthdayDiscountValue;
  }
  const birthdayDiscountAmount = calculateBirthdayDiscount();

  // Calculate welcome discount amount from subtotal
  const calculateWelcomeDiscount = () => {
    if (!applicableWelcomeOffer) return 0;
    return subtotal * (applicableWelcomeOffer.discount / 100);
  };
  const welcomeDiscountAmount = calculateWelcomeDiscount();

  // Discounted subtotal before service charge
  const discountedSubtotal = Math.max(0, subtotal - birthdayDiscountAmount - welcomeDiscountAmount);
  
  // Calculate service charge based on the discounted subtotal
  const serviceCharge = orderType === 'Dine-in' ? discountedSubtotal * 0.10 : 0;
  
  const totalBeforePoints = discountedSubtotal + serviceCharge;

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
    if (redeemAmount > totalBeforePoints) {
        toast({ variant: 'destructive', title: "Cannot redeem more than total", description: `Your order total is LKR ${totalBeforePoints.toFixed(2)}.` });
        return;
    }

    setAppliedPoints(redeemAmount);
    toast({ title: "Points Applied", description: `${redeemAmount} points will be used for a LKR ${redeemAmount.toFixed(2)} discount.` });
  };
  
  const loyaltyDiscount = Math.min(totalBeforePoints, appliedPoints);
  const totalDiscount = loyaltyDiscount + birthdayDiscountAmount + welcomeDiscountAmount;
  const cartTotal = totalBeforePoints - loyaltyDiscount;
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleProceedToCheckout = async () => {
    if (cart.length === 0) {
        toast({
            variant: "destructive",
            title: "Your cart is empty",
            description: "Please add items to your cart before proceeding.",
        });
        return;
    }

    const checkoutData = {
        cart,
        subtotal,
        serviceCharge,
        appliedPoints,
        loyaltyDiscount,
        birthdayDiscountAmount,
        welcomeDiscountAmount,
        totalDiscount,
        cartTotal,
        orderType,
        tableNumber,
    };

    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    
    router.push('/dashboard/checkout');
  };


  return (
    <div className="w-full">
      <Dialog open={isOrderTypeDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
           {dialogStep === 'type' && (
             <>
                <DialogHeader>
                    <DialogTitle className="text-center">How will you be joining us?</DialogTitle>
                    <DialogDescription className="text-center">Please select whether you want to dine-in or take your order away.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <Button variant="outline" className="h-32 flex-col gap-2" onClick={() => handleTypeSelect('Dine-in')}>
                        <Utensils className="h-8 w-8"/>
                        <span>Dine-in</span>
                    </Button>
                     <Button variant="outline" className="h-32 flex-col gap-2" onClick={() => handleTypeSelect('Takeaway')}>
                        <ShoppingBag className="h-8 w-8"/>
                        <span>Takeaway</span>
                    </Button>
                </div>
             </>
           )}
           {dialogStep === 'table' && (
               <>
                <DialogHeader>
                    <DialogTitle className="text-center">Select Table Number</DialogTitle>
                    <DialogDescription className="text-center">Choose the table where you are currently seated.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                            <Button key={num} variant="outline" className="h-16 text-lg" onClick={() => handleTableSelect(String(num))}>
                                {num}
                            </Button>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogStep('type')}>Back</Button>
                </DialogFooter>
               </>
           )}
        </DialogContent>
      </Dialog>
      
      {!isOrderTypeDialogOpen && (
        <>
            <div className="mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-lg sm:text-2xl uppercase tracking-tight">Order Details</CardTitle>
                        <CardDescription>
                            Order Type: <span className="font-bold text-primary uppercase">{orderType}</span>
                            {orderType === 'Dine-in' && tableNumber && (
                                <> • Table: <span className="font-bold text-primary">#{tableNumber}</span></>
                            )}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="mb-6 overflow-x-auto pb-2">
                    <TabsList className="h-auto p-1 bg-muted rounded-md">
                        {categories?.map(category => (
                        <TabsTrigger key={category.id} value={category.id} className="whitespace-nowrap px-6 py-2">{category.name}</TabsTrigger>
                        ))}
                    </TabsList>
                </div>
                {categories?.map(subCategory => (
                <TabsContent key={subCategory.id} value={subCategory.id}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedMenuItems.filter(item => item.categoryId === subCategory.id).map(item => {
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

                        displayPrice = Math.max(0, displayPrice);

                        return (
                        <Card key={item.id} className={cn("flex flex-col overflow-hidden shadow-lg", item.isOutOfStock && "opacity-60")}>
                            <div className="relative w-full h-48">
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
                            <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                            </CardContent>
                            <CardFooter className="p-4 flex justify-between items-center border-t bg-muted/10">
                            <div className="font-bold text-lg text-primary">
                                {isOfferApplied && <span className="block text-xs text-muted-foreground line-through opacity-60">LKR {originalPrice.toFixed(2)}</span>}
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
                </TabsContent>
                ))}
            </Tabs>
        </>
      )}

      <Sheet>
        <SheetTrigger asChild>
          <Button className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-2xl z-50">
            <ShoppingCart className="h-6 w-6" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold ring-2 ring-background">
                {cartItemCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex h-full flex-col w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-headline text-2xl uppercase tracking-tighter">Your Order</SheetTitle>
            <SheetDescription>Review your items before placing order.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="py-6">
                {cart.length === 0 ? (
                <div className="text-center text-muted-foreground h-64 flex flex-col items-center justify-center space-y-4">
                    <ShoppingCart className="w-12 h-12 opacity-20" />
                    <p>Your cart is empty</p>
                    </div>
                ) : (
                <div className="space-y-6">
                    {cart.map(item => {
                    const category = categories?.find(c => c.id === item.menuItem.categoryId);
                    const isBeverage = category?.type === 'Beverages';
                    return (
                        <div key={item.id} className="flex items-center gap-4 group">
                        <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                            <Image
                                src={item.menuItem.imageUrl || `https://picsum.photos/seed/${item.menuItem.id}/100/100`}
                                alt={item.menuItem.name}
                                fill
                                className="object-cover"
                                data-ai-hint="food item"
                            />
                        </div>
                        <div className="flex-grow min-w-0">
                            <p className="font-bold text-sm leading-tight truncate">{item.menuItem.name}</p>
                            {item.addons.length > 0 && (
                            <p className="text-[10px] text-muted-foreground truncate italic">
                                {item.addons.map(addon => `+ ${addon.name}`).join(', ')}
                            </p>
                            )}
                            <p className="text-xs font-bold text-primary">LKR {item.totalPrice.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-muted p-1 rounded-md shrink-0">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}>
                            {item.quantity === 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
                            </Button>
                            <span className="w-4 text-center text-xs font-bold">{item.quantity}</span>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)} disabled={isBeverage}>
                            <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                        </div>
                    );
                    })}
                </div>
                )}
            </div>
          </ScrollArea>
          <div className="border-t pt-6 space-y-4">
                <div className="w-full space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>LKR {subtotal.toFixed(2)}</span>
                    </div>
                    {(birthdayDiscountAmount > 0 || welcomeDiscountAmount > 0) && (
                    <div className="flex justify-between text-destructive font-bold">
                        <span>Item Discounts</span>
                        <span>- LKR {(birthdayDiscountAmount + welcomeDiscountAmount).toFixed(2)}</span>
                    </div>
                    )}
                    {serviceCharge > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                        <span>Service Charge (10%)</span>
                        <span>LKR {serviceCharge.toFixed(2)}</span>
                    </div>
                    )}
                    {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-destructive font-bold">
                        <span>Points Redemption</span>
                        <span>- LKR {loyaltyDiscount.toFixed(2)}</span>
                    </div>
                    )}
                    <div className="flex justify-between text-xl font-black text-primary uppercase tracking-tighter pt-2 border-t">
                        <span>Total</span>
                        <span>LKR {cartTotal.toFixed(2)}</span>
                    </div>
                </div>
                 <Button size="lg" className="w-full uppercase tracking-tight" disabled={cart.length === 0 || isProcessing} onClick={handleProceedToCheckout}>
                    {isProcessing ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...</>
                    ) : (
                        <>Checkout <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isCustomizationOpen} onOpenChange={setCustomizationOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <div className="p-6 border-b bg-muted/10">
            <DialogTitle className="font-headline text-xl uppercase tracking-tighter">Customize {customizingItem?.menuItem.name}</DialogTitle>
            <DialogDescription>
                Make it just right.
            </DialogDescription>
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-6 space-y-8">
                {customizingItem?.menuItem.addonGroups?.map((group) => {
                    const categoryName = getCategoryName(group.addonCategoryId, 'addon');
                    const availableAddons = allAddons?.filter(addon => addon.addonCategoryId === group.addonCategoryId);
                    const selectedCount = selectedAddons.filter(sa => sa.addonCategoryId === group.addonCategoryId).length;

                    if (!availableAddons || availableAddons.length === 0) return null;
                    
                    return (
                        <div key={group.addonCategoryId}>
                            <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-4 flex justify-between items-center">
                                <span>{categoryName}</span>
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", validationErrors[group.addonCategoryId] ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                                    {selectedCount} / {group.maxSelection || '∞'}
                                </span>
                            </h4>
                            {validationErrors[group.addonCategoryId] && (
                                <p className="text-xs font-bold text-destructive mb-3">{validationErrors[group.addonCategoryId]}</p>
                            )}
                            <div className="grid grid-cols-1 gap-2">
                                {availableAddons.map(addon => {
                                    const isChecked = !!selectedAddons.find(a => a.id === addon.id);
                                    const isDisabled = !isChecked && group.maxSelection > 0 && selectedCount >= group.maxSelection;
                                    return (
                                        <div key={addon.id} className={cn(
                                            "flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer",
                                            isChecked ? "border-primary bg-primary/5" : "border-muted hover:border-primary/30",
                                            isDisabled && "opacity-40 cursor-not-allowed grayscale"
                                        )}
                                        onClick={() => !isDisabled && handleAddonToggle(addon)}
                                        >
                                            <Checkbox
                                                id={`addon-check-${addon.id}`}
                                                checked={isChecked}
                                                onCheckedChange={() => !isDisabled && handleAddonToggle(addon)}
                                                disabled={isDisabled}
                                            />
                                            <div className="flex-grow flex justify-between items-center min-w-0">
                                                <Label htmlFor={`addon-check-${addon.id}`} className={cn("text-sm font-bold truncate", isDisabled && "cursor-not-allowed")}>
                                                    {addon.name}
                                                </Label>
                                                <span className="text-xs font-black text-primary ml-2 shrink-0">+ LKR {addon.price.toFixed(0)}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
          </ScrollArea>
          <div className="p-6 border-t bg-muted/10 flex gap-3">
            <Button variant="outline" onClick={() => setCustomizationOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={confirmAddToCart} className="flex-1 uppercase font-black">Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
