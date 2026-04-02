import {
  Calendar,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  BookOpen,
  Plus,
  Download,
  Play,
  MoreHorizontal,
  Copy,
  FileJson,
  FileText,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
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

export default function ViewTimetables({
  timetables,
  onDelete,
  onView,
  onSetActive,
  onRename,
  onDuplicate,
  onApplyToWeek,
  onNavigate,
}: ViewTimetablesProps) {
  const { t } = useTranslation();
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<any | null>(null);

  useEffect(() => {
    const openId = localStorage.getItem('searchOpenTimetableId');
    if (!openId) return;

    const focusSubject = localStorage.getItem('searchFocusSubject');

    localStorage.removeItem('searchOpenTimetableId');
    localStorage.removeItem('searchFocusSubject');

    const tt = (timetables || []).find((t: any) => t?.id === openId);
    if (!tt) return;

    onView(tt);
    if (focusSubject) {
      toast.info(t('viewTimetables.toasts.showingSubject', { subject: focusSubject, name: tt.name }));
    }
  }, [timetables, onView, t]);

  const timeToMinutes = (time: string) => {
    const [h, m] = (time || '0:0').split(':').map((n) => parseInt(n, 10));
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
    if (confirm(t('viewTimetables.confirm.delete'))) {
      onDelete(id);
      toast.success(t('viewTimetables.toasts.deleted'));
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

    await Promise.resolve(onSetActive(timetable.id) as any);

    localStorage.setItem(weekKey, JSON.stringify(incoming));
    window.dispatchEvent(new Event('calendarSessionsUpdated'));

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
        // best effort
      }
    }

    if (onApplyToWeek) {
      await Promise.resolve(onApplyToWeek(timetable.id, 'overwrite') as any);
    }

    const timetableStartData = {
      id: timetable.id,
      startedAt: new Date().toISOString(),
      isRunning: true,
    };
    localStorage.setItem('activeTimetableStart', JSON.stringify(timetableStartData));

    toast.success(t('viewTimetables.toasts.started'), {
      description: t('viewTimetables.toasts.startedOverwriteDescription'),
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

    const hasClash = incoming.some((s: any) => existing.some((e: any) => sessionsClash(s, e)));
    if (hasClash) {
      toast.error(t('viewTimetables.toasts.sessionUnavailable'));
      return;
    }

    await Promise.resolve(onSetActive(timetable.id) as any);

    const merged = [...existing, ...incoming];
    localStorage.setItem(weekKey, JSON.stringify(merged));
    window.dispatchEvent(new Event('calendarSessionsUpdated'));

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
        // best effort
      }
    }

    if (onApplyToWeek) {
      await Promise.resolve(onApplyToWeek(timetable.id, 'merge') as any);
    }

    const timetableStartData = {
      id: timetable.id,
      startedAt: new Date().toISOString(),
      isRunning: true,
    };
    localStorage.setItem('activeTimetableStart', JSON.stringify(timetableStartData));

    toast.success(t('viewTimetables.toasts.startedMerged'), {
      description: t('viewTimetables.toasts.startedMergeDescription'),
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
      toast.info(t('viewTimetables.toasts.generatingPdf'));

      const { default: jsPDF } = await import('jspdf');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      pdf.text(t('viewTimetables.export.pdfTitle'), pageWidth / 2, 20, { align: 'center' });

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      const createdDate = new Date(timetable.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      pdf.text(t('viewTimetables.export.createdOn', { date: createdDate }), pageWidth / 2, 28, {
        align: 'center',
      });

      let yPos = 40;
      pdf.setFontSize(12);
      pdf.setTextColor(60, 60, 60);

      if (timetable.studyHoursPerDay) {
        pdf.text(t('viewTimetables.export.studyHoursPerDay', { value: `${timetable.studyHoursPerDay}h` }), 20, yPos);
        yPos += 7;
      }
      if (timetable.preferredStartTime && timetable.preferredEndTime) {
        pdf.text(
          t('viewTimetables.export.studyTime', {
            start: timetable.preferredStartTime,
            end: timetable.preferredEndTime,
          }),
          20,
          yPos
        );
        yPos += 7;
      }
      if (timetable.breakInterval) {
        pdf.text(t('viewTimetables.export.sessionLength', { value: `${timetable.breakInterval} min` }), 20, yPos);
        yPos += 7;
      }
      if (timetable.breakDuration) {
        pdf.text(t('viewTimetables.export.breakDuration', { value: `${timetable.breakDuration} min` }), 20, yPos);
        yPos += 7;
      }
      yPos += 3;

      if (timetable.subjects && timetable.subjects.length > 0) {
        pdf.setFontSize(14);
        pdf.setTextColor(37, 99, 235);
        pdf.text(t('viewTimetables.export.subjects'), 20, yPos);
        yPos += 7;

        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        timetable.subjects.forEach((subject: any) => {
          pdf.text(`• ${subject.name} (${subject.priority} ${t('viewTimetables.export.priority')})`, 25, yPos);
          yPos += 5;
        });

        yPos += 5;
      }

      if (timetable.schedule) {
        pdf.setFontSize(14);
        pdf.setTextColor(37, 99, 235);
        pdf.text(t('viewTimetables.export.weeklySchedule'), 20, yPos);
        yPos += 8;

        const weekDays = [
          t('viewTimetables.days.monday'),
          t('viewTimetables.days.tuesday'),
          t('viewTimetables.days.wednesday'),
          t('viewTimetables.days.thursday'),
          t('viewTimetables.days.friday'),
          t('viewTimetables.days.saturday'),
          t('viewTimetables.days.sunday'),
        ];
        const scheduleKeys = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);

        weekDays.forEach((dayLabel, index) => {
          const key = scheduleKeys[index];
          const daySchedule = timetable.schedule[key] || [];

          if (daySchedule.length > 0) {
            if (yPos > pageHeight - 40) {
              pdf.addPage();
              yPos = 20;
            }

            pdf.setFontSize(12);
            pdf.setTextColor(37, 99, 235);
            pdf.text(dayLabel, 20, yPos);
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

      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        t('viewTimetables.export.generatedOn', { date: new Date().toLocaleDateString() }),
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      pdf.save(`timetable-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(t('viewTimetables.toasts.pdfDownloaded'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('viewTimetables.toasts.pdfFailed'));
    }
  };

  const handleExportExcel = async (timetable: any) => {
    try {
      toast.info(t('viewTimetables.toasts.generatingCsv'));

      const worksheetData: any[][] = [];

      worksheetData.push([t('viewTimetables.export.csvTitle')]);
      worksheetData.push([t('viewTimetables.export.createdOnShort', { date: new Date(timetable.createdAt).toLocaleDateString() })]);
      worksheetData.push([]);

      if (timetable.studyHoursPerDay) {
        worksheetData.push([t('viewTimetables.export.studyHoursPerDayLabel'), timetable.studyHoursPerDay + 'h']);
      }
      if (timetable.preferredStartTime && timetable.preferredEndTime) {
        worksheetData.push([
          t('viewTimetables.export.studyTimeLabel'),
          `${timetable.preferredStartTime} - ${timetable.preferredEndTime}`,
        ]);
      }
      if (timetable.breakInterval) {
        worksheetData.push([t('viewTimetables.export.sessionLengthLabel'), timetable.breakInterval + ' min']);
      }
      if (timetable.breakDuration) {
        worksheetData.push([t('viewTimetables.export.breakDurationLabel'), timetable.breakDuration + ' min']);
      }
      worksheetData.push([]);

      if (timetable.subjects && timetable.subjects.length > 0) {
        worksheetData.push([t('viewTimetables.export.subjects')]);
        timetable.subjects.forEach((subject: any) => {
          worksheetData.push([subject.name, subject.priority + ' ' + t('viewTimetables.export.priority')]);
        });
        worksheetData.push([]);
      }

      if (timetable.schedule) {
        worksheetData.push([t('viewTimetables.export.weeklySchedule')]);
        worksheetData.push([]);

        const scheduleDays = [
          t('viewTimetables.days.monday'),
          t('viewTimetables.days.tuesday'),
          t('viewTimetables.days.wednesday'),
          t('viewTimetables.days.thursday'),
          t('viewTimetables.days.friday'),
          t('viewTimetables.days.saturday'),
          t('viewTimetables.days.sunday'),
        ];
        const scheduleKeys = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        scheduleDays.forEach((dayLabel, index) => {
          const key = scheduleKeys[index];
          const daySchedule = timetable.schedule[key] || [];

          if (daySchedule.length > 0) {
            worksheetData.push([dayLabel]);
            daySchedule.forEach((session: any) => {
              worksheetData.push([session.time, session.subject, session.type || '']);
            });
            worksheetData.push([]);
          }
        });
      }

      const { exportToCSV } = await import('../utils/excelExport');
      await exportToCSV({
        data: worksheetData,
        fileName: `timetable-${new Date().toISOString().split('T')[0]}.csv`,
      });

      toast.success(t('viewTimetables.toasts.csvDownloaded'));
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast.error(t('viewTimetables.toasts.exportFailed'));
    }
  };

  const handleExport = async (timetable: any, format: 'csv' | 'json' | 'pdf') => {
    if (format === 'pdf') return handleExportPDF(timetable);
    if (format === 'csv') return handleExportExcel(timetable);

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
      toast.success(t('viewTimetables.toasts.jsonDownloaded'));
    } catch (e) {
      toast.error(t('viewTimetables.toasts.jsonFailed'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <AlertDialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
          <AlertDialogContent className="w-[92vw] max-w-sm rounded-[28px] border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0b0b0b]">
            <AlertDialogHeader className="space-y-2 text-left">
              <AlertDialogTitle className="text-lg font-semibold">
                {t('viewTimetables.dialog.useThisTimetable')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t('viewTimetables.dialog.description.before')} <strong>{t('viewTimetables.dialog.myTimetable')}</strong>.
                {t('viewTimetables.dialog.description.after')}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="grid grid-cols-1 gap-2 pt-2">
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => {
                  setPendingStart(null);
                  setStartDialogOpen(false);
                }}
              >
                {t('common.cancel')}
              </Button>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => {
                    if (!pendingStart) return;
                    setStartDialogOpen(false);
                    const tt = pendingStart;
                    setPendingStart(null);
                    startTimetableMerge(tt);
                  }}
                >
                  {t('viewTimetables.actions.merge')}
                </Button>

                <Button
                  className="rounded-2xl bg-blue-700 text-white hover:bg-blue-700"
                  onClick={() => {
                    if (!pendingStart) return;
                    setStartDialogOpen(false);
                    const tt = pendingStart;
                    setPendingStart(null);
                    startTimetableOverwrite(tt);
                  }}
                >
                  {t('viewTimetables.actions.overwrite')}
                </Button>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0b0b]">
          <CardHeader className="rounded-t-[28px] border-b border-slate-100 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{t('viewTimetables.title')}</CardTitle>
                <CardDescription>{t('viewTimetables.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6">
            {timetables.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
                <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('viewTimetables.empty.title')}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t('viewTimetables.empty.description')}
                </p>

                {onNavigate && (
                  <Button
                    onClick={() => onNavigate('create-timetable')}
                    className="mt-4 rounded-2xl bg-blue-700 text-white hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('viewTimetables.empty.create')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {timetables.map((timetable) => {
                  const createdDate = new Date(timetable.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  const sessionCount = (timetable.calendarSessions || timetable.schedule || []).length;
                  const subjectCount = timetable.subjects?.length || 0;

                  return (
                    <div
                      key={timetable.id}
                      className={`rounded-3xl border bg-white p-4 dark:bg-[#111] ${
                        timetable.isActive
                          ? 'border-blue-200 dark:border-blue-900/40'
                          : 'border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                                {timetable.name || t('viewTimetables.card.untitled')}
                              </h3>

                              {timetable.isActive && (
                                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
                                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                  {t('viewTimetables.card.active')}
                                </Badge>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {t('viewTimetables.card.created', { date: createdDate })}
                            </p>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                              <DropdownMenuItem onClick={() => onView(timetable)} className="rounded-xl">
                                <Eye className="mr-2 h-4 w-4" />
                                {t('viewTimetables.actions.view')}
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handleExport(timetable, 'csv')} className="rounded-xl">
                                <FileText className="mr-2 h-4 w-4" />
                                {t('viewTimetables.actions.exportCsv')}
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handleExport(timetable, 'json')} className="rounded-xl">
                                <FileJson className="mr-2 h-4 w-4" />
                                {t('viewTimetables.actions.exportJson')}
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handleExport(timetable, 'pdf')} className="rounded-xl">
                                <Download className="mr-2 h-4 w-4" />
                                {t('viewTimetables.actions.exportPdf')}
                              </DropdownMenuItem>

                              {onDuplicate && (
                                <DropdownMenuItem onClick={() => onDuplicate(timetable.id)} className="rounded-xl">
                                  <Copy className="mr-2 h-4 w-4" />
                                  {t('viewTimetables.actions.duplicate')}
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                className="rounded-xl text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                onClick={() => handleDelete(timetable.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('viewTimetables.actions.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-900/40">
                            <Calendar className="mx-auto mb-2 h-4 w-4 text-blue-700 dark:text-blue-400" />
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {t('viewTimetables.stats.sessions')}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                              {sessionCount}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-900/40">
                            <BookOpen className="mx-auto mb-2 h-4 w-4 text-blue-700 dark:text-blue-400" />
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {t('viewTimetables.stats.subjects')}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                              {subjectCount}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-900/40">
                            <Clock className="mx-auto mb-2 h-4 w-4 text-blue-700 dark:text-blue-400" />
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {t('viewTimetables.stats.hoursPerDay')}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                              {timetable.studyHoursPerDay ? `${timetable.studyHoursPerDay}h` : '--'}
                            </div>
                          </div>
                        </div>

                        {timetable.breakInterval && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {t('viewTimetables.card.breakEvery', { minutes: timetable.breakInterval })}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => handleStartTimetable(timetable)}
                            className="rounded-2xl bg-blue-700 text-white hover:bg-blue-700"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            {t('viewTimetables.actions.start')}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => onView(timetable)}
                            className="rounded-2xl"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t('viewTimetables.actions.preview')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}