import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import Script from 'next/script'; 
import './globals.css';
import { AuthProvider } from './context/AuthContext'; 
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthCookieHelper from './components/AuthCookieHelper'; // 👈 1. IMPORTAMOS AQUI

const nunito = Nunito({ 
  subsets: ['latin'], 
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Atividade Adaptada | Materiais para Professores',
  description: 'A maior plataforma de atividades e recursos adaptados para educadores.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* === LINK DOS ÍCONES (MATERIAL SYMBOLS) AQUI === */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" 
          rel="stylesheet" 
        />

        {/* GOOGLE TAG MANAGER */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-5V8F3ZKD');
            `,
          }}
        />

        {/* GOOGLE ANALYTICS (gtag) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-XJ6XZC2JN1"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XJ6XZC2JN1');
            `,
          }}
        />

        {/* GOOGLE ADSENSE */}
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7297230407550504"
        />
      </head>

      <body className={`${nunito.variable} font-nunito bg-slate-50 text-gray-800 min-h-screen flex flex-col`}>
        
        {/* GTM NOSCRIPT */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5V8F3ZKD"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <AuthProvider>
          {/* 👈 2. COLOCAMOS ELE AQUI PARA RODAR NO FUNDO */}
          <AuthCookieHelper /> 
          
          <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
            <Navbar />
          </header>
          
          <main className="flex-grow">
            {children}
          </main>

          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}