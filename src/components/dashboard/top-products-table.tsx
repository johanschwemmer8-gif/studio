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

type TableData = {
  id: string;
  name: string;
  scans: number;
  category: string;
}[];

export default function TopProductsTable({ data }: { data: TableData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top-Scanned Products</CardTitle>
        <CardDescription>
          The most frequently scanned products by customers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Scans</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="font-medium">{product.name}</div>
                  <Badge variant="outline" className='mt-1'>{product.category}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {product.scans}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
