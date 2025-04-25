
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';

interface ExportOptions {
  filename: string;
  sheetName?: string; // For Excel exports
  title?: string; // For PDF exports
  orientation?: 'portrait' | 'landscape'; // For PDF exports
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToExcel = (data: any[], options: ExportOptions) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Data');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, `${options.filename}.xlsx`);
    toast.success('File Excel berhasil diunduh');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    toast.error('Gagal mengunduh file Excel');
  }
};

export const exportToCSV = (data: any[], options: ExportOptions) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${options.filename}.csv`);
    toast.success('File CSV berhasil diunduh');
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    toast.error('Gagal mengunduh file CSV');
  }
};

export const exportToPDF = (data: any[], headers: string[], options: ExportOptions) => {
  try {
    const doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title if provided
    if (options.title) {
      doc.text(options.title, 14, 15);
    }
    
    // Convert data to format expected by autoTable
    const tableData = data.map(item => 
      headers.map(header => item[header] !== undefined ? 
        (typeof item[header] === 'number' ? 
          item[header].toLocaleString('id-ID') : 
          item[header]) : '')
    );
    
    // Define column headers for the table
    const columnHeaders = headers.map(header => {
      // Convert camelCase or snake_case to Title Case
      const title = header
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      
      return { header: title, dataKey: header };
    });
    
    doc.autoTable({
      head: [columnHeaders.map(col => col.header)],
      body: tableData,
      startY: options.title ? 25 : 15,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: 'bold'
      },
    });
    
    doc.save(`${options.filename}.pdf`);
    toast.success('File PDF berhasil diunduh');
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    toast.error('Gagal mengunduh file PDF');
  }
};
