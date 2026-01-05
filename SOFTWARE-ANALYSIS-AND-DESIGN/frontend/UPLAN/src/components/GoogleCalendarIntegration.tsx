import { useState, useEffect } from 'react';
import { Calendar, Link, Unlink, Download, CheckCircle2, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface GoogleCalendarIntegrationProps {
  onExportTimetable?: (timetableId: string) => void;
}

export default function GoogleCalendarIntegration({ onExportTimetable }: GoogleCalendarIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check if Google Calendar is connected
    const savedConnection = localStorage.getItem('googleCalendarConnected');
    const savedEmail = localStorage.getItem('googleCalendarEmail');
    
    if (savedConnection === 'true' && savedEmail) {
      setIsConnected(true);
      setUserEmail(savedEmail);
    }
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);

    // ============================================================================
    // 🔌 BACKEND INTEGRATION POINT - GOOGLE CALENDAR OAUTH
    // ============================================================================
    // This section handles Google Calendar OAuth authentication
    // 
    // API Endpoint: GET /api/auth/google/calendar
    // Query Parameters: {
    //   redirect_uri: string,    // callback URL
    //   state: string            // CSRF token
    // }
    // 
    // OAuth Flow:
    // 1. Redirect user to Google OAuth consent screen
    // 2. User grants calendar access permissions
    // 3. Google redirects back with authorization code
    // 4. Exchange code for access & refresh tokens
    // 5. Store tokens securely in backend
    // 
    // Callback Endpoint: GET /api/auth/google/calendar/callback
    // Response: {
    //   success: boolean,
    //   user: {
    //     email: string,
    //     name: string,
    //     picture: string
    //   },
    //   tokens: {
    //     access_token: string,
    //     refresh_token: string,
    //     expiry_date: number
    //   }
    // }
    // 
    // Required: Google Calendar API credentials in backend
    // Scopes: 'https://www.googleapis.com/auth/calendar.events'
    // 
    // TODO: Implement actual Google OAuth flow
    // ============================================================================

    try {
      // In a real implementation, this would use Google OAuth
      // For demo purposes, we'll simulate the connection
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful connection
      const mockEmail = 'user@example.com'; // In real app, this would come from OAuth
      
      localStorage.setItem('googleCalendarConnected', 'true');
      localStorage.setItem('googleCalendarEmail', mockEmail);
      
      setIsConnected(true);
      setUserEmail(mockEmail);
      
      toast.success('Successfully connected to Google Calendar!');
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Failed to connect to Google Calendar. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect from Google Calendar? Your existing calendar events will not be affected.')) {
      localStorage.removeItem('googleCalendarConnected');
      localStorage.removeItem('googleCalendarEmail');
      
      setIsConnected(false);
      setUserEmail('');
      
      toast.success('Disconnected from Google Calendar');
    }
  };

  const exportToGoogleCalendar = async (timetableData: any) => {
    if (!isConnected) {
      toast.error('Please connect to Google Calendar first');
      return;
    }

    // ============================================================================
    // 🔌 BACKEND INTEGRATION POINT - EXPORT TIMETABLE TO GOOGLE CALENDAR
    // ============================================================================
    // This section exports timetable sessions as Google Calendar events
    // 
    // API Endpoint: POST /api/calendar/export
    // Request Body: {
    //   timetableId: string,
    //   sessions: Array<{
    //     subject: string,
    //     day: string,
    //     startTime: string,
    //     endTime: string,
    //     duration: number,
    //     color: string
    //   }>,
    //   calendarId: string,      // target calendar
    //   recurrence: {
    //     type: 'WEEKLY',
    //     endDate: string         // when to stop recurring
    //   }
    // }
    // Response: {
    //   success: boolean,
    //   exportedEvents: number,
    //   calendarUrl: string,
    //   eventIds: string[]
    // }
    // 
    // Google Calendar API Implementation:
    // - Use authorized access tokens from OAuth
    // - Create recurring events with RRULE
    // - Set reminders (15 min before, etc.)
    // - Add event descriptions with course info
    // - Apply color coding by subject
    // - Handle timezone conversions
    // - Sync deletions and updates
    // 
    // Example Event:
    // {
    //   summary: 'Study: Mathematics',
    //   start: { dateTime: '2024-01-15T09:00:00-08:00' },
    //   end: { dateTime: '2024-01-15T10:00:00-08:00' },
    //   recurrence: ['RRULE:FREQ=WEEKLY;COUNT=10'],
    //   reminders: { useDefault: false, overrides: [{method: 'popup', minutes: 15}] }
    // }
    // 
    // TODO: Implement actual Google Calendar API integration
    // ============================================================================

    try {
      toast.info('Exporting to Google Calendar...');
      
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Timetable exported to Google Calendar successfully! Check your calendar.');
      
      // In a real implementation, this would:
      // 1. Create events in Google Calendar using the Calendar API
      // 2. Handle recurring events for weekly schedules
      // 3. Add proper event descriptions and reminders
    } catch (error) {
      console.error('Error exporting to Google Calendar:', error);
      toast.error('Failed to export to Google Calendar');
    }
  };



  return (
    <div className="space-y-4">
      {/* Connection Status Card */}
      <Card className={`border-2 ${isConnected ? 'border-green-200 bg-green-50 dark:from-green-950/20 dark:to-emerald-950/20' : 'border-blue-200 bg-blue-50 dark:from-blue-950/20 dark:to-indigo-950/20'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isConnected ? 'bg-green-600' : 'bg-blue-600'}`}>
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Google Calendar Integration
                  {isConnected && (
                    <Badge className="bg-green-600 text-white border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {isConnected 
                    ? `Connected as ${userEmail}` 
                    : 'Connect to sync your study timetables with Google Calendar'}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              {/* Connected Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  onClick={() => exportToGoogleCalendar({})}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Timetable
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDisconnect}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>

              {/* Sync Info */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      <strong>Sync Active:</strong> Your study sessions will be automatically synced to Google Calendar when you save your timetable.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Connection Button */}
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        <strong>Connect Google Calendar to:</strong>
                      </p>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                        <li>• Export your study timetables directly to Google Calendar</li>
                        <li>• Import existing calendar events to avoid scheduling conflicts</li>
                        <li>• Get automatic reminders for your study sessions</li>
                        <li>• Sync across all your devices</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isConnecting ? (
                    <>Connecting...</>
                  ) : (
                    <>
                      <Link className="h-4 w-4 mr-2" />
                      Connect Google Calendar
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Features Card */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Calendar className="h-5 w-5 text-blue-600" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-gray-900 dark:text-gray-100 mb-1">Export to Calendar</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically create Google Calendar events for all your study sessions
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="text-gray-900 dark:text-gray-100 mb-1">Auto-Sync</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Keep your study schedule synchronized across all your devices
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="text-gray-900 dark:text-gray-100 mb-1">Smart Reminders</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notifications before each study session through Google Calendar
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}