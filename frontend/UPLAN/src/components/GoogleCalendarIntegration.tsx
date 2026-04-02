import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Link, Unlink, Download, CheckCircle2, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface GoogleCalendarIntegrationProps {
  onExportTimetable?: (timetableId: string) => void;
}

export default function GoogleCalendarIntegration({
  onExportTimetable,
}: GoogleCalendarIntegrationProps) {
  const { t } = useTranslation();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const savedConnection = localStorage.getItem('googleCalendarConnected');
    const savedEmail = localStorage.getItem('googleCalendarEmail');

    if (savedConnection === 'true' && savedEmail) {
      setIsConnected(true);
      setUserEmail(savedEmail);
    }
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockEmail = 'user@example.com';

      localStorage.setItem('googleCalendarConnected', 'true');
      localStorage.setItem('googleCalendarEmail', mockEmail);

      setIsConnected(true);
      setUserEmail(mockEmail);

      toast.success(t('googleCalendar.success.connected'));
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error(t('googleCalendar.errors.connect'));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (
      confirm(t('googleCalendar.confirm.disconnect'))
    ) {
      localStorage.removeItem('googleCalendarConnected');
      localStorage.removeItem('googleCalendarEmail');

      setIsConnected(false);
      setUserEmail('');

      toast.success(t('googleCalendar.success.disconnected'));
    }
  };

  const exportToGoogleCalendar = async (timetableData: any) => {
    if (!isConnected) {
      toast.error(t('googleCalendar.errors.connectFirst'));
      return;
    }

    try {
      toast.info(t('googleCalendar.info.exporting'));

      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(t('googleCalendar.success.exported'));
    } catch (error) {
      console.error('Error exporting to Google Calendar:', error);
      toast.error(t('googleCalendar.errors.export'));
    }
  };
}