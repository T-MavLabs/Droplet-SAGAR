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

  const handleKeyPress = (key) => {
    if (onInput) {
      const char = shift || capsLock ? key.toUpperCase() : key.toLowerCase();
      onInput(char);
      if (shift) {
        setShift(false); // Auto-disable shift after one character
      }
    }
  };

  const handleSpace = () => {
    if (onInput) {
      onInput(' ');
    }
  };

  const handleBackspace = () => {
    if (onInput) {
      onInput('backspace');
    }
  };

  const handleEnter = () => {
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
                onClick={() => handleKeyPress(key)}
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
                  onClick={() => handleKeyPress(key)}
                >
                  {shift || capsLock ? key.toUpperCase() : key}
                </button>
              ))}
            </div>
          ))}

          {/* Bottom row with special keys */}
          <div className="keyboard-row keyboard-bottom-row">
            <button
              className="keyboard-key special-key shift-key"
              onClick={toggleShift}
              onMouseDown={(e) => e.preventDefault()}
            >
              {capsLock ? 'CAPS' : '⇧'}
            </button>
            <button
              className="keyboard-key special-key caps-key"
              onClick={toggleCapsLock}
            >
              CAPS
            </button>
            <button
              className="keyboard-key space-key"
              onClick={handleSpace}
            >
              Space
            </button>
            <button
              className="keyboard-key special-key enter-key"
              onClick={handleEnter}
            >
              <FiCornerDownLeft className="icon" />
            </button>
            <button
              className="keyboard-key special-key backspace-key"
              onClick={handleBackspace}
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

