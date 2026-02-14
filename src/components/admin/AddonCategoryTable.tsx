
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AddonCategory } from '@/lib/types';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { Textarea } from '../ui/textarea';

const INITIAL_FORM_DATA: Omit<AddonCategory, 'id'> = {
  name: '',
  description: '',
};

export default function AddonCategoryTable() {
  const firestore = useFirestore();
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, "addon_categories") : null, [firestore]);

  const { data: categories, isLoading } = useCollection<AddonCategory>(categoriesQuery);
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AddonCategory | null>(null);
  const [formData, setFormData] = useState<Omit<AddonCategory, 'id'>>(INITIAL_FORM_DATA);
  const { toast } = useToast();

  useEffect(() => {
    if (isFormOpen) {
      if (selectedCategory) {
        setFormData({
          name: selectedCategory.name,
          description: selectedCategory.description,
        });
      } else {
        setFormData(INITIAL_FORM_DATA);
      }
    }
  }, [isFormOpen, selectedCategory]);


  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = (category: AddonCategory) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCategory(null);
    setFormOpen(true);
  };
  
  const handleDelete = (category: AddonCategory) => {
    setSelectedCategory(category);
    setAlertOpen(true);
  }
  
  const confirmDelete = async () => {
    if(!selectedCategory || !firestore) return;
    await deleteDoc(doc(firestore, "addon_categories", selectedCategory.id));

    toast({ title: "Category Deleted", description: `${selectedCategory.name} has been removed.`});
    setAlertOpen(false);
    setSelectedCategory(null);
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    if (!formData.name) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out the name field.",
        });
        return;
    }

    if (selectedCategory) {
      // Update existing item
      await setDoc(doc(firestore, "addon_categories", selectedCategory.id), formData, { merge: true });
      toast({ title: "Category Updated", description: `${formData.name} has been updated.`});
    } else {
      // Add new item
      await addDoc(collection(firestore, "addon_categories"), formData);
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
        <CardTitle className="font-headline text-2xl">Add-on Categories</CardTitle>
        <Button size="sm" onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Category
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map(cat => {
              return (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>{cat.description}</TableCell>
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
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className="font-headline">{selectedCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
              <DialogDescription>
                Create a new category for your add-ons, like "Syrups" or "Milk Options".
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Category Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleFormChange} required placeholder="e.g., Milk Options" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleFormChange} placeholder="e.g., Choose your preferred milk" />
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
