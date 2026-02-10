
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Category } from '@/lib/types';
import { MoreHorizontal, PlusCircle, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, addDoc, writeBatch } from 'firebase/firestore';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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

const CATEGORY_TYPES: Category['type'][] = ['Food', 'Beverages'];

const INITIAL_FORM_DATA: Omit<Category, 'id'> = {
  name: '',
  type: CATEGORY_TYPES[0],
};

function SortableTableRow({ 
  cat, 
  handleEdit, 
  handleDelete 
}: { 
  cat: Category, 
  handleEdit: (cat: Category) => void,
  handleDelete: (cat: Category) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

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
      <TableCell className="font-medium">{cat.name}</TableCell>
      <TableCell><Badge variant="secondary">{cat.type}</Badge></TableCell>
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
            <DropdownMenuItem onClick={() => handleEdit(cat)}>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(cat)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function CategoryTable() {
  const firestore = useFirestore();
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, "categories") : null, [firestore]);

  const { data: categoriesRaw, isLoading } = useCollection<Category>(categoriesQuery);
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Omit<Category, 'id'>>(INITIAL_FORM_DATA);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedCategories = useMemo(() => {
    if (!categoriesRaw) return [];
    return [...categoriesRaw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [categoriesRaw]);

  useEffect(() => {
    if (isFormOpen) {
      if (selectedCategory) {
        setFormData({
          name: selectedCategory.name,
          type: selectedCategory.type,
        });
      } else {
        setFormData(INITIAL_FORM_DATA);
      }
    }
  }, [isFormOpen, selectedCategory]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !firestore || !sortedCategories) return;

    const oldIndex = sortedCategories.findIndex((cat) => cat.id === active.id);
    const newIndex = sortedCategories.findIndex((cat) => cat.id === over.id);

    const newOrder = arrayMove(sortedCategories, oldIndex, newIndex);
    
    const batch = writeBatch(firestore);
    newOrder.forEach((cat, index) => {
      const docRef = doc(firestore, 'categories', cat.id);
      batch.update(docRef, { displayOrder: index });
    });

    batch.commit().catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'categories',
        operation: 'update',
      }));
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleTypeChange = (value: Category['type']) => {
     setFormData(prev => ({
      ...prev,
      type: value,
    }));
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCategory(null);
    setFormOpen(true);
  };
  
  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setAlertOpen(true);
  }
  
  const confirmDelete = async () => {
    if(!selectedCategory || !firestore) return;
    await deleteDoc(doc(firestore, "categories", selectedCategory.id));

    toast({ title: "Category Deleted", description: `${selectedCategory.name} has been removed.`});
    setAlertOpen(false);
    setSelectedCategory(null);
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    if (!formData.name || !formData.type) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out all fields.",
        });
        return;
    }

    const finalData = {
      ...formData,
      displayOrder: selectedCategory ? selectedCategory.displayOrder : (categoriesRaw?.length || 0)
    };

    if (selectedCategory) {
      await setDoc(doc(firestore, "categories", selectedCategory.id), finalData, { merge: true });
      toast({ title: "Category Updated", description: `${formData.name} has been updated.`});
    } else {
      await addDoc(collection(firestore, "categories"), finalData);
      toast({ title: "Category Added", description: `${formData.name} has been added.`});
    }

    setFormOpen(false);
    setSelectedCategory(null);
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
        <CardTitle className="font-headline text-2xl">Categories</CardTitle>
        <Button size="sm" onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Category
        </Button>
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
                <TableHead>Main Group</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext 
                items={sortedCategories.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedCategories.map(cat => (
                  <SortableTableRow 
                    key={cat.id} 
                    cat={cat} 
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                  />
                ))}
              </SortableContext>
              {sortedCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    No categories found. Add your first category to get started.
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
              <DialogTitle className="font-headline">{selectedCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
              <DialogDescription>
                Create a new sub-category for your menu, like "Pastries" or "Iced Teas", and assign it to a main group.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">New Category Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleFormChange} required placeholder="e.g., Pastries & Bakes" />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="type">Main Group</Label>
                   <Select onValueChange={handleTypeChange} value={formData.type} required>
                    <SelectTrigger id="type">
                        <SelectValue placeholder="Select a main group" />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORY_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
                This action cannot be undone. This will permanently delete the category.
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
