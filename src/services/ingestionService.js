// Service to handle data ingestion to DataProcessingEngine
// API endpoint: http://localhost:8000/process-csv (or from env)

const API_BASE_URL = process.env.REACT_APP_PROCESSING_API_URL || 'https://dataprocessingengine-sagar.onrender.com';

/**
 * Convert spreadsheet data to CSV format
 */
export const convertToCSV = (columns, rows) => {
  // Create header row
  const headers = columns.map(col => col.name);
  const headerRow = headers.join(',');
  
  // Create data rows
  const dataRows = rows.map(row => {
    return headers.map(header => {
      const colKey = columns.find(c => c.name === header)?.key;
      const value = row[colKey] || '';
      // Escape quotes and wrap in quotes if contains comma, newline, or quotes
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${String(value).replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  // Combine header and data
  const csvContent = [headerRow, ...dataRows].join('\n');
  return csvContent;
};

/**
 * Convert CSV string to Blob for file upload
 */
export const csvToBlob = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  return new File([blob], filename || 'data-entry.csv', { type: 'text/csv' });
};

/**
 * Send CSV file to DataProcessingEngine API
 */
export const ingestData = async (columns, rows, filename) => {
  try {
    // Convert to CSV
    const csvContent = convertToCSV(columns, rows);
    const csvFile = csvToBlob(csvContent, filename);
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', csvFile);
    
    // Send to API
    const response = await fetch(`${API_BASE_URL}/process-csv`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      data: result,
      qualityReport: result.quality_report,
      metadata: result.metadata,
      processedFile: result.processed_file
    };
  } catch (error) {
    console.error('Ingestion error:', error);
    return {
      success: false,
      error: error.message || 'Failed to ingest data'
    };
  }
};

/**
 * Check if DataProcessingEngine API is available
 */
export const checkAPIHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      return { available: true, data };
    }
    return { available: false };
  } catch (error) {
    return { available: false, error: error.message };
  }
};
