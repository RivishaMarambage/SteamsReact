
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DailyOffer, MenuItem } from '@/lib/types';
import { MoreHorizontal, PlusCircle, Calendar as CalendarIcon, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

type FormData = Omit<DailyOffer, 'id' | 'discountPrice'> & { discountPrice: number | '' };

const INITIAL_FORM_DATA: FormData = {
  title: '',
  menuItemId: '',
  offerDate: format(new Date(), 'yyyy-MM-dd'),
  discountPrice: '',
};

export default function DailyOfferTable() {
  const firestore = useFirestore();
  const offersQuery = useMemoFirebase(() => firestore ? collection(firestore, "daily_offers") : null, [firestore]);
  const menuItemsQuery = useMemoFirebase(() => firestore ? collection(firestore, "menu_items") : null, [firestore]);

  const { data: offers, isLoading: areOffersLoading } = useCollection<DailyOffer>(offersQuery);
  const { data: menuItems, isLoading: areMenuItemsLoading } = useCollection<MenuItem>(menuItemsQuery);
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<DailyOffer | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const { toast } = useToast();

  const isLoading = areOffersLoading || areMenuItemsLoading;

  useEffect(() => {
    if (isFormOpen) {
      if (selectedOffer) {
        setFormData({
          title: selectedOffer.title,
          menuItemId: selectedOffer.menuItemId,
          offerDate: selectedOffer.offerDate,
          discountPrice: selectedOffer.discountPrice,
        });
      } else {
        setFormData({
          ...INITIAL_FORM_DATA,
          menuItemId: menuItems && menuItems.length > 0 ? menuItems[0].id : '',
        });
      }
    }
  }, [isFormOpen, selectedOffer, menuItems]);


  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'discountPrice' ? (value === '' ? '' : parseFloat(value)) : value,
    }));
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

    if (!formData.title || !formData.menuItemId || !formData.offerDate || formData.discountPrice === '') {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out all fields.",
        });
        return;
    }
    
    const menuItem = menuItems?.find(item => item.id === formData.menuItemId);
    if (menuItem && Number(formData.discountPrice) >= menuItem.price) {
        toast({
            variant: "destructive",
            title: "Invalid Price",
            description: "Discount price must be less than the item's original price.",
        });
        return;
    }


    const finalData = {
        ...formData,
        discountPrice: Number(formData.discountPrice),
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
              <TableHead>Discount Price</TableHead>
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
                  <TableCell>Rs. {offer.discountPrice.toFixed(2)}</TableCell>
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
        <DialogContent className="sm:max-w-[425px]">
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

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="discountPrice">Discount Price</Label>
                      <Input id="discountPrice" name="discountPrice" type="number" step="0.01" value={formData.discountPrice} onChange={handleFormChange} required />
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
