import type { Transition, Variants } from 'motion/react';

export const brandEasing = [0.22, 1, 0.36, 1] as const;

export const brandTransitions = {
  fast: { duration: 0.4, ease: brandEasing } satisfies Transition,
  base: { duration: 0.7, ease: brandEasing } satisfies Transition,
  slow: { duration: 1.0, ease: brandEasing } satisfies Transition,
  stagger: { staggerChildren: 0.1, delayChildren: 0.08 } satisfies Transition,
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: brandTransitions.base,
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: brandTransitions.stagger,
  },
};

export const inViewOnce = { once: true, margin: '-8% 0px -8% 0px' };
