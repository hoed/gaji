
/**
 * Supabase Schema Functions and Database Utility Functions
 * 
 * This file contains helper functions for interacting with the Gaji Kita Selaras database.
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch department list
 * @returns {Promise<Array>} List of departments
 */
export async function fetchDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
}

/**
 * Fetch positions list, optionally filtered by department
 * @param {string} departmentId - Optional department ID to filter by
 * @returns {Promise<Array>} List of positions
 */
export async function fetchPositions(departmentId = null) {
  let query = supabase
    .from('positions')
    .select('*, departments(name)');
  
  if (departmentId) {
    query = query.eq('department_id', departmentId);
  }
  
  const { data, error } = await query.order('title');
  
  if (error) throw error;
  return data;
}

/**
 * Fetch employees list with department and position details
 * @returns {Promise<Array>} List of employees with details
 */
export async function fetchEmployees() {
  const { data, error } = await supabase
    .from('employee_summary')
    .select('*')
    .order('full_name');
  
  if (error) throw error;
  return data;
}

/**
 * Fetch attendance data for a specific month
 * @param {string} year - Year in YYYY format
 * @param {string} month - Month in MM format
 * @returns {Promise<Array>} Attendance data for the month
 */
export async function fetchMonthlyAttendance(year, month) {
  const startDate = `${year}-${month}-01`;
  const nextMonth = parseInt(month) + 1;
  const nextYear = parseInt(year) + (nextMonth > 12 ? 1 : 0);
  const endMonth = nextMonth > 12 ? '01' : nextMonth.toString().padStart(2, '0');
  const endDate = `${nextMonth > 12 ? nextYear : year}-${endMonth}-01`;
  
  const { data, error } = await supabase
    .from('attendance')
    .select('*, employees(first_name, last_name)')
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date');
  
  if (error) throw error;
  return data;
}

/**
 * Fetch attendance summary data
 * @param {string} year - Year in YYYY format
 * @param {string} month - Month in MM format
 * @returns {Promise<Array>} Attendance summary data
 */
export async function fetchAttendanceSummary(year, month) {
  const startDate = `${year}-${month}-01`;
  
  const { data, error } = await supabase
    .from('attendance_summary')
    .select('*')
    .eq('month', startDate);
  
  if (error) throw error;
  return data;
}

/**
 * Fetch payroll data for a specific period
 * @param {string} startDate - Period start date in YYYY-MM-DD format
 * @param {string} endDate - Period end date in YYYY-MM-DD format
 * @returns {Promise<Array>} Payroll data for the period
 */
export async function fetchPayrollData(startDate, endDate) {
  const { data, error } = await supabase
    .from('payroll_summary')
    .select('*')
    .gte('period_start', startDate)
    .lte('period_end', endDate);
  
  if (error) throw error;
  return data;
}

/**
 * Calculate PPh 21 tax
 * @param {number} grossSalary - Gross salary amount
 * @param {string} taxStatus - Tax status (TK/0, K/0, K/1, etc.)
 * @returns {Promise<number>} Calculated PPh 21 amount
 */
export async function calculatePph21(grossSalary, taxStatus) {
  const { data, error } = await supabase
    .rpc('calculate_pph21', { gross_salary: grossSalary, tax_status: taxStatus });
  
  if (error) throw error;
  return data;
}

/**
 * Calculate BPJS Kesehatan contributions
 * @param {number} salary - Base salary amount
 * @returns {Promise<Object>} Object containing employee and company contributions
 */
export async function calculateBpjsKesehatan(salary) {
  const { data, error } = await supabase
    .rpc('calculate_bpjs_kesehatan', { salary: salary });
  
  if (error) throw error;
  return data;
}

/**
 * Calculate BPJS Ketenagakerjaan contributions
 * @param {number} salary - Base salary amount
 * @returns {Promise<Object>} Object containing all BPJS Ketenagakerjaan components
 */
export async function calculateBpjsKetenagakerjaan(salary) {
  const { data, error } = await supabase
    .rpc('calculate_bpjs_ketenagakerjaan', { salary: salary });
  
  if (error) throw error;
  return data;
}

/**
 * Upload attendance data in bulk
 * @param {Array} attendanceData - Array of attendance records
 * @returns {Promise<Object>} Result of the bulk insert operation
 */
export async function uploadAttendanceData(attendanceData) {
  const { data, error } = await supabase
    .from('attendance')
    .upsert(attendanceData, { onConflict: 'employee_id,date' });
  
  if (error) throw error;
  return data;
}

/**
 * Process and validate CSV/Excel attendance data
 * @param {Array} rows - Rows from the CSV/Excel file
 * @returns {Object} Validated data and any errors found
 */
export function processAttendanceImport(rows) {
  const validRecords = [];
  const errors = [];
  
  // Process each row
  rows.forEach((row, index) => {
    // Skip empty rows or comment rows
    if (!row.NIK || row.NIK.startsWith('#')) return;
    
    try {
      // Basic validation
      if (!row.NIK || !row.Tanggal || !row.Status) {
        errors.push(`Row ${index + 1}: Missing required fields`);
        return;
      }
      
      // Format date and times
      const date = new Date(row.Tanggal);
      if (isNaN(date.getTime())) {
        errors.push(`Row ${index + 1}: Invalid date format`);
        return;
      }
      
      let checkIn = null;
      let checkOut = null;
      
      if (row['Jam Masuk']) {
        const [hours, minutes, seconds] = row['Jam Masuk'].split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes) || (seconds !== undefined && isNaN(seconds))) {
          errors.push(`Row ${index + 1}: Invalid check-in time format`);
        } else {
          const checkInDate = new Date(date);
          checkInDate.setHours(hours, minutes, seconds || 0);
          checkIn = checkInDate.toISOString();
        }
      }
      
      if (row['Jam Keluar']) {
        const [hours, minutes, seconds] = row['Jam Keluar'].split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes) || (seconds !== undefined && isNaN(seconds))) {
          errors.push(`Row ${index + 1}: Invalid check-out time format`);
        } else {
          const checkOutDate = new Date(date);
          checkOutDate.setHours(hours, minutes, seconds || 0);
          checkOut = checkOutDate.toISOString();
        }
      }
      
      // Validate status
      const validStatuses = ['present', 'absent', 'sick', 'leave'];
      if (!validStatuses.includes(row.Status)) {
        errors.push(`Row ${index + 1}: Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        return;
      }
      
      // Add to valid records
      validRecords.push({
        nik: row.NIK,
        employee_name: row.Nama,
        date: date.toISOString().split('T')[0],
        check_in: checkIn,
        check_out: checkOut,
        status: row.Status,
        notes: row.Catatan || null
      });
      
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error.message}`);
    }
  });
  
  return {
    validRecords,
    errors,
    totalRows: rows.length,
    validRowCount: validRecords.length,
    errorCount: errors.length
  };
}
