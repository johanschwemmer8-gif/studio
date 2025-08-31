'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Download, QrCode } from 'lucide-react';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL.' }),
});

export default function QrCodeGenerator() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const encodedUrl = encodeURIComponent(values.url);
    const fullQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedUrl}`;
    setQrCodeUrl(fullQrUrl);
    setSourceUrl(values.url);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate QR Code</CardTitle>
        <CardDescription>
          Enter a product URL to generate a scannable QR code.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://your-store.com/product/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">
              <QrCode className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </form>
        </Form>
        <div className="flex flex-col items-center justify-center bg-muted/50 p-8 rounded-lg min-h-[256px]">
          {qrCodeUrl ? (
            <div className="text-center">
              <Image
                src={qrCodeUrl}
                alt="Generated QR Code"
                width={256}
                height={256}
                className="rounded-md border bg-white"
              />
              <Button asChild variant="outline" className="mt-4">
                <a href={qrCodeUrl} download={`qr-code.png`}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <QrCode className="h-16 w-16 mx-auto mb-4" />
              <p>Your generated QR code will appear here.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
