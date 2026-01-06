
'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { MenuItem, Category } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

const MAIN_CATEGORIES: Category['type'][] = ['Food', 'Beverages'];

function PublicMenuDisplayContent() {
  const firestore = useFirestore();
  
  const menuItemsQuery = useMemoFirebase(() => firestore ? collection(firestore, "menu_items") : null, [firestore]);
  const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>(menuItemsQuery);
  
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, "categories") : null, [firestore]);
  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);

  const isLoading = menuLoading || areCategoriesLoading;
  
  if (isLoading) {
    return (
       <div className="space-y-8">
        <div className="flex justify-center mb-6">
            <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
        </div>
      </div>
    )
  }
  
  return (
    <Tabs defaultValue={MAIN_CATEGORIES[0]} className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList>
            {MAIN_CATEGORIES.map(categoryType => (
              <TabsTrigger key={categoryType} value={categoryType}>{categoryType}</TabsTrigger>
            ))}
          </TabsList>
        </div>
        {MAIN_CATEGORIES.map(categoryType => (
          <TabsContent key={categoryType} value={categoryType}>
             <div className="space-y-8">
               {categories?.filter(c => c.type === categoryType).map(subCategory => (
                <div key={subCategory.id}>
                    <h2 className="text-2xl font-bold font-headline mb-4">{subCategory.name}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {menuItems?.filter(item => item.categoryId === subCategory.id).map(item => (
                          <Card key={item.id} className={cn("flex flex-col overflow-hidden shadow-lg", item.isOutOfStock && "opacity-60")}>
                             <div className="relative w-full h-40">
                                <Image
                                    src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    data-ai-hint="food item"
                                />
                                 {item.isOutOfStock && (
                                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Badge variant="destructive">Out of Stock</Badge>
                                    </div>
                                )}
                            </div>
                            <CardContent className="p-4 flex-grow">
                              <CardTitle className="font-headline text-xl mb-1">{item.name}</CardTitle>
                              <CardDescription>{item.description}</CardDescription>
                            </CardContent>
                            <CardFooter className="p-4 flex justify-between items-center">
                              <div className="font-bold text-lg text-primary">
                                LKR {item.price.toFixed(2)}
                              </div>
                            </CardFooter>
                          </Card>
                      ))}
                    </div>
                </div>
               ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
  );
}

export default function PublicMenuDisplay() {
    return <PublicMenuDisplayContent />;
}
