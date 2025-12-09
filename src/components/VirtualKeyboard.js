import React, { useState, useEffect } from 'react';
import { FiDelete, FiCornerDownLeft, FiX } from 'react-icons/fi';
import './VirtualKeyboard.css';

const VirtualKeyboard = ({ onInput, onClose, visible = false }) => {
  const [shift, setShift] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  // Standard QWERTY layout
  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const symbols = [
    ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  // Punctuation row
  const punctuation = ['.', ',', '-', '_', '/', ':', ';', '?', '!', "'", '"'];

  const handleKeyPress = (key, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onInput) {
      let char;
      if (key.match(/[a-z]/i)) {
        // Letter keys - apply shift or caps lock
        char = shift || capsLock ? key.toUpperCase() : key.toLowerCase();
      } else {
        // Number and symbol keys - use shift for symbols
        const numberIndex = rows[0].indexOf(key);
        if (numberIndex >= 0 && shift) {
          // Use symbol from symbols array
          char = symbols[0][numberIndex];
        } else {
          char = key;
        }
      }
      // Call the input handler
      onInput(char);
      if (shift && !capsLock) {
        setShift(false); // Auto-disable shift after one character (unless caps lock is on)
      }
    }
  };

  const handleSpace = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onInput) {
      onInput(' ');
    }
  };

  const handleBackspace = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onInput) {
      onInput('backspace');
    }
  };

  const handleEnter = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onInput) {
      onInput('enter');
    }
  };

  const toggleShift = () => {
    setShift(!shift);
  };

  const toggleCapsLock = () => {
    setCapsLock(!capsLock);
    setShift(false);
  };

  if (!visible) return null;

  const currentLayout = shift ? symbols : rows;

  return (
    <div className="virtual-keyboard-overlay" onClick={onClose}>
      <div className="virtual-keyboard" onClick={(e) => e.stopPropagation()}>
        <div className="keyboard-header">
          <span className="keyboard-title">Keyboard</span>
          <button className="keyboard-close-btn" onClick={onClose}>
            <FiX className="icon" />
          </button>
        </div>
        
        <div className="keyboard-body">
          {/* Number row */}
          <div className="keyboard-row">
            {rows[0].map((key, idx) => (
              <button
                key={idx}
                className="keyboard-key number-key"
                onClick={(e) => handleKeyPress(key, e)}
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
              >
                {shift ? symbols[0][idx] : key}
              </button>
            ))}
          </div>

          {/* Letter rows */}
          {currentLayout.slice(1).map((row, rowIdx) => (
            <div key={rowIdx} className="keyboard-row">
              {row.map((key, keyIdx) => (
                <button
                  key={keyIdx}
                  className="keyboard-key letter-key"
                  onClick={(e) => handleKeyPress(key, e)}
                  onMouseDown={(e) => e.preventDefault()}
                  onTouchStart={(e) => e.preventDefault()}
                >
                  {shift || capsLock ? key.toUpperCase() : key}
                </button>
              ))}
            </div>
          ))}

          {/* Punctuation row */}
          <div className="keyboard-row">
            {punctuation.map((punc, idx) => (
              <button
                key={idx}
                className="keyboard-key punctuation-key"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onInput) {
                    onInput(punc);
                  }
                }}
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
              >
                {punc}
              </button>
            ))}
          </div>

          {/* Bottom row with special keys */}
          <div className="keyboard-row keyboard-bottom-row">
            <button
              className={`keyboard-key special-key shift-key ${shift ? 'active' : ''}`}
              onClick={toggleShift}
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
            >
              {capsLock ? 'CAPS' : '⇧'}
            </button>
            <button
              className={`keyboard-key special-key caps-key ${capsLock ? 'active' : ''}`}
              onClick={toggleCapsLock}
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
            >
              CAPS
            </button>
            <button
              className="keyboard-key space-key"
              onClick={(e) => handleSpace(e)}
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
            >
              Space
            </button>
            <button
              className="keyboard-key special-key enter-key"
              onClick={(e) => handleEnter(e)}
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
            >
              <FiCornerDownLeft className="icon" />
            </button>
            <button
              className="keyboard-key special-key backspace-key"
              onClick={handleBackspace}
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
            >
              <FiDelete className="icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualKeyboard;

