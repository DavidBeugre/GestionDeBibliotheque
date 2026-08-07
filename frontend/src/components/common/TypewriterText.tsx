import { useEffect, useState } from 'react';

export function TypewriterText({ text, speed = 26 }: { text: string; speed?: number }) {
  const [visibleText, setVisibleText] = useState('');

  useEffect(() => {
    setVisibleText('');
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, speed);
    return () => window.clearInterval(timer);
  }, [text, speed]);

  return <span className="typewriter" aria-label={text}>{visibleText}</span>;
}
