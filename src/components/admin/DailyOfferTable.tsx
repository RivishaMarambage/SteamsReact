"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DailyOffer, MenuItem, Category, LoyaltyLevel } from '@/lib/types';
import { MoreHorizontal, PlusCircle, Calendar as CalendarIcon, Tag, Percent, Search, FilterX, CheckCircle2, Circle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { addDays, format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Calendar } from '../ui/calendar';
import { DateRange } from 'react-day-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

const today = new Date();

const getInitialFormData = (levels: LoyaltyLevel[]): Omit<DailyOffer, 'id'> => {
  const tierDiscounts = levels.reduce((acc, level) => {
    acc[level.id] = 0;
    return acc;
  }, {} as Record<string, number>);

  return {
    title: '',
    menuItemIds: [],
    offerStartDate: format(today, 'yyyy-MM-dd'),
    offerEndDate: format(addDays(today, 7), 'yyyy-MM-dd'),
    tierDiscounts,
    discountType: 'fixed',
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
    return loyaltyLevelsRaw.filter(l => l.name.toLowerCase() !== 'standard');
  }, [loyaltyLevelsRaw]);

  const [formData, setFormData] = useState(getInitialFormData(loyaltyLevels));
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: addDays(today, 7),
  });
  const { toast } = useToast();

  const isLoading = areOffersLoading || areMenuItemsLoading || areLevelsLoading || areCategoriesLoading;

  const filteredOffers = useMemo(() => {
    if (!offers || !menuItems) return [];
    
    return offers.filter(offer => {
      const itemsInOffer = menuItems.filter(m => offer.menuItemIds?.includes(m.id));
      const itemNames = itemsInOffer.map(i => i.name.toLowerCase()).join(' ');
      
      const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           itemNames.includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || itemsInOffer.some(i => i.categoryId === categoryFilter);
      
      return matchesSearch && matchesCategory;
    }).sort((a, b) => (b.offerStartDate || '').localeCompare(a.offerStartDate || ''));
  }, [offers, menuItems, searchTerm, categoryFilter]);

  const groupedMenuItems = useMemo(() => {
    if (!menuItems || !categories) return {};
    return categories.reduce((acc, cat) => {
      const items = menuItems.filter(item => item.categoryId === cat.id);
      if (items.length > 0) {
        acc[cat.name] = items;
      }
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menuItems, categories]);

  useEffect(() => {
    if (loyaltyLevels.length > 0 && !selectedOffer) {
      setFormData(getInitialFormData(loyaltyLevels));
    }
  }, [loyaltyLevels, selectedOffer]);

  useEffect(() => {
    if (isFormOpen) {
      if (selectedOffer && loyaltyLevels.length > 0) {
        const fromDate = selectedOffer.offerStartDate ? parseISO(selectedOffer.offerStartDate) : new Date();
        const toDate = selectedOffer.offerEndDate ? parseISO(selectedOffer.offerEndDate) : addDays(new Date(), 7);
        
        const tierDiscounts = loyaltyLevels.reduce((acc, level) => {
          acc[level.id] = selectedOffer.tierDiscounts?.[level.id] || 0;
          return acc;
        }, {} as Record<string, number>);

        setFormData({
          title: selectedOffer.title,
          menuItemIds: selectedOffer.menuItemIds || [],
          offerStartDate: selectedOffer.offerStartDate,
          offerEndDate: selectedOffer.offerEndDate,
          discountType: selectedOffer.discountType,
          orderType: selectedOffer.orderType || 'Both',
          tierDiscounts,
        });
        setDateRange({ from: fromDate, to: toDate });
      } else if (loyaltyLevels.length > 0) {
        setFormData(getInitialFormData(loyaltyLevels));
        setDateRange({ from: today, to: addDays(today, 7) });
      }
    }
  }, [isFormOpen, selectedOffer, menuItems, loyaltyLevels]);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
        setFormData(prev => ({
            ...prev,
            offerStartDate: format(dateRange.from!, 'yyyy-MM-dd'),
            offerEndDate: format(dateRange.to!, 'yyyy-MM-dd'),
        }));
    }
  }, [dateRange]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleItem = (itemId: string) => {
    setFormData(prev => {
      const current = prev.menuItemIds || [];
      if (current.includes(itemId)) {
        return { ...prev, menuItemIds: current.filter(id => id !== itemId) };
      }
      return { ...prev, menuItemIds: [...current, itemId] };
    });
  };

  const handleSelectAll = () => {
    if (!menuItems) return;
    setFormData(prev => ({ ...prev, menuItemIds: menuItems.map(m => m.id) }));
  };

  const handleDeselectAll = () => {
    setFormData(prev => ({ ...prev, menuItemIds: [] }));
  };

  const handleToggleCategory = (categoryName: string) => {
    const itemsInCategory = groupedMenuItems[categoryName];
    if (!itemsInCategory) return;
    
    const itemIds = itemsInCategory.map(i => i.id);
    const currentlySelected = formData.menuItemIds || [];
    const allSelected = itemIds.every(id => currentlySelected.includes(id));

    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        menuItemIds: currentlySelected.filter(id => !itemIds.includes(id))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        menuItemIds: Array.from(new Set([...currentlySelected, ...itemIds]))
      }));
    }
  };

  const handleEdit = (offer: DailyOffer) => {
    setSelectedOffer(offer);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedOffer(null);
    setFormOpen(true);
  };
  
  const handleDelete = (offer: DailyOffer) => {
    setSelectedOffer(offer);
    setAlertOpen(true);
  }
  
  const confirmDelete = async () => {
    if(!selectedOffer || !firestore) return;
    await deleteDoc(doc(firestore, "daily_offers", selectedOffer.id));

    toast({ title: "Offer Deleted", description: `The offer "${selectedOffer.title}" has been removed.`});
    setAlertOpen(false);
    setSelectedOffer(null);
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    if (!formData.title || !formData.menuItemIds?.length || !formData.offerStartDate || !formData.offerEndDate) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all fields and select at least one item." });
        return;
    }

    if (selectedOffer) {
      await setDoc(doc(firestore, "daily_offers", selectedOffer.id), formData, { merge: true });
      toast({ title: "Offer Updated", description: `The offer "${formData.title}" has been updated.`});
    } else {
      await addDoc(collection(firestore, "daily_offers"), formData);
      toast({ title: "Offer Added", description: `The offer "${formData.title}" has been created.`});
    }

    setFormOpen(false);
    setSelectedOffer(null);
  };
  
  if (isLoading) {
    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <CardTitle className="font-headline text-2xl">Daily Offers</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search offers..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48 h-10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchTerm !== '' || categoryFilter !== 'all') && (
            <Button variant="ghost" size="icon" onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }}>
              <FilterX className="h-4 w-4" />
            </Button>
          )}

          <Button size="sm" onClick={handleAddNew} className="h-10 ml-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Offer
          </Button>
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
                    <TableCell><Badge variant="outline">{offer.offerStartDate} to {offer.offerEndDate}</Badge></TableCell>
                    <TableCell className="font-bold">{offer.title}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary"><Package className="h-3 w-3 mr-1" /> {offer.menuItemIds?.length || 0} Items</Badge>
                        </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{offer.orderType || 'Both'}</Badge></TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1">
                        {loyaltyLevels.map(level => {
                            const discount = offer.tierDiscounts?.[level.id];
                            if (discount > 0) {
                            return (
                                <div key={level.id} className="text-xs">
                                <span className="font-semibold capitalize">{level.name}: </span> 
                                {offer.discountType === 'percentage' ? `${discount}%` : `LKR ${discount.toFixed(2)}`}
                                </div>
                            )
                            }
                            return null;
                        })}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
                <Card key={offer.id} className="rounded-2xl border-2">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{offer.title}</CardTitle>
                            <Badge variant="secondary">{offer.orderType || 'Both'}</Badge>
                        </div>
                        <CardDescription>{offer.menuItemIds?.length || 0} Items Selected</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            <span className="text-xs font-medium">{offer.offerStartDate} — {offer.offerEndDate}</span>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl space-y-1">
                            {loyaltyLevels.map(level => {
                                const discount = offer.tierDiscounts?.[level.id];
                                if (discount > 0) {
                                    return (
                                        <div key={level.id} className="flex justify-between text-xs">
                                            <span className="capitalize text-muted-foreground">{level.name}</span>
                                            <span className="font-bold text-primary">{offer.discountType === 'percentage' ? `${discount}%` : `LKR ${discount.toFixed(2)}`}</span>
                                        </div>
                                    )
                                }
                                return null;
                            })}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end pt-0">
                         <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4 mr-2" /> Manage
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(offer)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(offer)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem]">
          <form onSubmit={handleFormSubmit} className="flex flex-col h-full">
            <div className="p-8 border-b bg-muted/10">
              <DialogHeader>
                <DialogTitle className="font-headline">{selectedOffer ? 'Edit Offer' : 'Add New Offer'}</DialogTitle>
                <DialogDescription>Apply discounts to multiple menu items across various tiers.</DialogDescription>
              </DialogHeader>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-8 space-y-10">
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Offer Title</Label>
                    <Input id="title" name="title" value={formData.title} onChange={handleFormChange} required placeholder="e.g., Muffin Monday" className="h-12 rounded-xl" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                      <Label>Date Range</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-12 rounded-xl", !dateRange && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}</> : format(dateRange.from, "LLL dd")) : <span>Pick a date</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                          </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-2">
                      <Label>Order Type</Label>
                      <RadioGroup value={formData.orderType} onValueChange={(v) => setFormData(p => ({ ...p, orderType: v as any }))} className="flex gap-2 bg-muted/50 p-1 rounded-xl h-12">
                          {['Both', 'Dine-in', 'Takeaway'].map((type) => (
                              <div key={type} className="flex-1">
                                  <RadioGroupItem value={type} id={`form-type-${type}`} className="sr-only" />
                                  <Label htmlFor={`form-type-${type}`} className={cn(
                                      "flex items-center justify-center h-full rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all",
                                      formData.orderType === type ? "bg-white shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
                                  )}>
                                      {type}
                                  </Label>
                              </div>
                          ))}
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-6">
                  <div className="flex items-end justify-between gap-4">
                    <div className="space-y-1">
                      <Label className="text-base font-headline uppercase tracking-tight">Select Menu Items</Label>
                      <p className="text-xs text-muted-foreground">Select multiple items to apply this offer.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase" onClick={handleSelectAll}>Select All</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase text-destructive" onClick={handleDeselectAll}>Clear</Button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {Object.entries(groupedMenuItems).map(([categoryName, items]) => (
                      <div key={categoryName} className="space-y-4">
                        <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                          <h4 className="font-black text-xs uppercase tracking-[0.2em] text-primary">{categoryName}</h4>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-[9px] font-black uppercase px-2 hover:bg-primary/10"
                            onClick={() => handleToggleCategory(categoryName)}
                          >
                            Toggle Category
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {items.map(item => {
                            const isChecked = formData.menuItemIds?.includes(item.id);
                            return (
                              <div 
                                key={item.id} 
                                className={cn(
                                  "flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                                  isChecked ? "bg-primary/5 border-primary shadow-inner" : "border-muted hover:border-primary/30"
                                )}
                                onClick={() => handleToggleItem(item.id)}
                              >
                                <Checkbox 
                                  id={`item-${item.id}`} 
                                  checked={isChecked}
                                  onCheckedChange={() => handleToggleItem(item.id)}
                                  className="h-5 w-5"
                                />
                                <Label htmlFor={`item-${item.id}`} className="flex-1 text-sm font-bold truncate cursor-pointer">
                                  {item.name}
                                </Label>
                                <span className="text-[10px] font-black text-muted-foreground">LKR {item.price.toFixed(0)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="p-6 border-2 border-primary/10 bg-primary/5 rounded-[2rem] space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-headline uppercase tracking-tight">Tier Discounts</Label>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Set specific savings per level</p>
                        </div>
                        <RadioGroup value={formData.discountType} onValueChange={(v) => setFormData(p => ({ ...p, discountType: v as any }))} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fixed" id="form-discount-fixed" />
                                <Label htmlFor="form-discount-fixed" className='flex items-center gap-1 text-xs font-black'>LKR</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="percentage" id="form-discount-percent" />
                                <Label htmlFor="form-discount-percent" className='flex items-center gap-1 text-xs font-black'><Percent className="h-3 w-3"/> %</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className='grid grid-cols-2 gap-6'>
                        {loyaltyLevels.map(level => (
                        <div className="grid gap-2" key={level.id}>
                            <Label htmlFor={`tier-${level.id}`} className='capitalize text-[10px] font-black text-muted-foreground uppercase tracking-widest'>{level.name}</Label>
                            <Input
                            id={`tier-${level.id}`}
                            type="number"
                            step="0.01"
                            className="h-12 rounded-xl bg-white border-primary/20 focus:ring-primary font-bold"
                            placeholder={formData.discountType === 'fixed' ? 'LKR' : '%'}
                            value={formData.tierDiscounts[level.id] || 0}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              setFormData(prev => ({
                                ...prev,
                                tierDiscounts: { ...prev.tierDiscounts, [level.id]: val }
                              }))
                            }}
                            />
                        </div>
                        ))}
                    </div>
                </div>
              </div>
            </ScrollArea>

            <div className="p-8 border-t bg-muted/10 flex flex-col sm:flex-row gap-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="flex-1 h-14 rounded-full font-black uppercase tracking-widest">Cancel</Button>
              <Button type="submit" className="flex-1 h-14 rounded-full font-black uppercase tracking-widest shadow-xl">
                {selectedOffer ? 'Update Promotion' : 'Launch Promotion'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="rounded-[2rem]">
            <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Delete Promotion?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this offer from all associated menu items. This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full px-6">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-full px-8">Delete Forever</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}