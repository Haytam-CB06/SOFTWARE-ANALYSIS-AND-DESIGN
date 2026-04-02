import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface UnsavedTimetableDialogProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDiscard: () => void;
  onStay: () => void;
}

export default function UnsavedTimetableDialog({
  show,
  onClose,
  onDiscard,
  onStay,
}: UnsavedTimetableDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={show} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
            </div>

            <AlertDialogTitle className="text-xl">
              {t('timetable.unsaved.title')}
            </AlertDialogTitle>
          </div>

          <AlertDialogDescription className="text-base leading-relaxed pt-2">
            {t('timetable.unsaved.backDescription')}
            <br /><br />
            {t('timetable.unsaved.backQuestion')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            onClick={onDiscard}
            className="sm:w-auto"
          >
            {t('timetable.unsaved.discardAndGoBack')}
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={onStay}
            className="bg-blue-700 hover:bg-blue-700 sm:w-auto"
          >
            {t('timetable.unsaved.stayAndSave')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}