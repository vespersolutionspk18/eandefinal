import type { Metadata } from 'next';
import { Open_Sans, Roboto_Condensed } from 'next/font/google';
import './globals.css';
import GTag from './components/GTag';
import LanguageProvider from './components/LanguageProvider';
import PhoneTracker from './components/PhoneTracker';

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--ff-open-sans',
  display: 'swap',
});

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--ff-roboto-condensed',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://eandehomeremodel.com'),
  title: {
    default: 'E&E Home Remodeling | Kitchen, Bath, ADU & Whole-Home Remodeling',
    template: '%s | E&E Home Remodeling',
  },
  description:
    'Family-owned for 25+ years. Kitchen, bathroom, ADU, garage conversion, landscaping, and whole-home remodeling across Ventura, Santa Barbara, Los Angeles, and the San Fernando Valley. Free 3D design. CA Lic #1087571.',
  openGraph: {
    title: 'E&E Home Remodeling | Kitchen, Bath, ADU & Whole-Home Remodeling',
    description:
      'Family-owned for 25+ years. Kitchen, bathroom, ADU, garage conversion, landscaping, and whole-home remodeling across Ventura, Santa Barbara, and the San Fernando Valley.',
    type: 'website',
    images: ['/bathroom/emain.jpg'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${openSans.variable} ${robotoCondensed.variable}`}>
      <body>
        {children}
        <GTag />
        <PhoneTracker />
        <LanguageProvider />
      </body>
    </html>
  );
}
