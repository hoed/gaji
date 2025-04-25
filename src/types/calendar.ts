
export type CalendarEventType = 'payroll' | 'attendance' | 'tax';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startTime: Date;
  endTime: Date;
  googleEventId?: string;
  payrollId?: string;
  employeeId?: string;
  attendanceId?: string;
  isSynced: boolean;
}
