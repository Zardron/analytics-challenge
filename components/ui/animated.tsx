'use client';

import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { ReactNode } from 'react';

type AnimationType = 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'fadeInUp' | 'width';

interface AnimatedProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  type?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
}

const animationVariants: Record<AnimationType, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  },
  width: {
    hidden: { width: 0 },
    visible: { width: 240 },
  },
};

export function Animated({
  children,
  type = 'fadeIn',
  delay = 0,
  duration = 0.5,
  className,
  ...props
}: AnimatedProps) {
  const variants = animationVariants[type];

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{ duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedInputProps extends Omit<HTMLMotionProps<'input'>, 'type'> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
}

export function AnimatedInput({ whileFocus = { scale: 1.01 }, ...props }: AnimatedInputProps) {
  return <motion.input whileFocus={whileFocus} {...props} />;
}

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  loading?: boolean;
}

export function AnimatedButton({
  loading = false,
  whileHover = { scale: 1.02 },
  whileTap = { scale: 0.98 },
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={loading ? undefined : whileHover}
      whileTap={loading ? undefined : whileTap}
      {...props}
    />
  );
}

