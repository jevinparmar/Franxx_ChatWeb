import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { RiEmotionHappyLine, RiAttachmentLine, RiMicLine, RiSendPlane2Fill } from 'react-icons/ri';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useTheme } from '../../context/ThemeContext';
import { uploadAvatar } from '../../services/userService';
import './chat.css';

const MessageInput = ({ onSendMessage, onTypingStart, onTypingStop }) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileType, setFileType] = useState('none');
  const [uploading, setUploading] = useState(false);

  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const { theme } = useTheme();
  const pendingCursorPosRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  // Handle typing status throttling
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (val.trim() && !isTypingRef.current) {
      isTypingRef.current = true;
      if (onTypingStart) onTypingStart();
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (onTypingStop) onTypingStop();
    }, 2000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    if (onTypingStop) onTypingStop();

    let mediaUrl = '';
    let mediaType = 'none';

    if (selectedFile) {
      setUploading(true);
      try {
        const response = await uploadAvatar(selectedFile);
        mediaUrl = response.avatarUrl;
        mediaType = fileType;
      } catch (error) {
        console.error('Failed to upload message attachment:', error);
        alert('Failed to send file. Please try again.');
        setUploading(false);
        return;
      }
    }

    onSendMessage(text, mediaUrl, mediaType);
    
    // Reset states
    setText('');
    handleCancelAttachment();
    setUploading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  };

  const handleEmojiSelect = (emojiObj) => {
    const emoji = emojiObj.native;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + emoji + after;
      
      // Store cursor position to restore in useLayoutEffect
      pendingCursorPosRef.current = start + emoji.length;
      
      setText(newText);
      setShowEmojiPicker(false);
      
      // Clear any window text selection to prevent ghost highlights/carets
      window.getSelection()?.removeAllRanges();
    } else {
      setText(prev => prev + emoji);
      setShowEmojiPicker(false);
    }
  };

  const handleAttachmentClick = () => {
    if (uploading) return;
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const type = file.type;

      if (type.startsWith('image/')) {
        setFileType('image');
      } else if (type.startsWith('video/')) {
        setFileType('video');
      } else {
        setFileType('file');
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCancelAttachment = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFileType('none');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* File Preview Bar */}
      {previewUrl && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '12px 16px', 
          borderBottom: '1px solid var(--border-color)', 
          backgroundColor: 'var(--bg-card)',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          margin: '0 8px'
        }}>
          {fileType === 'image' ? (
            <img src={previewUrl} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
          ) : fileType === 'video' ? (
            <video src={previewUrl} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
          ) : (
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '8px', 
              backgroundColor: 'rgba(255, 255, 255, 0.08)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'var(--accent-color)'
            }}>
              <RiAttachmentLine size={22} />
            </div>
          )}
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '250px' }}>
              {selectedFile?.name}
            </span>
            <span style={{ fontSize: '11px', color: uploading ? 'var(--text-accent, #6c5ce7)' : 'var(--text-secondary)' }}>
              {uploading ? 'Sending attachment...' : 'Ready to send'}
            </span>
          </div>
          <button 
            type="button" 
            onClick={handleCancelAttachment} 
            disabled={uploading}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#ef4444', 
              fontSize: '13px', 
              fontWeight: '600', 
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            Remove
          </button>
        </div>
      )}

      <form className="message-input-area" onSubmit={handleSend}>
        <div className="message-input-left-actions">
          <div style={{ position: 'relative' }} ref={emojiPickerRef}>
            <button 
              type="button" 
              className="message-input-action-btn" 
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                textareaRef.current?.focus();
              }}
              title="Add Emoji"
            >
              <RiEmotionHappyLine size={22} />
            </button>
            
            {showEmojiPicker && (
              <div 
                className="emoji-picker-popover animate-scale"
                onMouseDown={(e) => {
                  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                  }
                }}
              >
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme={theme === 'system' ? 'auto' : theme}
                />
              </div>
            )}
          </div>

          <button 
            type="button" 
            className="message-input-action-btn" 
            onClick={handleAttachmentClick}
            disabled={uploading}
            title="Attach File"
          >
            <RiAttachmentLine size={22} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
          />

          <button 
            type="button" 
            className="message-input-action-btn" 
            title="Record Voice"
          >
            <RiMicLine size={22} />
          </button>
        </div>

        <div className="message-input-container">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={uploading ? "Sending attachment..." : "Message..."}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyPress}
            disabled={uploading}
            className="message-text-input"
          />
        </div>

        <button 
          type="submit" 
          disabled={(!text.trim() && !selectedFile) || uploading} 
          className="message-input-send-btn"
          aria-label="Send message"
        >
          <RiSendPlane2Fill size={20} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
