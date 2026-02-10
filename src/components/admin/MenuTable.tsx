
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
import type { MenuItem, Category, AddonCategory, MenuItemAddonGroup } from '@/lib/types';
import { MoreHorizontal, PlusCircle, Trash2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, addDoc, writeBatch } from 'firebase/firestore';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { FirestorePermissionError } from '@/firebase/errors';

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
function SortableTableRow({ item, getCategoryName, handleEdit, handleDelete }: { 
  item: MenuItem, 
  getCategoryName: (id: string) => string,
  handleEdit: (item: MenuItem) => void,
  handleDelete: (item: MenuItem) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
    backgroundColor: isDragging ? 'hsl(var(--muted))' : undefined,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "shadow-2xl" : ""}>
      <TableCell className="w-[50px]">
        <button 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-md transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="font-bold">{item.name}</TableCell>
      <TableCell>{getCategoryName(item.categoryId)}</TableCell>
      <TableCell>
        <Badge variant={item.isOutOfStock ? "destructive" : "secondary"}>
          {item.isOutOfStock ? "Out of Stock" : "In Stock"}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-mono">LKR {item.price.toFixed(2)}</TableCell>
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

  // Stable sorted menu list
  const sortedMenu = useMemo(() => {
    if (!menuRaw) return [];
    return [...menuRaw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [menuRaw]);

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
    if (!over || active.id === over.id || !firestore || !sortedMenu) return;

    const oldIndex = sortedMenu.findIndex((item) => item.id === active.id);
    const newIndex = sortedMenu.findIndex((item) => item.id === over.id);

    const newOrder = arrayMove(sortedMenu, oldIndex, newIndex);
    
    // Update local display orders and push to Firestore
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
        // Assign display order if new
        displayOrder: selectedItem ? selectedItem.displayOrder : (sortedMenu?.length || 0)
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-2xl">Menu Items</CardTitle>
        <div className="flex gap-2">
          <Badge variant="outline" className="h-10 px-4 bg-muted/50 hidden sm:flex">
            Drag items to reorder
          </Badge>
          <Button size="sm" onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </div>
      </CardHeader>
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
                items={sortedMenu.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedMenu.map(item => (
                  <SortableTableRow 
                    key={item.id} 
                    item={item} 
                    getCategoryName={getCategoryName}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                  />
                ))}
              </SortableContext>
            </SortableContext>
            {sortedMenu.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No menu items found. Add your first item to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </Card>
  );
}
