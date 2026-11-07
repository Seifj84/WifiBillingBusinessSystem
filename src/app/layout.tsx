import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MtaaWiFi - Wi-Fi Portal Tanzania',
  description: 'Fast and affordable public Wi-Fi billing system in Tanzania',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sw">
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
