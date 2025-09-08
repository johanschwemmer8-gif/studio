
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';

export default function AdminPage() {
  const [newRetailerName, setNewRetailerName] = useState('');

  const handleAddRetailer = () => {
    // Logic to add the retailer will go here
    console.log('Adding retailer:', newRetailerName);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">iNteract Admin Panel</h2>
        <p className="text-muted-foreground max-w-3xl">
          Manage retailers and their associated brands, stores, and platform settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retailer Management</CardTitle>
          <CardDescription>
            Add new retailers to the iNteract-AOE platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="retailer-name">Retailer Name</Label>
                <Input
                id="retailer-name"
                placeholder="e.g., Example Retail Group"
                value={newRetailerName}
                onChange={(e) => setNewRetailerName(e.target.value)}
                />
            </div>
          <Button onClick={handleAddRetailer}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Retailer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
