import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NPF EOD CBRN Personnel and Equipment Management System',
  description: 'Nigeria Police Force Explosive Ordnance Disposal and Chemical, Biological, Radiological and Nuclear Command Administrative C2 System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
