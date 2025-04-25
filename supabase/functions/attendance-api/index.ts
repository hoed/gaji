
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.0';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get the API key from the Authorization header
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verify the API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key', apiKey)
      .eq('is_active', true)
      .single();

    if (apiKeyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last_used_at for the API key
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyData.id);

    // Parse the request body
    const requestData = await req.json();
    const { action, data } = requestData;

    // Handle different actions
    switch (action) {
      case 'get_employees':
        // Return list of employees
        const { data: employees, error: employeesError } = await supabase
          .from('employees')
          .select('id, first_name, last_name, nik');

        if (employeesError) {
          console.error('Error fetching employees:', employeesError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch employees' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ employees }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'add_employee':
        // Check if the employee exists (by NIK)
        if (!data.nik) {
          return new Response(
            JSON.stringify({ error: 'NIK is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: existingEmployee } = await supabase
          .from('employees')
          .select('id')
          .eq('nik', data.nik)
          .maybeSingle();

        if (existingEmployee) {
          // Employee already exists
          return new Response(
            JSON.stringify({ message: 'Employee already exists', employee_id: existingEmployee.id }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Add new employee
        const newEmployee = {
          first_name: data.first_name || 'Unknown',
          last_name: data.last_name || '',
          nik: data.nik,
          hire_date: data.hire_date || new Date().toISOString().split('T')[0],
        };

        const { data: insertedEmployee, error: insertError } = await supabase
          .from('employees')
          .insert(newEmployee)
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting employee:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to insert employee' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ message: 'Employee added successfully', employee: insertedEmployee }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'add_attendance':
        // Validate required fields
        if (!data.employee_id && !data.nik) {
          return new Response(
            JSON.stringify({ error: 'Either employee_id or NIK is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let employeeId = data.employee_id;

        // If no employee_id but NIK is provided, look up the employee
        if (!employeeId && data.nik) {
          const { data: employeeData } = await supabase
            .from('employees')
            .select('id')
            .eq('nik', data.nik)
            .maybeSingle();

          if (!employeeData) {
            return new Response(
              JSON.stringify({ error: 'Employee not found with the provided NIK' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          employeeId = employeeData.id;
        }

        // Create attendance record
        const attendanceDate = data.date || new Date().toISOString().split('T')[0];
        
        // Check if attendance record already exists for this date
        const { data: existingAttendance } = await supabase
          .from('attendance')
          .select('id')
          .eq('employee_id', employeeId)
          .eq('date', attendanceDate)
          .maybeSingle();
        
        let attendanceId;
        
        if (existingAttendance) {
          // Update existing attendance
          const { data: updatedAttendance, error: updateError } = await supabase
            .from('attendance')
            .update({
              check_in: data.check_in || null,
              check_out: data.check_out || null,
              status: data.status || 'present',
              notes: data.notes || null
            })
            .eq('id', existingAttendance.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating attendance:', updateError);
            return new Response(
              JSON.stringify({ error: 'Failed to update attendance' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          attendanceId = existingAttendance.id;
        } else {
          // Insert new attendance
          const { data: insertedAttendance, error: insertError } = await supabase
            .from('attendance')
            .insert({
              employee_id: employeeId,
              date: attendanceDate,
              check_in: data.check_in || null,
              check_out: data.check_out || null,
              status: data.status || 'present',
              notes: data.notes || null
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error inserting attendance:', insertError);
            return new Response(
              JSON.stringify({ error: 'Failed to insert attendance' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          attendanceId = insertedAttendance.id;
        }

        // Create calendar event for attendance if it doesn't exist
        const eventDate = new Date(attendanceDate);
        const startTime = data.check_in ? new Date(data.check_in) : new Date(eventDate.setHours(8, 0, 0, 0));
        const endTime = data.check_out ? new Date(data.check_out) : new Date(eventDate.setHours(17, 0, 0, 0));
        
        const { data: calendarEvent, error: calendarError } = await supabase
          .from('calendar_events')
          .upsert({
            title: `Attendance: ${data.status || 'present'}`,
            description: data.notes || 'Attendance record',
            event_type: 'attendance',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            employee_id: employeeId,
            attendance_id: attendanceId,
            is_synced: false
          })
          .select()
          .single();

        if (calendarError) {
          console.error('Error creating calendar event:', calendarError);
          // We don't want to fail the whole request if just the calendar event fails
        }

        return new Response(
          JSON.stringify({ 
            message: existingAttendance ? 'Attendance updated' : 'Attendance recorded',
            attendance_id: attendanceId,
            calendar_event: calendarEvent || null
          }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in attendance API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
