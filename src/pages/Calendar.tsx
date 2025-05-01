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
  payroll_id?: string | null;           // Foreign key to connect to payroll table
  attendance_id?: string | null;        // Foreign key to connect to attendance table
  calendar_event_id?: string | null;    // Foreign key to connect to calendar_events table
  
  // Related data from joins
  payroll?: {
    id: string;
    basic_salary: number;
    net_salary: number;
    // Other payroll fields as needed
  } | null;
  
  attendance?: {
    id: string;
    date: string;
    check_in: string | null;
    check_out: string | null;
    // Other attendance fields as needed
  } | null;
  
  calendar_events?: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    // Other calendar_events fields as needed
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
  payroll_event_id?: string | null;     // Foreign key to reference payroll_events
  
  // Related data from joins
  payroll_events?: {
    id: string;
    title: string;
    event_type: string;
    // Other payroll_events fields as needed
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
        // Fetch payroll events for April 2025 with related data
        const startDate = "2025-04-01";
        const endDate = "2025-04-30";
        
        // Improved query with proper join relationships
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

        // Fetch attendance events for April 2025 with related payroll event data
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
        
        // Transform attendance data with proper typing
        const typedAttendanceData = (attendanceData || []).map(event => ({
          ...event,
          event_type: 'attendance'
        })) as CalendarEvent[];

        setAttendanceEvents(typedAttendanceData);

        // Group events by date
        const groupedEvents: EventsByDate = {};
        
        // Group payroll events
        typedPayrollData.forEach(event => {
          const dateKey = new Date(event.start_time).toISOString().split('T')[0];
          if (!groupedEvents[dateKey]) {
            groupedEvents[dateKey] = { payroll: [], attendance: [] };
          }
          groupedEvents[dateKey].payroll.push(event);
        });
        
        // Group attendance events
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
    
    if (!events) return null;
    
    return (
      <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
        {events.payroll.length > 0 && (
          <CalendarBadge type="payroll" count={events.payroll.length} />
        )}
        {events.attendance.length > 0 && (
          <CalendarBadge type="attendance" count={events.attendance.length} />
        )}
      </div>
    );
  };

  // Function to sync with Google Calendar
  const syncWithGoogleCalendar = () => {
    // This is a placeholder. In a real implementation, you would integrate with Google Calendar API
    toast({
      title: "Google Calendar",
      description: "Sinkronisasi dengan Google Calendar akan segera tersedia.",
      variant: "default",
    });
  };
  
  const filteredPayrollEvents = selectedDate 
    ? payrollEvents.filter(event => 
        isSameDay(new Date(event.start_time), selectedDate)) 
    : [];
  
  const filteredAttendanceEvents = selectedDate 
    ? attendanceEvents.filter(event => 
        isSameDay(new Date(event.start_time), selectedDate)) 
    : [];

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
                      <div className="day-content text-foreground" {...props} />
                      {renderDayContent(date)}
                    </div>
                  );
                },
              }}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <CalendarBadge type="payroll" />
                <span className="text-xs text-muted-foreground">Gaji</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarBadge type="attendance" />
                <span className="text-xs text-muted-foreground">Kehadiran</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events List Card */}
        <Card className="lg:col-span-2 h-full">
          <CardHeader>
            <CardTitle>
              {selectedDate ? (
                <>Event pada {format(selectedDate, "dd MMMM yyyy")}</>
              ) : (
                <>Semua Event</>
              )}
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
              <div className="space-y-6">
                {/* Payroll Events Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="success" className="h-6">Payroll Events</Badge>
                    <CalendarCheck className="h-4 w-4 text-green-600" />
                  </div>
                  {filteredPayrollEvents.length === 0 ? (
                    <p className="text-muted-foreground">Tidak ada event penggajian untuk tanggal ini.</p>
                  ) : (
                    <ul className="space-y-4">
                      {filteredPayrollEvents.map(event => (
                        <li key={event.id} className="border-l-4 border-green-500 pl-4 bg-green-50/50 p-3 rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(event.start_time).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                                {event.start_time !== event.end_time && (
                                  <>
                                    {" - "}
                                    {new Date(event.end_time).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(event.start_time).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {" - "}
                                {new Date(event.end_time).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              {event.description && (
                                <p className="text-sm mt-1">{event.description}</p>
                              )}
                              {event.payroll && (
                                <div className="mt-2 text-sm">
                                  <p className="font-medium text-green-700">Data Gaji:</p>
                                  <p>Gaji Dasar: Rp {event.payroll.basic_salary?.toLocaleString('id-ID')}</p>
                                  <p>Gaji Bersih: Rp {event.payroll.net_salary?.toLocaleString('id-ID')}</p>
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              {event.event_type}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Employee Attendance Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="info" className="h-6">Attendance Events</Badge>
                    <CalendarCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  {filteredAttendanceEvents.length === 0 ? (
                    <p className="text-muted-foreground">Tidak ada data kehadiran untuk tanggal ini.</p>
                  ) : (
                    <ul className="space-y-4">
                      {filteredAttendanceEvents.map(event => (
                        <li key={event.id} className="border-l-4 border-blue-500 pl-4 bg-blue-50/50 p-3 rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(event.start_time).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                              {event.check_in && (
                                <p className="text-sm">
                                  Check-in Paling Awal: {new Date(event.check_in).toLocaleTimeString("id-ID")}
                                </p>
                              )}
                              {event.check_out && (
                                <p className="text-sm">
                                  Check-out Paling Akhir: {new Date(event.check_out).toLocaleTimeString("id-ID")}
                                </p>
                              )}
                              {event.description && (
                                <p className="text-sm mt-1 whitespace-pre-line">{event.description}</p>
                              )}
                              {event.payroll_events && (
                                <div className="mt-2 text-sm">
                                  <p className="font-medium text-blue-700">Terkait dengan:</p>
                                  <p>{event.payroll_events.title} ({event.payroll_events.event_type})</p>
                                </div>
                              )}
                            </div>
                            <Badge variant={event.is_synced ? "success" : "gray"} className="h-6">
                              {event.is_synced ? "Tersinkronisasi" : "Belum Tersinkronisasi"}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
