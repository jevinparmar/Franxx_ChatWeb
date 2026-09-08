import './common.css';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'outline' | 'icon-only'
  disabled = false,
  loading = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {loading && <span className="btn-loading-spinner"></span>}
      {!loading && Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

export default Button;
