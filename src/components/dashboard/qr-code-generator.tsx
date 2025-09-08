
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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

type QrCodeGeneratorProps = {
  onQrGenerated: (url: string, qrCodeUrl: string) => void;
};

export default function QrCodeGenerator({ onQrGenerated }: QrCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

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
    onQrGenerated(values.url, fullQrUrl);
    form.reset();
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
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
            Generate QR Code
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
            <p className="text-sm mt-2 text-muted-foreground">
              QR Code generated successfully.
            </p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <QrCode className="h-16 w-16 mx-auto mb-4" />
            <p>Your generated QR code will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
