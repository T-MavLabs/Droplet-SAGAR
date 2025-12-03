import React from 'react';
import { motion } from 'framer-motion';
import { FiFile, FiCalendar, FiTrash2, FiArrowRight, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const EntryCard = ({ entry, onSelect, onDelete, onViewReport }) => {
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getQualityStatusColor = () => {
    const status = entry.qualityReport?.summary?.quality_status;
    if (status === 'GOOD') return '#00ff88'; // marine-green
    if (status === 'SUSPECT') return '#ffd700'; // marine-yellow
    if (status === 'FAIL') return '#ef4444'; // red
    return '#9ca3af'; // gray
  };

  const getTagColor = () => {
    // Cycle through colors based on entry index or use a consistent color
    const colors = ['#00ff88', '#ffd700', '#00d4ff', '#ff6b35'];
    return colors[entry.id.charCodeAt(0) % colors.length];
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKey}
      className="entry-card"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Tag */}
      <div className="entry-tag" style={{ backgroundColor: getTagColor() }}>
        <span style={{ color: '#0a1929' }}>Data Entry</span>
      </div>

      {/* Card Content */}
      <div className="entry-card-body">
        <h3 className="entry-title">{entry.filename}</h3>
        
        <div className="entry-meta">
          <div className="entry-meta-item">
            <FiCalendar className="meta-icon" />
            <span>{formatDate(entry.updatedAt)}</span>
          </div>
        </div>

        <p className="entry-description">
          Data entry file with {entry.rowCount || 0} rows and {entry.columnCount || 0} columns
        </p>

        {/* Quality Report Status */}
        {entry.qualityReport && (
          <div className="quality-status-card" style={{ borderColor: getQualityStatusColor() }}>
            <div className="quality-status-content">
              <div className="quality-score-large" style={{ color: getQualityStatusColor() }}>
                {entry.qualityReport.detailed_metrics?.overall_quality_score?.toFixed(1) || 'N/A'}%
              </div>
              <div className="quality-status-label" style={{ color: getQualityStatusColor() }}>
                {entry.qualityReport.summary?.quality_status === 'GOOD' ? 'EXCELLENT' : 
                 entry.qualityReport.summary?.quality_status || 'UNKNOWN'}
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar - Only show if quality report exists */}
        {entry.qualityReport && (
          <div className="entry-progress">
            <div className="progress-bar">
              <motion.div 
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${entry.qualityReport.detailed_metrics?.overall_quality_score || 0}%` }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
            </div>
            <span className="progress-text">
              {entry.qualityReport.detailed_metrics?.overall_quality_score?.toFixed(0) || 0}%
            </span>
          </div>
        )}
      </div>

      <div className="entry-card-footer">
        {entry.qualityReport && onViewReport ? (
          <div className="footer-buttons-row">
            <motion.button
              className="entry-view-report-btn"
              onClick={(e) => {
                e.stopPropagation();
                onViewReport(entry);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>View Quality Report</span>
            </motion.button>
            <button
              className="entry-delete-btn-small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete Entry"
            >
              <FiTrash2 />
            </button>
          </div>
        ) : (
          <div className="footer-buttons-row">
            <div style={{ flex: 1 }}></div>
            <button
              className="entry-delete-btn-small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete Entry"
            >
              <FiTrash2 />
            </button>
          </div>
        )}
        <motion.button
          className="entry-open-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Open Entry</span>
          <FiArrowRight className="arrow-icon" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default EntryCard;
