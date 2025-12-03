// File management utility for saving and loading Excel files
const STORAGE_KEY = 'sagar_data_entries';

export const saveEntry = (filename, data, qualityReport = null) => {
  try {
    const entries = getEntries();
    const entry = {
      id: Date.now().toString(),
      filename: filename || `Entry_${new Date().toISOString().split('T')[0]}.xlsx`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: data,
      rowCount: data.rows ? data.rows.length : 0,
      columnCount: data.columns ? data.columns.length : 0,
      qualityReport: qualityReport || null,
      ingested: qualityReport ? true : false,
      ingestedAt: qualityReport ? new Date().toISOString() : null
    };
    
    // Check if file already exists (update) or create new
    const existingIndex = entries.findIndex(e => e.filename === entry.filename);
    if (existingIndex >= 0) {
      entries[existingIndex] = { 
        ...entries[existingIndex], 
        ...entry,
        // Preserve quality report if updating without new one
        qualityReport: qualityReport || entries[existingIndex].qualityReport,
        ingested: qualityReport ? true : entries[existingIndex].ingested,
        ingestedAt: qualityReport ? new Date().toISOString() : entries[existingIndex].ingestedAt
      };
    } else {
      entries.push(entry);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return entry;
  } catch (error) {
    console.error('Error saving entry:', error);
    throw error;
  }
};

export const getEntries = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading entries:', error);
    return [];
  }
};

export const getEntry = (id) => {
  const entries = getEntries();
  return entries.find(e => e.id === id);
};

export const deleteEntry = (id) => {
  try {
    const entries = getEntries();
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting entry:', error);
    return false;
  }
};

export const updateEntry = (id, updates) => {
  try {
    const entries = getEntries();
    const index = entries.findIndex(e => e.id === id);
    if (index >= 0) {
      entries[index] = {
        ...entries[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      return entries[index];
    }
    return null;
  } catch (error) {
    console.error('Error updating entry:', error);
    return null;
  }
};

/**
 * Rename an entry file
 * @param {string} oldFilename - The old filename
 * @param {string} newFilename - The new filename
 * @returns {Promise<{success: boolean, entry?: Object, error?: string}>}
 */
export const renameEntry = (oldFilename, newFilename) => {
  try {
    const entries = getEntries();
    const entryIndex = entries.findIndex(e => e.filename === oldFilename);
    
    if (entryIndex === -1) {
      return { success: false, error: 'Entry not found' };
    }

    if (oldFilename === newFilename) {
      return { success: true, entry: entries[entryIndex] }; // No change needed
    }

    // Check if new filename already exists
    const existingEntry = entries.find(e => e.filename === newFilename);
    if (existingEntry) {
      return { success: false, error: 'A file with this name already exists' };
    }

    // Update the entry
    entries[entryIndex] = {
      ...entries[entryIndex],
      filename: newFilename,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return { success: true, entry: entries[entryIndex] };
  } catch (error) {
    console.error('Error renaming entry:', error);
    return { success: false, error: error.message };
  }
};
