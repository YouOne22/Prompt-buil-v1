import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prompt Studio Banner v1.3',
  description: 'AI‑driven prompt generator for banner & poster design',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
