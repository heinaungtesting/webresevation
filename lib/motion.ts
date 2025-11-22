// Optimized framer-motion wrapper with lazy loading
'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Lazy load framer-motion to reduce initial bundle size
const MotionDiv = dynamic(
    () => import('framer-motion').then((mod) => mod.motion.div),
    {
        ssr: false, // Disable SSR for animations
        loading: () => <div />, / / Fallback while loading
    }
);

const MotionButton = dynamic(
    () => import('framer-motion').then((mod) => mod.motion.button),
    {
        ssr: false,
        loading: () => <button />,
    }
);

const MotionLi = dynamic(
    () => import('framer-motion').then((mod) => mod.motion.li),
    {
        ssr: false,
        loading: () => <li />,
    }
);

// Export optimized motion components
export const motion = {
    div: MotionDiv as any,
    button: MotionButton as any,
    li: MotionLi as any,
};

// Export AnimatePresence with lazy loading
export const AnimatePresence = dynamic(
    () => import('framer-motion').then((mod) => mod.AnimatePresence),
    {
        ssr: false,
    }
);
