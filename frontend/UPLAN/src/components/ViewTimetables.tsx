import { Calendar, Trash2, Eye, CheckCircle, Clock, BookOpen, Plus, Download, FileSpreadsheet, ChevronDown, Play, MoreHorizontal, Copy } from 'lucide-react';
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
  <div className="flex h-full min-h-0 flex-col bg-background">
    <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4 sm:max-w-2xl sm:px-6">
      <AlertDialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <AlertDialogContent className="w-[92vw] max-w-sm overflow-hidden rounded-3xl border border-border bg-card p-0 text-foreground shadow-xl">
          <div className="p-5">
            <AlertDialogHeader className="space-y-2 text-left">
             <AlertDialogTitle className="text-lg font-semibold text-foreground">
                Use this timetable?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                You already have sessions in <strong>My Timetable</strong>. You can merge this timetable into your
                current schedule or overwrite everything.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-border bg-muted/40 p-4">
            <Button
              variant="outline"
              className="h-11 rounded-2xl"
              onClick={() => setPendingStart(false) || setStartDialogOpen(false)}
            >
              Cancel
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-11 rounded-2xl"
                onClick={() => {
                  if (!pendingStart) return;
                  setStartDialogOpen(false);
                  const t = pendingStart;
                  setPendingStart(false);
                  startTimetableMerge(t);
                }}
              >
                Merge
              </Button>

              <Button
                className="h-11 rounded-2xl bg-blue-600 text-white hover:bg-blue-700"
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
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Phone-style header */}
      <div className="mb-4 rounded-[28px] bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-5 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <BookOpen className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight">Saved Timetables</h1>
              <p className="mt-1 text-sm text-blue-100">
                Your study plans, ready to launch
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
            <p className="text-xs text-blue-100">Total</p>
            <p className="mt-1 text-lg font-semibold">
              {timetables.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
            <p className="text-xs text-blue-100">Active</p>
            <p className="mt-1 text-lg font-semibold">
              {timetables.filter((t) => t.isActive).length}
            </p>
          </div>
        </div>
      </div>

      {timetables.length === 0 ? (
        <Card className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
          <CardContent className="px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>

            <h3 className="text-lg font-semibold text-foreground">No Saved Timetables</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              You haven&apos;t created any timetables yet. Start with your first study plan.
            </p>

            {onNavigate && (
              <Button
                onClick={() => onNavigate("create-timetable")}
                className="mt-5 h-11 rounded-2xl bg-blue-600 px-5 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Timetable
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {timetables.map((timetable) => {
            const createdDate = new Date(timetable.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const sessionCount = (timetable.calendarSessions || timetable.schedule || []).length;
            const subjectCount = timetable.subjects?.length || 0;

            return (
              <Card
                key={timetable.id}
                className={`overflow-hidden rounded-[28px] border border-border bg-card shadow-sm transition-all ${
                  timetable.isActive ? "ring-1 ring-blue-500/40" : ""
                }`}
              >
                <CardContent className="p-4">
                  {/* Top row */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        timetable.isActive
                        ? "bg-blue-600 text-white"
                        : "bg-muted text-foreground"
                      }`}
                    >
                      <Calendar className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-semibold text-foreground">
                            Study Timetable
                          </h2>
                          <p className="mt-1 text-xs text-muted-foreground">Created {createdDate}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {timetable.isActive && (
                            <div className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Active
                            </div>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 rounded-full text-muted-foreground hover:bg-slate-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end"   className="w-44 rounded-2xl border border-border bg-popover text-popover-foreground">
                              <DropdownMenuItem onClick={() => onView(timetable)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handleExport(timetable, "csv")}>
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handleExport(timetable, "json")}>
                                <Download className="mr-2 h-4 w-4" />
                                Export JSON
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handleExport(timetable, "pdf")}>
                                <Download className="mr-2 h-4 w-4" />
                                Export PDF
                              </DropdownMenuItem>

                              {onDuplicate && (
                                <DropdownMenuItem onClick={() => onDuplicate(timetable.id)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                onClick={() => handleDelete(timetable.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-muted/60 p-3 text-center">
                      <p className="text-[11px] text-muted-foreground">Sessions</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{sessionCount}</p>
                    </div>

                    <div className="rounded-2xl bg-muted/60 p-3 text-center">
                      <p className="text-[11px] text-muted-foreground">Subjects</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{subjectCount}</p>
                    </div>

                    <div className="rounded-2xl bg-muted/60 p-3 text-center">
                      <p className="text-[11px] text-muted-foreground">Hours/day</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {timetable.studyHoursPerDay ? `${timetable.studyHoursPerDay}h` : "--"}
                      </p>
                    </div>
                  </div>

                  {/* Optional detail row */}
                  {timetable.breakInterval && (
                    <div className="mt-3 inline-flex items-center rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                      Break every {timetable.breakInterval} min
                    </div>
                  )}

                  {/* Main actions */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleStartTimetable(timetable)}
                      className="h-11 rounded-2xl bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start timetable
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => onView(timetable)}
                      className="h-11 rounded-2xl border-slate-200 bg-white"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
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
);}