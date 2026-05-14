import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { LegalFooter } from '@/components/layout/LegalFooter';
import { ConsentBanner } from '@/components/ui/ConsentBanner';
import { AuthProvider } from '@/context/AuthContext';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';

export const metadata: Metadata = {
  title: 'Táxi Combinado - Calculadora de Corrida para Taxistas',
  description: 'Calcule corridas combinadas de táxi sem sair no prejuízo.',
  keywords: ['taxi', 'táxi', 'calculadora', 'corrida', 'taxista', 'São Paulo', 'preço', 'tarifa'],
  authors: [{ name: 'Táxi Combinado' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Táxi Combinado',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Táxi Combinado - Calculadora de Corrida',
    description: 'Calcule corridas combinadas de táxi sem sair no prejuízo.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f5b800',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Táxi Combinado" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
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
          <PWAInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
