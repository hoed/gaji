/* src/pages/Calendar.tsx */
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarUI, DayContentProps } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from "date-fns";
import { CalendarCheck, CalendarClock, Calendar as CalendarIcon } from "lucide-react";
import CalendarBadge, { BadgeType } from "@/components/calendar/CalendarBadge";
import { Button } from "@/components/ui/button";

// Define interface for payroll events (based on payroll_events table)
interface PayrollEvent {
  id: string;
  title: string;
  event_type: string;
  start_time: string;
  end_time: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  payroll_id?: string | null;
  attendance_id?: string | null;
  calendar_event_id?: string | null;
  
  payroll?: {
    id: string;
    basic_salary: number;
    net_salary: number;
  } | null;
  
  attendance?: {
    id: string;
    date: string;
    check_in: string | null;
    check_out: string | null;
  } | null;
  
  calendar_events?: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
  } | null;
}

// Define interface for calendar events (based on calendar_events table)
interface CalendarEvent {
  id: string;
  title: string;
  event_type?: string;
  start_time: string;
  end_time: string;
  description: string | null;
  check_in: string | null;
  check_out: string | null;
  earliest_check_in_attendance_id: string | null;
  latest_check_out_attendance_id: string | null;
  created_at: string;
  updated_at: string;
  is_synced: boolean;
  payroll_event_id?: string | null;
  
  payroll_events?: {
    id: string;
    title: string;
    event_type: string;
  } | null;
}

// Group events by date for badges
type EventsByDate = {
  [date: string]: {
    payroll: PayrollEvent[];
    attendance: CalendarEvent[];
  };
};

export default function CalendarPage() {
  const [payrollEvents, setPayrollEvents] = useState<PayrollEvent[]>([]);
  const [attendanceEvents, setAttendanceEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [eventsByDate, setEventsByDate] = useState<EventsByDate>({});
  const { toast } = useToast();

  // Fetch payroll events and attendance events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const startDate = "2025-04-01";
        const endDate = "2025-04-30";
        
        const { data: payrollData, error: payrollError } = await supabase
          .from("payroll_events")
          .select(`
            *,
            payroll(*),
            calendar_events(*),
            attendance(*)
          `)
          .gte("start_time", startDate)
          .lte("end_time", endDate);

        if (payrollError) {
          console.error("Error fetching payroll events:", payrollError);
          throw payrollError;
        }
        
        const typedPayrollData = payrollData as PayrollEvent[] || [];
        setPayrollEvents(typedPayrollData);

        const { data: attendanceData, error: attendanceError } = await supabase
          .from("calendar_events")
          .select(`
            *,
            payroll_events(*)
          `)
          .gte("start_time", startDate)
          .lte("end_time", endDate);

        if (attendanceError) {
          console.error("Error fetching attendance events:", attendanceError);
          throw attendanceError;
        }
        
        const typedAttendanceData = (attendanceData || []).map(event => ({
          ...event,
          event_type: 'attendance'
        })) as CalendarEvent[];

        setAttendanceEvents(typedAttendanceData);

        const groupedEvents: EventsByDate = {};
        
        typedPayrollData.forEach(event => {
          const dateKey = new Date(event.start_time).toISOString().split('T')[0];
          if (!groupedEvents[dateKey]) {
            groupedEvents[dateKey] = { payroll: [], attendance: [] };
          }
          groupedEvents[dateKey].payroll.push(event);
        });
        
        typedAttendanceData.forEach(event => {
          const dateKey = new Date(event.start_time).toISOString().split('T')[0];
          if (!groupedEvents[dateKey]) {
            groupedEvents[dateKey] = { payroll: [], attendance: [] };
          }
          groupedEvents[dateKey].attendance.push(event);
        });
        
        setEventsByDate(groupedEvents);

      } catch (error) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data event.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [toast]);

  // Function to render event badges for a specific day
  const renderDayContent = (day: Date) => {
    const dateKey = day.toISOString().split('T')[0];
    const events = eventsByDate[dateKey];
    
    if (!events) return <div className="text-foreground">{day.getDate()}</div>;
    
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-foreground">{day.getDate()}</div>
        <div className="flex gap-0.5">
          {events.payroll.length > 0 && (
            <CalendarBadge type="payroll" count={events.payroll.length} className="text-xs w-4 h-4" />
          )}
          {events.attendance.length > 0 && (
            <CalendarBadge type="attendance" count={events.attendance.length} className="text-xs w-4 h-4" />
          )}
        </div>
      </div>
    );
  };

  // Function to sync with Google Calendar
  const syncWithGoogleCalendar = () => {
    toast({
      title: "Google Calendar",
      description: "Sinkronisasi dengan Google Calendar akan segera tersedia.",
      variant: "default",
    });
  };
  
  // Combine and filter events for the selected date
  const filteredEvents = selectedDate
    ? [...payrollEvents, ...attendanceEvents].filter(event =>
        isSameDay(new Date(event.start_time), selectedDate)
      )
    : [...payrollEvents, ...attendanceEvents];

  // Determine if an event is upcoming
  const isUpcoming = (event: PayrollEvent | CalendarEvent) => {
    return new Date(event.start_time) > new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold">Kalender</h1>
          <p className="text-muted-foreground">
            Lihat event penggajian dan kehadiran karyawan
          </p>
        </div>
        <Button 
          onClick={syncWithGoogleCalendar} 
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <CalendarClock className="h-4 w-4" />
          Sync to Google Calendar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Card */}
        <Card className="lg:col-span-1 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar April 2025
            </CardTitle>
            <CardDescription>
              Lihat event berdasarkan tanggal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarUI
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="border rounded-md p-3"
              components={{
                DayContent: (props: DayContentProps) => {
                  const { date } = props;
                  return (
                    <div className="relative w-full h-full flex flex-col items-center">
                      {renderDayContent(date)}
                    </div>
                  );
                },
              }}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <CalendarBadge type="payroll" className="text-xs w-4 h-4" />
                <span className="text-xs text-muted-foreground">Gaji</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarBadge type="attendance" className="text-xs w-4 h-4" />
                <span className="text-xs text-muted-foreground">Kehadiran</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events List Card */}
        <Card className="lg:col-span-2 h-full">
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? `Event pada ${format(selectedDate, "dd MMMM yyyy")}`
                : "Semua Event"}
            </CardTitle>
            <CardDescription>
              Detail event penggajian dan kehadiran karyawan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredEvents.length === 0 ? (
                  <p className="text-muted-foreground">Tidak ada event untuk tanggal ini.</p>
                ) : (
                  filteredEvents.map(event => (
                    <li key={event.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-foreground">
                          {new Date(event.start_time).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}{" "}
                          {event.title}
                        </p>
                      </div>
                      {isUpcoming(event) && (
                        <span className="text-yellow-600 font-medium">Mendatang</span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}