import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const ACCENT_COLORS = {
  purple: { color: '#6C5CE7', hover: '#5B4BE0', glowLight: 'rgba(108, 92, 231, 0.25)', glowDark: 'rgba(108, 92, 231, 0.4)' },
  blue: { color: '#3B82F6', hover: '#2563EB', glowLight: 'rgba(59, 130, 246, 0.25)', glowDark: 'rgba(59, 130, 246, 0.4)' },
  green: { color: '#10B981', hover: '#059669', glowLight: 'rgba(16, 185, 129, 0.25)', glowDark: 'rgba(16, 185, 129, 0.4)' },
  pink: { color: '#EC4899', hover: '#DB2777', glowLight: 'rgba(236, 72, 153, 0.25)', glowDark: 'rgba(236, 72, 153, 0.4)' },
  orange: { color: '#F97316', hover: '#EA580C', glowLight: 'rgba(249, 115, 22, 0.25)', glowDark: 'rgba(249, 115, 22, 0.4)' },
  red: { color: '#EF4444', hover: '#DC2626', glowLight: 'rgba(239, 68, 68, 0.25)', glowDark: 'rgba(239, 68, 68, 0.4)' }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('franxx-theme') || 'dark';
  });
  
  const [accent, setAccent] = useState(() => {
    return localStorage.getItem('franxx-accent') || 'purple';
  });

  useEffect(() => {
    // 1. Handle Light/Dark/System Theme Class
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    
    let activeTheme = theme;
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      activeTheme = systemTheme;
    }
    
    root.classList.add(`theme-${activeTheme}`);
    root.setAttribute('data-theme', activeTheme);
    localStorage.setItem('franxx-theme', theme);

    // 2. Handle Accent Color properties
    const activeAccent = ACCENT_COLORS[accent] || ACCENT_COLORS.purple;
    root.style.setProperty('--accent-color', activeAccent.color);
    root.style.setProperty('--accent-hover', activeAccent.hover);
    
    const glow = activeTheme === 'dark' ? activeAccent.glowDark : activeAccent.glowLight;
    root.style.setProperty('--accent-glow', glow);
    localStorage.setItem('franxx-accent', accent);
  }, [theme, accent]);

  // Listen to system changes if theme is set to 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = document.documentElement;
      root.classList.remove('theme-light', 'theme-dark');
      const activeTheme = mediaQuery.matches ? 'dark' : 'light';
      root.classList.add(`theme-${activeTheme}`);
      root.setAttribute('data-theme', activeTheme);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, accent, setAccent, accentColors: Object.keys(ACCENT_COLORS) }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
