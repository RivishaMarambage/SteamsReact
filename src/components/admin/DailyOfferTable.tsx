
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DailyOffer, MenuItem, LoyaltyLevel, Order } from '@/lib/types';
import { MoreHorizontal, PlusCircle, Calendar as CalendarIcon, Tag, Percent, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, addDoc, orderBy, query } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

type TierDiscounts = { [key: string]: number | '' };
type FormData = Omit<DailyOffer, 'id' | 'tierDiscounts'> & { tierDiscounts: TierDiscounts };

const INITIAL_FORM_DATA: Omit<DailyOffer, 'id'> = {
  title: '',
  menuItemId: '',
  offerDate: format(new Date(), 'yyyy-MM-dd'),
  tierDiscounts: {},
  discountType: 'fixed',
  orderType: 'Pick up',
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
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM_DATA, tierDiscounts: {} });
  const { toast } = useToast();

  const isLoading = areOffersLoading || areMenuItemsLoading || areLevelsLoading;

  useEffect(() => {
    if (isFormOpen) {
      const initialTierDiscounts = loyaltyLevels?.reduce((acc, level) => {
        acc[level.id] = '';
        return acc;
      }, {} as TierDiscounts) || {};

      if (selectedOffer) {
        setFormData({
          title: selectedOffer.title,
          menuItemId: selectedOffer.menuItemId,
          offerDate: selectedOffer.offerDate,
          discountType: selectedOffer.discountType,
          orderType: selectedOffer.orderType,
          tierDiscounts: { ...initialTierDiscounts, ...selectedOffer.tierDiscounts },
        });
      } else {
        setFormData({
          ...INITIAL_FORM_DATA,
          menuItemId: menuItems && menuItems.length > 0 ? menuItems[0].id : '',
          tierDiscounts: initialTierDiscounts,
        });
      }
    }
  }, [isFormOpen, selectedOffer, menuItems, loyaltyLevels]);


  const handleTierDiscountChange = (tierId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      tierDiscounts: {
        ...prev.tierDiscounts,
        [tierId]: value === '' ? '' : parseFloat(value)
      }
    }));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

   const handleDiscountTypeChange = (value: 'fixed' | 'percentage') => {
    setFormData(prev => ({ ...prev, discountType: value }));
  };

  const handleOrderTypeChange = (value: Order['orderType']) => {
    setFormData(prev => ({ ...prev, orderType: value }));
  };
  
  const handleDateSelect = (date?: Date) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        offerDate: format(date, 'yyyy-MM-dd'),
      }));
    }
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

    if (!formData.title || !formData.menuItemId || !formData.offerDate) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill out title, item, and date." });
        return;
    }

    const finalTierDiscounts: { [key: string]: number } = {};
    for (const tierId in formData.tierDiscounts) {
        const discount = formData.tierDiscounts[tierId];
        if (discount !== '' && !isNaN(Number(discount))) {
            finalTierDiscounts[tierId] = Number(discount);
        }
    }

    if (Object.keys(finalTierDiscounts).length === 0) {
        toast({ variant: "destructive", title: "No Discounts Set", description: "Please set a discount for at least one loyalty tier." });
        return;
    }

    const finalData: Omit<DailyOffer, 'id'> = {
        title: formData.title,
        menuItemId: formData.menuItemId,
        offerDate: formData.offerDate,
        discountType: formData.discountType,
        orderType: formData.orderType,
        tierDiscounts: finalTierDiscounts,
    };

    if (selectedOffer) {
      // Update existing item
      await setDoc(doc(firestore, "daily_offers", selectedOffer.id), finalData, { merge: true });
      toast({ title: "Offer Updated", description: `The offer "${finalData.title}" has been updated.`});
    } else {
      // Add new item
      await addDoc(collection(firestore, "daily_offers"), finalData);
      toast({ title: "Offer Added", description: `The offer "${finalData.title}" has been created.`});
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
              <TableHead>Date</TableHead>
              <TableHead>Offer Title</TableHead>
              <TableHead>Menu Item</TableHead>
              <TableHead>Order Type</TableHead>
              <TableHead>Tier Discounts</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers?.sort((a,b) => b.offerDate.localeCompare(a.offerDate)).map(offer => {
              return (
                <TableRow key={offer.id}>
                  <TableCell><Badge variant="outline">{offer.offerDate}</Badge></TableCell>
                  <TableCell className="font-medium">{offer.title}</TableCell>
                  <TableCell>{getMenuItemName(offer.menuItemId)}</TableCell>
                  <TableCell><Badge variant="secondary">{offer.orderType}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                        {offer.tierDiscounts && Object.entries(offer.tierDiscounts).map(([tierId, discount]) => (
                            <div key={tierId} className='capitalize'>
                                <span className='font-semibold'>{tierId}:</span> {offer.discountType === 'percentage' ? `${discount}%` : `Rs. ${discount.toFixed(2)}`}
                            </div>
                        ))}
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
        <DialogContent className="sm:max-w-md">
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
                    <Label>Offer Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.offerDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.offerDate ? format(parseISO(formData.offerDate), "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={parseISO(formData.offerDate)}
                            onSelect={handleDateSelect}
                            initialFocus
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
                        <RadioGroupItem value="Pick up" id="pick-up" />
                        <Label htmlFor="pick-up">Pick up</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Takeway" id="takeway" />
                        <Label htmlFor="takeway">Takeway</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="grid gap-2">
                    <Label>Discount Type</Label>
                     <RadioGroup value={formData.discountType} onValueChange={handleDiscountTypeChange} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fixed" id="fixed" />
                            <Label htmlFor="fixed" className='flex items-center gap-1'><IndianRupee className="h-4 w-4"/> Fixed Amount (Rs.)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="percentage" id="percentage" />
                            <Label htmlFor="percentage" className='flex items-center gap-1'><Percent className="h-4 w-4"/> Percentage (%)</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="grid gap-2">
                    <Label>Tier Discounts</Label>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border p-4">
                        {loyaltyLevels?.map(level => (
                            <div key={level.id} className="grid grid-cols-2 items-center gap-2">
                                <Label htmlFor={`price-${level.id}`} className='capitalize text-muted-foreground'>{level.name}</Label>
                                <Input 
                                    id={`price-${level.id}`}
                                    type="number"
                                    step="0.01"
                                    placeholder={formData.discountType === 'fixed' ? 'Rs.' : '%'}
                                    value={formData.tierDiscounts[level.id] ?? ''}
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

    