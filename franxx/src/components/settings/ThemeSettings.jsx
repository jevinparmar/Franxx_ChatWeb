import { useTheme } from '../../context/ThemeContext';
import { RiSunLine, RiMoonLine, RiComputerLine, RiCheckLine, RiPaletteLine } from 'react-icons/ri';
import './settings.css';

const ACCENT_COLOR_HEX = {
  purple: '#6C5CE7',
  blue: '#3B82F6',
  green: '#10B981',
  pink: '#EC4899',
  orange: '#F97316',
  red: '#EF4444'
};

const ThemeSettings = () => {
  const { theme, setTheme, accent, setAccent, accentColors } = useTheme();

  return (
    <div className="animate-fade">
      {/* Theme Selection */}
      <div className="settings-section-card">
        <h3 className="settings-section-title">
          <RiSunLine size={18} color="var(--accent-color)" /> Appearance Mode
        </h3>
        
        <div className="theme-options-grid">
          <div 
            className={`theme-option-card ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <div className="theme-icon-wrapper">
              <RiSunLine size={24} />
            </div>
            <span className="theme-label">Light</span>
          </div>

          <div 
            className={`theme-option-card ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <div className="theme-icon-wrapper">
              <RiMoonLine size={24} />
            </div>
            <span className="theme-label">Dark</span>
          </div>

          <div 
            className={`theme-option-card ${theme === 'system' ? 'active' : ''}`}
            onClick={() => setTheme('system')}
          >
            <div className="theme-icon-wrapper">
              <RiComputerLine size={24} />
            </div>
            <span className="theme-label">System</span>
          </div>
        </div>
        
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Choose between light mode, dark mode, or follow your operating system default color scheme.
        </p>
      </div>

      {/* Accent Colors */}
      <div className="settings-section-card">
        <h3 className="settings-section-title">
          <RiPaletteLine size={18} color="var(--accent-color)" /> Accent Color
        </h3>
        
        <div className="color-palette-grid">
          {accentColors.map(color => {
            const hex = ACCENT_COLOR_HEX[color] || '#6C5CE7';
            const isActive = accent === color;
            
            return (
              <button
                key={color}
                type="button"
                className={`color-palette-circle ${isActive ? 'active' : ''}`}
                style={{ backgroundColor: hex }}
                onClick={() => setAccent(color)}
                title={`${color.charAt(0).toUpperCase() + color.slice(1)}`}
                aria-label={`Select ${color} accent color`}
              >
                {isActive && <RiCheckLine size={20} />}
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '16px' }}>
          Select your favorite squad accent brand color. This updates all buttons, borders, highlights, and badge backgrounds.
        </p>
      </div>
    </div>
  );
};

export default ThemeSettings;
