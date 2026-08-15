import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertTriangle, X } from 'lucide-react';

interface DisableApiTokenDialogProps {
  onConfirm: () => void;
}

export function DisableApiTokenDialog({ onConfirm }: DisableApiTokenDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 20px -5px hsla(0,84%,60%,0.50)' }}
          whileTap={{ scale: 0.97 }}
          className="relative h-11 px-5 rounded-xl font-black text-[11px] uppercase tracking-widest overflow-hidden transition-colors"
          style={{
            background: 'hsla(0,84%,60%,0.10)',
            border: '1px solid hsla(0,84%,60%,0.28)',
            color: 'hsl(0,84%,70%)',
          }}
        >
          <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,84%,75%,0.40),transparent)' }} />
          Disable API Token
        </motion.button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[420px] p-0 overflow-hidden border-0"
        style={{
          background: 'hsla(270,45%,5%,0.97)',
          border: '1px solid hsla(0,84%,60%,0.22)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 60px -15px hsla(0,84%,60%,0.30), 0 0 120px -30px hsla(0,100%,62%,0.15)',
          borderRadius: 20,
        }}
      >
        <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,hsl(0,84%,60%),hsl(0,100%,62%),transparent)' }} />
        <div className="absolute inset-x-0 top-0.5 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,84%,75%,0.35),transparent)' }} />

        <div className="p-7 space-y-6">
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'hsla(0,84%,60%,0.10)',
                  border: '1px solid hsla(0,84%,60%,0.25)',
                  boxShadow: '0 0 20px -5px hsla(0,84%,60%,0.25)',
                }}
              >
                <AlertTriangle className="h-5 w-5" style={{ color: 'hsl(0,84%,65%)' }} />
              </div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">
                Disable API Token
              </DialogTitle>
            </div>

            <DialogDescription
              className="text-sm font-medium leading-relaxed"
              style={{ color: 'hsla(0,0%,100%,0.45)' }}
            >
              Are you sure you want to disable your API token?{' '}
              <span style={{ color: 'hsl(0,84%,68%)', fontWeight: 700 }}>This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <div
            className="rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest"
            style={{
              background: 'hsla(0,84%,60%,0.06)',
              border: '1px solid hsla(0,84%,60%,0.14)',
              color: 'hsla(0,84%,70%,0.70)',
            }}
          >
            All active integrations using this token will immediately stop working.
          </div>

          <DialogFooter className="flex gap-3 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setOpen(false)}
              className="flex-1 h-11 rounded-xl font-black text-[11px] uppercase tracking-widest relative overflow-hidden"
              style={{
                background: 'hsla(270,45%,8%,0.80)',
                border: '1px solid hsla(0,100%,62%,0.10)',
                color: 'hsla(0,0%,100%,0.50)',
              }}
            >
              <X className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              Cancel
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 28px -6px hsla(0,84%,60%,0.65)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirm}
              className="flex-1 h-11 rounded-xl font-black text-[11px] uppercase tracking-widest relative overflow-hidden text-white"
              style={{
                background: 'linear-gradient(135deg,hsl(0,84%,52%),hsl(0,72%,42%))',
                boxShadow: '0 0 20px -6px hsla(0,84%,60%,0.45)',
              }}
            >
              <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.30),transparent)' }} />
              Disable
            </motion.button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
