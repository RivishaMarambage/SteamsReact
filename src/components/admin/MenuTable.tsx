
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { MenuItem } from '@/lib/types';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';

type FormData = Omit<MenuItem, 'id' | 'price'> & { price: number | '' };

const INITIAL_FORM_DATA: FormData = {
  name: '',
  price: '',
  categoryId: '',
  description: '',
  imageUrl: '',
  isOutOfStock: false,
};

export default function MenuTable() {
  const firestore = useFirestore();
  const menuItemsQuery = useMemoFirebase(() => firestore ? collection(firestore, "menu_items") : null, [firestore]);
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, "categories") : null, [firestore]);

  const { data: menu, isLoading: isMenuLoading } = useCollection<MenuItem>(menuItemsQuery);
  const { data: categories, isLoading: areCategoriesLoading } = useCollection(categoriesQuery);
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const { toast } = useToast();

  useEffect(() => {
    if (isFormOpen) {
      if (selectedItem) {
        setFormData({
          name: selectedItem.name,
          price: selectedItem.price,
          categoryId: selectedItem.categoryId,
          description: selectedItem.description,
          imageUrl: selectedItem.imageUrl || '',
          isOutOfStock: selectedItem.isOutOfStock || false,
        });
      } else {
        setFormData({
          ...INITIAL_FORM_DATA,
          categoryId: categories && categories.length > 0 ? categories[0].id : '',
        });
      }
    }
  }, [isFormOpen, selectedItem, categories]);


  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? (value === '' ? '' : parseFloat(value)) : value,
    }));
  };
  
  const handleStockChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isOutOfStock: checked }));
  }

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
  
  const confirmDelete = async () => {
    if(!selectedItem || !firestore) return;
    const docRef = doc(firestore, "menu_items", selectedItem.id);
    
    deleteDoc(docRef)
      .then(() => {
        toast({ title: "Item Deleted", description: `${selectedItem.name} has been removed from the menu.`});
        setAlertOpen(false);
        setSelectedItem(null);
      })
      .catch((error) => {
         const contextualError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', contextualError);
      })
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    if (!formData.categoryId) {
        toast({
            variant: "destructive",
            title: "Category Required",
            description: "Please select a category for the menu item.",
        });
        return;
    }

    const finalData = {
        ...formData,
        price: Number(formData.price) || 0,
    };

    if (selectedItem) {
      // Update existing item
      const docRef = doc(firestore, "menu_items", selectedItem.id);
      setDoc(docRef, finalData, { merge: true })
        .then(() => {
            toast({ title: "Item Updated", description: `${finalData.name} has been updated.`});
        })
        .catch((error) => {
            const contextualError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: finalData,
            });
            errorEmitter.emit('permission-error', contextualError);
        });

    } else {
      // Add new item
      const collRef = collection(firestore, "menu_items");
      addDoc(collRef, finalData)
        .then(() => {
            toast({ title: "Item Added", description: `${finalData.name} has been added to the menu.`});
        })
        .catch((error) => {
            const contextualError = new FirestorePermissionError({
                path: collRef.path,
                operation: 'create',
                requestResourceData: finalData,
            });
            errorEmitter.emit('permission-error', contextualError);
        });
    }

    setFormOpen(false);
    setSelectedItem(null);
  };
  
  if (isMenuLoading || areCategoriesLoading) {
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

  const getCategoryName = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name || 'N/A';
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
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menu?.map(item => {
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{getCategoryName(item.categoryId)}</TableCell>
                  <TableCell>
                    <Badge variant={item.isOutOfStock ? "destructive" : "secondary"}>
                      {item.isOutOfStock ? "Out of Stock" : "In Stock"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">LKR {item.price.toFixed(2)}</TableCell>
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
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className="font-headline">{selectedItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              <DialogDescription>{selectedItem ? 'Make changes to the menu item.' : 'Add a new item to your menu.'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleFormChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (LKR)</Label>
                  <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleFormChange} required />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId || ''}
                    onChange={handleFormChange}
                    required
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>Select a category</option>
                    {categories?.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleFormChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" name="imageUrl" value={formData.imageUrl || ''} onChange={handleFormChange} placeholder="https://example.com/image.jpg" />
              </div>
               <div className="flex items-center space-x-2">
                <Switch id="isOutOfStock" name="isOutOfStock" checked={formData.isOutOfStock} onCheckedChange={handleStockChange} />
                <Label htmlFor="isOutOfStock">Mark as out of stock</Label>
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
