import { User, MenuItem } from './types';
import { getLoyaltyTier } from './data';

export const MENU_ITEMS: MenuItem[] = [
  { id: 'item_1', name: 'Espresso', description: 'Rich & intense, a pure coffee experience.', price: 3.50, category: 'Hot Coffee', imageId: 'espresso', stock: 100, analytics: { unitsSold: 150 } },
  { id: 'item_2', name: 'Latte', description: 'Smooth espresso with steamed milk.', price: 4.50, category: 'Hot Coffee', imageId: 'latte', stock: 80, analytics: { unitsSold: 250 } },
  { id: 'item_3', name: 'Cappuccino', description: 'Equal parts espresso, steamed milk, and foam.', price: 4.00, category: 'Hot Coffee', imageId: 'cappuccino', stock: 90, analytics: { unitsSold: 200 } },
  { id: 'item_4', name: 'Iced Coffee', description: 'Chilled and refreshing, brewed to perfection.', price: 4.00, category: 'Iced Coffee', imageId: 'iced-coffee', stock: 120, analytics: { unitsSold: 180 } },
  { id: 'item_5', name: 'Croissant', description: 'Buttery, flaky, and fresh from the oven.', price: 3.50, category: 'Pastries', imageId: 'croissant', stock: 50, analytics: { unitsSold: 300 } },
  { id: 'item_6', name: 'Blueberry Muffin', description: 'Sweet and moist, packed with blueberries.', price: 3.00, category: 'Pastries', imageId: 'muffin', stock: 60, analytics: { unitsSold: 120 } },
];

const CUSTOMER_USER: User = {
  id: 'usr_customer',
  name: 'Sam Customer',
  email: 'customer@example.com',
  mobileNumber: '555-123-4567',
  cafeNickname: 'Sammy',
  role: 'customer',
  points: 78,
  loyaltyLevel: getLoyaltyTier(78).level,
  recentOrders: [
    {
      id: 'ord_1',
      date: '2024-07-28',
      items: [{ menuItem: MENU_ITEMS[1], quantity: 1 }, { menuItem: MENU_ITEMS[4], quantity: 1 }],
      total: 8.00,
      pointsEarned: 8,
      status: 'Completed',
    },
    {
      id: 'ord_2',
      date: '2024-07-25',
      items: [{ menuItem: MENU_ITEMS[0], quantity: 2 }],
      total: 7.00,
      pointsEarned: 7,
      status: 'Completed',
    },
    {
      id: 'ord_3',
      date: '2024-07-29',
      items: [{ menuItem: MENU_ITEMS[2], quantity: 1 }],
      total: 4.00,
      pointsEarned: 4,
      status: 'Ready for Pickup',
    }
  ],
  analytics: {
    totalSpent: 150.25,
    orderCount: 15,
  }
};

const OTHER_CUSTOMER_USER: User = {
  id: 'usr_customer_2',
  name: 'Jane Doe',
  email: 'jane@example.com',
  mobileNumber: '555-987-6543',
  cafeNickname: 'JD',
  role: 'customer',
  points: 150,
  loyaltyLevel: getLoyaltyTier(150).level,
  recentOrders: [
    {
      id: 'ord_4',
      date: '2024-07-29',
      items: [{ menuItem: MENU_ITEMS[5], quantity: 2 }],
      total: 6.00,
      pointsEarned: 6,
      status: 'Processing',
    },
  ],
  analytics: {
    totalSpent: 280.50,
    orderCount: 25,
  }
};


const STAFF_USER: User = {
    id: 'usr_staff',
    name: 'Sarah Staff',
    email: 'staff@example.com',
    role: 'staff',
}

const ADMIN_USER: User = {
  id: 'usr_admin',
  name: 'Alex Admin',
  email: 'admin@example.com',
  role: 'admin',
};

export const MOCK_DATA: User[] = [
    CUSTOMER_USER,
    OTHER_CUSTOMER_USER,
    STAFF_USER,
    ADMIN_USER,
];
