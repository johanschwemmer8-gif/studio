import QrCodeGenerator from '@/components/dashboard/qr-code-generator';

export default function QrGeneratorPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">QR Code Generator</h2>
      <p className="text-muted-foreground mb-6 max-w-2xl">
        Create QR codes for your products. Customers can scan these in-store to
        view product information on your website. Just paste the product URL below.
      </p>
      <QrCodeGenerator />
    </div>
  );
}
