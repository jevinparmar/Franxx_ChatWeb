import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  RiSearchLine,
  RiMessage3Line,
  RiHashtag,
  RiGroupLine,
  RiCloseLine,
  RiUserAddLine,
  RiCheckLine,
  RiTimeLine
} from "react-icons/ri";
import { useAuth } from "../context/AuthContext";
import { searchUsers, toggleFollowUser } from "../services/userService";
import { fetchChats, accessChat } from "../services/chatService";
import BackButton from "../components/common/BackButton";
import UserAvatar from "../components/common/UserAvatar";
import Button from "../components/common/Button";
import axios from "../services/axios";
import "./search.css";

const MOCK_SEARCH_HASHTAGS = [
  { tag: "#Strelizia", posts: "124K posts", trending: true },
  { tag: "#Darling", posts: "98.5K posts", trending: true },
  { tag: "#Franxx", posts: "210K posts", trending: false },
  { tag: "#Squad13", posts: "45K posts", trending: false },
  { tag: "#Stampede", posts: "12K posts", trending: true },
];

const SearchPage = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'groups' | 'hashtags'
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [hashtags] = useState(MOCK_SEARCH_HASHTAGS);
  const [loading, setLoading] = useState(false);
  const [actioningUserId, setActioningUserId] = useState(null);
  const abortControllerRef = useRef(null);

  // Load search history from backend
  const fetchRecentSearches = async () => {
    try {
      const res = await axios.get('/search/history');
      setRecentSearches(res.data || []);
    } catch (err) {
      console.error('Failed to load search history:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchRecentSearches();
    }
  }, [currentUser]);

  // Debounced user search
  useEffect(() => {
    if (activeTab !== "users") return;

    if (!query.trim()) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const data = await searchUsers(query);
        const currentIdStr = currentUser?._id?.toString();

        const formatted = data.map((u) => {
          const userIdStr = (u._id || u.id).toString();
          
          const isFollowing = Array.isArray(u.followers) && u.followers.some(f => (f._id || f).toString() === currentIdStr);
          const hasRequested = Array.isArray(u.followRequests) && u.followRequests.some(r => (r._id || r).toString() === currentIdStr);
          const hasSentToMe = Array.isArray(currentUser?.followRequests) && currentUser.followRequests.some(r => (r._id || r).toString() === userIdStr);

          let relationship = 'none'; // 'none' | 'requested' | 'accept' | 'following' | 'self'
          if (userIdStr === currentIdStr) {
            relationship = 'self';
          } else if (isFollowing) {
            relationship = 'following';
          } else if (hasRequested) {
            relationship = 'requested';
          } else if (hasSentToMe) {
            relationship = 'accept';
          }

          return {
            id: userIdStr,
            name: u.name,
            username: u.username,
            avatar: u.avatar,
            bio: u.bio,
            relationship: relationship,
          };
        });
        setUsers(formatted);
      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.error("Failed to load users:", error);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab, currentUser]);

  // Load groups from backend
  const loadGroups = async () => {
    try {
      const chatsData = await fetchChats();
      const groupChats = chatsData
        .filter((c) => c.type === "group")
        .map((g) => ({
          id: g._id,
          name: g.name,
          desc: "Active group",
          members: g.members?.length || 0,
        }));
      setGroups(groupChats);
    } catch (error) {
      console.error("Failed to load groups:", error);
    }
  };

  useEffect(() => {
    if (currentUser && activeTab === "groups") {
      loadGroups();
    }
  }, [activeTab, currentUser]);

  const handleStartChat = async (userId) => {
    try {
      await axios.post(`/search/history/${userId}`).catch(() => {});
      const chat = await accessChat(userId);
      navigate(`/dashboard?chat=${chat._id}`, { state: { newChat: chat } });
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  const handleAddOrToggleFollow = async (e, targetUserId, currentRelationship) => {
    e.stopPropagation();
    if (actioningUserId || currentRelationship === 'self') return;

    setActioningUserId(targetUserId);

    try {
      if (currentRelationship === 'accept') {
        // Accept request
        await axios.post(`/users/requests/${targetUserId}/accept`);
        setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, relationship: 'following' } : u));
      } else {
        // Toggle add / follow
        const res = await toggleFollowUser(targetUserId);
        const status = res.status; // 'followed', 'requested', 'unfollowed', 'cancelled'

        let newRel = 'none';
        if (status === 'followed') newRel = 'following';
        else if (status === 'requested') newRel = 'requested';

        setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, relationship: newRel } : u));
      }
    } catch (err) {
      console.error('Failed friend request action:', err);
    } finally {
      setActioningUserId(null);
    }
  };

  const handleRemoveHistoryItem = async (e, searchedUserId) => {
    e.stopPropagation();
    try {
      await axios.delete(`/search/history/${searchedUserId}`);
      setRecentSearches(prev => prev.filter(item => item.searchedUser?._id !== searchedUserId));
    } catch (err) {
      console.error('Failed to remove history item:', err);
    }
  };

  const handleClearAllHistory = async () => {
    try {
      await axios.delete('/search/history');
      setRecentSearches([]);
    } catch (err) {
      console.error('Failed to clear search history:', err);
    }
  };

  const filteredHashtags = hashtags.filter((hash) =>
    hash.tag.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="search-page-layout animate-fade">
      <div className="search-list-panel">
        {/* Search Header */}
        <div className="search-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <BackButton label="Back" />
          </div>
          <div className="search-bar-container">
            <span className="search-bar-icon">
              <RiSearchLine size={20} />
            </span>
            <input
              type="text"
              placeholder="Search users, squadmates, or hashtags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-bar-input"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="search-tabs">
          <button
            className={`search-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
          <button
            className={`search-tab ${activeTab === "groups" ? "active" : ""}`}
            onClick={() => setActiveTab("groups")}
          >
            Groups
          </button>
          <button
            className={`search-tab ${activeTab === "hashtags" ? "active" : ""}`}
            onClick={() => setActiveTab("hashtags")}
          >
            Hashtags
          </button>
        </div>

        {/* Scroll Search results */}
        <div className="search-scroll">
          {/* USERS TAB */}
          {activeTab === "users" && (
            <div className="search-results-list">
              {/* Show Recent Searches if query is empty */}
              {!query.trim() ? (
                <div className="recent-searches-section">
                  <div className="recent-searches-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Recent</span>
                    {recentSearches.length > 0 && (
                      <button 
                        type="button" 
                        onClick={handleClearAllHistory}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {recentSearches.length > 0 ? (
                    recentSearches.map((item) => {
                      const searchedUser = item.searchedUser;
                      if (!searchedUser) return null;
                      return (
                        <div
                          key={item._id}
                          className="search-result-card"
                          onClick={() => handleUserClick(searchedUser._id)}
                        >
                          <UserAvatar
                            src={searchedUser.avatar}
                            name={searchedUser.name}
                            size="md"
                          />
                          <div className="search-result-info">
                            <span className="search-result-name">{searchedUser.name}</span>
                            <span className="search-result-username">{searchedUser.username}</span>
                          </div>
                          <button
                            type="button"
                            className="search-remove-history-btn"
                            onClick={(e) => handleRemoveHistoryItem(e, searchedUser._id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                            title="Remove"
                          >
                            <RiCloseLine size={18} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="search-no-results">
                      Your recent searches will appear here
                    </div>
                  )}
                </div>
              ) : (
                /* Query search results */
                users.length > 0 ? (
                  users.map((u) => (
                    <div
                      key={u.id}
                      className="search-result-card"
                      onClick={() => handleUserClick(u.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <UserAvatar
                        src={u.avatar}
                        name={u.name}
                        size="md"
                      />

                      <div className="search-result-info">
                        <span className="search-result-name">{u.name}</span>
                        <span className="search-result-username">{u.username}</span>
                      </div>

                      <div
                        className="search-result-action"
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', gap: '6px' }}
                      >
                        {u.relationship !== 'self' && (
                          <Button
                            variant={u.relationship === 'following' ? 'secondary' : u.relationship === 'requested' ? 'secondary' : 'primary'}
                            size="small"
                            disabled={actioningUserId === u.id}
                            onClick={(e) => handleAddOrToggleFollow(e, u.id, u.relationship)}
                          >
                            {u.relationship === 'following' ? 'Following' : u.relationship === 'requested' ? 'Requested' : u.relationship === 'accept' ? 'Accept' : 'Add'}
                          </Button>
                        )}

                        <Button
                          variant="secondary"
                          size="small"
                          icon={RiMessage3Line}
                          onClick={() => handleStartChat(u.id)}
                          title="Chat"
                        >
                          Chat
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="search-no-results">
                    {loading ? "Searching..." : `No users found matching "${query}"`}
                  </div>
                )
              )}
            </div>
          )}

          {/* GROUPS TAB */}
          {activeTab === "groups" && (
            <div className="search-results-list">
              {groups.length > 0 ? (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="search-result-card"
                    onClick={() => navigate(`/dashboard?chat=${group.id}`)}
                  >
                    <div className="search-result-avatar-icon bg-group">
                      <RiGroupLine size={22} />
                    </div>
                    <div className="search-result-info">
                      <span className="search-result-name">{group.name}</span>
                      <span className="search-result-username">
                        {group.members} members
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-no-results">
                  No groups found
                </div>
              )}
            </div>
          )}

          {/* HASHTAGS TAB */}
          {activeTab === "hashtags" && (
            <div className="search-results-list">
              {filteredHashtags.length > 0 ? (
                filteredHashtags.map((hash, idx) => (
                  <div key={idx} className="search-result-card">
                    <div className="search-result-avatar-icon bg-hashtag">
                      <RiHashtag size={20} />
                    </div>
                    <div className="search-result-info">
                      <span className="search-result-name">{hash.tag}</span>
                      <span className="search-result-username">{hash.posts}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-no-results">
                  No hashtags found matching "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
