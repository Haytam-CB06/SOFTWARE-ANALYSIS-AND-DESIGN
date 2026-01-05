import { Calendar, Trash2, Eye, CheckCircle, Clock, BookOpen, Plus, Download, FileSpreadsheet, ChevronDown, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { toast } from 'sonner';
import { convertScheduleToSessions } from '../src/utils/scheduleUtils';
import { getWeekIdentifier } from '../src/utils/dateUtils';
import { getUserWeekKey } from '../utils/userStorage';
import { API_BASE_URL } from '../lib/api';

interface ViewTimetablesProps {
  timetables: any[];
  onDelete: (id: string) => void;
  onView: (timetable: any) => void;
  onSetActive: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  onDuplicate?: (id: string) => void;
  onApplyToWeek?: (id: string, mode: 'overwrite' | 'merge') => void;
  onNavigate?: (page: string) => void;
}

export default function ViewTimetables({ timetables, onDelete, onView, onSetActive, onRename, onDuplicate, onApplyToWeek, onNavigate }: ViewTimetablesProps) {
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<any | null>(null);

  // Search deep-link support (from the global search box)
  // - searchOpenTimetableId: auto-open a specific saved timetable
  // - searchFocusSubject: optional string used as a hint/toast
  useEffect(() => {
    const openId = localStorage.getItem('searchOpenTimetableId');
    if (!openId) return;

    const focusSubject = localStorage.getItem('searchFocusSubject');

    // Always clear so we don't re-trigger on refresh.
    localStorage.removeItem('searchOpenTimetableId');
    localStorage.removeItem('searchFocusSubject');

    const tt = (timetables || []).find((t: any) => t?.id === openId);
    if (!tt) return;

    onView(tt);
    if (focusSubject) {
      toast.info(`Showing “${focusSubject}” in ${tt.name}`);
    }
  }, [timetables, onView]);

  const timeToMinutes = (t: string) => {
    const [h, m] = (t || '0:0').split(':').map((n) => parseInt(n, 10));
    return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
  };

  const sessionsClash = (a: any, b: any) => {
    if (a?.day !== b?.day) return false;
    const aS = timeToMinutes(a.startTime);
    const aE = timeToMinutes(a.endTime);
    const bS = timeToMinutes(b.startTime);
    const bE = timeToMinutes(b.endTime);
    return aS < bE && aE > bS;
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this timetable?')) {
      onDelete(id);
      toast.success('Timetable deleted successfully');
    }
  };

  const startTimetableOverwrite = async (timetable: any) => {
    const userId = localStorage.getItem('currentUserId');
    const weekId = getWeekIdentifier(new Date());
    const weekKey = getUserWeekKey(weekId);

    const incoming = Array.isArray(timetable.calendarSessions)
      ? timetable.calendarSessions
      : Array.isArray(timetable.schedule)
        ? convertScheduleToSessions(timetable.schedule)
        : [];

    // Mark this timetable as active (backend), then overwrite the user's current week sessions
    await Promise.resolve(onSetActive(timetable.id) as any);

    localStorage.setItem(weekKey, JSON.stringify(incoming));
    window.dispatchEvent(new Event('calendarSessionsUpdated'));

    // Best-effort persist to backend so it sticks across browsers
    if (API_BASE_URL && userId) {
      try {
        await fetch(
          `${API_BASE_URL}/timetable/user/${encodeURIComponent(userId)}/sessions?week_id=${encodeURIComponent(weekId)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
            body: JSON.stringify(incoming),
          }
        );
      } catch {
        // best-effort
      }
    }

    // Create planned StudySession rows on the backend (deduped) and keep schedule in sync
    if (onApplyToWeek) {
      await Promise.resolve(onApplyToWeek(timetable.id, 'overwrite') as any);
    }

    const timetableStartData = {
      id: timetable.id,
      startedAt: new Date().toISOString(),
      isRunning: true,
    };
    localStorage.setItem('activeTimetableStart', JSON.stringify(timetableStartData));

    toast.success('Timetable started! Good luck with your studies! 📚', {
      description: 'Your My Timetable has been replaced with this saved timetable',
    });
  };

  const startTimetableMerge = async (timetable: any) => {
    const userId = localStorage.getItem('currentUserId');
    const weekId = getWeekIdentifier(new Date());
    const weekKey = getUserWeekKey(weekId);

    const existing = JSON.parse(localStorage.getItem(weekKey) || '[]');
    const incoming = Array.isArray(timetable.calendarSessions)
      ? timetable.calendarSessions
      : Array.isArray(timetable.schedule)
        ? convertScheduleToSessions(timetable.schedule)
        : [];

    // Clash check BEFORE touching the active timetable
    const hasClash = incoming.some((s: any) => existing.some((e: any) => sessionsClash(s, e)));
    if (hasClash) {
      toast.error('One or more sessions unavailable');
      return;
    }

    // Mark the timetable as active (backend) but we will keep a merged calendar
    await Promise.resolve(onSetActive(timetable.id) as any);

    const merged = [...existing, ...incoming];
    localStorage.setItem(weekKey, JSON.stringify(merged));
    window.dispatchEvent(new Event('calendarSessionsUpdated'));

    // Best-effort persist to backend so it sticks across browsers
    if (API_BASE_URL && userId) {
      try {
        await fetch(
          `${API_BASE_URL}/timetable/user/${encodeURIComponent(userId)}/sessions?week_id=${encodeURIComponent(weekId)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
            body: JSON.stringify(merged),
          }
        );
      } catch {
        // best-effort
      }
    }

    // Create planned StudySession rows on the backend (deduped) and keep schedule in sync
    if (onApplyToWeek) {
      await Promise.resolve(onApplyToWeek(timetable.id, 'merge') as any);
    }

    const timetableStartData = {
      id: timetable.id,
      startedAt: new Date().toISOString(),
      isRunning: true,
    };
    localStorage.setItem('activeTimetableStart', JSON.stringify(timetableStartData));

    toast.success('Timetable started (merged) ✅', {
      description: 'Your saved timetable was merged into your current calendar',
    });
  };

  const handleStartTimetable = (timetable: any) => {
    const weekId = getWeekIdentifier(new Date());
    const weekKey = getUserWeekKey(weekId);
    const existing = JSON.parse(localStorage.getItem(weekKey) || '[]');

    if (Array.isArray(existing) && existing.length > 0) {
      setPendingStart(timetable);
      setStartDialogOpen(true);
      return;
    }

    startTimetableOverwrite(timetable);
  };

  const handleExportPDF = async (timetable: any) => {
    try {
      toast.info('Generating PDF...');
      
      // Dynamically import jsPDF
      const { default: jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Study Timetable', pageWidth / 2, 20, { align: 'center' });
      
      // Add creation date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      const createdDate = new Date(timetable.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      pdf.text(`Created on ${createdDate}`, pageWidth / 2, 28, { align: 'center' });
      
      // Add timetable info
      let yPos = 40;
      pdf.setFontSize(12);
      pdf.setTextColor(60, 60, 60);
      
      if (timetable.studyHoursPerDay) {
        pdf.text(`Study Hours per Day: ${timetable.studyHoursPerDay}h`, 20, yPos);
        yPos += 7;
      }
      if (timetable.preferredStartTime && timetable.preferredEndTime) {
        pdf.text(`Study Time: ${timetable.preferredStartTime} - ${timetable.preferredEndTime}`, 20, yPos);
        yPos += 7;
      }
      if (timetable.breakInterval) {
        pdf.text(`Session Length: ${timetable.breakInterval} min`, 20, yPos);
        yPos += 7;
      }
      if (timetable.breakDuration) {
        pdf.text(`Break Duration: ${timetable.breakDuration} min`, 20, yPos);
        yPos += 7;
      }
      yPos += 3;
      
      // Add subjects if available
      if (timetable.subjects && timetable.subjects.length > 0) {
        pdf.setFontSize(14);
        pdf.setTextColor(37, 99, 235);
        pdf.text('Subjects:', 20, yPos);
        yPos += 7;
        
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        timetable.subjects.forEach((subject: any) => {
          pdf.text(`• ${subject.name} (${subject.priority} priority)`, 25, yPos);
          yPos += 5;
        });
        
        yPos += 5;
      }
      
      // Add schedule if available
      if (timetable.schedule) {
        pdf.setFontSize(14);
        pdf.setTextColor(37, 99, 235);
        pdf.text('Weekly Schedule:', 20, yPos);
        yPos += 8;
        
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        
        days.forEach((day, index) => {
          const daySchedule = timetable.schedule[day] || [];
          
          if (daySchedule.length > 0) {
            // Check if we need a new page
            if (yPos > pageHeight - 40) {
              pdf.addPage();
              yPos = 20;
            }
            
            pdf.setFontSize(12);
            pdf.setTextColor(37, 99, 235);
            pdf.text(day, 20, yPos);
            yPos += 6;
            
            pdf.setFontSize(9);
            pdf.setTextColor(60, 60, 60);
            
            daySchedule.forEach((session: any) => {
              if (yPos > pageHeight - 20) {
                pdf.addPage();
                yPos = 20;
              }
              
              const sessionText = `  ${session.time}: ${session.subject}${session.type ? ` (${session.type})` : ''}`;
              pdf.text(sessionText, 25, yPos);
              yPos += 5;
            });
            
            yPos += 3;
          }
        });
      }
      
      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Save the PDF
      pdf.save(`timetable-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handleExportExcel = async (timetable: any) => {
    try {
      toast.info('Generating CSV file...');
      
      // Create worksheet data
      const worksheetData: any[][] = [];
      
      // Header
      worksheetData.push(['Study Timetable']);
      worksheetData.push([`Created on ${new Date(timetable.createdAt).toLocaleDateString()}`]);
      worksheetData.push([]);
      
      // Timetable Info - only add if data exists
      if (timetable.studyHoursPerDay) {
        worksheetData.push(['Study Hours per Day:', timetable.studyHoursPerDay + 'h']);
      }
      if (timetable.preferredStartTime && timetable.preferredEndTime) {
        worksheetData.push(['Study Time:', `${timetable.preferredStartTime} - ${timetable.preferredEndTime}`]);
      }
      if (timetable.breakInterval) {
        worksheetData.push(['Session Length:', timetable.breakInterval + ' min']);
      }
      if (timetable.breakDuration) {
        worksheetData.push(['Break Duration:', timetable.breakDuration + ' min']);
      }
      worksheetData.push([]);
      
      // Subjects - only add if they exist
      if (timetable.subjects && timetable.subjects.length > 0) {
        worksheetData.push(['Subjects:']);
        timetable.subjects.forEach((subject: any) => {
          worksheetData.push([subject.name, subject.priority + ' priority']);
        });
        worksheetData.push([]);
      }
      
      // Weekly Schedule
      if (timetable.schedule) {
        worksheetData.push(['Weekly Schedule:']);
        worksheetData.push([]);
        
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        days.forEach(day => {
          const daySchedule = timetable.schedule[day] || [];
          
          if (daySchedule.length > 0) {
            worksheetData.push([day]);
            daySchedule.forEach((session: any) => {
              worksheetData.push([
                session.time,
                session.subject,
                session.type || ''
              ]);
            });
            worksheetData.push([]);
          }
        });
      }
      
      // Export to CSV (Excel-compatible)
      const { exportToCSV } = await import('../utils/excelExport');
      await exportToCSV({
        data: worksheetData,
        fileName: `timetable-${new Date().toISOString().split('T')[0]}.csv`
      });
      
      toast.success('CSV file downloaded successfully! (Open with Excel)');
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast.error('Failed to export file. Please try again.');
    }
  };

  const handleExport = async (timetable: any, format: 'csv' | 'json' | 'pdf') => {
    if (format === 'pdf') return handleExportPDF(timetable);
    if (format === 'csv') return handleExportExcel(timetable);

    // JSON
    try {
      const json = JSON.stringify(timetable, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetable-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('JSON downloaded successfully!');
    } catch (e) {
      toast.error('Failed to export JSON');
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
      <AlertDialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite your current timetable?</AlertDialogTitle>
            <AlertDialogDescription>
              You already have sessions in <strong>My Timetable</strong>. You can overwrite them or merge this saved
              timetable into your current schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel onClick={() => setPendingStart(null)}>Cancel</AlertDialogCancel>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!pendingStart) return;
                  setStartDialogOpen(false);
                  const t = pendingStart;
                  setPendingStart(null);
                  startTimetableMerge(t);
                }}
              >
                Merge
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  if (!pendingStart) return;
                  setStartDialogOpen(false);
                  const t = pendingStart;
                  setPendingStart(null);
                  startTimetableOverwrite(t);
                }}
              >
                Overwrite
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Header */}
      <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
          <h1 className="text-white text-xl">Saved Timetables</h1>
        </div>
        <p className="text-blue-100 text-sm">
          View and manage all your saved study timetables
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
            {timetables.length} {timetables.length === 1 ? 'Timetable' : 'Timetables'}
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
            {timetables.filter(t => t.isActive).length} Active
          </Badge>
        </div>
      </div>

      {/* Timetables List */}
      {timetables.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-gray-900 mb-2">No Saved Timetables</h3>
            <p className="text-gray-600 mb-4">
              You haven't created any timetables yet. Create your first one to get started!
            </p>
            {onNavigate && (
              <Button
                onClick={() => onNavigate('create-timetable')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Timetable
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {timetables.map((timetable) => {
            const totalHours = timetable.studyHoursPerDay;
            const createdDate = new Date(timetable.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            return (
              <Card key={timetable.id} className={`\n                border-0 shadow-md transition-all hover:shadow-lg\n                ${timetable.isActive ? 'ring-2 ring-blue-500' : ''}\n              `}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          Study Timetable
                        </CardTitle>
                        {timetable.isActive && (
                          <Badge className="bg-green-500 text-white border-0 text-xs px-2 py-0">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">Created on {createdDate}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">{(timetable.calendarSessions || timetable.schedule || []).length} sessions</Badge>
                    {timetable.subjects && <Badge variant="secondary" className="text-xs">{timetable.subjects.length} subjects</Badge>}
                    {timetable.studyHoursPerDay && <Badge variant="secondary" className="text-xs">{timetable.studyHoursPerDay}h/day</Badge>}
                    {timetable.breakInterval && <Badge variant="secondary" className="text-xs">{timetable.breakInterval} min/session</Badge>}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleStartTimetable(timetable)}
                    >
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                      Start
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300"
                      onClick={() => onView(timetable)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="border-gray-300">
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExport(timetable, 'csv')}>CSV</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport(timetable, 'json')}>JSON</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport(timetable, 'pdf')}>PDF</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="border-gray-300">
                          <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            if (!onRename) return;
                            const proposed = prompt('Rename timetable', timetable.name || '');
                            if (proposed !== null) {
                              onRename(timetable.id, proposed);
                            }
                          }}
                        >
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (!onDuplicate) return;
                            onDuplicate(timetable.id);
                          }}
                        >
                          Duplicate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(timetable.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}