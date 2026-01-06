
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Addon } from '@/lib/types';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';

const INITIAL_FORM_DATA: Omit<Addon, 'id'> = {
  name: '',
  price: 0,
};

export default function AddonTable() {
  const firestore = useFirestore();
  const addonsQuery = useMemoFirebase(() => firestore ? collection(firestore, "addons") : null, [firestore]);

  const { data: addons, isLoading } = useCollection<Addon>(addonsQuery);
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [formData, setFormData] = useState<Omit<Addon, 'id'>>(INITIAL_FORM_DATA);
  const { toast } = useToast();

  useEffect(() => {
    if (isFormOpen) {
      if (selectedAddon) {
        setFormData({
          name: selectedAddon.name,
          price: selectedAddon.price,
        });
      } else {
        setFormData(INITIAL_FORM_DATA);
      }
    }
  }, [isFormOpen, selectedAddon]);


  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? (value === '' ? '' : parseFloat(value)) : value,
    }));
  };

  const handleEdit = (addon: Addon) => {
    setSelectedAddon(addon);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAddon(null);
    setFormOpen(true);
  };
  
  const handleDelete = (addon: Addon) => {
    setSelectedAddon(addon);
    setAlertOpen(true);
  }
  
  const confirmDelete = async () => {
    if(!selectedAddon || !firestore) return;
    await deleteDoc(doc(firestore, "addons", selectedAddon.id));

    toast({ title: "Add-on Deleted", description: `${selectedAddon.name} has been removed.`});
    setAlertOpen(false);
    setSelectedAddon(null);
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    const finalData = {
        ...formData,
        price: Number(formData.price) || 0,
    };

    if (!finalData.name || finalData.price < 0) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out a valid name and price.",
        });
        return;
    }

    if (selectedAddon) {
      // Update existing item
      await setDoc(doc(firestore, "addons", selectedAddon.id), finalData, { merge: true });
      toast({ title: "Add-on Updated", description: `${finalData.name} has been updated.`});
    } else {
      // Add new item
      await addDoc(collection(firestore, "addons"), finalData);
      toast({ title: "Add-on Added", description: `${finalData.name} has been added.`});
    }

    setFormOpen(false);
    setSelectedAddon(null);
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-2xl">Add-ons</CardTitle>
        <Button size="sm" onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Add-on
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addons?.map(addon => {
              return (
                <TableRow key={addon.id}>
                  <TableCell className="font-medium">{addon.name}</TableCell>
                  <TableCell className="text-right">LKR {addon.price.toFixed(2)}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEdit(addon)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(addon)}>Delete</DropdownMenuItem>
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
              <DialogTitle className="font-headline">{selectedAddon ? 'Edit Add-on' : 'Add New Add-on'}</DialogTitle>
              <DialogDescription>{selectedAddon ? 'Make changes to the add-on.' : 'Add a new customization add-on.'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleFormChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price (LKR)</Label>
                <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleFormChange} required />
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
                This action cannot be undone. This will permanently delete the add-on.
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
