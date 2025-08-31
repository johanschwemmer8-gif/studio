
'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Globe } from 'lucide-react';

type StoreSelectorProps = {
  regions: { province: string; stores: {name: string, code: number}[] }[];
  selectedStore: string | null;
  onStoreChange: (store: string | null) => void;
};

export default function StoreSelector({
  regions,
  selectedStore,
  onStoreChange,
}: StoreSelectorProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');
  const storesInRegion = regions.find(r => r.province === selectedRegion)?.stores || [];

  const handleRegionChange = (province: string) => {
    setSelectedRegion(province);
    onStoreChange(province === 'All Regions' ? 'All Stores' : null);
  };
  
  const handleStoreChange = (store: string) => {
    onStoreChange(store);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <Select value={selectedRegion} onValueChange={handleRegionChange}>
          <SelectTrigger className="w-full">
             <div className="flex items-center gap-2">
                <Globe />
                <SelectValue placeholder="Select a Region" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Regions">All Regions</SelectItem>
            {regions.map(region => (
              <SelectItem key={region.province} value={region.province}>
                {region.province}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Select
          value={selectedStore || ''}
          onValueChange={handleStoreChange}
          disabled={selectedRegion === 'All Regions'}
        >
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
                <Building2 />
                <SelectValue placeholder="Select a Store" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Stores">All Stores in Region</SelectItem>
            {storesInRegion.map(store => (
              <SelectItem key={store.name} value={store.name}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
