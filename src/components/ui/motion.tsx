'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';

// During SSR and initial hydration, motion.div renders inline opacity:0 styles.
// If motion fails to animate during hydration, content stays invisible.
// This flag ensures initial={false} during hydration (content visible immediately)
// and initial={{ opacity: 0 }} only after hydration (for client-side navigation animations).
let hasHydrated = false;

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  useEffect(() => { hasHydrated = true; }, []);

  return (
    <motion.div
      initial={hasHydrated ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.05,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  useEffect(() => { hasHydrated = true; }, []);

  return (
    <motion.div
      initial={hasHydrated ? 'hidden' : false}
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
