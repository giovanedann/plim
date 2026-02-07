'use client'
import { useCallback, useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import { motion } from 'motion/react'

type Direction = 'TOP' | 'LEFT' | 'BOTTOM' | 'RIGHT'

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = 'button',
  duration = 1,
  clockwise = true,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType
    containerClassName?: string
    className?: string
    duration?: number
    clockwise?: boolean
  } & React.HTMLAttributes<HTMLElement>
>): React.ReactElement {
  const [hovered, setHovered] = useState<boolean>(false)
  const [direction, setDirection] = useState<Direction>('TOP')

  const rotateDirection = useCallback(
    (currentDirection: Direction): Direction => {
      const directions: Direction[] = ['TOP', 'LEFT', 'BOTTOM', 'RIGHT']
      const currentIndex = directions.indexOf(currentDirection)
      const nextIndex = clockwise
        ? (currentIndex - 1 + directions.length) % directions.length
        : (currentIndex + 1) % directions.length
      return directions[nextIndex] as Direction
    },
    [clockwise]
  )

  const movingMap: Record<Direction, string> = {
    TOP: 'radial-gradient(20.7% 50% at 50% 0%, hsl(38, 92%, 50%) 0%, rgba(245, 158, 11, 0) 100%)',
    LEFT: 'radial-gradient(16.6% 43.1% at 0% 50%, hsl(38, 92%, 50%) 0%, rgba(245, 158, 11, 0) 100%)',
    BOTTOM:
      'radial-gradient(20.7% 50% at 50% 100%, hsl(38, 92%, 50%) 0%, rgba(245, 158, 11, 0) 100%)',
    RIGHT:
      'radial-gradient(16.2% 41.2% at 100% 50%, hsl(38, 92%, 50%) 0%, rgba(245, 158, 11, 0) 100%)',
  }

  const highlight =
    'radial-gradient(75% 181.16% at 50% 50%, #f59e0b 0%, rgba(245, 158, 11, 0) 100%)'

  useEffect(() => {
    if (!hovered) {
      const interval = setInterval(() => {
        setDirection((prevState) => rotateDirection(prevState))
      }, duration * 1000)
      return () => clearInterval(interval)
    }
  }, [hovered, duration, rotateDirection])

  return (
    <Tag
      onMouseEnter={() => {
        setHovered(true)
      }}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative flex rounded-full border border-transparent content-center bg-muted/50 hover:bg-muted/30 transition duration-500 items-center flex-col flex-nowrap gap-10 h-min justify-center overflow-visible p-px decoration-clone w-fit',
        containerClassName
      )}
      {...props}
    >
      <div
        className={cn(
          'w-auto text-foreground z-10 bg-background px-4 py-2 rounded-[inherit]',
          className
        )}
      >
        {children}
      </div>
      <motion.div
        className={cn('flex-none inset-0 overflow-hidden absolute z-0 rounded-[inherit]')}
        style={{
          filter: 'blur(2px)',
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered ? [movingMap[direction], highlight] : movingMap[direction],
        }}
        transition={{ ease: 'linear', duration: duration ?? 1 }}
      />
      <div className="bg-background absolute z-1 flex-none inset-[2px] rounded-[inherit]" />
    </Tag>
  )
}
