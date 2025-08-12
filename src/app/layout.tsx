import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../components/auth/AuthProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://interviewprep.ai'),
  title: {
    default: 'AI-Powered Interview Prep Platform | Practice Mock Interviews Online',
    template: '%s | Interview Prep AI'
  },
  description: 'Master your job interviews with AI-powered mock interviews. Practice behavioral, technical, and situational questions tailored to your industry. Free trial available.',
  keywords: [
    'interview preparation',
    'mock interview',
    'job interview practice',
    'AI interview coach',
    'behavioral interview questions',
    'technical interview prep',
    'STAR method practice',
    'interview simulator',
    'career coaching',
    'job interview tips'
  ],
  authors: [{ name: 'Interview Prep AI' }],
  creator: 'Interview Prep AI',
  publisher: 'Interview Prep AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'AI-Powered Interview Prep Platform | Practice Mock Interviews',
    description: 'Master your job interviews with personalized AI coaching. Practice with real interview questions from top companies.',
    url: 'https://interviewprep.ai',
    siteName: 'Interview Prep AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Interview Prep AI Platform',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Powered Interview Prep Platform',
    description: 'Master your job interviews with personalized AI coaching',
    images: ['/twitter-image.png'],
    creator: '@interviewprepai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://interviewprep.ai',
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Interview Prep AI',
              description: 'AI-powered interview preparation platform',
              url: 'https://interviewprep.ai',
              applicationCategory: 'EducationalApplication',
              offers: {
                '@type': 'Offer',
                price: '9.00',
                priceCurrency: 'USD',
                priceValidUntil: '2025-12-31',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                reviewCount: '1250',
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}