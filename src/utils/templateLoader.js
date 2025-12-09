import * as XLSX from 'xlsx';

/**
 * Load occurrence template columns
 * @returns {Array} Array of column definitions
 */
export const loadOccurrenceTemplate = () => {
  const columnHeaders = [
    'id',
    'institutionCode',
    'collectionCode',
    'ownerInstitutionCode',
    'basisOfRecord',
    'occurrenceID',
    'catalogNumber',
    'individualCount',
    'sex',
    'lifeStage',
    'occurrenceStatus',
    'eventID',
    'eventDate',
    'eventTime',
    'habitat',
    'samplingProtocol',
    'waterBody',
    'country',
    'locality',
    'minimumDepthInMeters',
    'maximumDepthInMeters',
    'decimalLatitude',
    'decimalLongitude',
    'identificationQualifier',
    'typeStatus',
    'identifiedBy',
    'dateIdentified',
    'identificationReferences',
    'scientificNameID',
    'scientificName'
  ];

  // Convert to column format used by Spreadsheet
  return columnHeaders.map((name, index) => ({
    key: `col${index + 1}`,
    name: name,
    editable: true,
    width: 150
  }));
};

/**
 * Load template from XLSX file
 * @param {string} templatePath - Path to template file
 * @returns {Promise<{columns: Array, rows: Array}>}
 */
export const loadTemplateFromFile = async (templatePath) => {
  try {
    const response = await fetch(templatePath);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) {
      return { columns: [], rows: [] };
    }
    
    // First row is headers
    const headers = jsonData[0];
    const columns = headers.map((name, index) => ({
      key: `col${index + 1}`,
      name: name || `Column ${index + 1}`,
      editable: true,
      width: 150
    }));
    
    // Rest are rows
    const rows = jsonData.slice(1).map(row => {
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[`col${index + 1}`] = row[index] || '';
      });
      return rowData;
    });
    
    return { columns, rows: rows.length > 0 ? rows : [{}] };
  } catch (error) {
    console.error('Error loading template:', error);
    throw error;
  }
};

/**
 * Available templates
 */
export const TEMPLATES = [
  {
    id: 'occurrence',
    name: 'Occurrence Data',
    description: 'Template for biodiversity occurrence records',
    load: loadOccurrenceTemplate
  },
  {
    id: 'blank',
    name: 'Blank Sheet',
    description: 'Start with a blank spreadsheet',
    load: () => [{ key: 'col1', name: 'Column 1', editable: true, width: 150 }]
  }
];

