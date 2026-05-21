import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'VedaAI - AI Assessment Creator',
  description: 'AI-Powered exam paper and assignment generator for teachers',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        <div className="app-container">
          <Sidebar />
          <div className="main-area">
            <Header />
            <main className="content-container">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
