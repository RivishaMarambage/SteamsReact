
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
import type { MenuItem, Category, AddonCategory, MenuItemAddonGroup } from '@/lib/types';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';

type FormData = Omit<MenuItem, 'id' | 'price' | 'addonGroups'> & { 
    price: number | '',
    addonGroups: (Omit<MenuItemAddonGroup, 'minSelection' | 'maxSelection'> & {
        minSelection: number | '',
        maxSelection: number | '',
    })[]
};


const INITIAL_FORM_DATA: FormData = {
  name: '',
  price: '',
  categoryId: '',
  description: '',
  imageUrl: '',
  isOutOfStock: false,
  addonGroups: [],
};

export default function MenuTable() {
  const firestore = useFirestore();
  const menuItemsQuery = useMemoFirebase(() => firestore ? collection(firestore, "menu_items") : null, [firestore]);
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, "categories") : null, [firestore]);
  const addonCategoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, "addon_categories") : null, [firestore]);


  const { data: menu, isLoading: isMenuLoading } = useCollection<MenuItem>(menuItemsQuery);
  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);
  const { data: addonCategories, isLoading: areAddonCategoriesLoading } = useCollection<AddonCategory>(addonCategoriesQuery);
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const { toast } = useToast();

  const isLoading = isMenuLoading || areCategoriesLoading || areAddonCategoriesLoading;

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
          addonGroups: selectedItem.addonGroups?.map(g => ({...g})) || [],
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

  const handleAddonGroupChange = <K extends keyof FormData['addonGroups'][number]>(index: number, field: K, value: FormData['addonGroups'][number][K]) => {
     setFormData(prev => {
        const newGroups = [...prev.addonGroups];
        newGroups[index] = {
            ...newGroups[index],
            [field]: value
        };
        return { ...prev, addonGroups: newGroups };
     })
  }

  const addNewAddonGroup = () => {
    if (!addonCategories || addonCategories.length === 0) {
        toast({ variant: 'destructive', title: "No Add-on Categories", description: "Please create an add-on category first."});
        return;
    }
    setFormData(prev => ({
        ...prev,
        addonGroups: [
            ...prev.addonGroups,
            { addonCategoryId: addonCategories[0].id, isRequired: false, minSelection: 0, maxSelection: 1 }
        ]
    }));
  }

  const removeAddonGroup = (index: number) => {
    setFormData(prev => ({
        ...prev,
        addonGroups: prev.addonGroups.filter((_, i) => i !== index),
    }));
  }
  
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
        addonGroups: formData.addonGroups.map(g => ({
            ...g,
            minSelection: Number(g.minSelection) || 0,
            maxSelection: Number(g.maxSelection) || 0,
        }))
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
              <TableHead>Add-on Groups</TableHead>
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
                  <TableCell>
                    {item.addonGroups && item.addonGroups.length > 0 ? `${item.addonGroups.length}` : '0'}
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
        <DialogContent className="sm:max-w-3xl">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className="font-headline">{selectedItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              <DialogDescription>{selectedItem ? 'Make changes to the menu item.' : 'Add a new item to your menu.'}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] -mx-6 px-6">
                <div className="grid gap-4 py-4 px-1">
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

                <div className="space-y-4 pt-4">
                    <Label className="text-lg font-semibold">Add-on Groups</Label>
                    <div className="space-y-4">
                        {formData.addonGroups.map((group, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeAddonGroup(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor={`addon-cat-${index}`}>Category</Label>
                                        <Select value={group.addonCategoryId} onValueChange={(val) => handleAddonGroupChange(index, 'addonCategoryId', val)}>
                                            <SelectTrigger id={`addon-cat-${index}`}>
                                                <SelectValue placeholder="Select add-on category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {addonCategories?.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-end pb-2">
                                         <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`is-required-${index}`} 
                                                checked={group.isRequired}
                                                onCheckedChange={(checked) => handleAddonGroupChange(index, 'isRequired', !!checked)}
                                            />
                                            <Label htmlFor={`is-required-${index}`}>Required</Label>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div className="grid gap-2">
                                        <Label htmlFor={`min-sel-${index}`}>Min Selections</Label>
                                        <Input id={`min-sel-${index}`} type="number" value={group.minSelection} onChange={(e) => handleAddonGroupChange(index, 'minSelection', e.target.value === '' ? '' : Number(e.target.value))} />
                                     </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor={`max-sel-${index}`}>Max Selections</Label>
                                        <Input id={`max-sel-${index}`} type="number" value={group.maxSelection} onChange={(e) => handleAddonGroupChange(index, 'maxSelection', e.target.value === '' ? '' : Number(e.target.value))} />
                                     </div>
                                </div>
                            </div>
                        ))}
                    </div>
                     <Button type="button" variant="outline" size="sm" onClick={addNewAddonGroup}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Group
                    </Button>
                </div>
                </div>
            </ScrollArea>
            <DialogFooter className="border-t pt-4">
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
