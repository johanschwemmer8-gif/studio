
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';

type Field = {
  name: string;
  type: string;
  description: string;
  pk?: boolean;
};

type Collection = {
  name: string;
  description: string;
  fields: Field[];
};

const schemas: Collection[] = [
  {
    name: 'qrcodes',
    description: 'Master collection for all generated QR codes.',
    fields: [
      { name: 'qrCodeId', type: 'string', description: 'Unique identifier for the QR code.', pk: true },
      { name: 'retailerId', type: 'string', description: 'The retailer this code belongs to.' },
      { name: 'campaignId', type: 'string', description: 'The campaign this code is part of.' },
      { name: 'requestId', type: 'string', description: 'The bulk request ID it was generated in.' },
      { name: 'redirectUrl', type: 'string', description: 'The final destination URL.' },
      { name: 'scanCount', type: 'number', description: 'Total number of scans.' },
      { name: 'createdAt', type: 'timestamp', description: 'When the code was created.' },
      { name: 'expiresAt', type: 'timestamp', description: 'When the code should expire (optional).' },
      { name: 'meta', type: 'map', description: 'Additional metadata like original URL.' },
    ],
  },
  {
    name: 'scanEvents',
    description: 'Logs every individual scan event.',
    fields: [
      { name: 'eventId', type: 'string', description: 'Unique identifier for the scan event.', pk: true },
      { name: 'qrCodeId', type: 'string', description: 'The ID of the scanned QR code.' },
      { name: 'retailerId', type: 'string', description: 'The retailer associated with the scan.' },
      { name: 'campaignId', type: 'string', description: 'The campaign associated with the scan.' },
      { name: 'timestamp', type: 'timestamp', description: 'The exact time of the scan.' },
      { name: 'userAgent', type: 'string', description: 'The user agent of the scanning device.' },
      { name: 'ip', type: 'string', description: 'The IP address of the scanner (optional).' },
      { name: 'referrer', type: 'string', description: 'The referrer URL (optional).' },
    ],
  },
];

export default function FirestoreSchemaViewer() {
  return (
    <div className="space-y-8">
      {schemas.map((collection) => (
        <Card key={collection.name}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="text-primary" />
              <span className="font-mono">{collection.name}</span>
            </CardTitle>
            <CardDescription>{collection.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collection.fields.map((field) => (
                  <TableRow key={field.name}>
                    <TableCell className="font-mono flex items-center gap-2">
                      {field.name}
                      {field.pk && <Badge>PK</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{field.type}</Badge>
                    </TableCell>
                    <TableCell>{field.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
