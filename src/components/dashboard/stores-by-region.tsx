
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { storesByRegion } from '@/lib/data';
import { Building2 } from 'lucide-react';

export default function StoresByRegion() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stores by Region</CardTitle>
        <CardDescription>
          Your retail locations across South Africa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="Gauteng">
          {storesByRegion.map((region) => (
            <AccordionItem key={region.province} value={region.province}>
              <AccordionTrigger className="font-medium text-base">
                {region.province}
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3 pt-2">
                  {region.stores.map((store) => (
                    <li key={store.name} className="flex items-center gap-3 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{store.name}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
