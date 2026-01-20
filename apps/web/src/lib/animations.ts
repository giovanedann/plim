import type { Variants } from 'motion/react'

/**
 * Modal animation variants for enter/exit transitions.
 * Uses transform and opacity for optimal performance.
 */
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1], // Custom ease for smooth feel
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: 'easeOut',
    },
  },
}

/**
 * Dropdown/select content animation variants.
 */
export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -4,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.1,
      ease: 'easeIn',
    },
  },
}

/**
 * List item stagger animation variants.
 */
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
}

/**
 * Container variants for staggered children animations.
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

/**
 * Fade in/out animation variants.
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
}

/**
 * Helper to return static variants when reduced motion is preferred.
 * @param variants - The animation variants to use
 * @param prefersReducedMotion - Whether user prefers reduced motion
 * @returns The original variants or static variants if reduced motion is preferred
 */
export function getVariants(variants: Variants, prefersReducedMotion: boolean): Variants {
  if (prefersReducedMotion) {
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1 },
      exit: { opacity: 1 },
    }
  }
  return variants
}
