import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from './providers';
import Script from 'next/script';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Seahorse — Pipeline Inteligente de Empleo',
  description:
    'Plataforma premium de automatización de búsqueda de empleo: scraping multi-fuente, matching con IA, y envío de alertas por email',
  keywords: ['empleo', 'trabajo', 'scraping', 'IA', 'matching', 'pipeline', 'automatización'],
  authors: [{ name: 'Seahorse' }],
  icons: {
    icon: { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
  },
  openGraph: {
    title: 'Seahorse — Pipeline Inteligente de Empleo',
    description:
      'Automatiza tu búsqueda de empleo con scraping multi-fuente, matching IA y alertas por correo',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') || '';

  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable}`}>
      <head />
      <body className={`${inter.className} min-h-screen antialiased`}>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var isDark = theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
