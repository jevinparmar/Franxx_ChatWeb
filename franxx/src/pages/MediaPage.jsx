import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  RiArrowLeftLine,
  RiFilter3Line,
  RiFilePdfLine,
  RiFileWordLine,
  RiFilePptLine,
  RiFileMusicLine,
  RiFolderZipLine,
  RiPlayFill,
  RiDownloadLine,
} from "react-icons/ri";
import { getSharedMedia } from "../services/mediaService";
import BackButton from "../components/common/BackButton";
import Button from "../components/common/Button";
import "./media.css";

const MediaPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [media, setMedia] = useState({ images: [], videos: [], files: [] });
  const [loading, setLoading] = useState(true);

  // Derive active tab directly from URL path and search params
  const activeTab =
    location.pathname === "/media/files"
      ? "files"
      : new URLSearchParams(location.search).get("tab") || "all";

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const data = await getSharedMedia();
        setMedia(data);
      } catch (error) {
        console.error("Failed to load shared media:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, []);

  const handleTabChange = (tab) => {
    if (tab === "files") {
      navigate("/media/files");
    } else {
      navigate(`/media?tab=${tab}`);
    }
  };

  const handleDownload = (file) => {
    window.open(file.url, "_blank");
  };

  const handleVideoPlay = (video) => {
    window.open(video.url, "_blank");
  };

  const handleImageClick = (img) => {
    window.open(img.url, "_blank");
  };

  const getCleanFilename = (name) => {
    if (!name) return "";
    return name.replace(/-[0-9]{13}(?=\.[a-zA-Z0-9]+$)/, "");
  };

  const getFileIcon = (name) => {
    const ext = name.split(".").pop().toLowerCase();
    if (ext === "pdf") return RiFilePdfLine;
    if (["doc", "docx"].includes(ext)) return RiFileWordLine;
    if (["ppt", "pptx"].includes(ext)) return RiFilePptLine;
    if (["mp3", "wav", "ogg"].includes(ext)) return RiFileMusicLine;
    if (["zip", "rar", "tar", "gz"].includes(ext)) return RiFolderZipLine;
    return RiFilePdfLine; // default fallback
  };

  return (
    <div className="media-page-layout animate-fade">
      <div className="media-list-panel">
        {/* Header */}
        <div className="media-header">
          <div className="media-header-left" style={{ gap: '12px' }}>
            <BackButton label="Back" />
            <h2 className="media-title-text">Media & Gallery</h2>
          </div>

          <button
            className="media-header-btn"
            onClick={() => alert("Filters reset")}
            title="Filter Files"
          >
            <RiFilter3Line size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="media-tabs">
          <button
            className={`media-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => handleTabChange("all")}
          >
            All
          </button>
          <button
            className={`media-tab ${activeTab === "images" ? "active" : ""}`}
            onClick={() => handleTabChange("images")}
          >
            Images
          </button>
          <button
            className={`media-tab ${activeTab === "videos" ? "active" : ""}`}
            onClick={() => handleTabChange("videos")}
          >
            Videos
          </button>
          <button
            className={`media-tab ${activeTab === "files" ? "active" : ""}`}
            onClick={() => handleTabChange("files")}
          >
            Files
          </button>
        </div>

        {/* Scroll View Area */}
        <div className="media-scroll">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              Scanning communications log for media attachments...
            </div>
          ) : (
            <>
              {/* Images Section */}
              {(activeTab === "all" || activeTab === "images") && media.images.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  {activeTab === "all" && (
                    <h3 className="status-section-title">Images</h3>
                  )}
                  <div className="images-grid">
                    {media.images.map((img) => (
                      <div
                        key={img.id}
                        className="image-card"
                        onClick={() => handleImageClick(img)}
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos Section */}
              {(activeTab === "all" || activeTab === "videos") && media.videos.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  {activeTab === "all" && (
                    <h3 className="status-section-title">Videos</h3>
                  )}
                  <div className="videos-grid">
                    {media.videos.map((video) => (
                      <div
                        key={video.id}
                        className="video-card"
                        onClick={() => handleVideoPlay(video)}
                      >
                        <div className="video-thumbnail-container">
                          <video src={video.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} preload="metadata" muted />
                          <div className="video-play-overlay">
                            <span className="video-play-btn">
                              <RiPlayFill size={24} />
                            </span>
                          </div>
                        </div>
                        <div className="video-info">
                          <h4 className="video-title">{getCleanFilename(video.title)}</h4>
                          <span className="video-duration">
                            Duration: {video.duration}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files Section */}
              {(activeTab === "all" || activeTab === "files") && media.files.length > 0 && (
                <div>
                  {activeTab === "all" && (
                    <h3 className="status-section-title">Files</h3>
                  )}
                  <div className="files-list">
                    {media.files.map((file) => {
                      const FileIcon = getFileIcon(file.name);
                      return (
                        <div key={file.id} className="file-row">
                          <div className="file-row-left">
                            <div
                              className="file-icon-box"
                              style={{ backgroundColor: "#6C5CE7" }}
                            >
                              <FileIcon size={24} />
                            </div>
                            <div className="file-info-box">
                              <span className="file-name">{getCleanFilename(file.name)}</span>
                              <span className="file-meta">
                                {file.size} • Shared Attachment
                              </span>
                            </div>
                          </div>

                          <div className="file-row-right">
                            <Button
                              variant="secondary"
                              icon={RiDownloadLine}
                              onClick={() => handleDownload(file)}
                              className="btn-icon-only"
                              title="Download File"
                              aria-label={`Download ${file.name}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {media.images.length === 0 && media.videos.length === 0 && media.files.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
                  No shared media attachments found in your conversation history.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPage;
