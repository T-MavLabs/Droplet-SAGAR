// Supabase service for syncing data entry files with Supabase
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Singleton pattern to prevent multiple Supabase client instances
let supabase = null;

/**
 * Get or create Supabase client instance (singleton)
 * @returns {Object|null} Supabase client or null if not configured
 */
const getSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false, // Don't persist auth session for data entry app
        autoRefreshToken: false
      }
    });
  }
  
  return supabase;
};

/**
 * Convert spreadsheet data to Excel file buffer
 * @param {Array} columns - Column definitions
 * @param {Array} rows - Row data
 * @returns {Blob} Excel file blob
 */
const convertToExcelBlob = (columns, rows) => {
  // Prepare data for export
  const exportData = rows.map(row => {
    const exportRow = {};
    columns.forEach(col => {
      exportRow[col.name] = row[col.key] || '';
    });
    return exportRow;
  });

  // Create workbook
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  // Convert to buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
};

/**
 * Upload Excel file to Supabase raw-uploads storage bucket
 * @param {string} filename - The filename
 * @param {Array} columns - Column definitions
 * @param {Array} rows - Row data
 * @returns {Promise<{success: boolean, filePath?: string, error?: string}>}
 */
export const uploadFileToSupabase = async (filename, columns, rows) => {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    console.warn('Supabase not configured. File will only be saved locally.');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Convert data to Excel blob
    const excelBlob = convertToExcelBlob(columns, rows);
    
    // Convert blob to File object
    const excelFile = new File([excelBlob], filename, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Upload to raw-uploads bucket
    // Use filename as-is (Supabase handles encoding internally)
    const filePath = `data-entry/${filename}`;
    
    const { data, error } = await supabaseClient.storage
      .from('raw-uploads')
      .upload(filePath, excelFile, {
        cacheControl: '3600',
        upsert: true, // Overwrite if file exists
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

    if (error) {
      console.error('Error uploading file to Supabase:', error);
      
      // Provide helpful error message for RLS policy issues
      if (error.message && error.message.includes('row-level security')) {
        return { 
          success: false, 
          error: 'Storage bucket RLS policy not configured. Please run supabase_storage_policies.sql in Supabase SQL Editor.' 
        };
      }
      
      return { success: false, error: error.message };
    }

    return { success: true, filePath: data.path };
  } catch (error) {
    console.error('Error uploading file to Supabase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync notes to Supabase for a specific file in Droplet_Notes table
 * @param {string} filename - The filename to sync notes for
 * @param {string} notes - The notes content
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const syncNotesToSupabase = async (filename, notes) => {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    console.warn('Supabase not configured. Notes will only be saved locally.');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Check if notes record exists for this filename
    const { data: existingData, error: searchError } = await supabaseClient
      .from('droplet_notes')
      .select('id, filename, notes, updated_at')
      .eq('filename', filename)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle not found gracefully

    if (searchError) {
      console.error('Error searching for notes in Supabase:', searchError);
      return { success: false, error: searchError.message };
    }

    if (existingData) {
      // Update existing notes record
      const { error: updateError } = await supabaseClient
        .from('droplet_notes')
        .update({
          notes: notes || '', // Ensure notes is never null
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id);

      if (updateError) {
        console.error('Error updating notes in Supabase:', updateError);
        console.error('Update error details:', JSON.stringify(updateError, null, 2));
        return { success: false, error: updateError.message };
      }

      console.log('Notes updated successfully in Droplet_Notes table');
      return { success: true };
    } else {
      // Create new notes record
      const { error: insertError } = await supabaseClient
        .from('droplet_notes')
        .insert({
          filename: filename,
          notes: notes || '', // Ensure notes is never null
          device_name: 'Droplet',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating notes record in Supabase:', insertError);
        console.error('Insert error details:', JSON.stringify(insertError, null, 2));
        return { success: false, error: insertError.message };
      }

      console.log('Notes created successfully in Droplet_Notes table');
      return { success: true };
    }
  } catch (error) {
    console.error('Error syncing notes to Supabase:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return { success: false, error: error.message };
  }
};

/**
 * Get notes from Supabase for a specific file
 * @param {string} filename - The filename to get notes for
 * @returns {Promise<{success: boolean, notes?: string, error?: string}>}
 */
export const getNotesFromSupabase = async (filename) => {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabaseClient
      .from('droplet_notes')
      .select('notes')
      .eq('filename', filename)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - return empty notes
        return { success: true, notes: '' };
      }
      console.error('Error getting notes from Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notes: data?.notes || '' };
  } catch (error) {
    console.error('Error getting notes from Supabase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update filename in Supabase when filename is edited in the app
 * Updates Droplet_Notes table and renames file in raw-uploads bucket
 * @param {string} oldFilename - The old filename
 * @param {string} newFilename - The new filename
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateFilenameInSupabase = async (oldFilename, newFilename) => {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    console.warn('Supabase not configured. Filename will only be updated locally.');
    return { success: false, error: 'Supabase not configured' };
  }

  if (oldFilename === newFilename) {
    return { success: true }; // No change needed
  }

  try {
    // Update Droplet_Notes table
    const { data: notesRecords, error: notesSearchError } = await supabaseClient
      .from('droplet_notes')
      .select('id')
      .eq('filename', oldFilename);

    if (notesSearchError && notesSearchError.code !== 'PGRST116') {
      console.error('Error searching for notes in Supabase:', notesSearchError);
    } else if (notesRecords && notesRecords.length > 0) {
      // Update all notes records with the old filename
      const notesUpdatePromises = notesRecords.map(record =>
        supabaseClient
          .from('droplet_notes')
          .update({
            filename: newFilename,
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id)
      );

      const notesResults = await Promise.all(notesUpdatePromises);
      const notesHasError = notesResults.some(result => result.error);
      if (notesHasError) {
        console.error('Error updating filename in Droplet_Notes:', notesResults.filter(r => r.error));
      }
    }

    // Rename file in raw-uploads bucket
    const oldFilePath = `data-entry/${oldFilename}`;
    const newFilePath = `data-entry/${newFilename}`;
    
    // Try to copy file to new location (this will fail if file doesn't exist, which is okay)
    const { error: copyError } = await supabaseClient.storage
      .from('raw-uploads')
      .copy(oldFilePath, newFilePath);

    if (!copyError) {
      // Successfully copied, now delete old file
      const { error: deleteError } = await supabaseClient.storage
        .from('raw-uploads')
        .remove([oldFilePath]);
      
      if (deleteError) {
        console.error('Error deleting old file from Supabase storage:', deleteError);
        // Continue anyway - file was copied successfully
      } else {
        console.log(`File renamed in Supabase storage: ${oldFilename} -> ${newFilename}`);
      }
    } else {
      // File might not exist in storage yet, or copy failed
      console.warn('Could not rename file in Supabase storage (file may not exist):', copyError.message);
      // Continue anyway - notes update succeeded
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating filename in Supabase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync file data to Supabase (upload to raw-uploads bucket and sync notes)
 * @param {string} filename - The filename
 * @param {Object} data - The file data (columns, rows, notes)
 * @param {Object} qualityReport - Optional quality report (not stored, just for reference)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const syncFileDataToSupabase = async (filename, data, qualityReport = null) => {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    console.warn('Supabase not configured. File will only be saved locally.');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Upload Excel file to raw-uploads bucket
    const uploadResult = await uploadFileToSupabase(filename, data.columns, data.rows);
    
    if (!uploadResult.success) {
      console.error('File upload failed:', uploadResult.error);
      // Continue to try notes sync even if file upload fails
    }

    // Sync notes to Droplet_Notes table (always try, even if notes is empty string)
    const notesResult = await syncNotesToSupabase(filename, data.notes || '');
    
    if (!notesResult.success) {
      console.error('Notes sync failed:', notesResult.error);
      // Return error if notes sync fails
      return { 
        success: false, 
        error: `File ${uploadResult.success ? 'uploaded' : 'upload failed'}, but notes sync failed: ${notesResult.error}` 
      };
    }

    // Return success if file uploaded and notes synced
    if (uploadResult.success && notesResult.success) {
      return { success: true, filePath: uploadResult.filePath };
    } else if (notesResult.success) {
      // Notes synced but file upload failed
      return { success: true, filePath: null, warning: 'Notes synced but file upload failed' };
    } else {
      return { success: false, error: 'Both file upload and notes sync failed' };
    }
  } catch (error) {
    console.error('Error syncing file data to Supabase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if Supabase is configured
 * @returns {boolean}
 */
export const isSupabaseConfigured = () => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};
