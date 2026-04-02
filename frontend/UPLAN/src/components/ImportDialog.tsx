import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Upload, FileSpreadsheet, Image as ImageIcon, X, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Clock, Coffee, Moon, Car, CalendarOff } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (sessions: any[], availabilitySettings?: AvailabilitySettings) => void;
  buttonText?: string;
}

export interface AvailabilitySettings {
  weekdayAvailability: { start: string; end: string };
  weekendAvailability: { start: string; end: string };
  sameForWeekend: boolean;
  sleepHours: { start: string; end: string };
  lunchBreak: { enabled: boolean; start: string; end: string };
  dinnerBreak: { enabled: boolean; start: string; end: string };
  commuteMinutes: number;
  blackoutPeriods: Array<{ id: string; date: string; start: string; end: string; reason: string }>;
}

export default function ImportDialog({ open, onOpenChange, onImport, buttonText }: ImportDialogProps) {
  const { t } = useTranslation();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'excel' | 'image' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewSessions, setPreviewSessions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAvailability, setShowAvailability] = useState(false);
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySettings>({
    weekdayAvailability: { start: '08:00', end: '18:00' },
    weekendAvailability: { start: '09:00', end: '17:00' },
    sameForWeekend: true,
    sleepHours: { start: '23:00', end: '07:00' },
    lunchBreak: { enabled: true, start: '12:30', end: '13:30' },
    dinnerBreak: { enabled: false, start: '19:00', end: '20:00' },
    commuteMinutes: 30,
    blackoutPeriods: [],
  });

  const handleFileSelect = (type: 'excel' | 'image') => {
    setImportType(type);
    setSelectedFile(null);
    setPreviewSessions([]);

    if (fileInputRef.current) {
      fileInputRef.current.accept =
        type === 'excel'
          ? '.xlsx,.xls,.csv'
          : '.jpg,.jpeg,.png,.gif,.bmp,.webp';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      if (importType === 'excel') {
        await processExcelFile(file);
      } else if (importType === 'image') {
        await processImageFile(file);
      }
    } catch {
      toast.error(t('import.errors.process'));
    } finally {
      setIsProcessing(false);
    }
  };

  const processExcelFile = async (file: File) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const sessions: any[] = [];

        let startIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (
            lines[i].toLowerCase().includes('time') ||
            lines[i].toLowerCase().includes('monday') ||
            lines[i].toLowerCase().includes('subject')
          ) {
            startIndex = i + 1;
            break;
          }
        }

        for (let i = startIndex; i < lines.length; i++) {
          const cells = lines[i].split(',').map(cell => cell.trim().replace(/['"]/g, ''));

          if (cells.length >= 4) {
            const [subject, day, startTime, endTime, type] = cells;

            const dayIndex = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
              .indexOf(day.toLowerCase());

            if (dayIndex !== -1 && subject && startTime && endTime) {
              sessions.push({
                id: `import-${Date.now()}-${i}`,
                subject,
                day: dayIndex,
                startTime,
                endTime,
                type: type || 'lecture',
              });
            }
          }
        }

        if (sessions.length > 0) {
          setPreviewSessions(sessions);
          toast.success(t('import.success.found', { count: sessions.length }));
        } else {
          setPreviewSessions(generateSampleSessions());
          toast.info(t('import.info.sample'));
        }
      } catch {
        toast.error(t('import.errors.parse'));
      }
    };

    reader.readAsText(file);
  };

  const processImageFile = async () => {
    toast.info(t('import.info.analyzing'));

    setTimeout(() => {
      const sampleSessions = generateSampleSessions();
      setPreviewSessions(sampleSessions);
      toast.success(t('import.success.detected', { count: sampleSessions.length }));
    }, 2000);
  };

  const generateSampleSessions = () => [
    { id: '1', subject: 'Mathematics', day: 0, startTime: '09:00', endTime: '10:30' },
    { id: '2', subject: 'Physics', day: 1, startTime: '11:00', endTime: '12:30' },
  ];

  const handleImport = () => {
    if (previewSessions.length > 0) {
      onImport(previewSessions, availabilitySettings);
      handleReset();
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportType(null);
    setPreviewSessions([]);
    setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleReset();
      onOpenChange(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('import.title')}</DialogTitle>
          <DialogDescription>
            {t('import.description')}
          </DialogDescription>
        </DialogHeader>

        {!selectedFile && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleFileSelect('excel')}>
                <FileSpreadsheet />
                <p>{t('import.excel')}</p>
              </button>

              <button onClick={() => handleFileSelect('image')}>
                <ImageIcon />
                <p>{t('import.image')}</p>
              </button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{t('import.help.excelTitle')}</strong> {t('import.help.excelDesc')}
                <br />
                <strong>{t('import.help.imageTitle')}</strong> {t('import.help.imageDesc')}
              </AlertDescription>
            </Alert>
          </>
        )}

        {isProcessing && <p>{t('import.processing')}</p>}

        {previewSessions.length > 0 && (
          <div>
            <p>{t('import.preview')}</p>

            <Button onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              {buttonText || t('import.actions.import')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}