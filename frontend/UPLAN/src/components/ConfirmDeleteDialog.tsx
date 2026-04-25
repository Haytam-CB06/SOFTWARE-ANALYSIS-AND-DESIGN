import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

export const DELETE_CONFIRMATION_TEXT = 'UPLAN DELETE';

interface ConfirmDeleteDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

export default function ConfirmDeleteDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  isSubmitting = false,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [input, setInput] = useState('');
  const isValid = input.trim() === DELETE_CONFIRMATION_TEXT;

  useEffect(() => {
    if (!open) setInput('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className="w-[94vw] rounded-2xl border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0b0f17] sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-left text-lg font-semibold text-slate-950 dark:text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="text-left text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="delete-confirmation-phrase" className="text-sm text-slate-700 dark:text-slate-200">
            Type <span className="font-semibold text-red-600 dark:text-red-300">{DELETE_CONFIRMATION_TEXT}</span> to continue
          </Label>
          <Input
            id="delete-confirmation-phrase"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={DELETE_CONFIRMATION_TEXT}
            autoComplete="off"
            className="rounded-2xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={!isValid || isSubmitting}>
            {isSubmitting ? 'Deleting...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
