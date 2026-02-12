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
import { collection, doc, query, where } from 'firebase/firestore';
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
          toast({ title: "Already in bag", description: "This drink is already in your order." });
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

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleAddonToggle = (addon: Addon) => {
    setSelectedAddons(prev => {
      if (prev.find(a => a.id === addon.id)) {
        return prev.filter(a => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  const confirmCustomization = () => {
    if (!customizingItem) return;
    const { menuItem, displayPrice, appliedDailyOfferId } = customizingItem;
    
    const errors: Record<string, string> = {};
    menuItem.addonGroups?.forEach(group => {
      const selectedInGroup = selectedAddons.filter(a => a.addonCategoryId === group.addonCategoryId);
      if (group.isRequired && selectedInGroup.length < group.minSelection) {
        errors[group.addonCategoryId] = `Required: ${group.minSelection}`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const addonPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const cartId = `${menuItem.id}-${Date.now()}`;
    const newCartItem: CartItem = {
      id: cartId,
      menuItem,
      addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
      quantity: 1,
      totalPrice: displayPrice + addonPrice,
      appliedDailyOfferId: appliedDailyOfferId,
    };

    setCart(prev => [...prev, newCartItem]);
    setCustomizationOpen(false);
    setCustomizingItem(null);
    setSelectedAddons([]);
    setIsCartOpen(true);
  };

  const applicableWelcomeOffer = useMemo(() => {
    if (!userProfile || (userProfile.orderCount ?? 0) >= 3 || !isEmailVerified) return null;
    return WELCOME_OFFERS.find(o => o.order === (userProfile.orderCount ?? 0));
  }, [userProfile, isEmailVerified]);

  const subtotal = cart.reduce((total, item) => total + (item.totalPrice * item.quantity), 0);
  const welcomeDiscountAmount = applicableWelcomeOffer ? subtotal * (applicableWelcomeOffer.discount / 100) : 0;
  const birthdayDiscountAmount = userProfile?.birthdayDiscountValue ? (userProfile.birthdayDiscountType === 'percentage' ? subtotal * (userProfile.birthdayDiscountValue / 100) : userProfile.birthdayDiscountValue) : 0;
  
  const discountedSubtotal = Math.max(0, subtotal - birthdayDiscountAmount - welcomeDiscountAmount);
  const serviceCharge = orderType === 'Dine-in' ? discountedSubtotal * 0.10 : 0;
  const totalBeforePoints = discountedSubtotal + serviceCharge;
  const cartTotal = totalBeforePoints - Math.min(totalBeforePoints, appliedPoints);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleProceedToCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    localStorage.setItem('checkoutData', JSON.stringify({
        cart, subtotal, serviceCharge, appliedPoints, 
        birthdayDiscountAmount, welcomeDiscountAmount, 
        cartTotal, orderType, tableNumber, welcomeOfferApplied: !!applicableWelcomeOffer,
    }));
    router.push('/dashboard/checkout');
  };

  return (
    <div className="w-full">
      <Dialog open={isOrderTypeDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
           {dialogStep === 'type' && (
             <>
                <DialogHeader>
                    <DialogTitle className="text-center">Welcome to Steamsbury</DialogTitle>
                    <DialogDescription className="text-center">How will you be joining us today?</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <Button variant="outline" className="h-32 flex-col gap-2 rounded-3xl" onClick={() => handleTypeSelect('Dine-in')}>
                        <Utensils className="h-8 w-8 text-primary"/>
                        <span>Dine-in</span>
                    </Button>
                     <Button variant="outline" className="h-32 flex-col gap-2 rounded-3xl" onClick={() => handleTypeSelect('Takeaway')}>
                        <ShoppingBag className="h-8 w-8 text-primary"/>
                        <span>Takeaway</span>
                    </Button>
                </div>
             </>
           )}
           {dialogStep === 'table' && (
               <>
                <DialogHeader>
                    <DialogTitle className="text-center">Select Your Table</DialogTitle>
                    <DialogDescription className="text-center">We'll bring your order right to you.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                            <Button key={num} variant="outline" className="h-16 text-lg rounded-xl" onClick={() => handleTableSelect(String(num))}>
                                {num}
                            </Button>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setDialogStep('type')}>Back</Button>
                </DialogFooter>
               </>
           )}
        </DialogContent>
      </Dialog>
      
      {!isOrderTypeDialogOpen && (
        <div className="relative">
            {/* STICKY HEADER AREA */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md pt-4 pb-6 -mx-4 px-4 sm:-mx-8 sm:px-8 border-b space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-headline font-black uppercase tracking-tight text-[#2c1810]">
                            Menu • <span className="text-primary">{orderType}</span>
                            {orderType === 'Dine-in' && tableNumber && <span className="text-muted-foreground ml-2">#{tableNumber}</span>}
                        </h2>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setOrderTypeDialogOpen(true); setDialogStep('type'); }} className="h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
                        <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset Selection
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-center">
                        <div className="bg-muted/50 p-1 rounded-full flex gap-1 border w-full sm:w-auto">
                            {MAIN_GROUPS.map((group) => (
                                <button
                                    key={group}
                                    className={cn(
                                        "flex-1 sm:flex-none flex items-center justify-center rounded-full px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                        selectedMainGroup === group ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => setSelectedMainGroup(group)}
                                >
                                    {group === 'Beverages' ? <Coffee className="mr-2 h-3.5 w-3.5" /> : <Pizza className="mr-2 h-3.5 w-3.5" />}
                                    {group}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto flex gap-2 pb-2 scrollbar-hide">
                        {filteredCategories.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setActiveTab(category.id)}
                                className={cn(
                                    "whitespace-nowrap px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border-2 transition-all",
                                    activeTab === category.id 
                                        ? "bg-[#2c1810] border-[#2c1810] text-white shadow-md scale-105" 
                                        : "bg-white border-muted-foreground/10 text-muted-foreground hover:border-primary/30"
                                )}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN MENU CONTENT */}
            <div className="pt-12">
                {filteredCategories.map(subCategory => (
                    <div key={subCategory.id} className={cn("space-y-8 animate-in fade-in duration-500", activeTab !== subCategory.id && "hidden")}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {sortedMenuItems.filter(item => item.categoryId === subCategory.id).map(item => {
                                const todayString = format(new Date(), 'yyyy-MM-dd');
                                const offer = dailyOffers.find(o => {
                                    if (!o.menuItemIds?.includes(item.id)) return false;
                                    if (o.orderType !== 'Both' && o.orderType !== orderType) return false;
                                    return todayString >= o.offerStartDate && todayString <= o.offerEndDate;
                                });

                                const alreadyRedeemed = offer && userProfile?.dailyOffersRedeemed?.[offer.id] === todayString;
                                let displayPrice = item.price;
                                let isOfferApplied = false;
                                
                                if (offer && userProfile?.loyaltyLevelId && !alreadyRedeemed) {
                                    const userTierDiscount = offer.tierDiscounts?.[userProfile.loyaltyLevelId] || 0;
                                    if (userTierDiscount > 0) {
                                        const isPercentage = (offer.discountType as string) === 'percentage' || (offer.discountType as string) === 'percent';
                                        displayPrice = isPercentage ? item.price - (item.price * userTierDiscount / 100) : item.price - userTierDiscount;
                                        isOfferApplied = true;
                                    }
                                }
                                displayPrice = Math.max(0, displayPrice);

                                return (
                                    <Card key={item.id} className={cn("flex flex-col overflow-hidden shadow-lg border-0 bg-white group hover:shadow-2xl transition-all duration-500 rounded-[2rem]", item.isOutOfStock && "opacity-60")}>
                                        <div className="relative aspect-[4/3] overflow-hidden">
                                            <Image
                                                src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`}
                                                alt={item.name}
                                                fill
                                                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                                data-ai-hint="food item"
                                            />
                                            {item.isOutOfStock && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                                    <Badge variant="destructive" className="h-10 px-6 uppercase font-black text-[9px]">Out of Stock</Badge>
                                                </div>
                                            )}
                                            {isOfferApplied && !item.isOutOfStock && (
                                                <Badge className="absolute top-4 right-4 bg-primary text-white px-3 py-1 shadow-lg animate-pulse rounded-full border-0">
                                                    <Tag className="h-3 w-3 mr-1.5 fill-current"/> 
                                                    <span className="font-black text-[9px] uppercase">Member Special</span>
                                                </Badge>
                                            )}
                                        </div>
                                        <CardContent className="p-6 flex-grow">
                                            <CardTitle className="font-headline text-xl mb-2 text-[#2c1810] leading-none">{item.name}</CardTitle>
                                            <CardDescription className="line-clamp-2 text-[#6b584b] text-xs font-medium leading-relaxed">{item.description}</CardDescription>
                                        </CardContent>
                                        <CardFooter className="px-6 pb-6 pt-0 flex justify-between items-end">
                                            <div className="flex flex-col">
                                                {isOfferApplied && <span className="text-[9px] text-muted-foreground line-through opacity-60 font-black uppercase">LKR {item.price.toFixed(2)}</span>}
                                                <span className="font-black text-xl text-primary tracking-tighter">LKR {displayPrice.toFixed(2)}</span>
                                            </div>
                                            <Button size="icon" onClick={() => addToCart(item, displayPrice, offer?.id)} disabled={item.isOutOfStock} className="rounded-full w-12 h-12 bg-[#2c1810] hover:bg-primary transition-all shadow-lg p-0 shrink-0">
                                                {item.isOutOfStock ? <Minus className="h-4 w-4" /> : <Plus className="h-5 w-5" />}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      <Dialog open={isCustomizationOpen} onOpenChange={setCustomizationOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-[3rem] border-none">
          <div className="p-8 bg-background">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-black text-[#2c1810] uppercase tracking-tighter">{customizingItem?.menuItem.name}</DialogTitle>
              <DialogDescription className="text-xs font-medium text-[#6b584b]">Customize your selection below.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[50vh] mt-6 pr-4">
              <div className="space-y-8 pb-4">
                {customizingItem?.menuItem.addonGroups?.map(group => {
                  const category = addonCategories?.find(c => c.id === group.addonCategoryId);
                  const groupAddons = allAddons?.filter(a => a.addonCategoryId === group.addonCategoryId && a.isActive !== false);
                  return (
                    <div key={group.addonCategoryId} className="space-y-4">
                      <div className="flex justify-between items-baseline border-b pb-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#2c1810]">{category?.name || 'Options'}</Label>
                        {group.isRequired && <Badge variant="outline" className="text-[8px] h-4 border-primary text-primary px-2">REQUIRED</Badge>}
                      </div>
                      <div className="grid gap-2">
                        {groupAddons?.map(addon => (
                          <div 
                            key={addon.id} 
                            onClick={() => handleAddonToggle(addon)}
                            className={cn(
                                "flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all cursor-pointer group",
                                selectedAddons.find(a => a.id === addon.id) ? "bg-primary/5 border-primary" : "hover:border-primary/20"
                            )}
                          >
                            <Checkbox 
                              checked={!!selectedAddons.find(a => a.id === addon.id)} 
                              onCheckedChange={() => handleAddonToggle(addon)}
                              className="h-5 w-5"
                            />
                            <Label className="flex-grow cursor-pointer font-bold text-sm">{addon.name}</Label>
                            <span className="font-black text-[10px] text-primary">+ LKR {addon.price.toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                      {validationErrors[group.addonCategoryId] && (
                        <p className="text-[9px] font-bold text-destructive uppercase tracking-widest">{validationErrors[group.addonCategoryId]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <DialogFooter className="mt-8">
              <Button size="lg" className="w-full h-16 rounded-full text-sm font-black uppercase tracking-widest shadow-2xl" onClick={confirmCustomization}>
                Add to Bag <PlusCircle className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetTrigger asChild>
          <Button onClick={() => setIsCartOpen(true)} className="fixed bottom-8 right-8 rounded-full w-20 h-20 shadow-[0_20px_50px_rgba(217,119,6,0.4)] z-50 transition-all active:scale-90 group border-0 bg-primary hover:bg-[#b45309]">
            <ShoppingCart className="h-8 w-8 text-white" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-primary rounded-full h-10 w-10 flex items-center justify-center text-sm font-black ring-4 ring-primary shadow-xl">
                {cartItemCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex h-full flex-col w-full sm:max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-l-[3rem]">
          <SheetHeader className="p-10 border-b bg-muted/10">
            <SheetTitle className="font-headline text-3xl uppercase tracking-tighter text-[#2c1810]">Your Order</SheetTitle>
            <SheetDescription className="font-bold text-[#6b584b] uppercase tracking-widest text-[10px]">Review items before checkout.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-10">
                {cart.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center justify-center space-y-6">
                    <ShoppingBag className="w-16 h-16 text-muted-foreground/20" />
                    <p className="font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Your bag is empty</p>
                    </div>
                ) : (
                <div className="space-y-8">
                    {cart.map(item => (
                        <div key={item.id} className="flex items-center gap-6 animate-in fade-in slide-in-from-right-4">
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-md border">
                                <Image
                                    src={item.menuItem.imageUrl || `https://picsum.photos/seed/${item.menuItem.id}/100/100`}
                                    alt={item.menuItem.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="font-black text-base leading-tight truncate text-[#2c1810] uppercase">{item.menuItem.name}</p>
                                {item.addons.length > 0 && (
                                    <p className="text-[8px] text-[#6b584b] font-bold uppercase tracking-widest truncate mt-1">
                                        {item.addons.map(addon => `+ ${addon.name}`).join(', ')}
                                    </p>
                                )}
                                <p className="text-sm font-black text-primary mt-1">LKR {item.totalPrice.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-full shrink-0">
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-white" onClick={() => updateQuantity(item.id, -1)}>
                                    {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5 text-destructive" /> : <Minus className="h-3.5 w-3.5" />}
                                </Button>
                                <span className="w-4 text-center text-xs font-black">{item.quantity}</span>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-white" onClick={() => updateQuantity(item.id, 1)}>
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                )}
            </div>
          </ScrollArea>
          <div className="p-10 border-t bg-muted/5 space-y-6">
                <div className="w-full space-y-3 text-[10px] font-black uppercase tracking-widest">
                    <div className="flex justify-between text-[#6b584b]">
                        <span>Subtotal</span>
                        <span>LKR {subtotal.toFixed(2)}</span>
                    </div>
                    {birthdayDiscountAmount > 0 && (
                        <div className="flex justify-between text-destructive">
                            <span>Birthday Reward</span>
                            <span>- LKR {birthdayDiscountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    {applicableWelcomeOffer && (
                        <div className="flex justify-between text-blue-600">
                            <span>{applicableWelcomeOffer.label}</span>
                            <span>- LKR {welcomeDiscountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    {serviceCharge > 0 && (
                        <div className="flex justify-between text-muted-foreground/60">
                            <span>Service Charge (10%)</span>
                            <span>LKR {serviceCharge.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-3xl font-black text-[#2c1810] tracking-tighter pt-4 border-t">
                        <span>Total</span>
                        <span className="text-primary">LKR {cartTotal.toFixed(2)}</span>
                    </div>
                </div>
                 <Button size="lg" className="w-full h-16 rounded-full text-sm font-black uppercase tracking-widest shadow-2xl" disabled={cart.length === 0 || isProcessing} onClick={handleProceedToCheckout}>
                    {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Working...</> : <>Checkout <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
