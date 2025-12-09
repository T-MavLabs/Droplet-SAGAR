import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import Spreadsheet from './components/Spreadsheet';
import DropletDesk from './components/DropletDesk';
import { saveEntry } from './utils/fileManager';

function App() {
  const [currentView, setCurrentView] = useState('welcome'); // welcome, dashboard, spreadsheet, dropletdesk
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleEnterDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleEnterDropletDesk = () => {
    setCurrentView('dropletdesk');
  };

  const handleBackToWelcome = () => {
    setCurrentView('welcome');
  };

  const handleNewEntry = (template = null) => {
    setSelectedEntry(null);
    setSelectedTemplate(template);
    setCurrentView('spreadsheet');
  };

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
    setCurrentView('spreadsheet');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedEntry(null);
    setSelectedTemplate(null);
  };

  const handleSaveEntry = (filename, data, qualityReport = null) => {
    saveEntry(filename, data, qualityReport);
  };

  return (
    <div className="App">
      <AnimatePresence mode="wait">
        {currentView === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <WelcomeScreen 
              onEnter={handleEnterDashboard} 
              onEnterDropletDesk={handleEnterDropletDesk}
            />
          </motion.div>
        )}

        {currentView === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard
              onSelectEntry={handleSelectEntry}
              onNewEntry={handleNewEntry}
              onBack={handleBackToWelcome}
            />
          </motion.div>
        )}

        {currentView === 'spreadsheet' && (
          <motion.div
            key="spreadsheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Spreadsheet
              entry={selectedEntry}
              template={selectedTemplate}
              onBack={handleBackToDashboard}
              onSave={handleSaveEntry}
            />
          </motion.div>
        )}

        {currentView === 'dropletdesk' && (
          <motion.div
            key="dropletdesk"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DropletDesk onBack={handleBackToWelcome} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
