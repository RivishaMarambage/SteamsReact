
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { AreaChart, BookMarked, LayoutDashboard, ShoppingCart, User as UserIcon, ScanSearch, Users, ShieldCheck, FolderPlus, Tag, Wallet, Blocks, Gift, AppWindow } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Logo } from '../Logo';
import Link from 'next/link';
import { useUser, useDoc, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, getDocs, collection, query, limit, writeBatch, where, getDoc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { Addon, AddonCategory, Category, LoyaltyLevel, MenuItem } from '@/lib/types';

const customerMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/order', label: 'Order', icon: ShoppingCart },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/profile', label: 'My Profile', icon: UserIcon },
];

const staffMenuItems = [
    { href: '/dashboard/staff/orders', label: 'Manage Orders', icon: ShoppingCart },
    { href: '/dashboard/staff/redeem', label: 'Redeem Points', icon: ScanSearch },
    { href: '/dashboard/admin/categories', label: 'Menu Categories', icon: FolderPlus },
    { href: '/dashboard/admin/menu', label: 'Menu Management', icon: BookMarked },
];

const adminMenuItems = [
  { href: '/dashboard/admin/analytics', label: 'Analytics', icon: AreaChart },
  { href: '/dashboard/admin/offers', label: 'Offers', icon: Gift },
  { href: '/dashboard/admin/addon-categories', label: 'Add-on Categories', icon: AppWindow },
  { href: '/dashboard/admin/addons', label: 'Add-ons', icon: Blocks },
  { href: '/dashboard/admin/users', label: 'Manage Users', icon: Users },
  { href: '/dashboard/admin/roles', label: 'Manage Roles', icon: ShieldCheck },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();

  const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);
  const userRole = userProfile?.role;
  const isLoading = isUserLoading || isProfileLoading;

  useEffect(() => {
    const SEED_CATEGORIES: Omit<Category, 'id'>[] = [
        { name: 'Coffee Classics', type: 'Beverages' },
        { name: 'Specialty Lattes', type: 'Beverages' },
        { name: 'Matcha & Tea', type: 'Beverages' },
        { name: 'Pastries & Bakes', type: 'Food' },
        { name: 'Savory Snacks', type: 'Food' },
        { name: 'Lunch Specials', type: 'Food' },
        { name: 'Custom Creations', type: 'Beverages' },
    ];

    const SEED_LOYALTY_LEVELS: Omit<LoyaltyLevel, 'id'>[] = [
        { name: 'Member', minimumPoints: 0 },
        { name: 'Bronze', minimumPoints: 100 },
        { name: 'Silver', minimumPoints: 500 },
        { name: 'Gold', minimumPoints: 2000 },
        { name: 'Platinum', minimumPoints: 5000 },
    ]

    const SEED_ADDON_CATEGORIES: Omit<AddonCategory, 'id'>[] = [
        { name: 'Milk Options', description: 'Choose your preferred milk' },
        { name: 'Syrups', description: 'Add a touch of sweetness' },
        { name: 'Toppings', description: 'Finish your drink with a flourish' },
    ];

    const seedDatabase = async () => {
        if (!firestore) return;

        let customCreationsCategoryId = '';

        // Seed Categories
        const categoriesRef = collection(firestore, 'categories');
        getDocs(query(categoriesRef, limit(1))).then(async categorySnapshot => {
            if (categorySnapshot.empty) {
                console.log("Categories collection is empty. Seeding...");
                const categoryBatch = writeBatch(firestore);
                for (const category of SEED_CATEGORIES) {
                    const docRef = doc(categoriesRef); // Create a new doc with a generated ID
                    categoryBatch.set(docRef, category);
                     if (category.name === 'Custom Creations') {
                      customCreationsCategoryId = docRef.id;
                    }
                }
                await categoryBatch.commit().catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'categories', operation: 'write', requestResourceData: SEED_CATEGORIES }));
                });
                console.log("Seeded categories.");
            } else {
                 const q = query(categoriesRef, where('name', '==', 'Custom Creations'), limit(1));
                 const snapshot = await getDocs(q);
                 if (!snapshot.empty) {
                    customCreationsCategoryId = snapshot.docs[0].id;
                 } else {
                    const customCreationCategory = SEED_CATEGORIES.find(c => c.name === 'Custom Creations');
                    if (customCreationCategory) {
                        const newDocRef = doc(categoriesRef);
                        await setDoc(newDocRef, customCreationCategory);
                        customCreationsCategoryId = newDocRef.id;
                    }
                 }
            }

            // Seed Add-on Categories
            const addonCategoriesRef = collection(firestore, 'addon_categories');
            const addonCategorySnapshot = await getDocs(query(addonCategoriesRef, limit(1))).catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'addon_categories', operation: 'list' }));
                return null;
            });
            if (!addonCategorySnapshot) return;

            const addonCategoryIds: Record<string, string> = {};

            if (addonCategorySnapshot.empty) {
                console.log("Add-on categories collection is empty. Seeding...");
                const batch = writeBatch(firestore);
                for (const category of SEED_ADDON_CATEGORIES) {
                    const docRef = doc(addonCategoriesRef);
                    batch.set(docRef, category);
                    addonCategoryIds[category.name] = docRef.id;
                }
                await batch.commit().catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'addon_categories', operation: 'write', requestResourceData: SEED_ADDON_CATEGORIES }));
                });
                console.log("Seeded add-on categories.");
            } else {
                const allAddonCategories = await getDocs(addonCategoriesRef).catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'addon_categories', operation: 'list' }));
                    return null;
                });
                if (!allAddonCategories) return;
                allAddonCategories.forEach(doc => {
                    const data = doc.data() as AddonCategory;
                    addonCategoryIds[data.name] = doc.id;
                });
            }
            
            // Seed Add-ons
            const addonsRef = collection(firestore, 'addons');
            const addonSnapshot = await getDocs(query(addonsRef, limit(1))).catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'addons', operation: 'list' }));
                return null;
            });
            if (!addonSnapshot) return;

            if (addonSnapshot.empty) {
                console.log("Addons collection is empty. Seeding...");
                const batch = writeBatch(firestore);
                const SEED_ADDONS: Omit<Addon, 'id'>[] = [
                    { name: "Extra Espresso Shot", price: 100, addonCategoryId: addonCategoryIds['Toppings'] },
                    { name: "Almond Milk", price: 80, addonCategoryId: addonCategoryIds['Milk Options'] },
                    { name: "Oat Milk", price: 80, addonCategoryId: addonCategoryIds['Milk Options'] },
                    { name: "Soy Milk", price: 70, addonCategoryId: addonCategoryIds['Milk Options'] },
                    { name: "Whipped Cream", price: 50, addonCategoryId: addonCategoryIds['Toppings'] },
                    { name: "Caramel Drizzle", price: 60, addonCategoryId: addonCategoryIds['Syrups'] },
                    { name: "Chocolate Syrup", price: 60, addonCategoryId: addonCategoryIds['Syrups'] },
                ];
                SEED_ADDONS.forEach(addon => {
                    const docRef = doc(addonsRef);
                    batch.set(docRef, addon);
                });
                await batch.commit().catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'addons', operation: 'write', requestResourceData: SEED_ADDONS }));
                });
                console.log("Seeded addons.");
            }

            // Seed Custom Menu Items
            const menuItemsRef = collection(firestore, 'menu_items');
            const customCoffeeDoc = await getDoc(doc(menuItemsRef, 'custom-coffee-base')).catch(error => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'menu_items/custom-coffee-base', operation: 'get' }));
                 return null;
            });
            
            if (customCoffeeDoc && !customCoffeeDoc.exists() && customCreationsCategoryId && Object.keys(addonCategoryIds).length > 0) {
                console.log("Seeding custom menu items...");
                const batch = writeBatch(firestore);
                const coffeeBase: Omit<MenuItem, 'id'> = {
                    name: 'Custom Coffee Base',
                    description: 'Your own coffee creation.',
                    price: 250,
                    categoryId: customCreationsCategoryId,
                    isOutOfStock: false,
                    addonGroups: [
                        { addonCategoryId: addonCategoryIds['Milk Options'], isRequired: true, minSelection: 1, maxSelection: 1 },
                        { addonCategoryId: addonCategoryIds['Syrups'], isRequired: false, minSelection: 0, maxSelection: 2 },
                        { addonCategoryId: addonCategoryIds['Toppings'], isRequired: false, minSelection: 0, maxSelection: 3 },
                    ]
                };
                 const teaBase: Omit<MenuItem, 'id'> = {
                    name: 'Custom Tea Base',
                    description: 'Your own tea creation.',
                    price: 200,
                    categoryId: customCreationsCategoryId,
                    isOutOfStock: false,
                    addonGroups: [
                        { addonCategoryId: addonCategoryIds['Milk Options'], isRequired: false, minSelection: 0, maxSelection: 1 },
                        { addonCategoryId: addonCategoryIds['Syrups'], isRequired: false, minSelection: 0, maxSelection: 2 },
                    ]
                };
                batch.set(doc(menuItemsRef, 'custom-coffee-base'), coffeeBase);
                batch.set(doc(menuItemsRef, 'custom-tea-base'), teaBase);
                await batch.commit().catch(error => {
                     errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'menu_items', operation: 'write', requestResourceData: { coffeeBase, teaBase } }));
                });
                console.log("Seeded custom menu items.");
            }


            // Seed Loyalty Levels
            const loyaltyLevelsRef = collection(firestore, 'loyalty_levels');
            const memberDoc = await getDoc(doc(loyaltyLevelsRef, 'member')).catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'loyalty_levels/member', operation: 'get' }));
                return null;
            });
            if (!memberDoc) return;

            if (!memberDoc.exists()) {
                console.log("Loyalty levels collection is missing or outdated. Seeding...");
                const loyaltyBatch = writeBatch(firestore);
                const existingLevels = await getDocs(loyaltyLevelsRef).catch(() => null);
                if(existingLevels) {
                    existingLevels.docs.forEach(d => loyaltyBatch.delete(d.ref));
                }
                
                SEED_LOYALTY_LEVELS.forEach(level => {
                    const docRef = doc(loyaltyLevelsRef, level.name.toLowerCase());
                    loyaltyBatch.set(docRef, level);
                });
                await loyaltyBatch.commit().catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'loyalty_levels', operation: 'write', requestResourceData: SEED_LOYALTY_LEVELS }));
                });
                console.log("Seeded loyalty levels.");
            }
        }).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'categories', operation: 'list' }));
        });
    };

    if (firestore && userRole === 'admin') {
      seedDatabase();
    }
  }, [firestore, userRole]);


  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  let menuItemsToShow: typeof customerMenuItems = [];
  const adminSectionItems: typeof adminMenuItems = [];

  if (userRole === 'customer') {
    menuItemsToShow = customerMenuItems;
  } else if (userRole === 'staff') {
    menuItemsToShow = staffMenuItems;
  } else if (userRole === 'admin') {
    // Admin sees all staff items plus their own admin items.
    menuItemsToShow = staffMenuItems;
    adminSectionItems.push(...adminMenuItems);
  }


  return (
    <Sidebar collapsible="icon">
      <SidebarRail />
      <SidebarHeader>
        <Logo link="/dashboard"/>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <div className="p-2 space-y-2">
            <div className="h-8 w-full bg-sidebar-accent/50 animate-pulse rounded-md" />
            <div className="h-8 w-full bg-sidebar-accent/50 animate-pulse rounded-md" />
            <div className="h-8 w-full bg-sidebar-accent/50 animate-pulse rounded-md" />
          </div>
        ) : (
        <SidebarMenu>
          {userRole === 'admin' && (
            <>
                <div className="px-2 py-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                    Staff View
                </div>
            </>
          )}

          {menuItemsToShow.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={isActive(item.href)}
                asChild
                tooltip={item.label}
              >
                <Link href={item.href} onClick={handleNavigate}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {userRole === 'admin' && (
            <>
              <div className="px-2 py-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                Admin
              </div>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    asChild
                    tooltip={item.label}
                  >
                    <Link href={item.href} onClick={handleNavigate}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </>
          )}
        </SidebarMenu>
        )}
      </SidebarContent>
      <SidebarFooter>
        {/* Can add elements to footer here */}
      </SidebarFooter>
    </Sidebar>
  );
}
