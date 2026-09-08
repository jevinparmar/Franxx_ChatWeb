import { useNavigate } from 'react-router-dom';
import { RiArrowLeftSLine } from 'react-icons/ri';
import './common.css';

const BackButton = ({ onClick, label = 'Back', className = '', style = {} }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      className={`back-button-component ${className}`}
      onClick={handleClick}
      style={style}
      aria-label={label}
      title={label}
    >
      <RiArrowLeftSLine size={24} className="back-button-icon" />
      {label && <span className="back-button-label">{label}</span>}
    </button>
  );
};

export default BackButton;
