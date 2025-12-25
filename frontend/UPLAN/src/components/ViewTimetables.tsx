import { Calendar, Trash2, Eye, CheckCircle, Clock, BookOpen, Plus, Download, FileSpreadsheet, ChevronDown, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { toast } from 'sonner';

interface ViewTimetablesProps {
  timetables: any[];
  onDelete: (id: string) => void;
  onView: (timetable: any) => void;
  onSetActive: (id: string) => void;
  onNavigate?: (page: string) => void;
}

export default function ViewTimetables({ timetables, onDelete, onView, onSetActive, onNavigate }: ViewTimetablesProps) {
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this timetable?')) {
      onDelete(id);
      toast.success('Timetable deleted successfully');
    }
  };

  const handleStartTimetable = (timetable: any) => {
    // Set the timetable as active first
    onSetActive(timetable.id);
    
    // Save the start timestamp
    const timetableStartData = {
      id: timetable.id,
      startedAt: new Date().toISOString(),
      isRunning: true,
    };
    
    localStorage.setItem('activeTimetableStart', JSON.stringify(timetableStartData));
    
    // Dispatch event to notify CalendarView to reload availability settings
    window.dispatchEvent(new Event('calendarSessionsUpdated'));
    
    toast.success('Timetable started! Good luck with your studies! 📚', {
      description: 'Your study session is now active',
    });
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
                  {/* Stats Grid - Only show stats that exist */}
                  {(timetable.studyHoursPerDay || timetable.subjects || timetable.breakInterval || timetable.breakDuration) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {timetable.studyHoursPerDay && (
                        <div className="bg-blue-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600 mb-0.5">Study Hours/Day</p>
                          <p className="text-sm text-blue-600">{timetable.studyHoursPerDay}h</p>
                        </div>
                      )}
                      {timetable.subjects && (
                        <div className="bg-indigo-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600 mb-0.5">Subjects</p>
                          <p className="text-sm text-indigo-600">{timetable.subjects.length}</p>
                        </div>
                      )}
                      {timetable.breakInterval && (
                        <div className="bg-purple-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600 mb-0.5">Session Length</p>
                          <p className="text-sm text-purple-600">{timetable.breakInterval} min</p>
                        </div>
                      )}
                      {timetable.breakDuration && (
                        <div className="bg-pink-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600 mb-0.5">Break Time</p>
                          <p className="text-sm text-pink-600">{timetable.breakDuration} min</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subjects - Only show if they exist */}
                  {timetable.subjects && timetable.subjects.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1.5">Subjects:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {timetable.subjects.map((subject: any) => (
                          <Badge
                            key={subject.id}
                            className={`${subject.color} text-white border-0 text-xs px-2 py-0.5`}
                          >
                            {subject.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Range - Only show if data exists */}
                  {timetable.preferredStartTime && timetable.preferredEndTime && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Study Time: {timetable.preferredStartTime} - {timetable.preferredEndTime}</span>
                    </div>
                  )}

                  {/* Selected Days */}
                  {timetable.selectedDays && timetable.selectedDays.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1.5">Study Days:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {/* Show actual days from schedule, not just selectedDays */}
                        {timetable.schedule && timetable.schedule.length > 0 ? (
                          timetable.schedule
                            .filter((daySchedule: any) => daySchedule.sessions && daySchedule.sessions.some((s: any) => s.type === 'study'))
                            .map((daySchedule: any) => (
                              <Badge
                                key={daySchedule.day}
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-0"
                              >
                                {daySchedule.day.substring(0, 3)}
                              </Badge>
                            ))
                        ) : (
                          // Fallback to selectedDays if schedule not available
                          timetable.selectedDays.map((day: string) => (
                            <Badge
                              key={day}
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-0"
                            >
                              {day.substring(0, 3)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Availability & Breaks Settings */}
                  {timetable.availabilitySettings && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-blue-900 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <strong>Availability & Breaks Settings</strong>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                        {/* Weekday Hours */}
                        {timetable.availabilitySettings.weekdayAvailability && (
                          <div>
                            <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                              Weekday Hours:
                            </p>
                            <p className="text-sm text-gray-900">
                              {timetable.availabilitySettings.weekdayAvailability.start} - {timetable.availabilitySettings.weekdayAvailability.end}
                            </p>
                          </div>
                        )}
                        
                        {/* Weekend Hours */}
                        {timetable.availabilitySettings.weekendAvailability && !timetable.availabilitySettings.weekendSameAsWeekday && (
                          <div>
                            <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                              Weekend Hours:
                            </p>
                            <p className="text-sm text-gray-900">
                              {timetable.availabilitySettings.weekendAvailability.start} - {timetable.availabilitySettings.weekendAvailability.end}
                            </p>
                          </div>
                        )}
                        
                        {/* Sleep Hours */}
                        <div>
                          <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                            Sleep Hours:
                          </p>
                          <p className="text-sm text-gray-900">
                            {timetable.availabilitySettings.sleepHours?.from && timetable.availabilitySettings.sleepHours?.to
                              ? `${timetable.availabilitySettings.sleepHours.from} - ${timetable.availabilitySettings.sleepHours.to}`
                              : '-'
                            }
                          </p>
                        </div>
                        
                        {/* Lunch Break */}
                        {timetable.availabilitySettings.lunchBreak?.enabled && (
                          <div>
                            <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                              Lunch Break:
                            </p>
                            <p className="text-sm text-gray-900">
                              {timetable.availabilitySettings.lunchBreak.start} - {timetable.availabilitySettings.lunchBreak.end}
                            </p>
                          </div>
                        )}
                        
                        {/* Dinner Break */}
                        {timetable.availabilitySettings.dinnerBreak?.enabled && (
                          <div>
                            <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                              Dinner Break:
                            </p>
                            <p className="text-sm text-gray-900">
                              {timetable.availabilitySettings.dinnerBreak.start} - {timetable.availabilitySettings.dinnerBreak.end}
                            </p>
                          </div>
                        )}
                        
                        {/* Commute Buffer */}
                        {timetable.availabilitySettings.commuteMinutes > 0 && (
                          <div>
                            <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                              Commute Buffer:
                            </p>
                            <p className="text-sm text-gray-900">
                              {timetable.availabilitySettings.commuteMinutes} minutes
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button 
                      onClick={() => handleStartTimetable(timetable)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                    <Button 
                      onClick={() => onView(timetable)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {!timetable.isActive && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          onSetActive(timetable.id);
                          toast.success('Timetable set as active');
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Set Active
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      onClick={() => handleDelete(timetable.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuItem
                          onClick={() => handleExportPDF(timetable)}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExportExcel(timetable)}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}