
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
import { MoreHorizontal, PlusCircle, Calendar as CalendarIcon, Tag, Search, FilterX, ChevronRight, Check, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { addDays, format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
import { DateRange } from 'react-day-picker';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

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
  const offersQuery = useMemoFirebase(() => firestore ? collection(firestore, "daily_offers") : null, [firestore]);
  const menuItemsQuery = useMemoFirebase(() => firestore ? collection(firestore, "menu_items") : null, [firestore]);
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, "categories") : null, [firestore]);
  const loyaltyLevelsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "loyalty_levels"), orderBy("minimumPoints")) : null, [firestore]);

  const { data: offers, isLoading: areOffersLoading } = useCollection<DailyOffer>(offersQuery);
  const { data: menuItems, isLoading: areMenuItemsLoading } = useCollection<MenuItem>(menuItemsQuery);
  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);
  const { data: loyaltyLevelsRaw, isLoading: areLevelsLoading } = useCollection<LoyaltyLevel>(loyaltyLevelsQuery);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<DailyOffer | null>(null);
  
  const loyaltyLevels = useMemo(() => {
    if (!loyaltyLevelsRaw) return [];
    return loyaltyLevelsRaw.filter(l => l.name.toLowerCase() !== 'standard' && l.name.toLowerCase() !== 'none');
  }, [loyaltyLevelsRaw]);

  const [formData, setFormData] = useState<Omit<DailyOffer, 'id'>>(() => getInitialFormData([]));
  const { toast } = useToast();

  const isLoading = areOffersLoading || areMenuItemsLoading || areLevelsLoading || areCategoriesLoading;

  const filteredOffers = useMemo(() => {
    if (!offers || !menuItems) return [];
    
    return offers.filter(offer => {
      const itemsInOffer = menuItems.filter(m => (offer.menuItemIds || []).includes(m.id));
      const itemNames = itemsInOffer.map(i => i.name.toLowerCase()).join(' ');
      
      const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           itemNames.includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || itemsInOffer.some(i => i.categoryId === categoryFilter);
      
      return matchesSearch && matchesCategory;
    }).sort((a, b) => (b.offerStartDate || '').localeCompare(a.offerStartDate || ''));
  }, [offers, menuItems, searchTerm, categoryFilter]);

  const groupedMenuItems = useMemo(() => {
    if (!menuItems || !categories) return {};
    const sortedCats = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    return sortedCats.reduce((acc, cat) => {
      const items = menuItems.filter(item => item.categoryId === cat.id);
      if (items.length > 0) {
        acc[cat.name] = items;
      }
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menuItems, categories]);

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    if (range?.from) {
      setFormData(prev => ({
        ...prev,
        offerStartDate: format(range.from!, 'yyyy-MM-dd'),
        offerEndDate: range.to ? format(range.to, 'yyyy-MM-dd') : format(range.from!, 'yyyy-MM-dd'),
      }));
    }
  }, []);

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
    const itemsInCategory = groupedMenuItems[categoryName];
    if (!itemsInCategory) return;
    
    const itemIds = itemsInCategory.map(i => i.id);
    setFormData(prev => {
      const currentlySelected = prev.menuItemIds || [];
      const allSelected = itemIds.every(id => currentlySelected.includes(id));
      
      if (allSelected) {
        return {
          ...prev,
          menuItemIds: currentlySelected.filter(id => !itemIds.includes(id))
        };
      } else {
        return {
          ...prev,
          menuItemIds: Array.from(new Set([...currentlySelected, ...itemIds]))
        };
      }
    });
  }, [groupedMenuItems]);

  const handleSelectAll = useCallback(() => {
    if (!menuItems) return;
    setFormData(prev => ({ ...prev, menuItemIds: menuItems.map(m => m.id) }));
  }, [menuItems]);

  const handleDeselectAll = useCallback(() => {
    setFormData(prev => ({ ...prev, menuItemIds: [] }));
  }, []);

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
      discountType: (offer.discountType as string) === 'percent' ? 'percentage' : (offer.discountType || 'fixed'),
      orderType: offer.orderType || 'Both',
      tierDiscounts,
    });
    setSelectedOffer(offer);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setFormData(getInitialFormData(loyaltyLevels));
    setSelectedOffer(null);
    setFormOpen(true);
  };
  
  const handleDelete = (offer: DailyOffer) => {
    setSelectedOffer(offer);
    setAlertOpen(true);
  };
  
  const confirmDelete = async () => {
    if(!selectedOffer || !firestore) return;
    await deleteDoc(doc(firestore, "daily_offers", selectedOffer.id));
    toast({ title: "Offer Deleted", description: `The offer "${selectedOffer.title}" has been removed.`});
    setAlertOpen(false);
    setSelectedOffer(null);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    if (!formData.title || !formData.menuItemIds?.length) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all fields and select at least one item." });
        return;
    }

    try {
        if (selectedOffer) {
          await setDoc(doc(firestore, "daily_offers", selectedOffer.id), formData, { merge: true });
          toast({ title: "Offer Updated", description: `The offer "${formData.title}" has been updated.`});
        } else {
          await addDoc(collection(firestore, "daily_offers"), formData);
          toast({ title: "Offer Added", description: `The offer "${formData.title}" has been created.`});
        }
        setFormOpen(false);
        setSelectedOffer(null);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error Saving", description: error.message });
    }
  };
  
  const calendarRange = useMemo((): DateRange => ({
    from: formData.offerStartDate ? parseISO(formData.offerStartDate) : undefined,
    to: formData.offerEndDate ? parseISO(formData.offerEndDate) : undefined,
  }), [formData.offerStartDate, formData.offerEndDate]);

  if (isLoading) {
    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </CardHeader>
            <CardContent><div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-16 w-full" /></div></CardContent>
        </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <CardTitle className="font-headline text-2xl uppercase tracking-tight text-[#2c1810]">Daily Offers</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search offers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-10 rounded-full" />
          </div>
          
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-4 rounded-full bg-muted/50 border-none text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="all">All Categories</option>
            {categories?.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {(searchTerm !== '' || categoryFilter !== 'all') && (
            <Button variant="ghost" size="icon" onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }} className="rounded-full"><FilterX className="h-4 w-4" /></Button>
          )}
          <Button size="sm" onClick={handleAddNew} className="h-10 ml-auto rounded-full px-6 shadow-lg"><PlusCircle className="mr-2 h-4 w-4" /> Add New Offer</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="hidden md:block">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Date Range</TableHead>
                <TableHead>Offer Title</TableHead>
                <TableHead>Target Items</TableHead>
                <TableHead>Order Type</TableHead>
                <TableHead>Discounts</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredOffers.map(offer => (
                    <TableRow key={offer.id}>
                    <TableCell><Badge variant="outline" className="rounded-md font-mono">{offer.offerStartDate} to {offer.offerEndDate}</Badge></TableCell>
                    <TableCell className="font-bold text-lg">{offer.title}</TableCell>
                    <TableCell><Badge variant="secondary" className="rounded-md bg-primary/5 text-primary">{(offer.menuItemIds || []).length} Items</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="rounded-md">{offer.orderType || 'Both'}</Badge></TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1">
                        {loyaltyLevels.map(level => {
                            const discount = offer.tierDiscounts?.[level.id];
                            const isPercentage = (offer.discountType as string) === 'percentage' || (offer.discountType as string) === 'percent';
                            if (discount > 0) {
                                return (
                                    <div key={level.id} className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                        <span className="text-primary">{level.name}: </span> 
                                        {isPercentage ? `${discount}%` : `LKR ${discount.toFixed(2)}`}
                                    </div>
                                )
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
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(offer)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
        <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredOffers.map(offer => (
                <Card key={offer.id} className="rounded-3xl border-2 p-4 space-y-4 shadow-sm">
                    <div className="flex justify-between items-start">
                        <h3 className="font-headline font-bold text-xl">{offer.title}</h3>
                        <Badge variant="secondary">{offer.orderType}</Badge>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">{offer.offerStartDate} to {offer.offerEndDate}</div>
                    <div className="flex justify-between pt-2">
                        <span className="text-xs font-bold uppercase text-muted-foreground">{(offer.menuItemIds || []).length} Items</span>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(offer)}>Edit</Button>
                    </div>
                </Card>
            ))}
        </div>
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <form onSubmit={handleFormSubmit} className="flex flex-col h-full">
            <div className="p-8 border-b bg-muted/10 shrink-0">
              <DialogHeader>
                <DialogTitle className="font-headline text-3xl uppercase tracking-tighter text-primary">{selectedOffer ? 'Edit Promotion' : 'New Promotion'}</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Configure your multi-item rewards.</DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-background p-8 space-y-12">
                <div className="grid gap-8">
                  <div className="grid gap-3">
                    <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Promotion Title</Label>
                    <Input id="title" name="title" value={formData.title} onChange={handleFormChange} required placeholder="e.g., Muffin Monday" className="h-14 rounded-2xl px-6 text-lg font-bold border-2" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="grid gap-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Validity</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                              <Button variant={"outline"} type="button" className={cn("w-full justify-start text-left font-mono h-14 rounded-2xl px-6 border-2")}>
                                <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                                {formData.offerStartDate} to {formData.offerEndDate}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar initialFocus mode="range" defaultMonth={calendarRange.from} selected={calendarRange} onSelect={handleDateRangeChange} numberOfMonths={2} />
                          </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Order Type</Label>
                      <div className="flex gap-2 bg-muted/50 p-1 rounded-2xl h-14 border-2">
                          {['Both', 'Dine-in', 'Takeaway'].map((type) => (
                              <div key={type} className="flex-1">
                                  <div 
                                      role="button"
                                      onClick={() => setFormData(p => ({ ...p, orderType: type as any }))}
                                      className={cn(
                                          "flex items-center justify-center h-full rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all",
                                          formData.orderType === type ? "bg-white shadow-lg text-primary" : "text-muted-foreground"
                                      )}
                                  >
                                      {type}
                                  </div>
                              </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <h3 className="text-2xl font-headline font-black uppercase tracking-tighter text-[#2c1810]">Menu Selection</h3>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="h-10 rounded-full px-6 text-[10px] font-black uppercase border-2" onClick={handleSelectAll}>All Items</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-10 rounded-full px-6 text-[10px] font-black uppercase text-destructive" onClick={handleDeselectAll}>Clear</Button>
                    </div>
                  </div>

                  <Accordion type="multiple" className="space-y-4">
                    {Object.entries(groupedMenuItems).map(([categoryName, items]) => {
                      const selectedInCat = items.filter(i => (formData.menuItemIds || []).includes(i.id));
                      const selectedCount = selectedInCat.length;
                      const allSelectedInCat = selectedCount === items.length;
                      
                      return (
                        <AccordionItem key={categoryName} value={categoryName} className="border-2 rounded-[1.5rem] overflow-hidden bg-background">
                          <div className="flex items-center bg-muted/5 pr-4">
                            <AccordionTrigger className="px-6 h-16 hover:no-underline flex-1">
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-xs uppercase tracking-widest">{categoryName}</span>
                                    {selectedCount > 0 && <Badge className="bg-primary text-white text-[10px] rounded-full">{selectedCount}</Badge>}
                                </div>
                            </AccordionTrigger>
                            <span 
                                role="button"
                                className="h-8 text-[9px] font-black uppercase tracking-[0.1em] px-4 rounded-full bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors flex items-center cursor-pointer select-none"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleCategory(categoryName); }}
                            >
                                {allSelectedInCat ? 'Deselect Section' : 'Select Section'}
                            </span>
                          </div>
                          <AccordionContent className="p-6 border-t">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {items.map(item => {
                                const isChecked = (formData.menuItemIds || []).includes(item.id);
                                return (
                                  <div 
                                    key={item.id} 
                                    className={cn(
                                      "flex items-center space-x-4 p-4 rounded-[1.25rem] border-2 transition-all cursor-pointer",
                                      isChecked ? "bg-primary/5 border-primary shadow-sm" : "border-muted/50 hover:border-primary/20"
                                    )}
                                    onClick={() => handleToggleItem(item.id)}
                                  >
                                    <Checkbox checked={isChecked} className="h-6 w-6 pointer-events-none" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black truncate uppercase">{item.name}</p>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase">LKR {item.price.toFixed(0)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>

                <Separator />

                <div className="p-8 border-2 border-primary/10 bg-primary/5 rounded-[2.5rem] space-y-10 pb-24">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <h3 className="text-2xl font-headline font-black uppercase tracking-tighter">Tier Discounts</h3>
                        <Tabs value={formData.discountType} onValueChange={(v) => setFormData(p => ({ ...p, discountType: v as any }))}>
                          <TabsList className="grid w-full grid-cols-2 bg-white/50 p-1 rounded-full h-12 border-2">
                            <TabsTrigger value="fixed" className="rounded-full text-[10px] font-black uppercase px-6">LKR</TabsTrigger>
                            <TabsTrigger value="percentage" className="rounded-full text-[10px] font-black uppercase px-6">Percent</TabsTrigger>
                          </TabsList>
                        </Tabs>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-8'>
                        {loyaltyLevels.map(level => (
                        <div className="grid gap-3" key={level.id}>
                            <Label className='text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2'>{level.name} SAVINGS</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="h-14 rounded-2xl bg-white border-2 font-bold px-6 text-lg"
                                    value={formData.tierDiscounts[level.id] || 0}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                      setFormData(prev => ({
                                          ...prev,
                                          tierDiscounts: { ...prev.tierDiscounts, [level.id]: val }
                                      }))
                                    }}
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black opacity-50 uppercase text-[10px]">
                                    {formData.discountType === 'fixed' ? 'LKR' : '%'}
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-8 border-t bg-muted/10 flex flex-col sm:flex-row gap-4 shrink-0">
              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)} className="flex-1 h-16 rounded-full font-black uppercase tracking-widest text-muted-foreground">Discard</Button>
              <Button type="submit" className="flex-1 h-16 rounded-full font-black uppercase tracking-widest shadow-2xl">
                {selectedOffer ? 'Update' : 'Launch'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] p-10">
            <AlertDialogHeader className="space-y-4">
                <AlertDialogTitle className="font-headline text-3xl text-center uppercase tracking-tighter">Terminate Campaign?</AlertDialogTitle>
                <AlertDialogDescription className="text-center">This will permanently remove the promotion.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center gap-4 mt-8">
                <AlertDialogCancel className="rounded-full h-14 px-8 border-2 font-bold flex-1">Keep</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-full h-14 px-10 font-bold flex-1 text-white border-none">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
