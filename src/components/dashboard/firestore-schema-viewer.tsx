
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, FileJson, FileText, Hash, Link, List, ScanLine, ShoppingCart } from "lucide-react";
import { Badge } from "../ui/badge";

const FieldDisplay = ({ name, type, description }: { name: string, type: string, description?: string }) => (
    <li className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors">
        <div>
            <span className="font-mono text-sm font-medium text-primary">{name}</span>
            <span className="font-mono text-xs text-muted-foreground ml-2">({type})</span>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
    </li>
);

const SubCollectionDisplay = ({ name, children }: { name: string, children: React.ReactNode }) => (
     <div className="ml-4 pl-4 border-l-2 border-dashed border-primary/50 mt-4">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <FileJson className="h-4 w-4 text-primary/80"/>
            Subcollection: <code className="font-mono text-primary">{name}</code>
        </h4>
        <ul className="space-y-2">
            {children}
        </ul>
    </div>
);


export default function FirestoreSchemaViewer() {
  return (
    <div>
        <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
               <Database className="text-primary"/> Firestore Data Structure
            </h2>
            <p className="text-muted-foreground max-w-3xl">
                A visual representation of the Firestore collections for the multi-tenant bulk QR generator.
            </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-start">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><List className="text-primary"/>Collection: <code className="font-mono">bulkQrRequests</code></CardTitle>
                    <CardDescription>Tracks the status and metadata of each bulk generation job.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        <FieldDisplay name="retailerId" type="string" description="Identifies the retailer."/>
                        <FieldDisplay name="campaignId" type="string" description="Groups QR codes under a campaign."/>
                        <FieldDisplay name="totalRequested" type="number" description="The total number of codes requested in the batch."/>
                        <FieldDisplay name="status" type="enum" description="QUEUED | PROCESSING | COMPLETED | FAILED | CANCELLED"/>
                        <FieldDisplay name="createdAt" type="timestamp" description="When the request was created."/>
                        <FieldDisplay name="createdBy" type="string" description="UID or email of the user who made the request."/>
                        <FieldDisplay name="options" type="map" description="Customization options for the QR codes (colors, AI goals, etc.)."/>
                    </ul>
                    <SubCollectionDisplay name="items">
                        <FieldDisplay name="index" type="number" description="The sequential number of the code within the batch."/>
                        <FieldDisplay name="qrCodeId" type="string" description="The unique identifier for this specific QR code."/>
                        <FieldDisplay name="redirectUrl" type="string" description="The final destination URL for the QR code."/>
                        <FieldDisplay name="signedUrl" type="string" description="A temporary, public URL for the generated QR image."/>
                        <FieldDisplay name="storagePath" type="string" description="The path to the image file in Cloud Storage."/>
                        <FieldDisplay name="status" type="enum" description="PENDING | DONE | ERROR"/>
                        <FieldDisplay name="error" type="string" description="An error message if this specific item failed."/>
                        <FieldDisplay name="checksum" type="string" description="MD5 hash of the generated image file for integrity checks."/>
                        <FieldDisplay name="params" type="map" description="Any specific parameters applied to this single QR code."/>
                    </SubCollectionDisplay>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShoppingCart className="text-primary"/>Collection: <code className="font-mono">qrcodes</code></CardTitle>
                    <CardDescription>Stores the master record for every individual QR code generated.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <ul className="space-y-2">
                        <FieldDisplay name="retailerId" type="string" description="Identifies the retailer."/>
                        <FieldDisplay name="campaignId" type="string" description="The campaign this code belongs to."/>
                        <FieldDisplay name="qrCodeId" type="string" description="The unique ID for this code."/>
                        <FieldDisplay name="requestId" type="string" description="The ID of the bulk request job it was part of."/>
                        <FieldDisplay name="redirectUrl" type="string" description="The final destination URL."/>
                        <FieldDisplay name="storagePath" type="string" description="The path to the image file in Cloud Storage."/>
                        <FieldDisplay name="signedUrl" type="string" description="Temporary public URL for the QR image."/>
                        <FieldDisplay name="scanCount" type="number" description="How many times the QR code has been scanned. Defaults to 0."/>
                        <FieldDisplay name="createdAt" type="timestamp" description="When the code was created."/>
                        <FieldDisplay name="expiresAt" type="timestamp" description="Optional expiration date for the QR code."/>
                        <FieldDisplay name="meta" type="map" description="Any other relevant metadata."/>
                    </ul>
                     <div className="mt-4 p-3 rounded-md border border-dashed">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Link className="h-4 w-4 text-blue-500"/>
                            Composite Index
                        </h4>
                        <p className="text-xs text-muted-foreground">For efficient querying, a composite index should be created on <Badge variant="secondary">retailerId</Badge> + <Badge variant="secondary">campaignId</Badge>.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
