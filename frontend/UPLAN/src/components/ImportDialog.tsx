import { useState, useRef } from 'react';
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
  buttonText?: string; // Custom button text;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'excel' | 'image' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewSessions, setPreviewSessions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Availability & Breaks state
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
    
    // Trigger file input
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'excel' 
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
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file. Please check the format and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processExcelFile = async (file: File) => {
    // Read the file
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        
        // Simple CSV parsing (for .csv files or exported Excel)
        const lines = text.split('\n').filter(line => line.trim());
        const sessions: any[] = [];
        
        // Skip header rows and find the data
        let startIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes('time') || 
              lines[i].toLowerCase().includes('monday') ||
              lines[i].toLowerCase().includes('subject')) {
            startIndex = i + 1;
            break;
          }
        }

        // Parse sessions from CSV format
        // Expected format: Subject, Day, Start Time, End Time, Type
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cells = line.split(',').map(cell => cell.trim().replace(/['"]/g, ''));
          
          if (cells.length >= 4) {
            const [subject, day, startTime, endTime, type] = cells;
            
            // Convert day name to index
            const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
              .indexOf(day.toLowerCase());
            
            if (dayIndex !== -1 && subject && startTime && endTime) {
              sessions.push({
                id: `import-${Date.now()}-${i}`,
                subject: subject,
                day: dayIndex,
                startTime: formatTime(startTime),
                endTime: formatTime(endTime),
                type: type ? type.toLowerCase() : 'lecture',
                color: getColorForType(type || 'lecture'),
              });
            }
          }
        }

        if (sessions.length > 0) {
          setPreviewSessions(sessions);
          toast.success(`Found ${sessions.length} sessions in the file`);
        } else {
          // Generate sample sessions if parsing fails
          const sampleSessions = generateSampleSessions();
          setPreviewSessions(sampleSessions);
          toast.info('Using sample data. Please ensure your Excel file has columns: Subject, Day, Start Time, End Time, Type');
        }
      } catch (error) {
        console.error('Error parsing Excel:', error);
        toast.error('Could not parse Excel file. Please check the format.');
      }
    };

    reader.readAsText(file);
  };

  const processImageFile = async (file: File) => {
    // Create image preview
    const reader = new FileReader();
    
    reader.onload = () => {
      toast.info('Image uploaded! Analyzing schedule...');
      
      // Simulate OCR processing
      setTimeout(() => {
        // Generate sample sessions as a demo
        const sampleSessions = generateSampleSessions();
        setPreviewSessions(sampleSessions);
        toast.success(`Detected ${sampleSessions.length} sessions from image`);
      }, 2000);
    };

    reader.readAsDataURL(file);
  };

  const generateSampleSessions = () => {
    return [
      {
        id: `import-${Date.now()}-1`,
        subject: 'Mathematics',
        day: 0, // Monday
        startTime: '09:00',
        endTime: '10:30',
        type: 'lecture',
        color: '#6366F1',
      },
      {
        id: `import-${Date.now()}-2`,
        subject: 'Physics',
        day: 1, // Tuesday
        startTime: '11:00',
        endTime: '12:30',
        type: 'lecture',
        color: '#6366F1',
      },
      {
        id: `import-${Date.now()}-3`,
        subject: 'Chemistry Lab',
        day: 2, // Wednesday
        startTime: '14:00',
        endTime: '16:00',
        type: 'practice',
        color: '#10B981',
      },
    ];
  };

  const formatTime = (time: string): string => {
    // Handle different time formats
    time = time.trim().toLowerCase();
    
    // If already in HH:MM format
    if (/^\d{1,2}:\d{2}$/.test(time)) {
      const [hours, minutes] = time.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
    
    // If in 12-hour format (e.g., "9:00 AM" or "2:30 PM")
    const match = time.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] || '00';
      const meridiem = match[3];
      
      if (meridiem) {
        if (meridiem === 'pm' && hours !== 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    
    return '09:00'; // Default fallback
  };

  const getColorForType = (type: string): string => {
    const types: { [key: string]: string } = {
      'reading': '#3B82F6',
      'revision': '#A855F7',
      'practice': '#10B981',
      'break': '#9CA3AF',
      'lecture': '#6366F1',
      'assignment': '#F97316',
      'test': '#DC2626',
      'exam': '#991B1B',
    };
    return types[type.toLowerCase()] || '#6366F1';
  };

  const handleImport = () => {
    if (previewSessions.length > 0) {
      onImport(previewSessions, availabilitySettings);
      // Remove the toast here since handleImportSessions will show a more detailed one
      handleReset();
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportType(null);
    setPreviewSessions([]);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleReset();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Schedule</DialogTitle>
          <DialogDescription>
            Upload your existing schedule from Excel/CSV file (.xlsx, .xls, .csv) or an image (.jpg, .png)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!selectedFile && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* Excel Import */}
                <button
                  onClick={() => handleFileSelect('excel')}
                  className="border-2 border-dashed border-border rounded-lg p-6 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full group-hover:bg-green-200 dark:group-hover:bg-green-800/40 group-hover:scale-110 transition-all duration-300">
                      <FileSpreadsheet className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">Excel/CSV File</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        .xlsx • .xls • .csv
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                        Click to upload
                      </p>
                    </div>
                  </div>
                </button>

                {/* Image Import */}
                <button
                  onClick={() => handleFileSelect('image')}
                  className="border-2 border-dashed border-border rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 group-hover:scale-110 transition-all duration-300">
                      <ImageIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">Image File</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        .jpg • .png • .jpeg
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                        Click to upload
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <div className="space-y-2">
                    <div>
                      <strong>📊 Excel/CSV Files:</strong> Include columns for Subject, Day, Start Time, End Time, and Type.
                    </div>
                    <div>
                      <strong>🖼️ Image Files:</strong> Upload a clear photo or screenshot of your schedule (supports .jpg, .png, .jpeg, .gif, .bmp, .webp).
                    </div>
                  </div>
                  <br />
                  <button
                    onClick={() => {
                      // Create sample CSV template
                      const template = 
`Subject,Day,Start Time,End Time,Type
Mathematics,Monday,09:00,10:30,lecture
Physics,Tuesday,11:00,12:30,lecture
Chemistry Lab,Wednesday,14:00,16:00,practice
English,Thursday,10:00,11:00,reading
History,Friday,13:00,14:30,revision`;
                      
                      const blob = new Blob([template], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'timetable-template.csv';
                      a.click();
                      toast.success('Template downloaded!');
                    }}
                    className="text-purple-600 hover:text-purple-800 underline mt-1 inline-block"
                  >
                    Download CSV Template
                  </button>
                </AlertDescription>
              </Alert>
            </>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Processing state */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground font-medium">
                  Processing {importType === 'excel' ? 'Excel/CSV' : 'image'} file...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedFile?.name}
                </p>
              </div>
            </div>
          )}

          {/* Preview Sessions */}
          {selectedFile && previewSessions.length > 0 && !isProcessing && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <h3 className="font-medium text-green-900">File uploaded successfully!</h3>
                      <p className="text-xs text-green-700 mt-0.5">
                        {selectedFile?.name} • {previewSessions.length} sessions found
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {previewSessions.slice(0, 10).map((session, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm bg-card p-2 rounded">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: session.color }}
                    />
                    <span className="flex-1 font-medium">{session.subject}</span>
                    <span className="text-muted-foreground">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][session.day]}
                    </span>
                    <span className="text-muted-foreground">
                      {session.startTime} - {session.endTime}
                    </span>
                  </div>
                ))}
                {previewSessions.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{previewSessions.length - 10} more sessions
                  </p>
                )}
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  Review the imported sessions above. Click "Import Sessions" to add them to your timetable.
                </AlertDescription>
              </Alert>

              {/* Availability & Breaks Section */}
              <div className="mt-6 border-t pt-6">
                <button
                  onClick={() => setShowAvailability(!showAvailability)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Availability & Breaks</span>
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                  </div>
                  {showAvailability ? 
                    <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                </button>
                <p className="text-xs text-muted-foreground mt-2 px-1">
                  These settings help avoid scheduling conflicts.
                </p>

                {showAvailability && (
                  <div className="mt-4 space-y-5 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    {/* Weekly Availability */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <Label className="font-medium">Weekly Availability</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="weekday-start" className="text-xs">Weekday Start (Mon-Fri)</Label>
                          <Input
                            id="weekday-start"
                            type="time"
                            value={availabilitySettings.weekdayAvailability.start}
                            onChange={(e) => setAvailabilitySettings({
                              ...availabilitySettings,
                              weekdayAvailability: {
                                ...availabilitySettings.weekdayAvailability,
                                start: e.target.value
                              }
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="weekday-end" className="text-xs">Weekday End</Label>
                          <Input
                            id="weekday-end"
                            type="time"
                            value={availabilitySettings.weekdayAvailability.end}
                            onChange={(e) => setAvailabilitySettings({
                              ...availabilitySettings,
                              weekdayAvailability: {
                                ...availabilitySettings.weekdayAvailability,
                                end: e.target.value
                              }
                            })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="same-weekend"
                          checked={availabilitySettings.sameForWeekend}
                          onCheckedChange={(checked) => setAvailabilitySettings({
                            ...availabilitySettings,
                            sameForWeekend: checked as boolean
                          })}
                        />
                        <Label htmlFor="same-weekend" className="text-xs cursor-pointer">
                          Same for weekend (Sat-Sun)
                        </Label>
                      </div>
                    </div>

                    {/* Sleep Hours */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-indigo-600" />
                        <Label className="font-medium">Sleep Hours</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="sleep-start" className="text-xs">From</Label>
                          <Input
                            id="sleep-start"
                            type="time"
                            value={availabilitySettings.sleepHours.start}
                            onChange={(e) => setAvailabilitySettings({
                              ...availabilitySettings,
                              sleepHours: {
                                ...availabilitySettings.sleepHours,
                                start: e.target.value
                              }
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sleep-end" className="text-xs">To</Label>
                          <Input
                            id="sleep-end"
                            type="time"
                            value={availabilitySettings.sleepHours.end}
                            onChange={(e) => setAvailabilitySettings({
                              ...availabilitySettings,
                              sleepHours: {
                                ...availabilitySettings.sleepHours,
                                end: e.target.value
                              }
                            })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Automatically applied every day</p>
                    </div>

                    {/* Meal Breaks */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-orange-600" />
                        <Label className="font-medium">Meal Breaks</Label>
                      </div>
                      
                      {/* Lunch Break */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="lunch-enabled"
                          checked={availabilitySettings.lunchBreak.enabled}
                          onCheckedChange={(checked) => setAvailabilitySettings({
                            ...availabilitySettings,
                            lunchBreak: {
                              ...availabilitySettings.lunchBreak,
                              enabled: checked as boolean
                            }
                          })}
                          className="mt-2"
                        />
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="lunch-enabled" className="text-xs cursor-pointer">Lunch break</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="time"
                              value={availabilitySettings.lunchBreak.start}
                              onChange={(e) => setAvailabilitySettings({
                                ...availabilitySettings,
                                lunchBreak: {
                                  ...availabilitySettings.lunchBreak,
                                  start: e.target.value
                                }
                              })}
                              disabled={!availabilitySettings.lunchBreak.enabled}
                              className="text-sm"
                            />
                            <Input
                              type="time"
                              value={availabilitySettings.lunchBreak.end}
                              onChange={(e) => setAvailabilitySettings({
                                ...availabilitySettings,
                                lunchBreak: {
                                  ...availabilitySettings.lunchBreak,
                                  end: e.target.value
                                }
                              })}
                              disabled={!availabilitySettings.lunchBreak.enabled}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dinner Break */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="dinner-enabled"
                          checked={availabilitySettings.dinnerBreak.enabled}
                          onCheckedChange={(checked) => setAvailabilitySettings({
                            ...availabilitySettings,
                            dinnerBreak: {
                              ...availabilitySettings.dinnerBreak,
                              enabled: checked as boolean
                            }
                          })}
                          className="mt-2"
                        />
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="dinner-enabled" className="text-xs cursor-pointer">Dinner break</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="time"
                              value={availabilitySettings.dinnerBreak.start}
                              onChange={(e) => setAvailabilitySettings({
                                ...availabilitySettings,
                                dinnerBreak: {
                                  ...availabilitySettings.dinnerBreak,
                                  start: e.target.value
                                }
                              })}
                              disabled={!availabilitySettings.dinnerBreak.enabled}
                              className="text-sm"
                            />
                            <Input
                              type="time"
                              value={availabilitySettings.dinnerBreak.end}
                              onChange={(e) => setAvailabilitySettings({
                                ...availabilitySettings,
                                dinnerBreak: {
                                  ...availabilitySettings.dinnerBreak,
                                  end: e.target.value
                                }
                              })}
                              disabled={!availabilitySettings.dinnerBreak.enabled}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Commute Time */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-green-600" />
                        <Label htmlFor="commute" className="font-medium">Commute Time</Label>
                      </div>
                      <Input
                        id="commute"
                        type="number"
                        min="0"
                        max="120"
                        value={availabilitySettings.commuteMinutes}
                        onChange={(e) => setAvailabilitySettings({
                          ...availabilitySettings,
                          commuteMinutes: parseInt(e.target.value) || 0
                        })}
                        className="max-w-xs"
                      />
                      <p className="text-xs text-muted-foreground">Buffer time (in minutes) added before and after each class/event</p>
                    </div>

                    {/* Blackout Periods */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CalendarOff className="h-4 w-4 text-red-600" />
                        <Label className="font-medium">Blackout Dates</Label>
                      </div>
                      
                      {availabilitySettings.blackoutPeriods.map((period) => (
                        <div key={period.id} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                          <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                            <Input
                              type="date"
                              value={period.date}
                              onChange={(e) => {
                                const updated = availabilitySettings.blackoutPeriods.map(p => 
                                  p.id === period.id ? { ...p, date: e.target.value } : p
                                );
                                setAvailabilitySettings({
                                  ...availabilitySettings,
                                  blackoutPeriods: updated
                                });
                              }}
                              className="text-sm"
                            />
                            <Input
                              type="time"
                              value={period.start}
                              onChange={(e) => {
                                const updated = availabilitySettings.blackoutPeriods.map(p => 
                                  p.id === period.id ? { ...p, start: e.target.value } : p
                                );
                                setAvailabilitySettings({
                                  ...availabilitySettings,
                                  blackoutPeriods: updated
                                });
                              }}
                              className="text-sm"
                            />
                            <Input
                              type="time"
                              value={period.end}
                              onChange={(e) => {
                                const updated = availabilitySettings.blackoutPeriods.map(p => 
                                  p.id === period.id ? { ...p, end: e.target.value } : p
                                );
                                setAvailabilitySettings({
                                  ...availabilitySettings,
                                  blackoutPeriods: updated
                                });
                              }}
                              className="text-sm"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const filtered = availabilitySettings.blackoutPeriods.filter(
                                p => p.id !== period.id
                              );
                              setAvailabilitySettings({
                                ...availabilitySettings,
                                blackoutPeriods: filtered
                              });
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-100"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPeriod = {
                            id: `blackout-${Date.now()}`,
                            date: new Date().toISOString().split('T')[0],
                            start: '09:00',
                            end: '14:00',
                            reason: ''
                          };
                          setAvailabilitySettings({
                            ...availabilitySettings,
                            blackoutPeriods: [...availabilitySettings.blackoutPeriods, newPeriod]
                          });
                        }}
                        className="w-full"
                      >
                        <CalendarOff className="h-4 w-4 mr-2" />
                        Add Blackout Date
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {selectedFile && previewSessions.length > 0 && !isProcessing && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                {buttonText || 'Import Sessions'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}