import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './WelcomeScreen.css';

const WelcomeScreen = ({ onEnter, onEnterDropletDesk }) => {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const dropletDeskRef = useRef(null);

  useEffect(() => {
    const title = titleRef.current;
    const subtitle = subtitleRef.current;
    const cta = ctaRef.current;
    const dropletDesk = dropletDeskRef.current;

    if (!title || !subtitle || !cta || !dropletDesk) return;

    title.animate([
      { transform: 'translateY(20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: 700, easing: 'ease-out', fill: 'forwards' });

    subtitle.animate([
      { transform: 'translateY(20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: 600, delay: 300, easing: 'ease-out', fill: 'forwards' });

    cta.animate([
      { transform: 'scale(0.9)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 500, delay: 550, easing: 'ease-out', fill: 'forwards' });

    dropletDesk.animate([
      { transform: 'scale(0.9)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 500, delay: 650, easing: 'ease-out', fill: 'forwards' });
  }, []);

  return (
    <div className="welcome-screen">
      <div className="welcome-background">
        <div className="welcome-gradient"></div>
      </div>
      <div className="welcome-content">
        <motion.h1 
          ref={titleRef}
          className="welcome-title"
          style={{ transform: 'translateY(20px)', opacity: 0 }}
        >
          SAGAR Data Entry
        </motion.h1>
        <motion.p 
          ref={subtitleRef}
          className="welcome-subtitle"
          style={{ transform: 'translateY(20px)', opacity: 0 }}
        >
          Professional Excel-like Data Entry Software for Scientists
        </motion.p>
        <div className="welcome-features">
          <motion.div 
            className="feature-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            📊 Excel-like Interface
          </motion.div>
          <motion.div 
            className="feature-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            📱 Tablet Optimized
          </motion.div>
          <motion.div 
            className="feature-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            💾 Export to Excel/CSV
          </motion.div>
        </div>
        <div className="welcome-buttons">
          <motion.button
            ref={ctaRef}
            onClick={onEnter}
            className="welcome-button"
            style={{ transform: 'scale(0.9)', opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Enter Dashboard
          </motion.button>
          <motion.button
            ref={dropletDeskRef}
            onClick={onEnterDropletDesk}
            className="welcome-button dropletdesk-button"
            style={{ transform: 'scale(0.9)', opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            DropletDesk
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
