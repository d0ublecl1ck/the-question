"use client"

import { Heart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

const animations = {
  count: {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
  },
  heart: {
    initial: { scale: 1 },
    tapActive: { scale: 0.8 },
    tapCompleted: { scale: 1 },
  },
}

type HeartButtonProps = {
  count: number
  label?: string
  active?: boolean
  disabled?: boolean
  ariaLabel?: string
  onToggle?: () => void
}

export function HeartButton({
  count,
  label = "收藏",
  active = false,
  disabled = false,
  ariaLabel,
  onToggle,
}: HeartButtonProps) {
  const fillPercentage = active ? 100 : 0
  const sizeMultiplier = active ? 1.08 : 1

  return (
    <div className="relative">
      <Button
        className="py-0 pe-0 overflow-visible h-8 px-2 text-xs rounded-[16px]"
        variant="outline"
        onClick={onToggle}
        aria-pressed={active}
        aria-label={ariaLabel ?? label}
        disabled={disabled}
      >
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: active ? sizeMultiplier : 1 }}
          whileTap={animations.heart.tapActive}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="relative"
        >
          <Heart className="opacity-60" size={14} aria-hidden="true" />

          <Heart
            className="absolute inset-0 text-red-500 fill-red-500 transition-all duration-300"
            size={14}
            aria-hidden="true"
            style={{ clipPath: `inset(${100 - fillPercentage}% 0 0 0)` }}
          />

        </motion.div>

        <span className="mx-1">{label}</span>

        <span className="relative inline-flex items-center justify-center h-full px-2 text-[10px] font-medium rounded-[16px] text-muted-foreground before:absolute before:inset-0 before:w-px before:bg-border ms-1">
          <AnimatePresence mode="wait">
            <motion.span
              key={count}
              variants={animations.count}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {count}
            </motion.span>
          </AnimatePresence>
        </span>
      </Button>
    </div>
  )
}
