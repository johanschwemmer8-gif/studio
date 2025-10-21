
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChevronDown,
  PlusCircle,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  BarChart,
  DollarSign,
  QrCode,
  Users,
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis } from 'recharts';
import { Label } from '@/components/ui/label';

const sampleRetailers: { id: number; logo: string; name: string; owner: string; email: string; plan: string; qrCodes: number; monthlyScans: number; lastActive: string; status: string; }[] = [];

const performanceChartData: { month: string; revenue: number; scans: number; }[] = [];

function RetailerProfileModal({ retailer, open, onOpenChange }: { retailer: any; open: boolean; onOpenChange: (open: boolean) => void }) {
    if (!retailer) return null;
    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <Avatar><AvatarImage src={retailer.logo} /><AvatarFallback>{retailer.name.charAt(0)}</AvatarFallback></Avatar>
                        {retailer.name}
                    </DialogTitle>
                    <DialogDescription>
                        An overview of the retailer's profile and performance.
                    </DialogDescription>
                </DialogHeader>
                 <div className="grid md:grid-cols-3 gap-6 py-4">
                    {/* Left Panel */}
                    <div className="md:col-span-1 space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="text-base">Retailer Information</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <p><strong>Owner:</strong> {retailer.owner}</p>
                                <p><strong>Email:</strong> {retailer.email}</p>
                                <p><strong>Plan:</strong> <Badge>{retailer.plan}</Badge></p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="text-base">Billing</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-2">
                               <p><strong>Method:</strong> Visa **** 4242</p>
                               <p><strong>Next Billing:</strong> {format(addDays(new Date(), 30), "LLL dd, y")}</p>
                               <Button size="sm" variant="outline" className="w-full mt-2">Manage Billing</Button>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Right Panel */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                           <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">QR Codes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{retailer.qrCodes}</div></CardContent></Card>
                           <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Scans/mo</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{retailer.monthlyScans}</div></CardContent></Card>
                           <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Revenue/mo</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">R0</div></CardContent></Card>
                        </div>
                        <Card>
                            <CardHeader><CardTitle className="text-base">Performance</CardTitle></CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="h-[200px] w-full">
                                    <RechartsBarChart data={performanceChartData}>
                                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={4} />
                                    </RechartsBarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function RetailerManagementInterface() {
  const [date, setDate] = useState<DateRange | undefined>({ from: addDays(new Date(), -30), to: new Date() });
  const [selectedRetailer, setSelectedRetailer] = useState<any | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  const handleViewProfile = (retailer: any) => {
    setSelectedRetailer(retailer);
    setIsProfileOpen(true);
  };
  
  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'Active': return <Badge>{status}</Badge>;
          case 'Inactive': return <Badge variant="secondary">{status}</Badge>;
          case 'Suspended': return <Badge variant="destructive">{status}</Badge>;
          case 'Pending': return <Badge variant="outline">{status}</Badge>;
          default: return <Badge>{status}</Badge>;
      }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Retailer Management</h1>
          <p className="text-muted-foreground">{sampleRetailers.length} retailers</p>
        </div>
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">Bulk Actions <ChevronDown className="ml-2 h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                    <DropdownMenuItem>Send Bulk Email</DropdownMenuItem>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem className="text-yellow-600">Suspend Selected</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete Selected</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Retailer</Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search retailers..." className="pl-10"/>
            </div>
            <Select><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="All Plans"/></SelectTrigger><SelectContent><SelectItem value="all">All Plans</SelectItem></SelectContent></Select>
            <Select><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="All Statuses"/></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem></SelectContent></Select>
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full md:w-auto justify-start text-left font-normal">
                        {date?.from ? (date.to ? `${format(date.from, "LLL dd")} - ${format(date.to, "LLL dd, y")}` : format(date.from, "LLL dd, y")) : "Select date range"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2}/></PopoverContent>
            </Popover>
            <Dialog open={isAdvancedSearchOpen} onOpenChange={setIsAdvancedSearchOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost"><SlidersHorizontal className="mr-2 h-4 w-4"/> Advanced</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Advanced Search</DialogTitle>
                        <DialogDescription>
                            Apply more specific filters to narrow down the retailer list.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                         <div className="space-y-2">
                             <Label htmlFor="monthlyScans">Monthly Scans</Label>
                             <div className="flex gap-2">
                                 <Input id="monthlyScansMin" placeholder="Min" type="number" />
                                 <Input id="monthlyScansMax" placeholder="Max" type="number" />
                             </div>
                         </div>
                          <div className="space-y-2">
                             <Label htmlFor="qrCodes">Total QR Codes</Label>
                             <div className="flex gap-2">
                                 <Input id="qrCodesMin" placeholder="Min" type="number" />
                                 <Input id="qrCodesMax" placeholder="Max" type="number" />
                             </div>
                         </div>
                    </div>
                     <DialogFooter>
                        <Button onClick={() => setIsAdvancedSearchOpen(false)}>Apply Filters</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"><Checkbox /></TableHead>
                <TableHead>Retailer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>QR Codes</TableHead>
                <TableHead>Monthly Scans</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleRetailers.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No retailers have been added yet.
                    </TableCell>
                </TableRow>
              ) : (sampleRetailers.map(retailer => (
                <TableRow key={retailer.id}>
                    <TableCell><Checkbox/></TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar><AvatarImage src={retailer.logo} /><AvatarFallback>{retailer.name.charAt(0)}</AvatarFallback></Avatar>
                            <div>
                                <p className="font-medium">{retailer.name}</p>
                                <p className="text-xs text-muted-foreground">{retailer.owner}</p>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>{retailer.plan}</TableCell>
                    <TableCell>{retailer.qrCodes}</TableCell>
                    <TableCell>{retailer.monthlyScans}</TableCell>
                    <TableCell>{retailer.lastActive}</TableCell>
                    <TableCell>{getStatusBadge(retailer.status)}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewProfile(retailer)}>View Profile</DropdownMenuItem>
                                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                <DropdownMenuItem>Manage QR Codes</DropdownMenuItem>
                                <DropdownMenuItem>View Analytics</DropdownMenuItem>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem>Suspend</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Showing 0 of {sampleRetailers.length} retailers</p>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
        </CardFooter>
      </Card>
      <RetailerProfileModal retailer={selectedRetailer} open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </div>
  );
}
