"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { MenuItem, CartItem, Category, Order, UserProfile, DailyOffer, Addon, AddonCategory } from '@/lib/types';
import { ShoppingCart, Minus, Plus, Trash2, Tag, Utensils, ShoppingBag, Sparkles, ArrowRight, Loader2, RotateCcw, Coffee, Pizza, ChevronRight, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { useRouter } from 'next/navigation';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '../ui/label';

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

export default function MenuDisplay({ menuItems, dailyOffers }: MenuDisplayProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<Order['orderType'] | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [selectedMainGroup, setSelectedMainGroup] = useState<Category['type']>(MAIN_GROUPS[0]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const router = useRouter();

  const [isCustomizationOpen, setCustomizationOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<{ menuItem: MenuItem, displayPrice: number, appliedDailyOfferId?: string } | null>(null);
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
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, "categories") : null, [firestore]);
  const { data: categories } = useCollection<Category>(categoriesQuery);

  const addonsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'addons') : null, [firestore]);
  const { data: allAddons } = useCollection<Addon>(addonsQuery);

  const addonCategoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'addon_categories') : null, [firestore]);
  const { data: addonCategories } = useCollection<AddonCategory>(addonCategoriesQuery);

  const sortedMenuItems = useMemo(() => {
    return [...menuItems].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [menuItems]);

  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    return [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [categories]);

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
    if (!item.addonGroups || item.addonGroups.length === 0) {
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

    setCustomizingItem({ menuItem: item, displayPrice, appliedDailyOfferId });
    setSelectedAddons([]);
    setValidationErrors({});
    setCustomizationOpen(true);
  }, []);

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

  const subtotal = cart.reduce((total, item) => total + (item.totalPrice * item.quantity), 0);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleProceedToCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    // Calculate final totals for storage
    const welcomeOffer = userProfile && (userProfile.orderCount ?? 0) < 3 && isEmailVerified
      ? WELCOME_OFFERS.find(o => o.order === (userProfile.orderCount ?? 0)) : null;
    const wDiscount = welcomeOffer ? subtotal * (welcomeOffer.discount / 100) : 0;
    const bDiscount = userProfile?.birthdayDiscountValue ? (userProfile.birthdayDiscountType === 'percentage' ? subtotal * (userProfile.birthdayDiscountValue / 100) : userProfile.birthdayDiscountValue) : 0;
    const discSub = Math.max(0, subtotal - bDiscount - wDiscount);
    const sCharge = orderType === 'Dine-in' ? discSub * 0.10 : 0;

    localStorage.setItem('checkoutData', JSON.stringify({
      cart, subtotal, serviceCharge: sCharge, appliedPoints: 0,
      birthdayDiscountAmount: bDiscount, welcomeDiscountAmount: wDiscount,
      cartTotal: discSub + sCharge, orderType, tableNumber, welcomeOfferApplied: !!welcomeOffer,
    }));
    router.push('/dashboard/checkout');
  };

  const scrollToCategory = (id: string) => {
    const element = document.getElementById(`cat-${id}`);
    if (element) {
      const offset = 180;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full">
      <Dialog open={isOrderTypeDialogOpen} onOpenChange={() => { }}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          {dialogStep === 'type' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center font-headline uppercase tracking-tight">How will you be joining us?</DialogTitle>
                <DialogDescription className="text-center">Select your order type to begin.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <Button variant="outline" className="h-40 flex-col gap-4 rounded-3xl border-2 hover:border-primary transition-all group" onClick={() => handleTypeSelect('Dine-in')}>
                  <Utensils className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-lg">Dine-in</span>
                </Button>
                <Button variant="outline" className="h-40 flex-col gap-4 rounded-3xl border-2 hover:border-primary transition-all group" onClick={() => handleTypeSelect('Takeaway')}>
                  <ShoppingBag className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-lg">Takeaway</span>
                </Button>
              </div>
            </>
          )}
          {dialogStep === 'table' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center font-headline">Select Your Table</DialogTitle>
                <DialogDescription className="text-center">Enter your table number for service.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                  {Array.from({ length: 15 }, (_, i) => i + 1).map(num => (
                    <Button key={num} variant="outline" className="h-12 sm:h-14 text-base sm:text-lg rounded-xl font-bold min-h-[44px]" onClick={() => handleTableSelect(String(num))}>
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogStep('type')} className="rounded-full">Back</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {!isOrderTypeDialogOpen && (
        <div className="space-y-12">
          {/* STICKY NAVIGATION */}
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md -mx-4 px-3 sm:px-4 md:-mx-8 md:px-8 py-3 sm:py-4 border-b space-y-3 sm:space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center justify-between">
              <h2 className="text-lg sm:text-xl md:text-2xl font-headline font-black uppercase tracking-tight text-[#2c1810]">
                Menu • <span className="text-primary">{orderType}</span>
                {orderType === 'Dine-in' && tableNumber && <span className="text-muted-foreground ml-2 opacity-50">#{tableNumber}</span>}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => { setOrderTypeDialogOpen(true); setDialogStep('type'); }} className="h-7 sm:h-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary px-2 sm:px-3">
                <RotateCcw className="mr-1 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="hidden xs:inline">Change</span> Context
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex justify-center">
                <div className="bg-muted/50 p-1 rounded-full flex gap-1 border shadow-inner w-full sm:w-auto overflow-x-auto no-scrollbar">
                  {MAIN_GROUPS.map((group) => (
                    <button
                      key={group}
                      className={cn(
                        "flex-1 sm:flex-none flex items-center justify-center rounded-full px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all whitespace-nowrap min-h-[44px]",
                        selectedMainGroup === group
                          ? "bg-primary text-white shadow-xl scale-105"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setSelectedMainGroup(group)}
                    >
                      {group === 'Beverages' ? <Coffee className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Pizza className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pb-2 justify-center md:justify-start">
                {sortedCategories.filter(c => c.type === selectedMainGroup).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className="shrink-0 px-3 sm:px-5 py-2 sm:py-2 rounded-full bg-muted border border-transparent hover:border-primary/30 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white hover:shadow-sm min-h-[44px] flex items-center"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CATEGORY SECTIONS */}
          <div className="space-y-24 pb-32">
            {sortedCategories.filter(c => c.type === selectedMainGroup).map(subCategory => {
              const subItems = sortedMenuItems.filter(item => item.categoryId === subCategory.id);
              if (subItems.length === 0) return null;

              return (
                <div key={subCategory.id} id={`cat-${subCategory.id}`} className="animate-in fade-in slide-in-from-left-4 duration-700">
                  <div className="flex items-center gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black uppercase tracking-tight text-[#2c1810] italic">
                      {subCategory.name}
                    </h3>
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6 md:gap-8 pb-6 sm:pb-8">
                    {subItems.map(item => {
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
                          const isPercentage = offer.discountType === 'percentage';
                          displayPrice = isPercentage ? item.price - (item.price * userTierDiscount / 100) : item.price - userTierDiscount;
                          isOfferApplied = true;
                        }
                      }
                      displayPrice = Math.max(0, displayPrice);

                      return (
                        <Card
                          key={item.id}
                          className={cn(
                            "flex flex-col w-full overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-500 group rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] bg-white",
                            item.isOutOfStock && "opacity-60 grayscale"
                          )}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <Image
                              src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`}
                              alt={item.name}
                              fill
                              className="object-cover transition-transform duration-1000 group-hover:scale-110"
                              data-ai-hint="food item"
                            />
                            {item.isOutOfStock && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                <Badge variant="destructive" className="h-6 px-3 text-[7px] font-black uppercase tracking-[0.2em] shadow-xl rounded-full">Sold Out</Badge>
                              </div>
                            )}
                            {isOfferApplied && !item.isOutOfStock && (
                              <Badge className="absolute top-1.5 right-1.5 sm:top-6 sm:right-6 bg-primary text-white px-2 py-0.5 sm:px-4 sm:py-1.5 shadow-lg animate-pulse rounded-full border-0">
                                <Tag className="h-2 w-2 sm:h-3 sm:w-3 mr-1 sm:mr-2 fill-current" />
                                <span className="font-black text-[7px] sm:text-[9px] uppercase tracking-widest">Deal</span>
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-2.5 sm:p-6 md:p-8 flex-grow flex flex-col justify-between">
                            <div>
                              <CardTitle className="font-headline text-xs sm:text-2xl mb-1 sm:mb-3 text-[#2c1810] tracking-tight group-hover:text-primary transition-colors line-clamp-2 leading-tight">{item.name}</CardTitle>
                              <CardDescription className="text-[#6b584b] line-clamp-2 leading-relaxed text-[10px] sm:text-sm font-medium hidden sm:block">
                                {item.description}
                              </CardDescription>
                            </div>
                            <div className="mt-2 sm:mt-6 md:mt-8 pt-2 sm:pt-5 md:pt-6 border-t border-muted/50 flex items-center justify-between gap-1">
                              <div className="flex flex-col">
                                {isOfferApplied && <span className="text-[7px] sm:text-[9px] text-muted-foreground line-through opacity-60 font-black mb-0">LKR {item.price.toFixed(0)}</span>}
                                <span className="font-black text-sm sm:text-2xl text-primary tracking-tighter">
                                  LKR {displayPrice.toFixed(0)}
                                </span>
                              </div>
                              <Button size="icon" onClick={() => addToCart(item, displayPrice, offer?.id)} disabled={item.isOutOfStock} className="rounded-full w-7 h-7 sm:w-12 sm:h-12 bg-[#2c1810] hover:bg-primary transition-all shadow-md min-w-[28px] min-h-[28px] sm:min-w-[44px] sm:min-h-[44px]">
                                <Plus className="h-3 w-3 sm:h-5 sm:w-5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CUSTOMIZATION DIALOG */}
      <Dialog open={isCustomizationOpen} onOpenChange={setCustomizationOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] border-none shadow-3xl max-h-[90vh]">
          <div className="p-6 sm:p-8 md:p-10 bg-background">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-headline font-black text-[#2c1810] uppercase tracking-tighter">{customizingItem?.menuItem.name}</DialogTitle>
              <DialogDescription className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#6b584b] opacity-70">Customize your selection</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[50vh] mt-6 sm:mt-8 pr-3 sm:pr-4">
              <div className="space-y-6 sm:space-y-8 md:space-y-10 pb-4 sm:pb-6">
                {customizingItem?.menuItem.addonGroups?.map(group => {
                  const category = addonCategories?.find(c => c.id === group.addonCategoryId);
                  const groupAddons = allAddons?.filter(a => a.addonCategoryId === group.addonCategoryId && a.isActive !== false);
                  return (
                    <div key={group.addonCategoryId} className="space-y-4 sm:space-y-5">
                      <div className="flex justify-between items-baseline border-b-2 border-muted pb-2 sm:pb-3">
                        <Label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#2c1810]">{category?.name || 'Options'}</Label>
                        {group.isRequired && <Badge variant="outline" className="text-[7px] sm:text-[8px] font-black h-4 sm:h-5 border-primary text-primary px-2 sm:px-3 rounded-full">REQUIRED</Badge>}
                      </div>
                      <div className="grid gap-3">
                        {groupAddons?.map(addon => (
                          <div
                            key={addon.id}
                            onClick={() => handleAddonToggle(addon)}
                            className={cn(
                              "flex items-center space-x-3 sm:space-x-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer group min-h-[56px]",
                              selectedAddons.find(a => a.id === addon.id)
                                ? "bg-primary/5 border-primary shadow-sm"
                                : "border-muted/50 hover:border-primary/30"
                            )}
                          >
                            <Checkbox
                              checked={!!selectedAddons.find(a => a.id === addon.id)}
                              onCheckedChange={() => handleAddonToggle(addon)}
                              className="h-5 w-5 sm:h-6 sm:w-6 min-h-[20px] min-w-[20px]"
                            />
                            <Label className="flex-grow cursor-pointer font-bold text-sm sm:text-base text-[#2c1810]">{addon.name}</Label>
                            <span className="font-black text-[10px] sm:text-xs text-primary whitespace-nowrap">+ LKR {addon.price.toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                      {validationErrors[group.addonCategoryId] && (
                        <p className="text-[10px] font-black text-destructive uppercase tracking-[0.2em] animate-pulse">{validationErrors[group.addonCategoryId]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <DialogFooter className="mt-6 sm:mt-8 md:mt-10">
              <Button size="lg" className="w-full h-14 sm:h-16 rounded-full text-xs sm:text-sm font-black uppercase tracking-widest shadow-[0_15px_40px_rgba(217,119,6,0.3)] bg-primary hover:bg-[#b45309] min-h-[56px]" onClick={confirmCustomization}>
                Add to Bag <PlusCircle className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* FLOATING CART BUTTON & SHEET */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetTrigger asChild>
          <Button onClick={() => setIsCartOpen(true)} className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-10 md:right-10 rounded-full w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shadow-[0_15px_40px_rgba(217,119,6,0.4)] sm:shadow-[0_25px_60px_rgba(217,119,6,0.5)] z-50 transition-all active:scale-90 group border-0 bg-[#2c1810] hover:bg-primary">
            <ShoppingCart className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-white group-hover:scale-110 transition-transform" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 sm:-top-2.5 sm:-right-2.5 md:-top-3 md:-right-3 bg-white text-primary rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 flex items-center justify-center text-sm sm:text-base md:text-lg font-black ring-2 sm:ring-3 md:ring-4 ring-primary shadow-2xl animate-in zoom-in">
                {cartItemCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex h-full flex-col w-full sm:max-w-md p-0 overflow-hidden border-none shadow-3xl rounded-l-[2rem] sm:rounded-l-[3rem] md:rounded-l-[4rem] bg-background">
          <SheetHeader className="p-6 sm:p-8 md:p-12 border-b bg-muted/10">
            <SheetTitle className="font-headline text-2xl sm:text-3xl md:text-4xl uppercase tracking-tighter text-[#2c1810]">Your Order</SheetTitle>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] text-[#6b584b] mt-2 opacity-60">Ready for Brewing</p>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-6 sm:p-8 md:p-12">
              {cart.length === 0 ? (
                <div className="text-center py-16 sm:py-20 md:py-24 flex flex-col items-center justify-center space-y-6 sm:space-y-8">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted/50 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/30" />
                  </div>
                  <p className="font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[9px] sm:text-[10px] text-muted-foreground px-4">Your bag is currently empty</p>
                  <Button variant="outline" onClick={() => setIsCartOpen(false)} className="rounded-full px-6 sm:px-8 uppercase font-bold text-xs tracking-widest h-11 sm:h-12 min-h-[44px]">Continue Browsing</Button>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8 md:space-y-10">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4 sm:gap-6 md:gap-8 animate-in fade-in slide-in-from-right-6 duration-500">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl overflow-hidden shrink-0 shadow-xl border-2 sm:border-4 border-white">
                        <Image
                          src={item.menuItem.imageUrl || `https://picsum.photos/seed/${item.menuItem.id}/100/100`}
                          alt={item.menuItem.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-black text-base sm:text-lg leading-tight truncate text-[#2c1810] uppercase tracking-tight">{item.menuItem.name}</p>
                        {item.addons.length > 0 && (
                          <p className="text-[8px] sm:text-[9px] text-primary font-black uppercase tracking-widest truncate mt-1 sm:mt-1.5 opacity-80">
                            {item.addons.map(addon => addon.name).join(' • ')}
                          </p>
                        )}
                        <p className="text-sm sm:text-base font-black text-primary mt-1.5 sm:mt-2">LKR {item.totalPrice.toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col items-center gap-2 sm:gap-3 bg-muted/30 p-1.5 sm:p-2 rounded-2xl shrink-0 border">
                        <Button size="icon" variant="ghost" className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl hover:bg-white shadow-sm min-h-[44px] min-w-[44px]" onClick={() => updateQuantity(item.id, 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-black">{item.quantity}</span>
                        <Button size="icon" variant="ghost" className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl hover:bg-white shadow-sm min-h-[44px] min-w-[44px]" onClick={() => updateQuantity(item.id, -1)}>
                          {item.quantity === 1 ? <Trash2 className="h-4 w-4 text-destructive" /> : <Minus className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-6 sm:p-8 md:p-12 border-t bg-[#2c1810] text-white space-y-6 sm:space-y-8 rounded-t-[2rem] sm:rounded-t-[3rem] md:rounded-t-[4rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
            <div className="w-full space-y-3 sm:space-y-4 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] opacity-80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>LKR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tighter pt-4 sm:pt-6 border-t border-white/10 opacity-100">
                <span className="uppercase text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] self-end mb-1 sm:mb-2">Grand Total</span>
                <span className="text-accent">LKR {subtotal.toFixed(2)}</span>
              </div>
            </div>
            <Button size="lg" className="w-full h-14 sm:h-16 md:h-20 rounded-full text-sm sm:text-base font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-2xl bg-primary hover:bg-[#b45309] text-white border-0 min-h-[56px]" disabled={cart.length === 0 || isProcessing} onClick={handleProceedToCheckout}>
              {isProcessing ? <><Loader2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> Finalizing...</> : <>Checkout <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5" /></>}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}