import React, { useEffect, useState, ElementType } from 'react';

interface TypedTextProps {
  texts: string[];
  typingSpeed?: number;
  cursorBlinkSpeed?: number;
  startDelay?: number;
  cursorBlinkCount?: number;
  onComplete?: () => void;
  as?: ElementType;
  className?: string;
}

const TypedText: React.FC<TypedTextProps> = ({ 
  texts, 
  typingSpeed = 100, 
  cursorBlinkSpeed = 500,
  startDelay = 0,
  cursorBlinkCount = -1, // -1 means infinite blinking
  onComplete,
  as: Element = 'div',
  className = ''
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [blinkCounter, setBlinkCounter] = useState(0);
  const [shouldShowCursor, setShouldShowCursor] = useState(true);

  // Handle start delay
  useEffect(() => {
    if (!isStarted) {
      const timeout = setTimeout(() => {
        setIsStarted(true);
      }, startDelay);
      
      return () => clearTimeout(timeout);
    }
  }, [isStarted, startDelay]);
  
  // Hide cursor completely before typing starts
  const showAnyCursor = isStarted;

  // Typing effect
  useEffect(() => {
    if (!isStarted) return;
    
    const currentText = texts[currentTextIndex] || '';
    
    if (displayText.length < currentText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(currentText.substring(0, displayText.length + 1));
      }, typingSpeed);
      
      return () => clearTimeout(timeout);
    } else {
      // Current text is complete
      if (currentTextIndex < texts.length - 1) {
        // Move to next text after a pause
        const timeout = setTimeout(() => {
          setCurrentTextIndex(prev => prev + 1);
          setDisplayText('');
        }, 1000); // Pause between texts
        
        return () => clearTimeout(timeout);
      } else {
        // All texts are complete
        setIsTypingComplete(true);
        if (onComplete) onComplete();
      }
    }
  }, [displayText, texts, currentTextIndex, typingSpeed, isStarted, onComplete]);

  // Cursor blinking effect
  useEffect(() => {
    if (!isStarted) return;
    
    const interval = setInterval(() => {
      if (isTypingComplete && cursorBlinkCount > 0) {
        // Count blinks after typing is complete
        setShowCursor(prev => !prev);
        if (!showCursor) {
          setBlinkCounter(prev => prev + 1);
        }
        
        if (blinkCounter >= cursorBlinkCount) {
          setShouldShowCursor(false);
          clearInterval(interval);
        }
      } else {
        // Normal blinking during typing or infinite blinking
        setShowCursor(prev => !prev);
      }
    }, cursorBlinkSpeed);
    
    return () => clearInterval(interval);
  }, [cursorBlinkSpeed, isTypingComplete, cursorBlinkCount, blinkCounter, showCursor, isStarted]);

  return (
    <Element className={`${className} ${isTypingComplete ? 'typing-complete' : ''}`}>
      {displayText}
      {shouldShowCursor && showAnyCursor && (
        <span className={`cursor ${isTypingComplete ? 'blink' : ''}`} style={{ opacity: showCursor ? 1 : 0 }}>|</span>
      )}
    </Element>
  );
};

export default TypedText;
