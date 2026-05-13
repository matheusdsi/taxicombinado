import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { LegalFooter } from '@/components/layout/LegalFooter';
import { ConsentBanner } from '@/components/ui/ConsentBanner';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Taxi Combinado - Calculadora de Corrida para Taxistas',
  description:
    'Calcule o preço justo da sua corrida de táxi considerando combustível, pedágios, tempo e margem de lucro. Feito para taxistas de São Paulo.',
  keywords: ['taxi', 'táxi', 'calculadora', 'corrida', 'taxista', 'São Paulo', 'preço', 'tarifa'],
  authors: [{ name: 'Taxi Combinado' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Taxi Combinado - Calculadora de Corrida',
    description: 'Calcule o preço justo da sua corrida de táxi',
    type: 'website',
    locale: 'pt_BR',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f59e0b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-W8L7JP8M');` }} />
      </head>
      <body className="min-h-screen bg-gray-50">
        {/* Google Tag Manager (noscript) */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-W8L7JP8M" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe></noscript>
        <AuthProvider>
          <Header />
          <div className="min-h-[calc(100vh-56px)]">{children}</div>
          <LegalFooter />
          <BottomNavigation />
          <ConsentBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
