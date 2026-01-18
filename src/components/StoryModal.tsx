import { useEffect, useRef, useState } from 'react';
import './StoryModal.css';

interface StoryModalProps {
  isOpen: boolean;
  storyText: string;
  onClose: () => void;
}

function StoryModal({ isOpen, storyText, onClose }: StoryModalProps) {
  const [typedText, setTypedText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTypedText('');
    setIsTypingDone(false);

    let index = 0;
    intervalRef.current = window.setInterval(() => {
      index += 1;
      setTypedText(storyText.slice(0, index));

      if (index >= storyText.length) {
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
        }
        setIsTypingDone(true);
      }
    }, 18);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, storyText]);

  if (!isOpen) return null;

  const handleSkipTyping = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
    }
    setTypedText(storyText);
    setIsTypingDone(true);
  };

  return (
    <div className="story-modal-overlay" onClick={onClose}>
      <div className="story-modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="story-modal-header">
          <h2 className="story-modal-title font-menu text-xl text-neon-green" style={{ letterSpacing: '0.1em' }}>
            SYSTEM TRANSMISSION
          </h2>
          <button
            className="story-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="story-modal-body">
          <div className="story-modal-terminal font-body text-sm">
            <pre className="story-modal-text">
              {typedText}
              {!isTypingDone && <span className="story-modal-cursor" />}
            </pre>
          </div>

          <div className="story-modal-actions">
            {!isTypingDone ? (
              <button
                className="story-modal-button story-modal-button-secondary font-menu text-sm px-5 py-2"
                onClick={handleSkipTyping}
              >
                SKIP TYPE
              </button>
            ) : (
              <button
                className="story-modal-button story-modal-button-primary retro-button font-logo text-base px-6 py-3"
                onClick={onClose}
              >
                ENTER THE GRID
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StoryModal;

