import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FiArrowLeft, FiUpload, FiMenu, FiX, FiSave, FiFileText, FiFile, FiEdit3, FiCheck, FiEdit2 } from 'react-icons/fi';
import './Spreadsheet.css';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { ingestData } from '../services/ingestionService';
import { syncNotesToSupabase, updateFilenameInSupabase, syncFileDataToSupabase, uploadFileToSupabase } from '../services/supabaseService';
import { renameEntry } from '../utils/fileManager';
import VirtualKeyboard from './VirtualKeyboard';

const Spreadsheet = ({ entry, onBack, onSave }) => {
  const [columns, setColumns] = useState([
    { key: 'col1', name: 'Column 1', editable: true, width: 150 }
  ]);
  const [rows, setRows] = useState([{}]);
  const [filename, setFilename] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredColumnIndex, setHoveredColumnIndex] = useState(null);
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null);
  const [showColumnMenu, setShowColumnMenu] = useState(null);
  const [showRowMenu, setShowRowMenu] = useState(null);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardTarget, setKeyboardTarget] = useState(null); // 'notes' or 'cell'
  const [previousFilename, setPreviousFilename] = useState(''); // Track filename changes for Supabase sync
  const [isRenaming, setIsRenaming] = useState(false); // Track if user is renaming
  const [activeInput, setActiveInput] = useState(null); // Track which input is currently active: 'filename', 'cell', 'header', 'notes', or null
  const inputRef = useRef(null);
  const spreadsheetRef = useRef(null);
  const notesRef = useRef(null);
  const filenameInputRef = useRef(null);

  // Load entry data if provided
  useEffect(() => {
    if (entry && entry.data) {
      setColumns(entry.data.columns || [{ key: 'col1', name: 'Column 1', editable: true, width: 70 }]);
      setRows(entry.data.rows || [{}]);
      const entryFilename = entry.filename || '';
      setFilename(entryFilename);
      setPreviousFilename(entryFilename); // Track original filename for Supabase sync
      setNotes(entry.data.notes || ''); // Load notes if they exist
    } else {
      const defaultFilename = `Entry_${new Date().toISOString().split('T')[0]}.xlsx`;
      setFilename(defaultFilename);
      setPreviousFilename(defaultFilename);
      setNotes('');
    }
  }, [entry]);

  // Initialize with empty row
  useEffect(() => {
    if (rows.length === 0) {
      setRows([{}]);
    }
  }, [rows.length]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.hamburger-menu') && !event.target.closest('.menu-btn')) {
        setShowMenu(false);
      }
      if (showColumnMenu !== null && !event.target.closest('.column-add-menu') && !event.target.closest('.add-col-btn')) {
        setShowColumnMenu(null);
      }
      if (showRowMenu !== null && !event.target.closest('.row-add-menu') && !event.target.closest('.add-row-btn')) {
        setShowRowMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, showColumnMenu, showRowMenu]);

  // Handle cell click
  const handleCellClick = (rowIndex, colKey) => {
    setSelectedCell({ rowIndex, colKey });
    const cellValue = rows[rowIndex]?.[colKey] || '';
    setEditingCell({ rowIndex, colKey });
    setEditValue(cellValue);
    
    // Show virtual keyboard for touch device
    setKeyboardTarget('cell');
    setShowKeyboard(true);
    
    // Focus input after a short delay for tablet
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 100);
  };

  // Handle cell value change
  const handleCellChange = (value) => {
    setEditValue(value);
    
    if (editingCell) {
      const newRows = [...rows];
      if (!newRows[editingCell.rowIndex]) {
        newRows[editingCell.rowIndex] = {};
      }
      newRows[editingCell.rowIndex][editingCell.colKey] = value;
      setRows(newRows);
    }
  };

  // Finish editing
  const finishEditing = () => {
    setEditingCell(null);
    setSelectedCell(null);
  };

  // Add new column at end
  const handleAddColumn = () => {
    const newColKey = `col${columns.length + 1}`;
    const newColumn = {
      key: newColKey,
      name: `Column ${columns.length + 1}`,
      editable: true,
      width: 70
    };
    setColumns([...columns, newColumn]);
  };

  // Add column at specific position
  const handleAddColumnAt = (position, colIndex) => {
    const newColKey = `col${Date.now()}`;
    const newColumn = {
      key: newColKey,
      name: `Column ${columns.length + 1}`,
      editable: true,
      width: 70
    };
    
    if (position === 'left') {
      const newColumns = [...columns];
      newColumns.splice(colIndex, 0, newColumn);
      setColumns(newColumns);
    } else if (position === 'right') {
      const newColumns = [...columns];
      newColumns.splice(colIndex + 1, 0, newColumn);
      setColumns(newColumns);
    }
    setShowColumnMenu(null);
  };

  // Delete column
  const handleDeleteColumn = (colKey) => {
    if (columns.length <= 1) {
      alert('Cannot delete the last column!');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this column? All data in this column will be lost.')) {
      return;
    }
    
    const newColumns = columns.filter(col => col.key !== colKey);
    setColumns(newColumns);
    
    // Remove data for this column from all rows
    const newRows = rows.map(row => {
      const newRow = { ...row };
      delete newRow[colKey];
      return newRow;
    });
    setRows(newRows);
    setSelectedColumn(null);
    setContextMenu(null);
  };

  // Rename column
  const handleRenameColumn = (colKey, newName) => {
    const newColumns = columns.map(col =>
      col.key === colKey ? { ...col, name: newName } : col
    );
    setColumns(newColumns);
  };

  // Add new row at end
  const handleAddRow = () => {
    setRows([...rows, {}]);
  };

  // Add row at specific position
  const handleAddRowAt = (position, rowIndex) => {
    const newRow = {};
    
    if (position === 'above') {
      const newRows = [...rows];
      newRows.splice(rowIndex, 0, newRow);
      setRows(newRows);
    } else if (position === 'below') {
      const newRows = [...rows];
      newRows.splice(rowIndex + 1, 0, newRow);
      setRows(newRows);
    }
    setShowRowMenu(null);
  };

  // Delete row
  const handleDeleteRow = (rowIndex) => {
    if (rows.length <= 1) {
      alert('Cannot delete the last row!');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this row? All data in this row will be lost.')) {
      return;
    }
    
    const newRows = rows.filter((_, index) => index !== rowIndex);
    setRows(newRows);
    setSelectedRowIndex(null);
    setContextMenu(null);
  };

  // Handle column header right-click
  const handleColumnRightClick = (e, colKey) => {
    e.preventDefault();
    setSelectedColumn(colKey);
    setContextMenu({
      type: 'column',
      x: e.clientX,
      y: e.clientY,
      colKey: colKey
    });
  };

  // Handle row index right-click
  const handleRowRightClick = (e, rowIndex) => {
    e.preventDefault();
    setSelectedRowIndex(rowIndex);
    setContextMenu({
      type: 'row',
      x: e.clientX,
      y: e.clientY,
      rowIndex: rowIndex
    });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Export to Excel
  const handleExportExcel = async () => {
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

    // Write file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const exportFilename = filename || 'sagar-data-entry.xlsx';
    saveAs(blob, exportFilename);

    // Save to file manager (notes preserved)
    if (onSave) {
      onSave(exportFilename, { columns, rows, notes });
      
      // Upload to Supabase raw-uploads bucket
      try {
        await uploadFileToSupabase(exportFilename, columns, rows);
        // Also sync notes
        if (notes) {
          await syncNotesToSupabase(exportFilename, notes);
        }
      } catch (error) {
        console.error('Error uploading to Supabase:', error);
      }
    }
  };

  // Export to CSV
  const handleExportCSV = async () => {
    // Prepare CSV header
    const headers = columns.map(col => col.name).join(',');
    
    // Prepare CSV rows
    const csvRows = rows.map(row => {
      return columns.map(col => {
        const value = row[col.key] || '';
        // Escape quotes and wrap in quotes if contains comma
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const exportFilename = filename.replace('.xlsx', '.csv') || 'sagar-data-entry.csv';
    saveAs(blob, exportFilename);

    // Save to file manager (notes preserved)
    if (onSave) {
      onSave(exportFilename, { columns, rows, notes });
      
      // Sync to Supabase
      try {
        await syncFileDataToSupabase(exportFilename, { columns, rows, notes });
      } catch (error) {
        console.error('Error syncing to Supabase:', error);
      }
    }
  };

  // Save current state
  const handleSave = async () => {
    if (onSave) {
      const saveFilename = filename || `Entry_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Save locally first
      onSave(saveFilename, { columns, rows, notes }); // Include notes in save
      
      // Sync to Supabase: Upload file to raw-uploads bucket and sync notes
      try {
        const result = await syncFileDataToSupabase(saveFilename, { columns, rows, notes });
        if (result.success) {
          alert('Entry saved successfully and synced to Supabase!');
        } else {
          alert(`Entry saved locally, but Supabase sync failed: ${result.error || 'Unknown error'}`);
          console.error('Supabase sync error:', result.error);
        }
      } catch (error) {
        console.error('Error syncing to Supabase:', error);
        alert(`Entry saved locally, but Supabase sync failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // Handle confirm rename (called by button or Enter key)
  const handleConfirmRename = async () => {
    const newFilename = filename.trim();
    if (newFilename && newFilename !== previousFilename) {
      await handleFilenameRename(newFilename);
      setIsRenaming(false);
      if (filenameInputRef.current) {
        filenameInputRef.current.blur();
      }
    } else if (!newFilename) {
      setFilename(previousFilename);
      setIsRenaming(false);
    } else {
      setIsRenaming(false);
    }
  };

  // Handle filename rename
  const handleFilenameRename = async (newFilename) => {
    if (!newFilename || newFilename.trim() === '') {
      alert('Filename cannot be empty');
      setFilename(previousFilename); // Revert to previous filename
      return;
    }

    // Ensure filename has .xlsx extension
    const finalFilename = newFilename.endsWith('.xlsx') ? newFilename : `${newFilename}.xlsx`;

    if (finalFilename === previousFilename) {
      // No change, just update the state
      setFilename(finalFilename);
      return;
    }

    try {
      // 1. Rename in local storage (find by filename, not ID, in case entry doesn't have ID yet)
      if (previousFilename && previousFilename.trim() !== '') {
        const renameResult = renameEntry(previousFilename, finalFilename);
        if (!renameResult.success) {
          // If rename failed because entry doesn't exist, that's okay for new files
          if (renameResult.error && !renameResult.error.includes('not found')) {
            alert(`Failed to rename: ${renameResult.error}`);
            setFilename(previousFilename); // Revert
            return;
          }
          // For new files that don't exist yet, continue with rename
        }
      }

      // 2. Update Supabase (notes table and storage bucket)
      if (previousFilename && previousFilename !== finalFilename) {
        const supabaseResult = await updateFilenameInSupabase(previousFilename, finalFilename);
        if (!supabaseResult.success) {
          console.error('Supabase rename error:', supabaseResult.error);
          // Continue anyway - local rename succeeded
          alert(`File renamed locally, but Supabase update failed: ${supabaseResult.error}`);
        } else {
          console.log(`File renamed successfully: ${previousFilename} -> ${finalFilename}`);
        }
      }

      // 3. Update state
      setFilename(finalFilename);
      setPreviousFilename(finalFilename);

      // 4. Update entry data if onSave is available (this will update the entry with new filename)
      if (onSave) {
        onSave(finalFilename, { columns, rows, notes });
      }

      alert('File renamed successfully! All references updated.');
    } catch (error) {
      console.error('Error renaming file:', error);
      alert(`Failed to rename file: ${error.message}`);
      setFilename(previousFilename); // Revert on error
    }
  };

  // Handle notes change
  const handleNotesChange = async (value) => {
    setNotes(value);
    // Auto-save notes with entry
    if (onSave) {
      const saveFilename = filename || `Entry_${new Date().toISOString().split('T')[0]}.xlsx`;
      onSave(saveFilename, { columns, rows, notes: value });
    }
    
    // Sync notes to Supabase
    if (filename) {
      try {
        await syncNotesToSupabase(filename, value);
      } catch (error) {
        console.error('Error syncing notes to Supabase:', error);
        // Don't show error to user, just log it - local save still works
      }
    }
  };

  // Handle virtual keyboard input
  const handleKeyboardInput = (char) => {
    if (char === 'backspace') {
      if (keyboardTarget === 'notes') {
        setNotes(prev => {
          const newNotes = prev.slice(0, -1);
          handleNotesChange(newNotes);
          return newNotes;
        });
      } else if (editingCell) {
        const newValue = editValue.slice(0, -1);
        setEditValue(newValue);
        handleCellChange(newValue);
      } else if (keyboardTarget === 'cell') {
        // Handle filename or header input
        const activeEl = document.activeElement;
        if (activeEl?.classList.contains('filename-input')) {
          setFilename(prev => prev.slice(0, -1));
        } else if (activeEl?.classList.contains('header-input')) {
          const colKey = activeEl?.dataset?.colKey;
          if (colKey) {
            const col = columns.find(c => c.key === colKey);
            if (col) {
              const newName = col.name.slice(0, -1);
              handleRenameColumn(colKey, newName);
            }
          }
        }
      }
    } else if (char === 'enter') {
      if (keyboardTarget === 'notes') {
        setNotes(prev => {
          const newNotes = prev + '\n';
          handleNotesChange(newNotes);
          return newNotes;
        });
      } else if (editingCell) {
        finishEditing();
        setShowKeyboard(false);
      }
    } else {
      if (keyboardTarget === 'notes') {
        setNotes(prev => {
          const newNotes = prev + char;
          handleNotesChange(newNotes);
          return newNotes;
        });
      } else if (editingCell) {
        const newValue = editValue + char;
        setEditValue(newValue);
        handleCellChange(newValue);
      } else if (keyboardTarget === 'cell') {
        // Handle filename or header input
        const activeEl = document.activeElement;
        if (activeEl?.classList.contains('filename-input')) {
          setFilename(prev => prev + char);
        } else if (activeEl?.classList.contains('header-input')) {
          const colKey = activeEl?.dataset?.colKey;
          if (colKey) {
            const col = columns.find(c => c.key === colKey);
            if (col) {
              handleRenameColumn(colKey, col.name + char);
            }
          }
        }
      }
    }
  };

  // Handle data ingestion
  const handleIngest = async () => {
    if (rows.length === 0 || rows.every(row => Object.keys(row).length === 0)) {
      alert('Please enter some data before ingesting!');
      return;
    }

    setIsIngesting(true);
    setIngestionStatus({ type: 'info', message: 'Converting data to CSV...' });

    try {
      const ingestFilename = filename.replace('.xlsx', '.csv') || `Entry_${new Date().toISOString().split('T')[0]}.csv`;
      setIngestionStatus({ type: 'info', message: 'Sending data to processing engine...' });

      const result = await ingestData(columns, rows, ingestFilename);

      if (result.success) {
        setIngestionStatus({ type: 'success', message: 'Data ingested successfully! Quality report generated.' });
        
        // Save entry with quality report (notes preserved)
        if (onSave) {
          const saveFilename = filename || `Entry_${new Date().toISOString().split('T')[0]}.xlsx`;
          onSave(saveFilename, { columns, rows, notes }, result.qualityReport);
          
          // Upload to Supabase raw-uploads bucket and sync notes
          try {
            await syncFileDataToSupabase(saveFilename, { columns, rows, notes });
          } catch (error) {
            console.error('Error syncing to Supabase:', error);
            // Continue even if Supabase sync fails
          }
        }

        // Show success message
        setTimeout(() => {
          setIngestionStatus(null);
          alert(`Data ingested successfully!\n\nQuality Score: ${result.qualityReport?.detailed_metrics?.overall_quality_score?.toFixed(1) || 'N/A'}%\nStatus: ${result.qualityReport?.summary?.quality_status || 'N/A'}`);
        }, 2000);
      } else {
        setIngestionStatus({ type: 'error', message: result.error || 'Failed to ingest data' });
        setTimeout(() => {
          setIngestionStatus(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Ingestion error:', error);
      setIngestionStatus({ type: 'error', message: error.message || 'An error occurred during ingestion' });
      setTimeout(() => {
        setIngestionStatus(null);
      }, 5000);
    } finally {
      setIsIngesting(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!selectedCell) return;

    const { rowIndex, colKey } = selectedCell;
    const colIndex = columns.findIndex(col => col.key === colKey);

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (rowIndex > 0) {
          handleCellClick(rowIndex - 1, colKey);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (rowIndex < rows.length - 1) {
          handleCellClick(rowIndex + 1, colKey);
        } else {
          handleAddRow();
          setTimeout(() => handleCellClick(rows.length, colKey), 100);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (colIndex > 0) {
          handleCellClick(rowIndex, columns[colIndex - 1].key);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (colIndex < columns.length - 1) {
          handleCellClick(rowIndex, columns[colIndex + 1].key);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (rowIndex < rows.length - 1) {
          handleCellClick(rowIndex + 1, colKey);
        } else {
          handleAddRow();
          setTimeout(() => handleCellClick(rows.length, colKey), 100);
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (colIndex > 0) {
            handleCellClick(rowIndex, columns[colIndex - 1].key);
          }
        } else {
          if (colIndex < columns.length - 1) {
            handleCellClick(rowIndex, columns[colIndex + 1].key);
          } else if (rowIndex < rows.length - 1) {
            handleCellClick(rowIndex + 1, columns[0].key);
          }
        }
        break;
      case 'Escape':
        finishEditing();
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (selectedColumn) {
          handleDeleteColumn(selectedColumn);
        } else if (selectedRowIndex !== null) {
          handleDeleteRow(selectedRowIndex);
        } else if (selectedCell && !editingCell) {
          // Delete cell content
          const newRows = [...rows];
          if (newRows[selectedCell.rowIndex]) {
            newRows[selectedCell.rowIndex][selectedCell.colKey] = '';
            setRows(newRows);
          }
        }
        break;
      default:
        break;
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Don't close keyboard on blur for touch devices - let user close manually
    // finishEditing();
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu && !e.target.closest('.context-menu') && !e.target.closest('.header-cell') && !e.target.closest('.index-cell')) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  return (
    <div 
      className={`spreadsheet-container ${showNotes ? 'notes-open' : ''} ${showKeyboard ? 'keyboard-open' : ''}`}
      ref={spreadsheetRef}
      onKeyDown={handleKeyDown}
      onClick={closeContextMenu}
      tabIndex={0}
    >
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          {onBack && (
            <button 
              className="toolbar-btn back-btn-icon" 
              onClick={onBack} 
              title="Back to Dashboard"
            >
              <FiArrowLeft className="icon" />
            </button>
          )}
          <div className="filename-input-wrapper">
            <div className="filename-input-container">
              <input
                ref={filenameInputRef}
                type="text"
                value={filename}
                onChange={(e) => {
                  // Allow editing in real-time
                  setFilename(e.target.value);
                  setIsRenaming(true);
                }}
                onBlur={async (e) => {
                  // Auto-rename on blur if changed
                  const newFilename = e.target.value.trim();
                  if (newFilename && newFilename !== previousFilename) {
                    await handleFilenameRename(newFilename);
                  } else if (!newFilename) {
                    // If empty, revert to previous
                    setFilename(previousFilename);
                  }
                  setIsRenaming(false);
                  setActiveInput(null);
                }}
                onKeyDown={(e) => {
                  // Handle Enter key to confirm rename
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirmRename();
                  }
                  // Handle Escape to cancel
                  if (e.key === 'Escape') {
                    setFilename(previousFilename);
                    setIsRenaming(false);
                    e.target.blur();
                  }
                }}
                onFocus={() => {
                  setKeyboardTarget('cell');
                  setShowKeyboard(true);
                  setIsRenaming(true);
                  setActiveInput('filename');
                }}
                className={`filename-input ${isRenaming ? 'editing' : ''}`}
                placeholder="Enter filename..."
                title="Click to rename file"
                readOnly
              />
              {activeInput === 'filename' && <span className="blinking-cursor">|</span>}
            </div>
          </div>
          <button 
            className="toolbar-btn menu-btn" 
            onClick={() => setShowMenu(!showMenu)}
            title="Menu"
          >
            {showMenu ? <FiX className="icon" /> : <FiMenu className="icon" />}
          </button>
        </div>
      </div>

      {/* Hamburger Menu */}
      {showMenu && (
        <div className="hamburger-menu">
          <div className="menu-section">
            <div className="menu-section-title">Data</div>
            <button className="menu-item" onClick={() => { handleAddColumn(); setShowMenu(false); }}>
              <span>➕</span> Add Column
            </button>
            <button className="menu-item" onClick={() => { handleAddRow(); setShowMenu(false); }}>
              <span>➕</span> Add Row
            </button>
          </div>
          <div className="menu-section">
            <div className="menu-section-title">Actions</div>
            <button 
              className="menu-item ingest-menu-item" 
              onClick={() => { handleIngest(); setShowMenu(false); }}
              disabled={isIngesting}
            >
              {isIngesting ? (
                <>
                  <span className="spinner"></span>
                  Ingesting...
                </>
              ) : (
                <>
                  <FiUpload className="icon" />
                  Ingest
                </>
              )}
            </button>
            <button className="menu-item" onClick={() => { handleSave(); setShowMenu(false); }}>
              <FiSave className="icon" />
              Save
            </button>
            <button className="menu-item" onClick={() => { handleExportExcel(); setShowMenu(false); }}>
              <FiFile className="icon" />
              Export Excel
            </button>
            <button className="menu-item" onClick={() => { handleExportCSV(); setShowMenu(false); }}>
              <FiFileText className="icon" />
              Export CSV
            </button>
            <button className="menu-item" onClick={() => { setShowNotes(!showNotes); setShowMenu(false); }}>
              <FiEdit3 className="icon" />
              {showNotes ? 'Hide Notes' : 'Show Notes'}
            </button>
            <button 
              className="menu-item" 
              onClick={() => { 
                setIsRenaming(true);
                setShowMenu(false);
                setTimeout(() => {
                  if (filenameInputRef.current) {
                    filenameInputRef.current.focus();
                    filenameInputRef.current.select();
                  }
                }, 100);
              }}
            >
              <FiEdit2 className="icon" />
              Rename File
            </button>
          </div>
        </div>
      )}

      {/* Ingestion Status */}
      {ingestionStatus && (
        <div className={`ingestion-status ${ingestionStatus.type}`}>
          <span>{ingestionStatus.message}</span>
        </div>
      )}

      {/* Spreadsheet */}
      <div className="spreadsheet-wrapper">
        <div className="spreadsheet">
          {/* Header Row */}
          <div className="header-row">
            <div className="header-cell index-cell">#</div>
            {columns.map((col, colIndex) => (
              <div 
                key={col.key} 
                className={`header-cell ${selectedColumn === col.key ? 'selected-column' : ''}`}
                onContextMenu={(e) => handleColumnRightClick(e, col.key)}
                onClick={() => {
                  setSelectedColumn(col.key);
                  setSelectedRowIndex(null);
                }}
                onMouseEnter={() => setHoveredColumnIndex(colIndex)}
                onMouseLeave={() => {
                  setHoveredColumnIndex(null);
                  setShowColumnMenu(null);
                }}
              >
                {/* Plus button for adding column */}
                {hoveredColumnIndex === colIndex && (
                  <div className="column-add-buttons">
                    <button
                      className="add-col-btn add-col-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowColumnMenu(colIndex);
                      }}
                      title="Add column"
                    >
                      +
                    </button>
                  </div>
                )}
                {showColumnMenu === colIndex && (
                  <div className="column-add-menu" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleAddColumnAt('left', colIndex)}>
                      Insert Left
                    </button>
                    <button onClick={() => handleAddColumnAt('right', colIndex)}>
                      Insert Right
                    </button>
                  </div>
                )}
                <div className="header-input-wrapper">
                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) => handleRenameColumn(col.key, e.target.value)}
                    onFocus={() => {
                      setKeyboardTarget('cell');
                      setShowKeyboard(true);
                      setActiveInput(`header-${col.key}`);
                    }}
                    onBlur={() => {
                      if (activeInput === `header-${col.key}`) {
                        setActiveInput(null);
                      }
                    }}
                    className="header-input editing"
                    placeholder="Column Name"
                    onClick={(e) => e.stopPropagation()}
                    data-col-key={col.key}
                    readOnly
                  />
                  {activeInput === `header-${col.key}` && <span className="blinking-cursor">|</span>}
                </div>
                {columns.length > 1 && (
                  <button
                    className="delete-col-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteColumn(col.key);
                    }}
                    title="Delete Column (or Right-click → Delete)"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {/* Add column button at the end */}
            <div 
              className="header-cell add-column-end"
              onMouseEnter={() => setHoveredColumnIndex(columns.length)}
              onMouseLeave={() => setHoveredColumnIndex(null)}
            >
              {hoveredColumnIndex === columns.length && (
                <button
                  className="add-col-btn-end"
                  onClick={handleAddColumn}
                  title="Add column"
                >
                  +
                </button>
              )}
            </div>
          </div>

          {/* Data Rows */}
          <div className="data-rows">
            {rows.map((row, rowIndex) => (
              <div 
                key={rowIndex} 
                className="data-row"
                onMouseEnter={() => setHoveredRowIndex(rowIndex)}
                onMouseLeave={() => {
                  setHoveredRowIndex(null);
                  setShowRowMenu(null);
                }}
              >
                {/* Plus button for adding row */}
                {hoveredRowIndex === rowIndex && (
                  <div className="row-add-buttons">
                    <button
                      className="add-row-btn add-row-above"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRowMenu(rowIndex);
                      }}
                      title="Add row"
                    >
                      +
                    </button>
                  </div>
                )}
                {showRowMenu === rowIndex && (
                  <div className="row-add-menu" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleAddRowAt('above', rowIndex)}>
                      Insert Above
                    </button>
                    <button onClick={() => handleAddRowAt('below', rowIndex)}>
                      Insert Below
                    </button>
                  </div>
                )}
                <div 
                  className={`index-cell ${selectedRowIndex === rowIndex ? 'selected-row' : ''}`}
                  onContextMenu={(e) => handleRowRightClick(e, rowIndex)}
                  onClick={() => {
                    setSelectedRowIndex(rowIndex);
                    setSelectedColumn(null);
                  }}
                >
                  <span>{rowIndex + 1}</span>
                  {rows.length > 1 && (
                    <button
                      className="delete-row-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRow(rowIndex);
                      }}
                      title="Delete Row (or Right-click → Delete)"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {columns.map((col) => {
                  const cellKey = `${rowIndex}-${col.key}`;
                  const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colKey === col.key;
                  const isSelected = selectedCell?.rowIndex === rowIndex && selectedCell?.colKey === col.key;
                  const cellValue = row[col.key] || '';

                  return (
                    <div
                      key={col.key}
                      className={`data-cell ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
                      onClick={() => handleCellClick(rowIndex, col.key)}
                    >
                      {isEditing ? (
                        <div className="cell-input-wrapper">
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => handleCellChange(e.target.value)}
                            onBlur={() => {
                              handleInputBlur();
                              setActiveInput(null);
                            }}
                            onFocus={() => {
                              setKeyboardTarget('cell');
                              setShowKeyboard(true);
                              setActiveInput(`cell-${rowIndex}-${col.key}`);
                            }}
                            className="cell-input editing"
                            autoFocus
                            readOnly // Prevent native keyboard, use virtual keyboard
                          />
                          {activeInput === `cell-${rowIndex}-${col.key}` && <span className="blinking-cursor">|</span>}
                        </div>
                      ) : (
                        <span className="cell-content">{cellValue}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            {/* Add row button at the end */}
            <div 
              className="data-row add-row-end"
              onMouseEnter={() => setHoveredRowIndex(rows.length)}
              onMouseLeave={() => setHoveredRowIndex(null)}
            >
              <div className="index-cell add-row-end-index">
                {hoveredRowIndex === rows.length && (
                  <button
                    className="add-row-btn-end"
                    onClick={handleAddRow}
                    title="Add row"
                  >
                    +
                  </button>
                )}
              </div>
              {columns.map((col, idx) => (
                <div key={`empty-${rows.length}-${col.key}-${idx}`} className="data-cell empty-cell"></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notes Panel */}
      {showNotes && (
        <div className="notes-panel">
          <div className="notes-panel-header">
            <h3 className="notes-title">Notes</h3>
            <button 
              className="notes-close-btn"
              onClick={() => setShowNotes(false)}
              title="Close Notes"
            >
              <FiX className="icon" />
            </button>
          </div>
          <div className="notes-textarea-wrapper">
            <textarea
              ref={notesRef}
              className="notes-textarea editing"
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              onFocus={() => {
                setKeyboardTarget('notes');
                setShowKeyboard(true);
                setActiveInput('notes');
              }}
              onBlur={() => {
                setActiveInput(null);
              }}
              placeholder="Add notes about this data entry... (Notes are saved with the file but excluded from ingestion)"
              readOnly
            />
            {activeInput === 'notes' && <span className="blinking-cursor notes-cursor">|</span>}
          </div>
          <div className="notes-footer">
            <span className="notes-info">Notes are saved with the file but excluded from data ingestion</span>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'column' && (
            <div className="context-menu-item" onClick={() => handleDeleteColumn(contextMenu.colKey)}>
              🗑️ Delete Column
            </div>
          )}
          {contextMenu.type === 'row' && (
            <div className="context-menu-item" onClick={() => handleDeleteRow(contextMenu.rowIndex)}>
              🗑️ Delete Row
            </div>
          )}
          <div className="context-menu-item" onClick={closeContextMenu}>
            Cancel
          </div>
        </div>
      )}

      {/* Virtual Keyboard */}
      <VirtualKeyboard
        visible={showKeyboard}
        onInput={handleKeyboardInput}
        onClose={() => setShowKeyboard(false)}
      />
    </div>
  );
};

export default Spreadsheet;
