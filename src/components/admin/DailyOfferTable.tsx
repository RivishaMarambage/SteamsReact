
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
import { MoreHorizontal, PlusCircle, Calendar as CalendarIcon, Tag, Percent, Search, FilterX } from 'lucide-react';
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

const today = new Date();

const getInitialFormData = (levels: LoyaltyLevel[]): Omit<DailyOffer, 'id'> => {
  const tierDiscounts = levels.reduce((acc, level) => {
    acc[level.id] = 0;
    return acc;
  }, {} as Record<string, number>);

  return {
    title: '',
    menuItemId: '',
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
  
  // Filter out "Standard" tier
  const loyaltyLevels = useMemo(() => {
    if (!loyaltyLevelsRaw) return [];
    return loyaltyLevelsRaw.filter(l => l.name.toLowerCase() !== 'standard');
  }, [loyaltyLevelsRaw]);

  const [formData, setFormData] = useState(getInitialFormData(loyaltyLevels));
  const [formCategoryFilter, setFormCategoryFilter] = useState('all');
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: addDays(today, 7),
  });
  const { toast } = useToast();

  const isLoading = areOffersLoading || areMenuItemsLoading || areLevelsLoading || areCategoriesLoading;

  const filteredOffers = useMemo(() => {
    if (!offers || !menuItems) return [];
    
    return offers.filter(offer => {
      const item = menuItems.find(m => m.id === offer.menuItemId);
      const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item?.categoryId === categoryFilter;
      
      return matchesSearch && matchesCategory;
    }).sort((a, b) => (b.offerStartDate || '').localeCompare(a.offerStartDate || ''));
  }, [offers, menuItems, searchTerm, categoryFilter]);

  const formMenuItems = useMemo(() => {
    if (!menuItems) return [];
    if (formCategoryFilter === 'all') return menuItems;
    return menuItems.filter(item => item.categoryId === formCategoryFilter);
  }, [menuItems, formCategoryFilter]);

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

        const item = menuItems?.find(m => m.id === selectedOffer.menuItemId);
        setFormCategoryFilter(item?.categoryId || 'all');

        setFormData({
          title: selectedOffer.title,
          menuItemId: selectedOffer.menuItemId,
          offerStartDate: selectedOffer.offerStartDate,
          offerEndDate: selectedOffer.offerEndDate,
          discountType: selectedOffer.discountType,
          orderType: selectedOffer.orderType || 'Both',
          tierDiscounts,
        });
        setDateRange({ from: fromDate, to: toDate });
      } else if (loyaltyLevels.length > 0) {
        setFormData(getInitialFormData(loyaltyLevels));
        setFormCategoryFilter('all');
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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
     setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTierDiscountChange = (tierId: string, value: string) => {
    const numericValue = value === '' ? 0 : parseFloat(value);
    setFormData(prev => ({
      ...prev,
      tierDiscounts: {
        ...prev.tierDiscounts,
        [tierId]: numericValue,
      }
    }))
  }

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

    if (!formData.title || !formData.menuItemId || !formData.offerStartDate || !formData.offerEndDate) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all fields." });
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

  const getMenuItemName = (menuItemId: string) => menuItems?.find(m => m.id === menuItemId)?.name || 'N/A';
  const getCategoryName = (categoryId: string) => categories?.find(c => c.id === categoryId)?.name || 'N/A';

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
                <TableHead>Menu Item</TableHead>
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
                    <TableCell>{getMenuItemName(offer.menuItemId)}</TableCell>
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
                        <CardDescription>{getMenuItemName(offer.menuItemId)}</CardDescription>
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-[2rem]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className="font-headline">{selectedOffer ? 'Edit Offer' : 'Add New Offer'}</DialogTitle>
              <DialogDescription>Configure details and tier discounts for this promotion.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Offer Title</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleFormChange} required placeholder="e.g., Muffin Monday" />
              </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label>Menu Category Filter</Label>
                    <Select value={formCategoryFilter} onValueChange={setFormCategoryFilter}>
                        <SelectTrigger className="rounded-xl h-10">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories?.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="menuItemId">Menu Item</Label>
                    <select
                      id="menuItemId"
                      name="menuItemId"
                      value={formData.menuItemId || ''}
                      onChange={handleFormChange}
                      required
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="" disabled>Select an item</option>
                      {formMenuItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Date Range</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-10", !dateRange && "text-muted-foreground")}>
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
                    <RadioGroup value={formData.orderType} onValueChange={(v) => setFormData(p => ({ ...p, orderType: v as any }))} className="flex gap-2 bg-muted/50 p-1 rounded-lg">
                        {['Both', 'Dine-in', 'Takeaway'].map((type) => (
                            <div key={type} className="flex-1">
                                <RadioGroupItem value={type} id={`form-type-${type}`} className="sr-only" />
                                <Label htmlFor={`form-type-${type}`} className={cn(
                                    "flex items-center justify-center h-8 rounded-md text-[10px] font-bold uppercase cursor-pointer transition-all",
                                    formData.orderType === type ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                )}>
                                    {type}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                  </div>
               </div>

                <div className="p-4 border-2 rounded-2xl space-y-6">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-headline uppercase tracking-tight">Tier Discounts</Label>
                        <RadioGroup value={formData.discountType} onValueChange={(v) => setFormData(p => ({ ...p, discountType: v as any }))} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fixed" id="form-discount-fixed" />
                                <Label htmlFor="form-discount-fixed" className='flex items-center gap-1 text-xs font-bold'>LKR</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="percentage" id="form-discount-percent" />
                                <Label htmlFor="form-discount-percent" className='flex items-center gap-1 text-xs font-bold'><Percent className="h-3 w-3"/> %</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                        {loyaltyLevels.map(level => (
                        <div className="grid gap-2" key={level.id}>
                            <Label htmlFor={`tier-${level.id}`} className='capitalize text-xs font-bold text-muted-foreground'>{level.name}</Label>
                            <Input
                            id={`tier-${level.id}`}
                            type="number"
                            step="0.01"
                            className="h-10 rounded-xl"
                            placeholder={formData.discountType === 'fixed' ? 'LKR' : '%'}
                            value={formData.tierDiscounts[level.id] || 0}
                            onChange={(e) => handleTierDiscountChange(level.id, e.target.value)}
                            />
                        </div>
                        ))}
                    </div>
                </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="rounded-full px-6">Cancel</Button>
              <Button type="submit" className="rounded-full px-8">Save Promotion</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="rounded-[2rem]">
            <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Delete Promotion?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this offer. Customers will no longer see these discounts.</AlertDialogDescription>
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
