"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMockData } from "@/lib/auth/provider"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Order, OrderStatus } from "@/lib/types"

export default function OrderManagement() {
  const { users } = useMockData()

  // We need to aggregate all orders from all customers
  const allOrders = useMemo(() => {
    const orders: (Order & { customerName: string })[] = [];
    users.forEach(user => {
      if (user.role === 'customer' && user.recentOrders) {
        user.recentOrders.forEach(order => {
          orders.push({ ...order, customerName: user.name });
        });
      }
    });
    return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [users]);
  
  const [orders, setOrders] = useState(allOrders);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    // In a real app, you'd also call a function here to update the backend.
    // e.g., updateOrderStatus(orderId, newStatus);
  };

  const getStatusVariant = (status: OrderStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Ready for Pickup":
        return "default"
      case "Processing":
        return "secondary"
      case "Completed":
        return "outline"
      case "Pending":
      default:
        return "destructive"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incoming Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="font-medium">{order.id.toUpperCase()}</div>
                  <div className="text-sm text-muted-foreground">{new Date(order.date).toLocaleString()}</div>
                </TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>
                  {order.items.map(item => `${item.quantity}x ${item.menuItem.name}`).join(', ')}
                </TableCell>
                <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                   <Select value={order.status} onValueChange={(value: OrderStatus) => handleStatusChange(order.id, value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue asChild>
                         <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Ready for Pickup">Ready for Pickup</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
