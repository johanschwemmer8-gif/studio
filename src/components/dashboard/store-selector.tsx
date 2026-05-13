'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Globe, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

type StoreSelectorProps = {
  regions: { province: string; stores: {name: string, code: number}[] }[];
  selectedRegion?: string | null;
  onRegionChange?: (region: string | null) => void;
  selectedStore: string | null;
  onStoreChange: (store: string | null) => void;
  className?: string;
};

export default function StoreSelector({
  regions,
  selectedRegion,
  onRegionChange,
  selectedStore,
  onStoreChange,
  className,
}: StoreSelectorProps) {
  
  const storesInRegion = regions.find(r => r.province === selectedRegion)?.stores || [];

  const handleRegionChange = (province: string) => {
    onRegionChange?.(province === 'All Regions' ? null : province);
  };
  
  const handleStoreChange = (store: string) => {
    onStoreChange(store === 'All Stores' ? null : store);
  };

  const isRegionSelectorDisabled = !onRegionChange;
  const isStoreSelectorDisabled = !selectedRegion;

  return (
    <div className={cn("flex flex-col sm:flex-row items-center gap-3", className)}>
      {onRegionChange && (
        <div className="flex-1 w-full">
          <Select value={selectedRegion || 'All Regions'} onValueChange={handleRegionChange} disabled={isRegionSelectorDisabled}>
            <SelectTrigger className="w-full bg-background/50 h-10 border-primary/10 hover:border-primary/30 transition-all">
               <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary/60" />
                  <SelectValue placeholder="All Regions" />
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
      )}
      <div className="flex-1 w-full">
        <Select
          value={selectedStore || 'All Stores'}
          onValueChange={handleStoreChange}
          disabled={isStoreSelectorDisabled}
        >
          <SelectTrigger className="w-full bg-background/50 h-10 border-primary/10 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary/60" />
                <SelectValue placeholder="All Stores" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Stores">All Stores</SelectItem>
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
