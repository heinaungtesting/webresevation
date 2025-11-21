'use client';

import { ReactNode } from 'react';
import { motion, Variants, HTMLMotionProps } from 'framer-motion';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  /** Delay before starting the animation (ms) */
  delay?: number;
  /** Duration of each item animation (seconds) */
  duration?: number;
  /** Stagger delay between items (seconds) */
  stagger?: number;
  /** Animation variant: 'fadeUp', 'fadeIn', 'scale', 'slideLeft', 'slideRight' */
  variant?: 'fadeUp' | 'fadeIn' | 'scale' | 'slideLeft' | 'slideRight';
  /** Whether to animate on viewport enter */
  animateOnView?: boolean;
  /** Viewport margin for triggering animation */
  viewportMargin?: string;
  /** Only animate once when in view */
  once?: boolean;
}

const variants: Record<string, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
};

/**
 * AnimatedList - A reusable component for staggered list animations
 *
 * @example
 * <AnimatedList stagger={0.1} variant="fadeUp">
 *   {items.map(item => <Card key={item.id}>{item.name}</Card>)}
 * </AnimatedList>
 */
export default function AnimatedList({
  children,
  className,
  delay = 0,
  duration = 0.4,
  stagger = 0.08,
  variant = 'fadeUp',
  animateOnView = true,
  viewportMargin = '-50px',
  once = true,
}: AnimatedListProps) {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: delay / 1000,
        staggerChildren: stagger,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: variants[variant].hidden,
    visible: {
      ...variants[variant].visible,
      transition: {
        duration,
        ease: 'easeOut',
      },
    },
  };

  const viewportConfig = animateOnView
    ? {
        viewport: { once, margin: viewportMargin },
        whileInView: 'visible',
        initial: 'hidden',
      }
    : {
        initial: 'hidden',
        animate: 'visible',
      };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      {...viewportConfig}
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * AnimatedItem - Individual animated item for custom list implementations
 */
interface AnimatedItemProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  index?: number;
  delay?: number;
  duration?: number;
  variant?: 'fadeUp' | 'fadeIn' | 'scale' | 'slideLeft' | 'slideRight';
}

export function AnimatedItem({
  children,
  index = 0,
  delay = 0,
  duration = 0.4,
  variant = 'fadeUp',
  className,
  ...props
}: AnimatedItemProps) {
  const itemVariant = variants[variant];

  return (
    <motion.div
      className={className}
      initial={itemVariant.hidden as any}
      animate={itemVariant.visible as any}
      transition={{
        duration,
        delay: delay / 1000 + index * 0.08,
        ease: 'easeOut',
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * PageTransition - Wrapper for page-level fade-in transitions
 */
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * FadeInSection - Animate a section when it enters the viewport
 */
interface FadeInSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeInSection({ children, className, delay = 0 }: FadeInSectionProps) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.5,
        delay: delay / 1000,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.section>
  );
}
