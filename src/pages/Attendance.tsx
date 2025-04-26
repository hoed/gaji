
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string | null;
}

export default function Attendance() {
  const [date, setDate] = useState<Date>(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (date) {
      fetchAttendanceForDate();
    }
  }, [date]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .order("first_name");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
      toast({
        title: "Error",
        description: `Failed to load employees: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const fetchAttendanceForDate = async () => {
    setIsLoading(true);
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", formattedDate);

      if (error) throw error;
      setAttendanceData(data || []);
    } catch (error: any) {
      console.error("Error fetching attendance:", error);
      toast({
        title: "Error",
        description: `Failed to load attendance records: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate attendance statistics
  // Since the status field doesn't exist in our current schema, we'll
  // calculate based on check-in presence
  const presentCount = attendanceData.filter(record => record.check_in !== null).length;
  const absentCount = employees.length - presentCount;
  const lateCount = 0; // We don't have a way to determine this yet
  const totalEmployees = employees.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">Track employee attendance records</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 md:col-span-8">
          <CardHeader>
            <CardTitle>Daily Attendance</CardTitle>
            <CardDescription>
              Attendance records for {date ? format(date, "PPPP", { locale: id }) : "today"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => {
                      const record = attendanceData.find(
                        (r) => r.employee_id === employee.id
                      );

                      // Determine status based on check-in
                      let status = "Not Recorded";
                      if (record) {
                        status = record.check_in ? "Present" : "Absent";
                      }

                      return (
                        <TableRow key={employee.id}>
                          <TableCell>
                            {employee.first_name}{" "}
                            {employee.last_name || ""}
                          </TableCell>
                          <TableCell>
                            {record?.check_in
                              ? format(new Date(record.check_in), "p", {
                                  locale: id,
                                })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {record?.check_out
                              ? format(new Date(record.check_out), "p", {
                                  locale: id,
                                })
                              : "-"}
                          </TableCell>
                          <TableCell>{status}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => alert("Edit attendance record")}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="col-span-12 md:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>Choose a date to view attendance</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                className="rounded-md border"
                locale={id}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>
                Statistics for {date ? format(date, "PP", { locale: id }) : "today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1 rounded-md border p-4">
                  <span className="text-muted-foreground text-xs">Present</span>
                  <span className="text-2xl font-bold">{presentCount}</span>
                </div>
                <div className="flex flex-col space-y-1 rounded-md border p-4">
                  <span className="text-muted-foreground text-xs">Absent</span>
                  <span className="text-2xl font-bold">{absentCount}</span>
                </div>
                <div className="flex flex-col space-y-1 rounded-md border p-4">
                  <span className="text-muted-foreground text-xs">Late</span>
                  <span className="text-2xl font-bold">{lateCount}</span>
                </div>
                <div className="flex flex-col space-y-1 rounded-md border p-4">
                  <span className="text-muted-foreground text-xs">Total</span>
                  <span className="text-2xl font-bold">{totalEmployees}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
