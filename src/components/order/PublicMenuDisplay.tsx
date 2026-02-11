'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import type { MenuItem, Category } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    return query(collection(firestore, "menu_items"));
  }, [firestore]);
  
  const { data: menuRaw, isLoading: menuLoading } = useCollection<MenuItem>(menuItemsQuery);
  
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, "categories") : null, [firestore]);
  const { data: categoriesRaw, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);

  const sortedMenuItems = useMemo(() => {
    if (!menuRaw) return [];
    return [...menuRaw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [menuRaw]);

  const sortedCategories = useMemo(() => {
    if (!categoriesRaw) return [];
    return [...categoriesRaw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [categoriesRaw]);

  const isLoading = menuLoading || areCategoriesLoading;
  
  if (isLoading) {
    return (
       <div className="space-y-8">
        <div className="flex justify-center mb-6">
            <Skeleton className="h-14 w-64 rounded-full" />
        </div>
        <div className="flex gap-6 overflow-hidden">
            <Skeleton className="h-80 w-80 shrink-0 rounded-[2.5rem]" />
            <Skeleton className="h-80 w-80 shrink-0 rounded-[2.5rem]" />
            <Skeleton className="h-80 w-80 shrink-0 rounded-[2.5rem]" />
        </div>
      </div>
    )
  }
  
  return (
    <Tabs defaultValue={MAIN_CATEGORIES[1]} className="w-full">
        <div className="flex justify-center mb-16">
          <TabsList className="bg-muted/50 p-1.5 h-16 rounded-full border border-muted">
            {MAIN_CATEGORIES.map(categoryType => (
              <TabsTrigger 
                key={categoryType} 
                value={categoryType}
                className="rounded-full px-10 font-black text-xs uppercase tracking-[0.2em] data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xl transition-all"
              >
                {categoryType}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {MAIN_CATEGORIES.map(categoryType => (
          <TabsContent key={categoryType} value={categoryType} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="space-y-24">
               {sortedCategories.filter(c => c.type === categoryType).map(subCategory => {
                const subItems = sortedMenuItems.filter(item => item.categoryId === subCategory.id);
                if (!subItems || subItems.length === 0) return null;

                return (
                  <div key={subCategory.id} className="animate-in fade-in slide-in-from-left-4 duration-1000">
                      <div className="flex items-center gap-6 mb-12">
                        <h2 className="text-4xl md:text-5xl font-headline font-black uppercase tracking-tight text-[#2c1810] italic">{subCategory.name}</h2>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                      </div>
                      <div className="flex overflow-x-auto gap-10 pb-12 snap-x scrollbar-hide">
                        {subItems.map(item => (
                            <Card key={item.id} className={cn("flex flex-col shrink-0 w-[280px] sm:w-[320px] snap-start overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group rounded-[3rem] bg-white", item.isOutOfStock && "opacity-60 grayscale")}>
                               <div className="relative w-full h-60 overflow-hidden">
                                  <Image
                                      src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`}
                                      alt={item.name}
                                      fill
                                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                      data-ai-hint="food item"
                                  />
                                   {item.isOutOfStock && (
                                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                          <Badge variant="destructive" className="h-12 px-8 text-xs font-black uppercase tracking-[0.2em] shadow-2xl">Sold Out</Badge>
                                      </div>
                                  )}
                              </div>
                              <CardContent className="p-8 flex-grow flex flex-col justify-between">
                                <div>
                                    <CardTitle className="font-headline text-3xl mb-3 text-[#2c1810] tracking-tight">{item.name}</CardTitle>
                                    <CardDescription className="text-[#6b584b] line-clamp-3 leading-relaxed text-sm font-medium">
                                        {item.description}
                                    </CardDescription>
                                </div>
                                <div className="mt-8 pt-6 border-t border-muted/50 flex items-center justify-between">
                                    <div className="font-black text-2xl text-primary tracking-tighter">
                                        LKR {item.price.toFixed(2)}
                                    </div>
                                    <Badge variant="secondary" className="bg-muted/50 text-[#6b584b] text-[10px] font-black uppercase tracking-widest px-3 py-1">
                                        portion
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
