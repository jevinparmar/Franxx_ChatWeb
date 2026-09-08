import { useState, useEffect } from 'react';
import { RiCloseLine, RiDeleteBinLine, RiEyeLine } from 'react-icons/ri';
import api from '../../services/axios';
import './status.css';

const SLIDE_DURATION = 4000; // 4 seconds per slide

const StatusViewer = ({ status, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isViewersOpen, setIsViewersOpen] = useState(false);

  const slides = status.slides || [
    { text: status.text || 'Checking in!', bg: status.bg || 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)', image: status.image }
  ];
  const currentSlide = slides[currentSlideIndex];

  const handleNextSlide = () => {
    setProgress(0);
    setIsViewersOpen(false);
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrevSlide = () => {
    setProgress(0);
    setIsViewersOpen(false);
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    } else {
      setProgress(0);
    }
  };

  // Record status view when current slide changes
  useEffect(() => {
    if (status.id !== 'myself' && currentSlide?.id) {
      api.put(`/status/${currentSlide.id}/view`).catch(() => {});
    }
  }, [currentSlideIndex, status.id, currentSlide?.id]);

  const handleDeleteSlide = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this status update?');
    if (!confirmDelete) return;

    try {
      await api.delete(`/status/${currentSlide.id}`);
      onClose();
    } catch (err) {
      console.error('Failed to delete status slide:', err);
    }
  };

  // Progressive timer bar effect
  useEffect(() => {
    if (isViewersOpen) return; // Pause timer when viewers modal is open!

    const intervalTime = 40; // 40ms interval updates
    const increment = (intervalTime / SLIDE_DURATION) * 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          handleNextSlide();
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlideIndex, isViewersOpen]);

  return (
    <div className="status-viewer-backdrop" onClick={onClose}>
      <div 
        className="status-viewer-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          backgroundImage: currentSlide?.image ? `url(${currentSlide.image})` : currentSlide?.bg,
          backgroundColor: '#1e293b'
        }}
      >
        {/* Nav Tap Overlays */}
        <div className="status-viewer-nav-overlay left" onClick={handlePrevSlide}></div>
        <div className="status-viewer-nav-overlay right" onClick={handleNextSlide}></div>

        <div>
          {/* Progress Bars */}
          <div className="status-viewer-bars">
            {slides.map((_, idx) => (
              <div key={idx} className="status-viewer-bar-bg">
                <div 
                  className="status-viewer-bar-progress"
                  style={{ 
                    width: idx < currentSlideIndex 
                      ? '100%' 
                      : idx === currentSlideIndex 
                        ? `${progress}%` 
                        : '0%' 
                  }}
                ></div>
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="status-viewer-header">
            <div className="status-viewer-user">
              <img 
                src={status.avatar} 
                alt={status.name} 
                className="status-viewer-avatar"
              />
              <div>
                <div className="status-viewer-name">{status.name}</div>
                <div className="status-viewer-time">{status.time}</div>
              </div>
            </div>
            
            <button className="status-viewer-close" onClick={onClose} aria-label="Close status viewer">
              <RiCloseLine size={24} />
            </button>
          </div>
        </div>

        {/* Story Text */}
        {currentSlide?.text && (
          <div className="status-viewer-content">
            <p>{currentSlide.text}</p>
          </div>
        )}

        {/* Bottom actions for self status updates */}
        {status.id === 'myself' && currentSlide?.id && (
          <div className="status-viewer-bottom-actions">
            <button className="status-viewer-views-btn" onClick={() => setIsViewersOpen(true)}>
              <RiEyeLine size={18} /> {currentSlide.viewers?.length || 0} views
            </button>
            <button className="status-viewer-delete-btn" onClick={handleDeleteSlide} title="Delete status update">
              <RiDeleteBinLine size={18} />
            </button>
          </div>
        )}

        {/* Viewers List Overlay */}
        {isViewersOpen && (
          <div className="status-viewers-list-overlay" onClick={() => setIsViewersOpen(false)}>
            <div className="status-viewers-list-container" onClick={(e) => e.stopPropagation()}>
              <div className="status-viewers-list-header">
                <h4>Viewed by ({currentSlide.viewers?.length || 0})</h4>
                <button onClick={() => setIsViewersOpen(false)}>
                  <RiCloseLine size={20} />
                </button>
              </div>
              <div className="status-viewers-list-scroll">
                {currentSlide.viewers?.length > 0 ? (
                  currentSlide.viewers.map(viewer => (
                    <div className="status-viewer-user-item" key={viewer._id || viewer}>
                      <img src={viewer.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} alt="" className="status-viewer-user-avatar" />
                      <div className="status-viewer-user-info">
                        <span className="status-viewer-user-name">{viewer.name}</span>
                        <span className="status-viewer-user-username">{viewer.username}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="status-viewers-empty">No views yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Spacing at bottom for design balance */}
        <div style={{ height: '40px', zIndex: 5 }}></div>
      </div>
    </div>
  );
};

export default StatusViewer;
