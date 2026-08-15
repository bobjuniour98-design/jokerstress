"use client"

import { useEffect } from "react"
import { X, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface AlertBoxProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export default function AlertBox({ message, type, onClose }: AlertBoxProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        className={cn(
          "fixed bottom-8 right-8 w-96 glass-card p-0 overflow-hidden shadow-2xl z-[100]",
          type === 'success'
            ? "border-emerald-500/20"
            : "border-primary/20"
        )}
      >
        <div className="flex">
          <div className={cn(
            "w-1.5",
            type === 'success' ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-primary shadow-[0_0_15px_rgba(225,29,72,0.5)]"
          )} />
          <div className="flex-1 p-5">
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-2 rounded-xl",
                type === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
              )}>
                {type === 'success' ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
              </div>
              <div className="flex-grow">
                <h4 className="text-sm font-black uppercase tracking-widest text-white">
                  {type === 'success' ? 'Operation Success' : 'System Alert'}
                </h4>
                <p className="text-sm font-medium text-gray-400 mt-1 leading-relaxed">{message}</p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-1.5 hover:bg-white/5 rounded-lg transition-all text-gray-600 hover:text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}