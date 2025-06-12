import React, { useEffect, useState } from 'react';

interface TypedHeadingProps {
  text: string;
  typingSpeed?: number;
  cursorBlinkSpeed?: number;
}

const TypedHeading: React.FC<TypedHeadingProps> = ({ 
  text, 
  typingSpeed = 100, 
  cursorBlinkSpeed = 500 
}) => {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Typing effect
  useEffect(() => {
    if (displayText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.substring(0, displayText.length + 1));
      }, typingSpeed);
      
      return () => clearTimeout(timeout);
    } else {
      setIsTypingComplete(true);
    }
  }, [displayText, text, typingSpeed]);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, cursorBlinkSpeed);
    
    return () => clearInterval(interval);
  }, [cursorBlinkSpeed]);

  return (
    <h1 className={`typed-heading ${isTypingComplete ? 'glow' : ''}`}>
      {displayText}
      <span className={`cursor ${isTypingComplete ? 'blink' : ''}`} style={{ opacity: showCursor ? 1 : 0 }}>|</span>
    </h1>
  );
};

export default TypedHeading;
