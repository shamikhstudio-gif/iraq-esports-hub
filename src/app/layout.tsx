import type { Metadata } from 'next';
import './globals.css';
import { AuthGate } from '@/components/auth/AuthGate';
import { RealtimeToaster } from '@/components/RealtimeToaster';

export const metadata: Metadata = {
  title: 'IEH | Iraq Esports Hub - شبكة الرياضات الإلكترونية العراقية',
  description: 'المنصة الرسمية المخصصة للفرق واللاعبين في الرياضات الإلكترونية داخل جمهورية العراق. تنظيم السكريمات، تأسيس الفرق، ومتابعة البطولات والإعلانات الرسمية.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark bg-black text-white">
      <body className="bg-black text-white min-h-screen flex flex-col antialiased selection:bg-white selection:text-black">
        <AuthGate>{children}</AuthGate>
        <RealtimeToaster />
      </body>
    </html>
  );
}
