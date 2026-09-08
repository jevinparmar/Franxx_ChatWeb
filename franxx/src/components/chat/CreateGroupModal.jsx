import { useState, useEffect, useCallback } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { searchUsers } from '../../services/userService';
import { RiSearchLine, RiCloseLine, RiGroupLine, RiCheckLine } from 'react-icons/ri';
import './chat.css';

const CreateGroupModal = ({ isOpen, onClose, onCreateGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setGroupName('');
      setSearchTerm('');
      setSearchResults([]);
      setSelectedUsers([]);
      setError('');
    }
  }, [isOpen]);

  // Debounced search
  const handleSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchUsers(query);
      // Filter out already selected users
      const selectedIds = selectedUsers.map(u => u._id);
      setSearchResults(results.filter(u => !selectedIds.includes(u._id)));
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }, [selectedUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  const addUser = (user) => {
    setSelectedUsers(prev => [...prev, user]);
    setSearchResults(prev => prev.filter(u => u._id !== user._id));
    setSearchTerm('');
    setError('');
  };

  const removeUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u._id !== userId));
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    if (selectedUsers.length < 2) {
      setError('Select at least 2 members to create a group');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const userIds = selectedUsers.map(u => u._id);
      await onCreateGroup(groupName.trim(), userIds);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Group Chat">
      <div className="create-group-form">
        {/* Group Name */}
        <div className="create-group-section">
          <label className="create-group-label">Group Name</label>
          <div className="create-group-input-wrap">
            <RiGroupLine className="create-group-input-icon" size={18} />
            <input
              type="text"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="create-group-input"
              maxLength={40}
              autoFocus
            />
          </div>
        </div>

        {/* Selected Members Chips */}
        {selectedUsers.length > 0 && (
          <div className="create-group-section">
            <label className="create-group-label">
              Members ({selectedUsers.length})
            </label>
            <div className="create-group-chips">
              {selectedUsers.map(user => (
                <div className="create-group-chip" key={user._id}>
                  <img src={user.avatar} alt="" className="create-group-chip-avatar" />
                  <span className="create-group-chip-name">{user.name}</span>
                  <button
                    type="button"
                    className="create-group-chip-remove"
                    onClick={() => removeUser(user._id)}
                  >
                    <RiCloseLine size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Members */}
        <div className="create-group-section">
          <label className="create-group-label">Add Members</label>
          <div className="create-group-input-wrap">
            <RiSearchLine className="create-group-input-icon" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="create-group-input"
            />
          </div>
        </div>

        {/* Search Results */}
        {searchTerm.length >= 2 && (
          <div className="create-group-results">
            {searching ? (
              <div className="create-group-searching">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map(user => (
                <div
                  className="create-group-result-item"
                  key={user._id}
                  onClick={() => addUser(user)}
                >
                  <img src={user.avatar} alt="" className="create-group-result-avatar" />
                  <div className="create-group-result-info">
                    <span className="create-group-result-name">{user.name}</span>
                    <span className="create-group-result-username">{user.username}</span>
                  </div>
                  <RiCheckLine className="create-group-result-add" size={18} />
                </div>
              ))
            ) : (
              <div className="create-group-searching">No users found</div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="create-group-error">{error}</div>
        )}

        {/* Actions */}
        <div className="create-group-actions">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Create Group
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateGroupModal;
