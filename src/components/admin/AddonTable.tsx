
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { Addon, AddonCategory } from '@/lib/types';
import { MoreHorizontal, PlusCircle, GripVertical, Search, FilterX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, addDoc, writeBatch } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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

const INITIAL_FORM_DATA: Omit<Addon, 'id'> = {
  name: '',
  price: 0,
  addonCategoryId: '',
  isActive: true,
};

function SortableTableRow({ 
  addon, 
  getCategoryName, 
  handleEdit, 
  handleDelete, 
  isReorderDisabled 
}: { 
  addon: Addon, 
  getCategoryName: (id: string) => string,
  handleEdit: (addon: Addon) => void,
  handleDelete: (addon: Addon) => void,
  isReorderDisabled: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: addon.id, disabled: isReorderDisabled });

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
      <TableCell className="font-bold">{addon.name}</TableCell>
      <TableCell>{getCategoryName(addon.addonCategoryId)}</TableCell>
      <TableCell>
        <Badge variant={addon.isActive ? "default" : "secondary"}>
          {addon.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-mono font-bold text-primary">LKR {addon.price.toFixed(2)}</TableCell>
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
}

export default function AddonTable() {
  const firestore = useFirestore();
  const addonsQuery = useMemoFirebase(() => firestore ? collection(firestore, "addons") : null, [firestore]);
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, "addon_categories") : null, [firestore]);

  const { data: addonsRaw, isLoading: areAddonsLoading } = useCollection<Addon>(addonsQuery);
  const { data: categories, isLoading: areCategoriesLoading } = useCollection<AddonCategory>(categoriesQuery);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [formData, setFormData] = useState<Omit<Addon, 'id'>>(INITIAL_FORM_DATA);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const isLoading = areAddonsLoading || areCategoriesLoading;
  const isFilterActive = searchTerm !== '' || categoryFilter !== 'all';

  const filteredAndSortedAddons = useMemo(() => {
    if (!addonsRaw) return [];
    
    let items = [...addonsRaw];

    if (categoryFilter !== 'all') {
      items = items.filter(item => item.addonCategoryId === categoryFilter);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      items = items.filter(item => item.name.toLowerCase().includes(lowerSearch));
    }

    return items.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [addonsRaw, searchTerm, categoryFilter]);

  useEffect(() => {
    if (isFormOpen) {
      if (selectedAddon) {
        setFormData({
          name: selectedAddon.name,
          price: selectedAddon.price,
          addonCategoryId: selectedAddon.addonCategoryId,
          isActive: selectedAddon.isActive ?? true,
        });
      } else {
        setFormData({
          ...INITIAL_FORM_DATA,
          addonCategoryId: categories && categories.length > 0 ? categories[0].id : ''
        });
      }
    }
  }, [isFormOpen, selectedAddon, categories]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !firestore || !filteredAndSortedAddons || isFilterActive) return;

    const oldIndex = filteredAndSortedAddons.findIndex((addon) => addon.id === active.id);
    const newIndex = filteredAndSortedAddons.findIndex((addon) => addon.id === over.id);

    const newOrder = arrayMove(filteredAndSortedAddons, oldIndex, newIndex);
    
    const batch = writeBatch(firestore);
    newOrder.forEach((addon, index) => {
      const docRef = doc(firestore, 'addons', addon.id);
      batch.update(docRef, { displayOrder: index });
    });

    batch.commit().catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'addons',
        operation: 'update',
      }));
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? (value === '' ? '' : parseFloat(value)) : value,
    }));
  };

  const handleStatusChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isActive: checked }));
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
        displayOrder: selectedAddon ? (selectedAddon.displayOrder ?? 0) : (addonsRaw?.length || 0)
    };

    if (selectedAddon) {
      await setDoc(doc(firestore, "addons", selectedAddon.id), finalData, { merge: true });
      toast({ title: "Add-on Updated", description: `${finalData.name} has been updated.`});
    } else {
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

  const getCategoryName = (categoryId: string) => categories?.find(c => c.id === categoryId)?.name || 'N/A';

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <CardTitle className="font-headline text-2xl">Add-ons</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search add-ons..." 
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
            Add New Add-on
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
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext 
                items={filteredAndSortedAddons.map(a => a.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredAndSortedAddons.map(addon => (
                  <SortableTableRow 
                    key={addon.id} 
                    addon={addon} 
                    getCategoryName={getCategoryName}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    isReorderDisabled={isFilterActive}
                  />
                ))}
              </SortableContext>
              {filteredAndSortedAddons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {isFilterActive ? "No add-ons match your search criteria." : "No add-ons found. Add your first add-on to get started."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
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
              <div className="grid gap-2">
                <Label htmlFor="addonCategoryId">Category</Label>
                <select
                  id="addonCategoryId"
                  name="addonCategoryId"
                  value={formData.addonCategoryId || ''}
                  onChange={handleFormChange}
                  required
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="" disabled>Select a category</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <Label htmlFor="isActive">Active Status</Label>
                <Switch 
                  id="isActive" 
                  checked={formData.isActive} 
                  onCheckedChange={handleStatusChange} 
                />
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
