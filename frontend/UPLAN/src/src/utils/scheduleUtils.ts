import { DAYS_OF_WEEK, PRIORITY_TO_TYPE_MAP } from '../constants';
import { DaySchedule, Session, ScheduleSession } from '../types';
import { convertTailwindColorToHex, getColorForType } from './colorUtils';

/**
 * Maps priority level to session type
 */
export const mapPriorityToType = (priority: string): string => {
  const normalizedPriority = priority?.toLowerCase() as keyof typeof PRIORITY_TO_TYPE_MAP;
  return PRIORITY_TO_TYPE_MAP[normalizedPriority] || 'reading';
};

/**
 * Converts a schedule array to calendar sessions format
 */
export const convertScheduleToSessions = (schedule: DaySchedule[]): Session[] => {
  const sessions: Session[] = [];

  console.log('=== CONVERTING SCHEDULE TO SESSIONS ===');
  console.log('Schedule has', schedule.length, 'days');

  // Counter to ensure truly unique IDs even if called in rapid succession
  let sessionCounter = 0;

  schedule.forEach((daySchedule) => {
    const dayIndex = DAYS_OF_WEEK.indexOf(daySchedule.day);

    if (dayIndex === -1) {
      console.warn(`Invalid day name: ${daySchedule.day}`);
      return;
    }

    console.log(
      `Processing ${daySchedule.day} (index ${dayIndex}) with ${daySchedule.sessions.length} sessions`
    );

    daySchedule.sessions.forEach((session: ScheduleSession) => {
      // Generate truly unique ID with timestamp, random value, and counter
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${sessionCounter++}`;
      
      if (session.type === 'study') {
        const sessionType = mapPriorityToType(session.priority || '');
        const hexColor =
          session.color && session.color.startsWith('bg-')
            ? convertTailwindColorToHex(session.color)
            : session.color || getColorForType(sessionType);

        sessions.push({
          id: uniqueId,
          subject: session.subject,
          startTime: session.startTime,
          endTime: session.endTime,
          day: dayIndex,
          type: sessionType as Session['type'],
          color: hexColor,
        });
        console.log(`  ✓ Added study session: ${session.subject} at ${session.startTime}-${session.endTime} [ID: ${uniqueId}]`);
      } else if (session.type === 'break') {
        sessions.push({
          id: uniqueId,
          subject: 'Break',
          startTime: session.startTime,
          endTime: session.endTime,
          day: dayIndex,
          type: 'break',
          color: '#9CA3AF',
        });
        console.log(`  ✓ Added break: ${session.startTime}-${session.endTime} [ID: ${uniqueId}]`);
      } else if (session.type === 'blocked') {
        // Include blocked times from the timetable
        sessions.push({
          id: uniqueId,
          subject: session.title || 'Blocked Time',
          startTime: session.startTime,
          endTime: session.endTime,
          day: dayIndex,
          type: 'lecture', // Use 'lecture' type for blocked times
          color: '#9333EA', // Purple color for blocked times
        });
        console.log(`  ✓ Added blocked time: ${session.title || 'Blocked Time'} at ${session.startTime}-${session.endTime} [ID: ${uniqueId}]`);
      } else {
        console.warn(`  ⚠ Unknown session type: ${session.type} for ${session.subject}`);
      }
    });
  });

  console.log('=== CONVERSION COMPLETE ===');
  console.log(
    `Created ${sessions.length} total sessions across ${new Set(sessions.map((s) => s.day)).size} days`
  );
  console.log(
    'Days with sessions:',
    [...new Set(sessions.map((s) => DAYS_OF_WEEK[s.day]))].join(', ')
  );
  console.log('Converted sessions for CalendarView:', sessions);
  
  // Verify no duplicate IDs
  const ids = sessions.map(s => s.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    console.error('⚠️ WARNING: Duplicate IDs detected in generated sessions!');
  } else {
    console.log('✓ All session IDs are unique');
  }
  
  return sessions;
};