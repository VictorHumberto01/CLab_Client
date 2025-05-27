import React from 'react';

const IntroModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div 
        className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-white">Welcome to CLab IDE (Alpha)</h2>
        <div className="text-gray-300 space-y-3">
          <p>👋 This is an early alpha version of CLab IDE. Features are experimental and may not work as expected.</p>
          <p>Current features:</p>
          <ul className="list-disc list-inside ml-2">
            <li>Basic C code editing</li>
            <li>Code compilation and execution</li>

          </ul>
          <p className="text-yellow-400 text-sm mt-4">⚠️ Note: This is a development version. Use at your own risk.</p>
        </div>
        <button
          onClick={handleClick}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors cursor-pointer active:transform active:scale-95"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default IntroModal;