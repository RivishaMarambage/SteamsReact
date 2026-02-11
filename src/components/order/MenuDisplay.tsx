
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MenuItem, CartItem, Category, Order, UserProfile, DailyOffer, LoyaltyLevel, Addon, AddonCategory } from '@/lib/types';
import { PlusCircle, ShoppingCart, Minus, Plus, Trash2, Tag, Utensils, ShoppingBag, Sparkles, ArrowRight, Loader2, RotateCcw, Coffee, Pizza, MailWarning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { Separator } from '../ui/separator';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '../ui/label';
import Link from 'next/link';

interface MenuDisplayProps {
  menuItems: MenuItem[];
  dailyOffers: DailyOffer[];
  freebieToClaim: string | null;
  offerToClaim: string | null;
}

const WELCOME_OFFERS = [
    { order: 0, discount: 10, label: "1st Order (10% OFF)" },
    { order: 1, discount: 5, label: "2nd Order (5% OFF)" },
    { order: 2, discount: 15, label: "3rd Order (15% OFF)" },
];

const MAIN_GROUPS: Category['type'][] = ['Beverages', 'Food'];

export default function MenuDisplay({ menuItems, dailyOffers, freebieToClaim, offerToClaim }: MenuDisplayProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<Order['orderType'] | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [appliedPoints, setAppliedPoints] = useState(0);
  const [activeTab, setActiveTab] = useState<string | undefined>();
  const [selectedMainGroup, setSelectedMainGroup] = useState<Category['type']>(MAIN_GROUPS[0]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const { data: categories } = useCollection<Category>(categoriesQuery);
  
  const addonsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'addons') : null, [firestore]);
  const { data: allAddons } = useCollection<Addon>(addonsQuery);

  const addonCategoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'addon_categories') : null, [firestore]);
  const { data: addonCategories } = useCollection<AddonCategory>(addonCategoriesQuery);

  const loyaltyLevelsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "loyalty_levels")) : null, [firestore]);
  const { data: loyaltyLevels } = useCollection<LoyaltyLevel>(loyaltyLevelsQuery);

  const sortedMenuItems = useMemo(() => {
    return [...menuItems].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [menuItems]);

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories
      .filter(c => c.type === selectedMainGroup)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [categories, selectedMainGroup]);

  useEffect(() => {
    if (filteredCategories.length > 0) {
      setActiveTab(filteredCategories[0].id);
    } else {
      setActiveTab(undefined);
    }
  }, [filteredCategories]);

  const handleTypeSelect = (type: Order['orderType']) => {
    if (type === 'Dine-in') {
      setOrderType('Dine-in');
      setDialogStep('table');
    } else {
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
      setIsCartOpen(true);
      return;
    }
    
    setCustomizingItem({menuItem: item, displayPrice, appliedDailyOfferId});
    setSelectedAddons([]);
    setValidationErrors({});
    setCustomizationOpen(true);
  }, [categories, cart, toast]);

  useEffect(() => {
    if (offerToClaim && offerToClaim !== processedOfferIdRef.current && menuItems.length > 0 && dailyOffers.length > 0 && userProfile && !isProfileLoading) {
        processedOfferIdRef.current = offerToClaim;
        const offer = dailyOffers.find(o => o.id === offerToClaim);
        if (!offer) return;

        // Determine which item to add if multiple exist in the offer
        const targetItemId = searchParams.get('itemId');
        const menuItemId = targetItemId || (offer.menuItemIds?.length > 0 ? offer.menuItemIds[0] : null);
        
        if (!menuItemId) return;

        const menuItem = menuItems.find(item => item.id === menuItemId);
        if (!menuItem) return;

        if (!orderType) {
            const defaultType = offer.orderType === 'Both' ? 'Takeaway' : offer.orderType;
            setOrderType(defaultType);
            if (defaultType === 'Takeaway') {
                setOrderTypeDialogOpen(false);
            } else {
                setDialogStep('table');
            }
        }

        const userTierDiscount = offer.tierDiscounts?.[userProfile.loyaltyLevelId] || 0;
        let displayPrice = menuItem.price;
        if (userTierDiscount > 0) {
            if (offer.discountType === 'percentage') {
                displayPrice = menuItem.price - (menuItem.price * userTierDiscount / 100);
            } else {
                displayPrice = menuItem.price - userTierDiscount;
            }
        }
        displayPrice = Math.max(0, displayPrice);

        addToCart(menuItem, displayPrice, offer.id);

        const params = new URLSearchParams(window.location.search);
        params.delete('addOffer');
        params.delete('itemId');
        router.replace(`${pathname}?${params.toString()}`);
    }
  }, [offerToClaim, menuItems, dailyOffers, userProfile, isProfileLoading, addToCart, router, pathname, orderType, searchParams]);

  // ... rest of the component logic remains same but uses menuItemIds.includes(item.id)
  
  const subtotal = cart.reduce((total, item) => total + (item.totalPrice * item.quantity), 0);
  const welcomeDiscountAmount = applicableWelcomeOffer ? subtotal * (applicableWelcomeOffer.discount / 100) : 0;
  const birthdayDiscountAmount = userProfile?.birthdayDiscountValue ? (userProfile.birthdayDiscountType === 'percentage' ? subtotal * (userProfile.birthdayDiscountValue / 100) : userProfile.birthdayDiscountValue) : 0;
  
  const discountedSubtotal = Math.max(0, subtotal - birthdayDiscountAmount - welcomeDiscountAmount);
  const serviceCharge = orderType === 'Dine-in' ? discountedSubtotal * 0.10 : 0;
  const totalBeforePoints = discountedSubtotal + serviceCharge;
  const loyaltyDiscount = Math.min(totalBeforePoints, appliedPoints);
  const cartTotal = totalBeforePoints - loyaltyDiscount;
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleProceedToCheckout = async () => {
    if (cart.length === 0) return;
    localStorage.setItem('checkoutData', JSON.stringify({
        cart, subtotal, serviceCharge, appliedPoints, loyaltyDiscount, 
        birthdayDiscountAmount, welcomeDiscountAmount, 
        totalDiscount: loyaltyDiscount + birthdayDiscountAmount + welcomeDiscountAmount,
        cartTotal, orderType, tableNumber, welcomeOfferApplied: !!applicableWelcomeOffer,
    }));
    router.push('/dashboard/checkout');
  };

  return (
    <div className="w-full">
      {/* Selection Dialogs and Order Mode Display (already implemented) */}
      <Dialog open={isOrderTypeDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
           {dialogStep === 'type' && (
             <>
                <DialogHeader>
                    <DialogTitle className="text-center">How will you be joining us?</DialogTitle>
                    <DialogDescription className="text-center">Select whether you want to dine-in or take your order away.</DialogDescription>
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
                    <DialogDescription className="text-center">Choose the table where you are seated.</DialogDescription>
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
                <Card className="border-none shadow-md overflow-hidden bg-gradient-to-r from-primary/5 to-transparent">
                    <CardHeader className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div>
                            <CardTitle className="font-headline text-lg sm:text-2xl uppercase tracking-tight">Order Details</CardTitle>
                            <CardDescription suppressHydrationWarning>
                                Order Type: <span className="font-bold text-primary uppercase">{orderType}</span>
                                {orderType === 'Dine-in' && tableNumber && (
                                    <> • Table: <span className="font-bold text-primary">#{tableNumber}</span></>
                                )}
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => { setOrderTypeDialogOpen(true); setDialogStep('type'); }} className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">
                            <RotateCcw className="mr-2 h-3 w-3" /> Change Mode
                        </Button>
                    </CardHeader>
                </Card>
            </div>

            <div className="flex justify-center mb-12">
                <div className="bg-muted/50 p-1.5 rounded-full flex gap-1 border">
                    {MAIN_GROUPS.map((group) => (
                        <Button
                            key={group}
                            variant={selectedMainGroup === group ? "default" : "ghost"}
                            className={cn(
                                "rounded-full px-10 py-6 text-xs font-black uppercase tracking-[0.2em] transition-all",
                                selectedMainGroup === group ? "shadow-xl scale-105" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setSelectedMainGroup(group)}
                        >
                            {group === 'Beverages' ? <Coffee className="mr-2 h-4 w-4" /> : <Pizza className="mr-2 h-4 w-4" />}
                            {group}
                        </Button>
                    ))}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="mb-12 overflow-x-auto pb-4 scrollbar-hide">
                    <TabsList className="h-auto p-1.5 bg-muted/30 rounded-2xl border flex justify-start w-max mx-auto">
                        {filteredCategories.map(category => (
                        <TabsTrigger 
                            key={category.id} 
                            value={category.id} 
                            className="whitespace-nowrap px-8 py-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                            {category.name}
                        </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
                {filteredCategories.map(subCategory => (
                <TabsContent key={subCategory.id} value={subCategory.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex overflow-x-auto gap-8 pb-12 snap-x scrollbar-hide">
                    {sortedMenuItems.filter(item => item.categoryId === subCategory.id).map(item => {
                        const todayString = format(new Date(), 'yyyy-MM-dd');
                        const offer = dailyOffers.find(o => {
                            if (!o.offerStartDate || !o.offerEndDate || !o.menuItemIds?.includes(item.id)) return false;
                            if (o.orderType !== 'Both' && o.orderType !== orderType) return false;
                            return isWithinInterval(new Date(), { start: parseISO(o.offerStartDate), end: parseISO(o.offerEndDate) });
                        });

                        const alreadyRedeemed = offer && userProfile?.dailyOffersRedeemed?.[offer.id] === todayString;
                        let displayPrice = item.price;
                        let isOfferApplied = false;
                        
                        if (offer && userProfile?.loyaltyLevelId && !alreadyRedeemed) {
                            const userTierDiscount = offer.tierDiscounts?.[userProfile.loyaltyLevelId] || 0;
                            if (userTierDiscount > 0) {
                                displayPrice = offer.discountType === 'percentage' ? item.price - (item.price * userTierDiscount / 100) : item.price - userTierDiscount;
                                isOfferApplied = true;
                            }
                        }
                        displayPrice = Math.max(0, displayPrice);

                        return (
                        <Card key={item.id} className={cn("flex flex-col shrink-0 w-[280px] sm:w-[340px] snap-start overflow-hidden shadow-xl border-0 bg-white group hover:shadow-2xl transition-all duration-500 rounded-[2.5rem]", item.isOutOfStock && "opacity-60 grayscale")}>
                            <div className="relative w-full h-60 overflow-hidden">
                                <Image
                                    src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`}
                                    alt={item.name}
                                    fill
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                    data-ai-hint="food item"
                                />
                                {item.isOutOfStock && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                        <Badge variant="destructive" className="h-12 px-8 uppercase font-black tracking-widest text-[10px]">Out of Stock</Badge>
                                    </div>
                                )}
                                {isOfferApplied && !item.isOutOfStock && (
                                    <Badge variant="destructive" className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 shadow-2xl animate-pulse rounded-full border-0">
                                    <Tag className="h-3 w-3 fill-current"/> <span className="font-black text-[10px] uppercase tracking-widest">Daily Special</span>
                                    </Badge>
                                )}
                            </div>
                            <CardContent className="p-8 flex-grow">
                                <CardTitle className="font-headline text-3xl mb-3 text-[#2c1810] leading-none tracking-tight">{item.name}</CardTitle>
                                <CardDescription className="line-clamp-2 text-[#6b584b] leading-relaxed text-sm font-medium">{item.description}</CardDescription>
                            </CardContent>
                            <CardFooter className="p-8 pt-0 flex justify-between items-center border-t border-muted/50 bg-muted/5 mt-auto">
                                <div className="flex flex-col pt-6">
                                    {isOfferApplied && <span className="text-[10px] text-muted-foreground line-through opacity-60 font-black uppercase tracking-widest">LKR {item.price.toFixed(2)}</span>}
                                    <span className="font-black text-3xl text-primary tracking-tighter">LKR {displayPrice.toFixed(2)}</span>
                                </div>
                                <Button size="lg" onClick={() => addToCart(item, displayPrice, offer?.id)} disabled={item.isOutOfStock} className="rounded-full w-14 h-14 bg-[#2c1810] hover:bg-primary transition-all shadow-xl hover:shadow-primary/20 mt-6 p-0">
                                    {item.isOutOfStock ? <Minus className="h-5 w-5" /> : <Plus className="h-6 w-6" />}
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
      {/* Cart Sheet and Customization Dialog (already implemented) */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetTrigger asChild>
          <Button onClick={() => setIsCartOpen(true)} className="fixed bottom-8 right-8 rounded-full w-20 h-20 shadow-[0_20px_50px_rgba(217,119,6,0.4)] z-50 transition-all active:scale-90 group border-0 bg-primary hover:bg-[#b45309]">
            <ShoppingCart className="h-8 w-8 text-white group-hover:rotate-12 transition-transform" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-primary rounded-full h-10 w-10 flex items-center justify-center text-sm font-black ring-4 ring-primary shadow-2xl animate-in zoom-in">
                {cartItemCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex h-full flex-col w-full sm:max-w-md p-0 overflow-hidden border-l-0 shadow-2xl rounded-l-[3rem]">
          <SheetHeader className="p-10 border-b bg-muted/10">
            <SheetTitle className="font-headline text-4xl uppercase tracking-tighter text-[#2c1810]">Your Order</SheetTitle>
            <SheetDescription className="font-bold text-[#6b584b] uppercase tracking-widest text-[10px]">Review your items before checkout.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-10 space-y-10">
                {cart.length === 0 ? (
                <div className="text-center text-muted-foreground h-64 flex flex-col items-center justify-center space-y-8">
                    <div className="bg-muted p-10 rounded-full scale-110">
                        <ShoppingBag className="w-16 h-16 opacity-20" />
                    </div>
                    <p className="font-black uppercase tracking-[0.2em] text-[10px]">Your bag is empty</p>
                    </div>
                ) : (
                <div className="space-y-8">
                    {cart.map(item => {
                    const category = categories?.find(c => c.id === item.menuItem.categoryId);
                    const isBeverage = category?.type === 'Beverages';
                    return (
                        <div key={item.id} className="flex items-center gap-6 group animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="relative w-24 h-24 rounded-[1.5rem] overflow-hidden shrink-0 shadow-lg border">
                            <Image
                                src={item.menuItem.imageUrl || `https://picsum.photos/seed/${item.menuItem.id}/100/100`}
                                alt={item.menuItem.name}
                                fill
                                className="object-cover"
                                data-ai-hint="food item"
                            />
                        </div>
                        <div className="flex-grow min-w-0">
                            <p className="font-black text-lg leading-tight truncate text-[#2c1810] uppercase tracking-tight">{item.menuItem.name}</p>
                            {item.addons.length > 0 && (
                            <p className="text-[9px] text-[#6b584b] font-bold uppercase tracking-widest truncate mt-1">
                                {item.addons.map(addon => `+ ${addon.name}`).join(', ')}
                            </p>
                            )}
                            <p className="text-base font-black text-primary mt-2">LKR {item.totalPrice.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-muted/50 p-1.5 rounded-full shrink-0 border">
                            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-white shadow-sm" onClick={() => updateQuantity(item.id, -1)}>
                            {item.quantity === 1 ? <Trash2 className="h-4 w-4 text-destructive" /> : <Minus className="h-4 w-4" />}
                            </Button>
                            <span className="w-6 text-center text-sm font-black">{item.quantity}</span>
                            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-white shadow-sm" onClick={() => updateQuantity(item.id, 1)} disabled={isBeverage}>
                            <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        </div>
                    );
                    })}
                </div>
                )}
            </div>
          </ScrollArea>
          <div className="p-10 border-t bg-muted/5 space-y-8">
                <div className="w-full space-y-4 text-xs font-bold uppercase tracking-widest">
                    <div className="flex justify-between text-[#6b584b]">
                        <span>Subtotal</span>
                        <span>LKR {subtotal.toFixed(2)}</span>
                    </div>
                    {birthdayDiscountAmount > 0 && (
                    <div className="flex justify-between text-destructive font-black">
                        <span>Birthday Reward</span>
                        <span>- LKR {birthdayDiscountAmount.toFixed(2)}</span>
                    </div>
                    )}
                    {applicableWelcomeOffer && (
                    <div className="flex justify-between text-blue-600 font-black">
                        <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 fill-current"/> {applicableWelcomeOffer.label}</span>
                        <span>- LKR {welcomeDiscountAmount.toFixed(2)}</span>
                    </div>
                    )}
                    {!isEmailVerified && potentialWelcomeOffer && (
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start gap-4">
                        <MailWarning className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-amber-700 leading-none">Verify to Save {potentialWelcomeOffer.discount}%</p>
                            <p className="text-[9px] text-amber-600 font-medium normal-case leading-tight">Discount pending email verification.</p>
                            <Link href="/dashboard/profile" className="text-[10px] font-black underline text-amber-700 block mt-2">Verify Now</Link>
                        </div>
                    </div>
                    )}
                    {serviceCharge > 0 && (
                    <div className="flex justify-between text-muted-foreground/60">
                        <span>Service Charge (10%)</span>
                        <span>LKR {serviceCharge.toFixed(2)}</span>
                    </div>
                    )}
                    <div className="flex justify-between text-4xl font-black text-[#2c1810] uppercase tracking-tighter pt-6 border-t border-muted/50">
                        <span>Total</span>
                        <span className="text-primary">LKR {cartTotal.toFixed(2)}</span>
                    </div>
                </div>
                 <Button size="lg" className="w-full h-20 rounded-full text-xl font-black uppercase tracking-[0.1em] shadow-2xl group transition-all" disabled={cart.length === 0 || isProcessing} onClick={handleProceedToCheckout}>
                    {isProcessing ? (
                        <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Processing...</>
                    ) : (
                        <>Checkout <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" /></>
                    )}
                </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
