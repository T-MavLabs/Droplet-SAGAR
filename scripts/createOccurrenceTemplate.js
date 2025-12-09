const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Column names from the occurrence file
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

// Create workbook
const wb = XLSX.utils.book_new();

// Create worksheet with headers
const ws = XLSX.utils.aoa_to_sheet([columnHeaders]);

// Set column widths for better readability
const colWidths = columnHeaders.map(() => ({ wch: 20 }));
ws['!cols'] = colWidths;

// Append worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Occurrence Data');

// Ensure templates directory exists
const templatesDir = path.join(__dirname, '..', 'public', 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Write file
const outputPath = path.join(templatesDir, 'occurrence_template.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ Template created successfully at: ${outputPath}`);
console.log(`📊 Total columns: ${columnHeaders.length}`);

