
"use client";

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DailyOffer, MenuItem, Category, LoyaltyLevel } from '@/lib/types';
import { MoreHorizontal, PlusCircle, Search, ChevronDown, ChevronRight, Tag, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

const getInitialFormData = (levels: LoyaltyLevel[]): Omit<DailyOffer, 'id'> => {
  const tierDiscounts = levels.reduce((acc, level) => {
    acc[level.id] = 0;
    return acc;
  }, {} as Record<string, number>);

  const today = new Date();
  return {
    title: '',
    menuItemIds: [],
    offerStartDate: format(today, 'yyyy-MM-dd'),
    offerEndDate: format(addDays(today, 7), 'yyyy-MM-dd'),
    tierDiscounts,
    discountType: 'percentage',
    orderType: 'Both',
  };
};

export default function DailyOfferTable() {
  const firestore = useFirestore();
  const { data: offers, isLoading: areOffersLoading } = useCollection<DailyOffer>("daily_offers");
  const { data: menuItems, isLoading: areMenuItemsLoading } = useCollection<MenuItem>("menu_items");
  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>("categories");
  const loyaltyLevelsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "loyalty_levels"), orderBy("minimumPoints")) : null, [firestore]);
  const { data: loyaltyLevelsRaw, isLoading: areLevelsLoading } = useCollection<LoyaltyLevel>(loyaltyLevelsQuery);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isFormOpen, setFormOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<DailyOffer | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  const loyaltyLevels = useMemo(() => {
    if (!loyaltyLevelsRaw) return [];
    return loyaltyLevelsRaw.filter(l => l.name.toLowerCase() !== 'standard');
  }, [loyaltyLevelsRaw]);

  const [formData, setFormData] = useState<Omit<DailyOffer, 'id'>>(() => getInitialFormData([]));
  const { toast } = useToast();

  const isLoading = areOffersLoading || areMenuItemsLoading || areLevelsLoading || areCategoriesLoading;

  const filteredOffers = useMemo(() => {
    if (!offers) return [];
    return offers.filter(offer => {
      const matchSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    }).sort((a, b) => (b.offerStartDate || '').localeCompare(a.offerStartDate || ''));
  }, [offers, searchTerm]);

  const groupedMenuItems = useMemo(() => {
    if (!menuItems || !categories) return {};
    const sortedCats = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    return sortedCats.reduce((acc, cat) => {
      const items = menuItems.filter(item => item.categoryId === cat.id);
      if (items.length > 0) acc[cat.name] = items;
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menuItems, categories]);

  const handleToggleItem = useCallback((itemId: string) => {
    setFormData(prev => {
      const current = prev.menuItemIds || [];
      const updated = current.includes(itemId) 
        ? current.filter(id => id !== itemId) 
        : [...current, itemId];
      return { ...prev, menuItemIds: updated };
    });
  }, []);

  const handleToggleCategory = useCallback((categoryName: string) => {
    const itemsInCategory = groupedMenuItems[categoryName] || [];
    const itemIds = itemsInCategory.map(i => i.id);
    
    setFormData(prev => {
      const current = prev.menuItemIds || [];
      const allSelected = itemIds.every(id => current.includes(id));
      if (allSelected) {
        return { ...prev, menuItemIds: current.filter(id => !itemIds.includes(id)) };
      } else {
        return { ...prev, menuItemIds: Array.from(new Set([...current, ...itemIds])) };
      }
    });
  }, [groupedMenuItems]);

  const handleEdit = (offer: DailyOffer) => {
    const tierDiscounts = loyaltyLevels.reduce((acc, level) => {
      acc[level.id] = offer.tierDiscounts?.[level.id] || 0;
      return acc;
    }, {} as Record<string, number>);

    setFormData({
      title: offer.title || '',
      menuItemIds: offer.menuItemIds || [],
      offerStartDate: offer.offerStartDate || format(new Date(), 'yyyy-MM-dd'),
      offerEndDate: offer.offerEndDate || format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      discountType: offer.discountType === 'percentage' ? 'percentage' : 'fixed',
      orderType: offer.orderType || 'Both',
      tierDiscounts,
    });
    setExpandedCategories({});
    setSelectedOffer(offer);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setFormData(getInitialFormData(loyaltyLevels));
    setExpandedCategories({});
    setSelectedOffer(null);
    setFormOpen(true);
  };
  
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    if (!formData.title || !formData.menuItemIds?.length) {
        toast({ variant: "destructive", title: "Selection Required", description: "Select at least one item." });
        return;
    }

    try {
        if (selectedOffer) {
          await setDoc(doc(firestore, "daily_offers", selectedOffer.id), formData, { merge: true });
        } else {
          await addDoc(collection(firestore, "daily_offers"), formData);
        }
        setFormOpen(false);
        toast({ title: "Promotion Saved" });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Save Error", description: error.message });
    }
  };
  
  if (isLoading) return <div className="space-y-4 p-8"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>;

  return (
    <Card className="shadow-lg border-none overflow-hidden">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/5 pb-8 border-b">
        <CardTitle className="font-headline text-3xl uppercase tracking-tighter text-[#2c1810]">Promotions</CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-11 rounded-xl" />
          </div>
          <Button size="lg" onClick={handleAddNew} className="h-11 rounded-xl px-6 shadow-xl"><PlusCircle className="mr-2 h-4 w-4" /> New Campaign</Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Validity</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Benefit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffers.map(offer => (
              <TableRow key={offer.id} className="hover:bg-muted/10 transition-colors">
                <TableCell><Badge variant="outline" className="font-mono text-[10px]">{offer.offerStartDate} / {offer.offerEndDate}</Badge></TableCell>
                <TableCell className="font-black uppercase tracking-tight text-sm">{offer.title}</TableCell>
                <TableCell><Badge variant="secondary" className="rounded-md">{(offer.menuItemIds || []).length} Items</Badge></TableCell>
                <TableCell>
                    <div className="flex flex-wrap gap-1">
                    {loyaltyLevels.map(level => {
                        const discount = offer.tierDiscounts?.[level.id];
                        if (discount > 0) {
                            return <Badge key={level.id} variant="outline" className="text-[8px] font-black uppercase border-primary/30">{level.name}: {offer.discountType === 'percentage' ? `${discount}%` : `LKR ${discount}`}</Badge>;
                        }
                        return null;
                    })}
                    </div>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(offer)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive font-bold" onClick={() => { setSelectedOffer(offer); setAlertOpen(true); }}>Terminate</DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 border-none shadow-3xl overflow-hidden rounded-[3rem]">
          <form onSubmit={handleFormSubmit} className="flex flex-col h-full bg-background">
            <div className="p-10 border-b shrink-0 flex justify-between items-center bg-muted/5">
              <DialogHeader>
                <DialogTitle className="font-headline text-4xl uppercase tracking-tighter text-primary">Promotion Builder</DialogTitle>
                <DialogDescription className="font-black text-[10px] uppercase tracking-[0.3em] text-[#6b584b]">Configuration & Incentives</DialogDescription>
              </DialogHeader>
              <Button type="button" variant="ghost" size="icon" onClick={() => setFormOpen(false)} className="rounded-full h-12 w-12"><X className="h-6 w-6" /></Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-12">
                <div className="grid gap-10">
                  <div className="grid gap-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Campaign Title</Label>
                    <Input name="title" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} required className="h-16 rounded-2xl px-6 text-xl font-bold border-2 focus:ring-primary shadow-sm" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Validity Window</Label>
                      <div className="flex gap-3">
                        <Input type="date" value={formData.offerStartDate} onChange={(e) => setFormData(p => ({ ...p, offerStartDate: e.target.value }))} className="h-14 rounded-2xl px-4 border-2 font-mono font-bold" />
                        <Input type="date" value={formData.offerEndDate} onChange={(e) => setFormData(p => ({ ...p, offerEndDate: e.target.value }))} className="h-14 rounded-2xl px-4 border-2 font-mono font-bold" />
                      </div>
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Order Context</Label>
                      <div className="flex gap-2 bg-muted/50 p-1.5 rounded-2xl h-14 border-2 shadow-inner">
                          {['Both', 'Dine-in', 'Takeaway'].map((type) => (
                              <button key={type} type="button" onClick={() => setFormData(p => ({ ...p, orderType: type as any }))} className={cn("flex-1 rounded-xl text-[10px] font-black uppercase transition-all", formData.orderType === type ? "bg-white shadow-lg text-primary" : "text-muted-foreground hover:text-foreground")}>{type}</button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b-2 pb-4">
                    <h3 className="text-3xl font-headline font-black uppercase tracking-tighter text-[#2c1810] italic">Menu Selection</h3>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setFormData(p => ({ ...p, menuItemIds: menuItems?.map(i => i.id) || [] }))} className="rounded-full text-[9px] font-black uppercase tracking-widest px-4">Select All</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(p => ({ ...p, menuItemIds: [] }))} className="rounded-full text-[9px] font-black uppercase tracking-widest px-4 text-destructive">Clear</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {Object.entries(groupedMenuItems).map(([categoryName, items]) => {
                      const isExpanded = !!expandedCategories[categoryName];
                      const selectedInCat = items.filter(i => (formData.menuItemIds || []).includes(i.id));
                      const allInCatSelected = items.length > 0 && selectedInCat.length === items.length;
                      
                      return (
                        <div key={categoryName} className="border-2 rounded-[2rem] overflow-hidden bg-background">
                          <div className="flex items-center justify-between p-5 bg-muted/10 h-[72px]">
                            <div className="flex items-center gap-4 cursor-pointer select-none flex-1 h-full" onClick={() => setExpandedCategories(p => ({ ...p, [categoryName]: !isExpanded }))}>
                                {isExpanded ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5" />}
                                <span className="font-black text-xs uppercase tracking-[0.2em]">{categoryName}</span>
                                {selectedInCat.length > 0 && <span className="bg-primary text-white text-[10px] h-6 w-6 flex items-center justify-center rounded-full font-black">{selectedInCat.length}</span>}
                            </div>
                            <div 
                                onClick={(e) => { e.stopPropagation(); handleToggleCategory(categoryName); }}
                                className={cn("h-9 text-[9px] font-black uppercase tracking-widest px-6 rounded-full transition-all border-2 cursor-pointer flex items-center justify-center", allInCatSelected ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground hover:border-primary/30")}
                            >
                                {allInCatSelected ? 'Selected' : 'Select Section'}
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {items.map(item => {
                                const isChecked = (formData.menuItemIds || []).includes(item.id);
                                return (
                                  <div key={item.id} className={cn("flex items-center space-x-4 p-5 rounded-2xl border-2 transition-all cursor-pointer h-[84px]", isChecked ? "bg-primary/5 border-primary" : "border-muted/50 hover:border-primary/20")} onClick={() => handleToggleItem(item.id)}>
                                    <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors", isChecked ? "bg-primary border-primary text-white" : "border-muted-foreground/30")}>
                                        {isChecked && <Check className="h-3 w-3 stroke-[4]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black truncate uppercase tracking-tight">{item.name}</p>
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">LKR {item.price.toFixed(0)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-10 border-2 border-primary/10 bg-primary/5 rounded-[3rem] space-y-10 shadow-inner">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <h3 className="text-3xl font-headline font-black uppercase tracking-tighter italic">Tier Incentives</h3>
                        <div className="flex gap-2 bg-white/50 p-1.5 rounded-full h-14 border-2 w-full sm:w-56 shadow-sm">
                            {['fixed', 'percentage'].map((type) => (
                                <button key={type} type="button" onClick={() => setFormData(p => ({ ...p, discountType: type as any }))} className={cn("flex-1 flex items-center justify-center rounded-full text-[10px] font-black transition-all", formData.discountType === type ? "bg-primary text-white shadow-xl scale-105" : "text-muted-foreground hover:text-foreground")}>{type === 'fixed' ? 'LKR OFF' : '% OFF'}</button>
                            ))}
                        </div>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-10'>
                        {loyaltyLevels.map(level => (
                        <div className="grid gap-3" key={level.id}>
                            <Label className='text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-2'>{level.name} Benefit</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="h-16 rounded-2xl bg-white border-2 font-black px-8 text-xl shadow-sm"
                                    value={formData.tierDiscounts[level.id] || 0}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                      setFormData(prev => ({ ...prev, tierDiscounts: { ...prev.tierDiscounts, [level.id]: val } }));
                                    }}
                                />
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 text-primary font-black uppercase text-[10px] tracking-widest">{formData.discountType === 'fixed' ? 'LKR' : '%'}</div>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-10 border-t bg-muted/10 flex flex-col sm:flex-row gap-4 shrink-0 rounded-t-[3rem]">
              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)} className="flex-1 h-16 rounded-full font-black uppercase tracking-widest text-muted-foreground">Discard</Button>
              <Button type="submit" className="flex-1 h-16 rounded-full font-black uppercase tracking-widest shadow-2xl bg-primary hover:bg-[#b45309] text-white">Save Promotion</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="rounded-[3rem] border-none shadow-3xl p-12">
            <AlertDialogHeader className="space-y-6">
                <AlertDialogTitle className="font-headline text-4xl text-center uppercase tracking-tighter">Terminate Campaign?</AlertDialogTitle>
                <AlertDialogDescription className="text-center font-bold text-[#6b584b] text-base leading-relaxed">This action cannot be undone. The promotion will be removed from all future eligibility.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center gap-4 mt-10">
                <AlertDialogCancel className="rounded-full h-16 border-2 font-black uppercase tracking-widest flex-1">Keep Active</AlertDialogCancel>
                <AlertDialogAction onClick={async () => { if(selectedOffer && firestore) { await deleteDoc(doc(firestore, "daily_offers", selectedOffer.id)); toast({ title: "Campaign Terminated" }); setAlertOpen(false); } }} className="bg-destructive hover:bg-destructive/90 rounded-full h-16 font-black uppercase tracking-widest flex-1 border-none shadow-xl">Terminate Now</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
