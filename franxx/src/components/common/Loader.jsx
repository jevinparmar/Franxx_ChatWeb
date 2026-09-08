import './common.css';
import loaderBg from '../../assets/images/Background- loader.png';

const Loader = ({ fullscreen = false }) => {
  return (
    <div
      className={`loader-wrapper ${fullscreen ? 'loader-fullscreen' : ''}`}
      style={{
        backgroundImage: `url("${loaderBg}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Center Layout Container */}
      <div className="loader-content">
        <h1 className="loader-brand-name">FRANXX</h1>
        <div className="loader-progress-container">
          <div className="loader-progress-bar">
            <div className="loader-progress-glow"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;

