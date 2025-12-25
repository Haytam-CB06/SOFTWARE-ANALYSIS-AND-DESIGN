/**
 * Excel Export Utility
 * Browser-compatible file export (CSV format)
 */

// Types
interface ExcelData {
  data: any[][];
  sheetName?: string;
  fileName?: string;
  columnWidths?: number[];
}

/**
 * Export data to Excel-compatible CSV file
 * This avoids xlsx library issues in browser environments
 */
export async function exportToExcel({
  data,
  sheetName = 'Sheet1',
  fileName = 'export.xlsx',
  columnWidths = []
}: ExcelData): Promise<void> {
  // Use CSV format which is Excel-compatible and more reliable in browsers
  const csvFileName = fileName.replace('.xlsx', '.csv');
  return exportToCSV({ data, fileName: csvFileName });
}

/**
 * Fallback CSV export method
 */
export function exportToCSV({ data, fileName = 'export.csv' }: { data: any[][], fileName?: string }): Promise<void> {
  try {
    // Convert data to CSV format
    const csvContent = data.map(row => 
      row.map(cell => {
        // Handle cells with commas, quotes, or newlines
        const cellStr = String(cell ?? '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return Promise.resolve();
  } catch (error) {
    console.error('CSV export error:', error);
    return Promise.reject(error);
  }
}

/**
 * Check if Excel export is available
 */
export function isExcelExportAvailable(): boolean {
  return typeof window !== 'undefined';
}
