
'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import type { MenuItem, Category } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const MAIN_CATEGORIES: Category['type'][] = ['Food', 'Beverages'];

function PublicMenuDisplayContent() {
  const firestore = useFirestore();
  
  const menuItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // We fetch without server-side orderBy to prevent Firestore from filtering out 
    // items that haven't been manually ordered yet (missing displayOrder field).
    return query(collection(firestore, "menu_items"));
  }, [firestore]);
  
  const { data: menuRaw, isLoading: menuLoading } = useCollection<MenuItem>(menuItemsQuery);
  
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, "categories") : null, [firestore]);
  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);

  // Apply robust client-side sorting to match the Admin tool's logic
  const sortedMenuItems = useMemo(() => {
    if (!menuRaw) return [];
    return [...menuRaw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [menuRaw]);

  const isLoading = menuLoading || areCategoriesLoading;
  
  if (isLoading) {
    return (
       <div className="space-y-8">
        <div className="flex justify-center mb-6">
            <Skeleton className="h-10 w-64 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Skeleton className="h-80 w-full rounded-3xl" />
            <Skeleton className="h-80 w-full rounded-3xl" />
            <Skeleton className="h-80 w-full rounded-3xl" />
            <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
      </div>
    )
  }
  
  return (
    <Tabs defaultValue={MAIN_CATEGORIES[0]} className="w-full">
        <div className="flex justify-center mb-10">
          <TabsList className="bg-muted/50 p-1 h-14 rounded-full">
            {MAIN_CATEGORIES.map(categoryType => (
              <TabsTrigger 
                key={categoryType} 
                value={categoryType}
                className="rounded-full px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                {categoryType}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {MAIN_CATEGORIES.map(categoryType => (
          <TabsContent key={categoryType} value={categoryType} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-16">
               {categories?.filter(c => c.type === categoryType).map(subCategory => {
                const subItems = sortedMenuItems.filter(item => item.categoryId === subCategory.id);
                if (!subItems || subItems.length === 0) return null;

                return (
                  <div key={subCategory.id}>
                      <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-3xl font-headline font-black uppercase tracking-tight text-[#2c1810]">{subCategory.name}</h2>
                        <div className="h-[2px] flex-1 bg-[#d97706]/10" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {subItems.map(item => (
                            <Card key={item.id} className={cn("flex flex-col overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group rounded-[2.5rem]", item.isOutOfStock && "opacity-60 grayscale")}>
                               <div className="relative w-full h-52 overflow-hidden">
                                  <Image
                                      src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`}
                                      alt={item.name}
                                      fill
                                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                                      data-ai-hint="food item"
                                  />
                                   {item.isOutOfStock && (
                                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                          <Badge variant="destructive" className="h-10 px-6 text-sm">Sold Out</Badge>
                                      </div>
                                  )}
                              </div>
                              <CardContent className="p-6 flex-grow flex flex-col justify-between">
                                <div>
                                    <CardTitle className="font-headline text-2xl mb-2 text-[#2c1810]">{item.name}</CardTitle>
                                    <CardDescription className="text-[#6b584b] line-clamp-2 leading-relaxed">
                                        {item.description}
                                    </CardDescription>
                                </div>
                                <div className="mt-6 pt-4 border-t border-muted flex items-center justify-between">
                                    <div className="font-black text-xl text-primary">
                                        LKR {item.price.toFixed(0)}
                                    </div>
                                    <Badge variant="secondary" className="bg-muted/50 text-[#6b584b] lowercase">
                                        per portion
                                    </Badge>
                                </div>
                              </CardContent>
                            </Card>
                        ))}
                      </div>
                  </div>
                );
               })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
  );
}

export default function PublicMenuDisplay() {
    return <PublicMenuDisplayContent />;
}
