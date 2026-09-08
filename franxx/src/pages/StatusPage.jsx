import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/axios";
import StatusCard from "../components/status/StatusCard";
import StatusViewer from "../components/status/StatusViewer";
import BackButton from "../components/common/BackButton";
import UserAvatar from "../components/common/UserAvatar";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import { uploadAvatar } from "../services/userService";
import { RiAddLine, RiImageAddLine, RiDeleteBinLine } from "react-icons/ri";
import "../components/status/status.css";

const StatusPage = () => {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState([]);
  const [activeStatus, setActiveStatus] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStatusText, setNewStatusText] = useState("");
  const [newStatusBg, setNewStatusBg] = useState("purple"); // 'purple' | 'blue' | 'green' | 'orange'
  const [loading, setLoading] = useState(false);
  
  // Image Upload states
  const [statusType, setStatusType] = useState("text"); // 'text' | 'image'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/status");
      const currentIdStr = (user?._id || user?.id)?.toString();

      const formatted = data.map((item) => {
        const itemUserIdStr = (item.user?._id || item.user?.id || item.user)?.toString();
        const isMe = Boolean(itemUserIdStr && currentIdStr && itemUserIdStr === currentIdStr);

        return {
          id: isMe ? "myself" : itemUserIdStr,
          name: isMe ? `${item.user?.name || 'You'} (You)` : (item.user?.name || 'User'),
          avatar: item.user?.avatar || '',
          time: "Active updates",
          unread: !isMe,
          slides: (item.stories || []).map((story) => {
            const hasMedia = story.mediaType !== 'text';
            return {
              id: story._id || story.id,
              text: story.caption || "",
              bg: hasMedia ? undefined : story.mediaUrl,
              image: hasMedia ? story.mediaUrl : undefined,
              viewers: story.viewers || [],
            };
          }),
        };
      });
      setStatuses(formatted);
    } catch (error) {
      console.error("Failed to fetch statuses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStatuses();
    }
  }, [user]);

  const handleSelectStatus = (status) => {
    setActiveStatus(status);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAddStatus = async (e) => {
    e.preventDefault();

    if (statusType === "text") {
      if (!newStatusText.trim()) return;

      let bgGradient = "linear-gradient(135deg, #6C5CE7 0%, #5B4BE0 100%)";
      if (newStatusBg === "blue")
        bgGradient = "linear-gradient(135deg, #3B82F6 0%, #1E3A8A 100%)";
      else if (newStatusBg === "green")
        bgGradient = "linear-gradient(135deg, #10B981 0%, #064E3B 100%)";
      else if (newStatusBg === "orange")
        bgGradient = "linear-gradient(135deg, #F97316 0%, #7C2D12 100%)";

      try {
        setUploading(true);
        await api.post("/status", {
          mediaUrl: bgGradient,
          mediaType: "text",
          caption: newStatusText.trim(),
        });
        setNewStatusText("");
        setIsAddModalOpen(false);
        fetchStatuses();
      } catch (error) {
        console.error("Failed to post status:", error);
        alert("Failed to share status update.");
      } finally {
        setUploading(false);
      }
    } else {
      if (!imageFile) {
        alert("Please select an image file first.");
        return;
      }

      try {
        setUploading(true);
        // 1. Upload status image
        const uploadRes = await uploadAvatar(imageFile);
        const uploadedImageUrl = uploadRes.avatarUrl;

        // 2. Post image status to DB
        await api.post("/status", {
          mediaUrl: uploadedImageUrl,
          mediaType: "image",
          caption: newStatusText.trim(),
        });

        setNewStatusText("");
        setImageFile(null);
        setImagePreview(null);
        setIsAddModalOpen(false);
        fetchStatuses();
      } catch (error) {
        console.error("Failed to post image status:", error);
        alert("Failed to upload image status.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleOpenMyStatus = () => {
    const myStatus = statuses.find((s) => s.id === "myself");
    if (myStatus && myStatus.slides?.length > 0) {
      setActiveStatus(myStatus);
    } else {
      setIsAddModalOpen(true);
    }
  };

  const handleMenuClick = (status) => {
    alert(`Status update by ${status.name}.`);
  };

  const myStatusObj = statuses.find((s) => s.id === "myself");

  return (
    <div className="status-page-layout animate-fade">
      {/* Left panel showing list of status updates */}
      <div className="status-list-panel">
        <div className="status-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BackButton label="Back" />
          <h2 className="status-title">Status</h2>
        </div>

        <div className="status-scroll">
          {/* My Status Container */}
          <div className="my-status-container">
            <div
              className="my-status-avatar-wrapper"
              onClick={handleOpenMyStatus}
              style={{ cursor: "pointer" }}
            >
              <UserAvatar
                src={user?.avatar}
                name={user?.name}
                size="md"
              />
              <span className="add-status-badge">
                <RiAddLine />
              </span>
            </div>

            <div className="my-status-info">
              <h4 className="my-status-title">My Status</h4>
              <p className="my-status-subtitle">
                {myStatusObj && myStatusObj.slides?.length > 0
                  ? `Tap to view ${myStatusObj.slides.length} updates`
                  : "Tap to share a status update"}
              </p>
            </div>

            <Button
              variant="outline"
              icon={RiAddLine}
              onClick={() => {
                setStatusType("text");
                setImageFile(null);
                setImagePreview(null);
                setIsAddModalOpen(true);
              }}
            >
              Add
            </Button>
          </div>

          <div>
            <h3 className="status-section-title">Recent Updates</h3>
            <div className="status-updates-list">
              {statuses
                .filter((s) => s.id !== "myself")
                .map((status) => (
                  <StatusCard
                    key={status.id}
                    status={status}
                    onClick={() => handleSelectStatus(status)}
                    onMenuClick={handleMenuClick}
                  />
                ))}
              {statuses.filter((s) => s.id !== "myself").length === 0 && (
                <div style={{ padding: '24px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No recent status updates from your squadmates.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Story Viewer */}
      {activeStatus && (
        <StatusViewer
          status={activeStatus}
          onClose={() => {
            setActiveStatus(null);
            fetchStatuses();
          }}
        />
      )}

      {/* Create Status Dialog */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !uploading && setIsAddModalOpen(false)}
        title="Create Status Update"
      >
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <button
            type="button"
            disabled={uploading}
            onClick={() => setStatusType("text")}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: statusType === 'text' ? 'var(--accent-color)' : 'transparent',
              color: statusType === 'text' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '500',
              cursor: 'pointer',
              opacity: uploading ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            Text Story
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => setStatusType("image")}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: statusType === 'image' ? 'var(--accent-color)' : 'transparent',
              color: statusType === 'image' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '500',
              cursor: 'pointer',
              opacity: uploading ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            Image Story
          </button>
        </div>

        <form onSubmit={handleAddStatus} className="edit-profile-form">
          {statusType === "text" ? (
            <>
              <Input
                label="What's on your mind?"
                value={newStatusText}
                onChange={(e) => setNewStatusText(e.target.value)}
                placeholder="Type your story slide..."
                required
                maxLength={100}
                disabled={uploading}
              />

              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Theme Background</label>
                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                  {["purple", "blue", "green", "orange"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      disabled={uploading}
                      onClick={() => setNewStatusBg(color)}
                      style={{
                        flex: 1,
                        height: "36px",
                        borderRadius: "var(--radius-sm)",
                        border:
                          newStatusBg === color
                            ? "2px solid var(--accent-color)"
                            : "1px solid var(--border-color)",
                        background:
                          color === "purple"
                            ? "linear-gradient(135deg, #6C5CE7 0%, #5B4BE0 100%)"
                            : color === "blue"
                              ? "linear-gradient(135deg, #3B82F6 0%, #1E3A8A 100%)"
                              : color === "green"
                                ? "linear-gradient(135deg, #10B981 0%, #064E3B 100%)"
                                : "linear-gradient(135deg, #F97316 0%, #7C2D12 100%)",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Image Uploader Selector */}
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Select Story Image</label>
                
                {imagePreview ? (
                  <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#111827' }}>
                    <img 
                      src={imagePreview} 
                      alt="Status preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={uploading}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-md)'
                      }}
                      title="Remove image"
                    >
                      <RiDeleteBinLine size={16} />
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '140px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px dashed var(--border-color)',
                    cursor: 'pointer',
                    background: 'var(--background-card)',
                    color: 'var(--text-secondary)',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}>
                    <RiImageAddLine size={28} />
                    <span style={{ fontSize: '12px' }}>Click to select pilot media</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              <Input
                label="Caption (Optional)"
                value={newStatusText}
                onChange={(e) => setNewStatusText(e.target.value)}
                placeholder="Add a caption to your story..."
                maxLength={80}
                disabled={uploading}
              />
            </>
          )}

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              marginTop: "16px",
            }}
          >
            <Button
              variant="secondary"
              disabled={uploading}
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={uploading}>
              {uploading ? "Sharing..." : "Post Update"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StatusPage;
