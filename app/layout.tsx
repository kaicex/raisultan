import type { Metadata, Viewport } from "next";
import { Caveat } from "next/font/google";
import "./globals.css";

const caveat = Caveat({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
  variable: "--font-handwritten",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#08111f',
};

export const metadata: Metadata = {
  title: 'Praxis Run',
  description: 'Днюховая игра для Райсултана: баги, дедлайны, Праксис и подарки в конце.',
  keywords: ['Praxis Run', 'днюха игра', 'раннер', 'Next.js game', 'Райсултан'],
  authors: [{ name: 'Kaiyr' }],
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  openGraph: {
    title: 'Praxis Run',
    description: 'Помоги Райсултану разогнать Праксис, пережить хаос и открыть подарки.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Praxis Run',
    description: 'Днюховая игра для Райсултана.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={caveat.variable}>{children}</body>
    </html>
  );
}
