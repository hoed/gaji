
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import "react-day-picker/dist/style.css";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
}

export default function Calendar() {
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*");

      if (error) throw error;

      // Convert to our CalendarEvent interface to avoid using non-existing properties
      const formattedEvents: CalendarEvent[] = (data || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time
      }));
      
      setEvents(formattedEvents);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: `Failed to load events: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const eventsForSelectedDate = selected
    ? events.filter((event) => {
        const eventDate = new Date(event.start_time);
        return (
          eventDate.getDate() === selected.getDate() &&
          eventDate.getMonth() === selected.getMonth() &&
          eventDate.getFullYear() === selected.getFullYear()
        );
      })
    : [];

  const handleAddEvent = async () => {
    if (!selected) return;
    
    try {
      const startTime = new Date(selected);
      startTime.setHours(9, 0, 0);
      
      const endTime = new Date(selected);
      endTime.setHours(10, 0, 0);
      
      const eventData = {
        title: `Event on ${format(selected, "PPPP", { locale: id })}`,
        description: "New event",
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      };
      
      const { error } = await supabase.from("calendar_events").insert([eventData]);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      
      fetchEvents();
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: `Failed to create event: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">Manage and view your scheduled events</p>
      </div>

      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar View
            </CardTitle>
            <CardDescription>Click on a date to see events.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center p-2 md:p-4">
              <DayPicker
                mode="single"
                selected={selected}
                onSelect={setSelected}
                locale={id}
                className="p-4 bg-white rounded-lg shadow-sm border"
                classNames={{
                  months: "flex flex-col space-y-4",
                  month: "space-y-4",
                  caption: "flex justify-center relative items-center h-10",
                  caption_label: "text-lg font-medium",
                  nav: "flex items-center space-x-1",
                  nav_button: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "rounded-md w-10 h-10 font-normal text-[0.8rem] text-muted-foreground",
                  row: "flex w-full mt-2 gap-1",
                  cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                  day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm sm:text-lg font-medium">
              Events for{" "}
              <span className="block mt-1 sm:inline sm:mt-0">
                {selected ? format(selected, "PPP", { locale: id }) : "Selected Date"}
              </span>
            </CardTitle>
            <Button onClick={handleAddEvent} size="sm" className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
              </div>
            ) : eventsForSelectedDate.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No events scheduled for this date.
              </p>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[300px] pr-1">
                {eventsForSelectedDate.map((event) => (
                  <div key={event.id} className="border rounded-lg p-3 space-y-1">
                    <h3 className="font-medium text-sm sm:text-base break-words">{event.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">{event.description}</p>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(event.start_time), "p", { locale: id })} -{" "}
                      {format(new Date(event.end_time), "p", { locale: id })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
