
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DailyOffer, MenuItem, Order, LoyaltyLevel } from '@/lib/types';
import { MoreHorizontal, PlusCircle, Calendar as CalendarIcon, Tag, Percent } from 'lucide-react';
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
    orderType: 'Takeaway',
  };
};

export default function DailyOfferTable() {
  const firestore = useFirestore();
  const offersQuery = useMemoFirebase(() => firestore ? collection(firestore, "daily_offers") : null, [firestore]);
  const menuItemsQuery = useMemoFirebase(() => firestore ? collection(firestore, "menu_items") : null, [firestore]);
  const loyaltyLevelsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "loyalty_levels"), orderBy("minimumPoints")) : null, [firestore]);

  const { data: offers, isLoading: areOffersLoading } = useCollection<DailyOffer>(offersQuery);
  const { data: menuItems, isLoading: areMenuItemsLoading } = useCollection<MenuItem>(menuItemsQuery);
  const { data: loyaltyLevels, isLoading: areLevelsLoading } = useCollection<LoyaltyLevel>(loyaltyLevelsQuery);
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<DailyOffer | null>(null);
  const [formData, setFormData] = useState(getInitialFormData(loyaltyLevels || []));
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: addDays(today, 7),
  });
  const { toast } = useToast();

  const isLoading = areOffersLoading || areMenuItemsLoading || areLevelsLoading;

  useEffect(() => {
    if (loyaltyLevels) {
      setFormData(getInitialFormData(loyaltyLevels));
    }
  }, [loyaltyLevels]);

  useEffect(() => {
    if (isFormOpen) {
      if (selectedOffer && loyaltyLevels) {
        const fromDate = parseISO(selectedOffer.offerStartDate);
        const toDate = parseISO(selectedOffer.offerEndDate);
        
        // Ensure all levels are present in the form data, even if not in the offer
        const tierDiscounts = loyaltyLevels.reduce((acc, level) => {
          acc[level.id] = selectedOffer.tierDiscounts[level.id] || 0;
          return acc;
        }, {} as Record<string, number>);

        setFormData({
          title: selectedOffer.title,
          menuItemId: selectedOffer.menuItemId,
          offerStartDate: selectedOffer.offerStartDate,
          offerEndDate: selectedOffer.offerEndDate,
          discountType: selectedOffer.discountType,
          orderType: selectedOffer.orderType,
          tierDiscounts,
        });
        setDateRange({ from: fromDate, to: toDate });
      } else if (loyaltyLevels) {
        setFormData({
          ...getInitialFormData(loyaltyLevels),
          menuItemId: menuItems && menuItems.length > 0 ? menuItems[0].id : '',
        });
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

   const handleDiscountTypeChange = (value: 'fixed' | 'percentage') => {
    setFormData(prev => ({ ...prev, discountType: value }));
  };

  const handleOrderTypeChange = (value: Order['orderType']) => {
    setFormData(prev => ({ ...prev, orderType: value }));
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

  const getMenuItemName = (menuItemId: string) => {
    return menuItems?.find(m => m.id === menuItemId)?.name || 'N/A';
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-2xl">Daily Offers</CardTitle>
        <Button size="sm" onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Offer
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Range</TableHead>
              <TableHead>Offer Title</TableHead>
              <TableHead>Menu Item</TableHead>
              <TableHead>Order Type</TableHead>
              <TableHead>Discounts</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers?.sort((a,b) => (b.offerStartDate || '').localeCompare(a.offerStartDate || '')).map(offer => {
              return (
                <TableRow key={offer.id}>
                  <TableCell><Badge variant="outline">{offer.offerStartDate} to {offer.offerEndDate}</Badge></TableCell>
                  <TableCell className="font-medium">{offer.title}</TableCell>
                  <TableCell>{getMenuItemName(offer.menuItemId)}</TableCell>
                  <TableCell><Badge variant="secondary">{offer.orderType}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {loyaltyLevels?.map(level => {
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
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className="font-headline">{selectedOffer ? 'Edit Offer' : 'Add New Offer'}</DialogTitle>
              <DialogDescription>{selectedOffer ? 'Make changes to the daily offer.' : 'Create a new daily offer for an item.'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Offer Title</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleFormChange} required placeholder="e.g., Muffin Monday" />
              </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="menuItemId">Menu Item</Label>
                    <select
                      id="menuItemId"
                      name="menuItemId"
                      value={formData.menuItemId || ''}
                      onChange={handleFormChange}
                      required
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="" disabled>Select an item</option>
                      {menuItems?.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Offer Date Range</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                            <Button
                              id="date"
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange?.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(dateRange.from, "LLL dd, y")
                                )
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                  </div>
               </div>
                <div className="grid gap-2">
                  <Label>Order Type</Label>
                  <RadioGroup value={formData.orderType} onValueChange={handleOrderTypeChange} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Dine-in" id="dine-in" />
                        <Label htmlFor="dine-in">Dine-in</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Takeaway" id="takeway" />
                        <Label htmlFor="takeway">Takeaway</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="grid gap-2">
                    <Label>Discount Type</Label>
                      <RadioGroup value={formData.discountType} onValueChange={handleDiscountTypeChange} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fixed" id="fixed" />
                            <Label htmlFor="fixed" className='flex items-center gap-1'><span className="font-bold">LKR</span> Fixed</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="percentage" id="percentage" />
                            <Label htmlFor="percentage" className='flex items-center gap-1'><Percent className="h-4 w-4"/> %</Label>
                        </div>
                    </RadioGroup>
                </div>
                <div className='grid gap-4'>
                  <Label>Tier Discounts</Label>
                  <div className='grid grid-cols-2 lg:grid-cols-3 gap-4'>
                    {loyaltyLevels?.map(level => (
                      <div className="grid gap-2" key={level.id}>
                        <Label htmlFor={`tier-${level.id}`} className='capitalize'>{level.name}</Label>
                        <Input
                          id={`tier-${level.id}`}
                          name={`tier-${level.id}`}
                          type="number"
                          step="0.01"
                          placeholder={formData.discountType === 'fixed' ? 'e.g., 50' : 'e.g., 10'}
                          value={formData.tierDiscounts[level.id] || 0}
                          onChange={(e) => handleTierDiscountChange(level.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this daily offer.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
