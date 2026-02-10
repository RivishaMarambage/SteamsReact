
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import type { MenuItem, Category, AddonCategory, MenuItemAddonGroup } from '@/lib/types';
import { MoreHorizontal, PlusCircle, Trash2, GripVertical, Search, FilterX, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, addDoc, writeBatch } from 'firebase/firestore';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FirestorePermissionError } from '@/firebase/errors';
import Image from 'next/image';

// DND Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

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

// Sortable Row Component
function SortableTableRow({ item, getCategoryName, handleEdit, handleDelete, isReorderDisabled }: { 
  item: MenuItem, 
  getCategoryName: (id: string) => string,
  handleEdit: (item: MenuItem) => void,
  handleDelete: (item: MenuItem) => void,
  isReorderDisabled: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isReorderDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
    backgroundColor: isDragging ? 'hsl(var(--muted))' : undefined,
    opacity: isReorderDisabled && !isDragging ? 0.8 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "shadow-2xl" : ""}>
      <TableCell className="w-[50px]">
        {!isReorderDisabled ? (
          <button 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-md transition-colors"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : (
          <div className="p-2 opacity-20">
            <GripVertical className="h-4 w-4" />
          </div>
        )}
      </TableCell>
      <TableCell className="w-[80px]">
        <div className="relative h-12 w-12 rounded-lg overflow-hidden border bg-muted group-hover:shadow-md transition-shadow">
          <Image 
            src={item.imageUrl || `https://picsum.photos/seed/${item.id}/100/100`} 
            alt={item.name} 
            fill 
            className="object-cover" 
          />
        </div>
      </TableCell>
      <TableCell className="font-bold">{item.name}</TableCell>
      <TableCell>{getCategoryName(item.categoryId)}</TableCell>
      <TableCell>
        <Badge variant={item.isOutOfStock ? "destructive" : "secondary"}>
          {item.isOutOfStock ? "Out of Stock" : "In Stock"}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-mono font-bold text-primary">LKR {item.price.toFixed(2)}</TableCell>
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
            <DropdownMenuItem onClick={() => handleEdit(item)}>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function MenuTable() {
  const firestore = useFirestore();
  const menuItemsQuery = useMemoFirebase(() => firestore ? collection(firestore, "menu_items") : null, [firestore]);
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, "categories") : null, [firestore]);
  const addonCategoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, "addon_categories") : null, [firestore]);

  const { data: menuRaw, isLoading: isMenuLoading } = useCollection<MenuItem>(menuItemsQuery);
  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);
  const { data: addonCategories, isLoading: areAddonCategoriesLoading } = useCollection<AddonCategory>(addonCategoriesQuery);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const isLoading = isMenuLoading || areCategoriesLoading || areAddonCategoriesLoading;

  const isFilterActive = searchTerm !== '' || categoryFilter !== 'all';

  const filteredAndSortedMenu = useMemo(() => {
    if (!menuRaw) return [];
    
    let items = [...menuRaw];

    // Filter by category
    if (categoryFilter !== 'all') {
      items = items.filter(item => item.categoryId === categoryFilter);
    }

    // Filter by name
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      items = items.filter(item => item.name.toLowerCase().includes(lowerSearch));
    }

    // Sort by display order
    return items.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [menuRaw, searchTerm, categoryFilter]);

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
          addonGroups: selectedItem.addonGroups?.map(g => ({...g, minSelection: g.minSelection ?? 0, maxSelection: g.maxSelection ?? 0})) || [],
        });
      } else {
        setFormData({
          ...INITIAL_FORM_DATA,
          categoryId: categories && categories.length > 0 ? categories[0].id : '',
        });
      }
    }
  }, [isFormOpen, selectedItem, categories]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !firestore || !filteredAndSortedMenu || isFilterActive) return;

    const oldIndex = filteredAndSortedMenu.findIndex((item) => item.id === active.id);
    const newIndex = filteredAndSortedMenu.findIndex((item) => item.id === over.id);

    const newOrder = arrayMove(filteredAndSortedMenu, oldIndex, newIndex);
    
    const batch = writeBatch(firestore);
    newOrder.forEach((item, index) => {
      const docRef = doc(firestore, 'menu_items', item.id);
      batch.update(docRef, { displayOrder: index });
    });

    batch.commit().catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'menu_items',
        operation: 'update',
      }));
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? (value === '' ? '' : parseFloat(value)) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (1MB limit for document-based storage in this prototype)
    if (file.size > 1024 * 1024) {
        toast({
            variant: "destructive",
            title: "File too large",
            description: "Please upload an image smaller than 1MB.",
        });
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
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
        })),
        displayOrder: selectedItem ? (selectedItem.displayOrder ?? 0) : (menuRaw?.length || 0)
    };

    if (selectedItem) {
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
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <CardTitle className="font-headline text-2xl">Menu Items</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search items..." 
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

          {isFilterActive && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }}
              title="Clear filters"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}

          <Button size="sm" onClick={handleAddNew} className="h-10 ml-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </div>
      </CardHeader>
      
      {isFilterActive && (
        <div className="px-6 py-2 bg-muted/30 border-y text-xs font-medium text-muted-foreground flex items-center gap-2">
          <span>Filtering active. Reordering is disabled while searching.</span>
        </div>
      )}

      <CardContent>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext 
                items={filteredAndSortedMenu.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredAndSortedMenu.map(item => (
                  <SortableTableRow 
                    key={item.id} 
                    item={item} 
                    getCategoryName={getCategoryName}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    isReorderDisabled={isFilterActive}
                  />
                ))}
              </SortableContext>
              {filteredAndSortedMenu.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {isFilterActive ? "No items match your search criteria." : "No menu items found. Add your first item to get started."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className="font-headline">{selectedItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              <DialogDescription>{selectedItem ? 'Make changes to the menu item.' : 'Add a new item to your cafe menu.'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleFormChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (LKR)</Label>
                  <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleFormChange} required />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="flex items-center gap-4 h-full pt-6">
                    <Label htmlFor="out-of-stock">Out of Stock</Label>
                    <Switch id="out-of-stock" checked={formData.isOutOfStock} onCheckedChange={handleStockChange} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleFormChange} />
              </div>

              <div className="grid gap-4 p-4 border rounded-xl bg-muted/30">
                <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Item Image</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Option 1: Upload File</Label>
                            <div className="relative">
                                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input type="file" accept="image/*" onChange={handleFileChange} className="pl-10 h-12 pt-3 cursor-pointer file:hidden bg-background border-dashed" />
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><Separator /></div>
                            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Option 2: Image URL</Label>
                            <Input id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleFormChange} placeholder="https://picsum.photos/seed/1/600/400" className="h-12" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preview</Label>
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden border-2 border-background shadow-inner bg-muted flex items-center justify-center">
                            {formData.imageUrl ? (
                                <>
                                    <Image src={formData.imageUrl} alt="Item Preview" fill className="object-cover" />
                                    <Button 
                                        type="button" 
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-[10px] text-muted-foreground font-medium">No image selected</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-lg">Add-on Customization</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addNewAddonGroup}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Group
                    </Button>
                </div>
                
                <div className="grid gap-4">
                    {formData.addonGroups.map((group, index) => (
                        <Card key={index} className="p-4 border-dashed">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <select
                                        value={group.addonCategoryId}
                                        onChange={(e) => handleAddonGroupChange(index, 'addonCategoryId', e.target.value)}
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    >
                                        {addonCategories?.map(ac => (
                                            <option key={ac.id} value={ac.id}>{ac.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-4 h-full pt-6">
                                    <Label>Required</Label>
                                    <Switch 
                                        checked={group.isRequired} 
                                        onCheckedChange={(val) => handleAddonGroupChange(index, 'isRequired', val)} 
                                    />
                                    <Button type="button" variant="ghost" size="icon" className="ml-auto text-destructive" onClick={() => removeAddonGroup(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="grid gap-2">
                                    <Label>Min Selections</Label>
                                    <Input 
                                        type="number" 
                                        value={group.minSelection} 
                                        onChange={(e) => handleAddonGroupChange(index, 'minSelection', e.target.value === '' ? '' : Number(e.target.value))} 
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Max Selections</Label>
                                    <Input 
                                        type="number" 
                                        value={group.maxSelection} 
                                        onChange={(e) => handleAddonGroupChange(index, 'maxSelection', e.target.value === '' ? '' : Number(e.target.value))} 
                                    />
                                </div>
                            </div>
                        </Card>
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
