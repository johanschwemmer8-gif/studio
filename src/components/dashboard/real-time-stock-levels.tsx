import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StockLevel = {
  id: string;
  name: string;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
};

type RealTimeStockLevelsProps = {
  data?: StockLevel[];
};

export default function RealTimeStockLevels({ data = [] }: RealTimeStockLevelsProps) {
  const getStatusColor = (status: StockLevel['status']) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'Low Stock':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'Out of Stock':
        return 'bg-red-500/20 text-red-600 border-red-500/30';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Stock Levels</CardTitle>
        <CardDescription>
          Live inventory status from your backend system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                  No stock data available.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right font-medium">{item.stock}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-semibold',
                        getStatusColor(item.status)
                      )}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
