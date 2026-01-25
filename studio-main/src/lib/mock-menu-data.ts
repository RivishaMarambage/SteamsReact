export const MOCK_MENU_ITEMS = [
    // Hot Coffee
    {
        id: 'm1',
        name: 'Classic Espresso',
        description: 'Rich, intense, and full-bodied single shot made from our signature dark roast.',
        price: 800,
        categoryId: 'Food',
        subCategory: 'Hot Coffee',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1887&auto=format&fit=crop', // Specific Espresso Cup
        isVegetarian: true,
    },
    {
        id: 'm2',
        name: 'Cappuccino',
        description: 'Espresso combined with equal parts steamed milk and milk foam, dusted with cocoa.',
        price: 800,
        categoryId: 'Food',
        subCategory: 'Hot Coffee',
        imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?q=80&w=1887&auto=format&fit=crop', // Nice Cappuccino Art
        isVegetarian: true,
    },
    {
        id: 'm3',
        name: 'Caffè Latte',
        description: 'A shot of espresso in steamed milk with a light layer of foam.',
        price: 800,
        categoryId: 'Food',
        subCategory: 'Hot Coffee',
        imageUrl: 'https://images.unsplash.com/photo-1570968992272-e5c4b189d28d?q=80&w=1888&auto=format&fit=crop', // Latte on Wood table
        isVegetarian: true,
    },
    {
        id: 'm4',
        name: 'Americano',
        description: 'Espresso shots topped with hot water creating a light layer of crema.',
        price: 800,
        categoryId: 'Food',
        subCategory: 'Hot Coffee',
        imageUrl: 'https://images.unsplash.com/photo-1551030173-122aaceafa94?q=80&w=1974&auto=format&fit=crop', // White Cup Americano
        isVegetarian: true,
    },
    {
        id: 'm5',
        name: 'Caramel Macchiato',
        description: 'Freshly steamed milk with vanilla-flavored syrup marked with espresso and topped with a caramel drizzle.',
        price: 950,
        categoryId: 'Food',
        subCategory: 'Hot Coffee',
        imageUrl: 'https://images.unsplash.com/photo-1485808191679-5f8c7c41f7bc?q=80&w=1932&auto=format&fit=crop', // Layered Macchiato
        isVegetarian: true,
    },
    {
        id: 'm6',
        name: 'Flat White',
        description: 'Smooth ristretto shots of espresso and steamed whole milk.',
        price: 850,
        categoryId: 'Food',
        subCategory: 'Hot Coffee',
        imageUrl: 'https://images.unsplash.com/photo-1574041113330-8041c2c31e7f?q=80&w=1974&auto=format&fit=crop', // Perfect Flat White
        isVegetarian: true,
    },

    // Cold Brews
    {
        id: 'c1',
        name: 'Iced Caramel Macchiato',
        description: 'Espresso combined with vanilla-flavored syrup, milk and caramel drizzle over ice.',
        price: 800,
        categoryId: 'Beverages',
        subCategory: 'Cold Brews',
        imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=1887&auto=format&fit=crop', // Iced Coffee Glass
        isVegetarian: true,
    },
    {
        id: 'c2',
        name: 'Nitro Cold Brew',
        description: 'Our signature Cold Brew infused with nitrogen for a creamy, sweet flavor without sugar.',
        price: 800,
        categoryId: 'Beverages',
        subCategory: 'Cold Brews',
        imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b5c7331c?q=80&w=2070&auto=format&fit=crop', // Dark Stout/Nitro
        isVegetarian: true,
    },
    {
        id: 'c3',
        name: 'Iced Matcha Latte',
        description: 'Smooth and creamy matcha sweetened just right and served with milk over ice.',
        price: 800,
        categoryId: 'Beverages',
        subCategory: 'Cold Brews',
        imageUrl: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?q=80&w=2071&auto=format&fit=crop', // Green Matcha
        isVegetarian: true,
    },
    {
        id: 'c4',
        name: 'Cold Brew Green Tea',
        description: 'Refreshing organic green tea brewed cold for a smooth taste.',
        price: 800,
        categoryId: 'Beverages',
        subCategory: 'Cold Brews',
        imageUrl: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=2070&auto=format&fit=crop', // Clear Green Tea
        isVegetarian: true,
    },

    // Teas
    {
        id: 't1',
        name: 'Earl Grey',
        description: 'Black tea blend flavored with oil of bergamot.',
        price: 450,
        categoryId: 'Beverages',
        subCategory: 'Teas',
        imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=1964&auto=format&fit=crop', // Tea Cup with Tea bag
        isVegetarian: true,
    },
    {
        id: 't2',
        name: 'Chai Latte',
        description: 'Black tea infused with cinnamon, clove, and other warming spices is combined with steamed milk.',
        price: 600,
        categoryId: 'Beverages',
        subCategory: 'Teas',
        imageUrl: 'https://images.unsplash.com/photo-1576092762791-2f34f18d9248?q=80&w=1887&auto=format&fit=crop', // Spiced Chai
        isVegetarian: true,
    },

    // Bakery
    {
        id: 'b1',
        name: 'Croissant',
        description: 'Flaky, golden-brown pastry made with pure butter.',
        price: 800,
        categoryId: 'Food',
        subCategory: 'Bakery',
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1926&auto=format&fit=crop', // Quality Croissant
        isVegetarian: true,
    },
    {
        id: 'b2',
        name: 'Chocolate Muffin',
        description: 'Rich chocolate muffin loaded with chocolate chips.',
        price: 800,
        categoryId: 'Food',
        subCategory: 'Bakery',
        imageUrl: 'https://images.unsplash.com/photo-1558401391-7899b4bd5bbf?q=80&w=1886&auto=format&fit=crop', // Chocolate Muffin
        isVegetarian: true,
    },
    {
        id: 'b3',
        name: 'Garlic Bread',
        description: 'Toasted baguette topped with garlic butter and herbs.',
        price: 800,
        categoryId: 'Food',
        subCategory: 'Bakery',
        imageUrl: 'https://images.unsplash.com/photo-1573140401552-3fb46a953427?q=80&w=2070&auto=format&fit=crop', // Garlic Bread
        isVegetarian: true,
    },
    {
        id: 'b4',
        name: 'Everything Bagel',
        description: 'New York style bagel topped with sesame seeds, poppy seeds, and onion.',
        price: 800,
        categoryId: 'Food',
        subCategory: 'Bakery',
        imageUrl: 'https://images.unsplash.com/photo-1621255523432-84334360e29b?q=80&w=2070&auto=format&fit=crop', // Bagel
        isVegetarian: true,
    }
];
