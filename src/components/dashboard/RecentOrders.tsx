import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User } from "@/lib/types";

export default function RecentOrders({ user }: { user: User }) {
  if (!user.recentOrders || user.recentOrders.length === 0) {
    return (
       <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Recent Orders</CardTitle>
            <CardDescription>Your latest pickups from Steamsburry.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          </CardContent>
        </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Recent Orders</CardTitle>
        <CardDescription>Your latest pickups from Steamsburry.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead className="hidden sm:table-cell">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Points Earned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user.recentOrders.map(order => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="font-medium">{order.id.toLocaleUpperCase()}</div>
                  <div className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString()}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                    {order.items.map(item => item.menuItem.name).join(', ')}
                </TableCell>
                <TableCell className="text-right">Rs. {order.total.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">+{order.pointsEarned}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
