import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const KEY = 'weynshop:theme';

const apply = (t) => {
  if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem(KEY) || 'light');

  useEffect(() => {
    apply(theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      className="btn-ghost p-2"
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
