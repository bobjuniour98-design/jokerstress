'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import PreviewProvider from '@/components/preview-provider';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

function JokerWipe() {
  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}
      initial={{ clipPath: 'inset(0 100% 0 0)' }}
      animate={{
        clipPath: [
          'inset(0 100% 0 0)',
          'inset(0 0% 0 0)',
          'inset(0 0% 0 0)',
          'inset(0 0% 0 100%)',
        ],
      }}
      transition={{ duration: 0.50, times: [0, 0.36, 0.62, 1], ease: 'easeInOut' }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, hsl(0,100%,56%) 0%, hsl(285,90%,55%) 50%, hsl(0,0%,56%) 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(-45deg, hsla(322,100%,90%,0.09) 0px, hsla(322,100%,90%,0.09) 2px, transparent 2px, transparent 14px)',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.82) 35%, rgba(255,255,255,0.82) 65%, transparent 100%)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent 0%, hsla(0,100%,30%,0.55) 50%, transparent 100%)',
      }} />
    </motion.div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [wipeId, setWipeId] = useState(0);
  const [hasNavigated, setHasNavigated] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      setHasNavigated(true);
      setWipeId(id => id + 1);
      prevPath.current = pathname;
    }
  }, [pathname]);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <PreviewProvider>
            {hasNavigated && <JokerWipe key={wipeId} />}
            {children}
          </PreviewProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
