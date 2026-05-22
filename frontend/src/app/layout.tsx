import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import './globals.css';

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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
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
