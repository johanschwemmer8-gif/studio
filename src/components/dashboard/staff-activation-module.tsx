
'use client';

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
import { Building2, Medal, User } from 'lucide-react';

type StaffData = {
  id: string;
  name: string;
  store: string;
  activations: number;
};

type StaffActivationModuleProps = {
  data: StaffData[];
};

export default function StaffActivationModule({ data }: StaffActivationModuleProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge variant="default" className="gap-1.5 pl-1.5 bg-yellow-400 hover:bg-yellow-400/80 text-yellow-900"><Medal /> 1st</Badge>;
    if (rank === 2) return <Badge variant="secondary" className="gap-1.5 pl-1.5 bg-slate-300 hover:bg-slate-300/80 text-slate-800"><Medal /> 2nd</Badge>;
    if (rank === 3) return <Badge variant="secondary" className="gap-1.5 pl-1.5 bg-orange-400 hover:bg-orange-400/80 text-orange-900"><Medal /> 3rd</Badge>;
    return <span className="font-semibold text-muted-foreground">{rank}</span>;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Staff Member</TableHead>
              <TableHead>Store</TableHead>
              <TableHead className="text-right">Activations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((staff, index) => (
              <TableRow key={staff.id}>
                <TableCell className="font-bold text-lg">
                  {getRankBadge(index + 1)}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2 font-medium'>
                      <User className="h-4 w-4 text-muted-foreground" />
                      {staff.name}
                  </div>
                </TableCell>
                 <TableCell>
                  <div className='flex items-center gap-2 text-muted-foreground'>
                      <Building2 className="h-4 w-4" />
                      {staff.store}
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold text-lg text-primary">
                  {staff.activations}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
