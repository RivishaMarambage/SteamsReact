
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { MenuItem } from '@/lib/types';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, doc, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { collection } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

export default function MenuTable() {
  const firestore = useFirestore();
  const menuItemsRef = useMemoFirebase(() => collection(firestore, 'menu_items'), [firestore]);
  const { data: menu, isLoading, error } = useCollection<MenuItem>(menuItemsRef);
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();

  const handleEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setFormOpen(true);
  };
  
  const handleDelete = (item: MenuItem) => {
    setSelectedItem(item);
    setAlertOpen(true);
  }
  
  const confirmDelete = () => {
    if(!selectedItem) return;
    const itemRef = doc(firestore, 'menu_items', selectedItem.id);
    deleteDocumentNonBlocking(itemRef);

    toast({ title: "Item Deleted", description: `${selectedItem.name} has been removed from the menu.`});
    setAlertOpen(false);
    setSelectedItem(null);
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const itemData = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as MenuItem['category'],
      description: formData.get('description') as string,
      imageId: 'latte', // Default image for now
    };

    if (selectedItem) {
      // Update existing item
      const itemRef = doc(firestore, 'menu_items', selectedItem.id);
      updateDocumentNonBlocking(itemRef, itemData);
      toast({ title: "Item Updated", description: `${itemData.name} has been updated.`});
    } else {
      // Add new item
      const collectionRef = collection(firestore, 'menu_items');
      addDocumentNonBlocking(collectionRef, itemData);
      toast({ title: "Item Added", description: `${itemData.name} has been added to the menu.`});
    }

    setFormOpen(false);
    setSelectedItem(null);
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
                    <Skeleton className="h-16 w-full" />
                </div>
            </CardContent>
        </Card>
    )
  }

  if (error) {
    return <p className="text-destructive-foreground bg-destructive p-4 rounded-md">Error loading menu: {error.message}</p>
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-2xl">Menu Items</CardTitle>
        <Button size="sm" onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Item
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menu?.map(item => {
              const image = PlaceHolderImages.find(p => p.id === item.imageId);
              return (
                <TableRow key={item.id}>
                  <TableCell className="hidden sm:table-cell">
                    {image && <Image src={image.imageUrl} alt={item.name} width={64} height={48} className="rounded-md object-cover aspect-[4/3]" data-ai-hint={image.imageHint}/>}
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(item)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item)}>Delete</DropdownMenuItem>
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
              <DialogTitle className="font-headline">{selectedItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              <DialogDescription>{selectedItem ? 'Make changes to the menu item.' : 'Add a new item to your menu.'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={selectedItem?.name} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" type="number" step="0.01" defaultValue={selectedItem?.price} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <select id="category" name="category" defaultValue={selectedItem?.category} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option>Hot Coffee</option>
                    <option>Iced Coffee</option>
                    <option>Pastries</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={selectedItem?.description} />
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
                This action cannot be undone. This will permanently delete the menu item.
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
