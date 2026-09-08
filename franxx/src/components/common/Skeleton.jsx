import './common.css';

export const SkeletonItem = ({ width = '100%', height = '1rem', borderRadius = 'var(--radius-sm)', className = '' }) => (
  <div 
    className={`skeleton-loader ${className}`} 
    style={{ width, height, borderRadius }} 
  />
);

export const ConversationSkeleton = () => (
  <div className="skeleton-chat-card">
    <SkeletonItem width="2.75rem" height="2.75rem" borderRadius="50%" />
    <div className="skeleton-chat-info">
      <SkeletonItem width="60%" height="0.875rem" />
      <SkeletonItem width="85%" height="0.75rem" />
    </div>
  </div>
);

export const MessageSkeleton = () => (
  <div className="skeleton-messages">
    <SkeletonItem width="40%" height="2.5rem" borderRadius="1rem" className="skeleton-msg-left" />
    <SkeletonItem width="55%" height="2.5rem" borderRadius="1rem" className="skeleton-msg-right" />
    <SkeletonItem width="35%" height="2.5rem" borderRadius="1rem" className="skeleton-msg-left" />
  </div>
);
