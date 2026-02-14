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
      <div className="space-y-8 min-h-[50vh] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 mb-6">
          <Skeleton className="h-14 w-64 rounded-full bg-muted/50" />
          <p className="text-muted-foreground text-sm animate-pulse tracking-widest uppercase font-bold">Loading Menu...</p>
        </div>
        <div className="flex gap-6 overflow-hidden w-full justify-center opacity-50">
          <Skeleton className="h-60 w-40 sm:h-80 sm:w-80 shrink-0 rounded-[2.5rem] bg-muted/30" />
          <Skeleton className="h-60 w-40 sm:h-80 sm:w-80 shrink-0 rounded-[2.5rem] bg-muted/30 hidden sm:block" />
          <Skeleton className="h-60 w-40 sm:h-80 sm:w-80 shrink-0 rounded-[2.5rem] bg-muted/30 hidden md:block" />
        </div>
      </div>
    )
  }

  return (
    <Tabs defaultValue={MAIN_CATEGORIES[1]} className="w-full">
      <div className="flex justify-center mb-10 sm:mb-16">
        <TabsList className="bg-muted/50 p-1 md:p-1.5 h-12 sm:h-16 rounded-full border border-muted w-auto overflow-x-auto">
          {MAIN_CATEGORIES.map(categoryType => (
            <TabsTrigger
              key={categoryType}
              value={categoryType}
              className="rounded-full px-5 sm:px-10 font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] data-[state=active]:bg-white data-[state=active]:text-[#d97706] data-[state=active]:shadow-xl transition-all h-full"
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
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6 md:gap-8 pb-6 sm:pb-8">
                    {subItems.map(item => (
                      <Card key={item.id} className={cn("flex flex-col w-full overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-500 group rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] bg-white", item.isOutOfStock && "opacity-60 grayscale")}>
                        <div className="relative w-full aspect-[4/3] overflow-hidden">
                          <Image
                            src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform duration-1000 group-hover:scale-110"
                            data-ai-hint="food item"
                          />
                          {item.isOutOfStock && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                              <Badge variant="destructive" className="h-6 px-3 text-[7px] font-black uppercase tracking-[0.2em] shadow-xl rounded-full">Sold Out</Badge>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-2.5 sm:p-6 md:p-8 flex-grow flex flex-col justify-between">
                          <div>
                            <CardTitle className="font-headline text-xs sm:text-2xl mb-1 sm:mb-3 text-[#2c1810] tracking-tight">{item.name}</CardTitle>
                            <CardDescription className="text-[#6b584b] line-clamp-2 leading-relaxed text-sm font-medium hidden sm:block">
                              {item.description}
                            </CardDescription>
                          </div>
                          <div className="mt-2 sm:mt-6 md:mt-8 pt-2 sm:pt-5 md:pt-6 border-t border-muted/50 flex items-center justify-between gap-1">
                            <div className="font-black text-sm sm:text-2xl text-primary tracking-tighter">
                              LKR {item.price.toFixed(0)}
                            </div>
                            <Badge variant="secondary" className="bg-muted/50 text-[#6b584b] text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 sm:px-3 sm:py-1">
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
