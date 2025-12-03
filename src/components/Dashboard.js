import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiFile, FiCalendar, FiTrash2, FiEdit3, FiArrowRight, FiLogOut } from 'react-icons/fi';
import { getEntries, deleteEntry } from '../utils/fileManager';
import EntryCard from './EntryCard';
import QualityReport from './QualityReport';
import './Dashboard.css';

const Dashboard = ({ onSelectEntry, onNewEntry, onBack }) => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = () => {
    setIsLoading(true);
    const allEntries = getEntries();
    // Sort by updated date, newest first
    const sorted = allEntries.sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    setEntries(sorted);
    setIsLoading(false);
  };

  const handleDelete = (id, filename) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      if (deleteEntry(id)) {
        loadEntries();
      }
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <motion.div 
            className="header-left"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="header-logo">
              <FiFile className="logo-icon" />
              <span className="logo-text">SAGAR</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="header-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <a href="#" className="nav-link">Home</a>
            <a href="#" className="nav-link">Data Sources</a>
            <a href="#" className="nav-link">API Documentation</a>
          </motion.div>
          
          <motion.div 
            className="header-right"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="welcome-text">Welcome, Scientist</span>
            <button className="header-button logout-btn">
              <FiLogOut className="icon" />
              Logout
            </button>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Title Section */}
          <div className="dashboard-title-section">
            <h1 className="dashboard-title">Manage your Data Entry Files</h1>
            <motion.button 
              className="new-entry-btn"
              onClick={onNewEntry}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPlus className="icon" />
              New Entry
            </motion.button>
          </div>
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FiFile className="empty-icon" />
              <h2>No entries yet</h2>
              <p>Create your first data entry file to get started</p>
              <button 
                className="empty-action-btn"
                onClick={onNewEntry}
              >
                <FiPlus className="icon" />
                Create New Entry
              </button>
            </motion.div>
          ) : (
            <motion.div 
              className="entries-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <EntryCard
                    entry={entry}
                    onSelect={() => onSelectEntry(entry)}
                    onDelete={() => handleDelete(entry.id, entry.filename)}
                    onViewReport={(entry) => setSelectedReport(entry.qualityReport)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Quality Report Modal */}
      <AnimatePresence>
        {selectedReport && (
          <QualityReport
            qualityReport={selectedReport}
            onClose={() => setSelectedReport(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
