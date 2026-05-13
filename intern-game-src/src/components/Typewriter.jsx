import { useState, useEffect, useRef } from 'react';

export default function Typewriter({ text, speed = 30, onDone }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(timerRef.current);
        onDone?.();
      }
    }, speed);

    return () => clearInterval(timerRef.current);
  }, [text, speed]);

  return <span>{displayed}</span>;
}
