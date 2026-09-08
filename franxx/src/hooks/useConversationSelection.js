import { useState, useCallback } from 'react';

export const useConversationSelection = (chats = []) => {
  const [selectedChatIds, setSelectedChatIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelectChat = useCallback((chatId) => {
    setSelectedChatIds((prev) => {
      const isSelected = prev.includes(chatId);
      const updated = isSelected ? prev.filter((id) => id !== chatId) : [...prev, chatId];
      if (updated.length === 0) setIsSelectionMode(false);
      else setIsSelectionMode(true);
      return updated;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedChatIds(chats.map((c) => c.id || c._id));
    setIsSelectionMode(true);
  }, [chats]);

  const clearSelection = useCallback(() => {
    setSelectedChatIds([]);
    setIsSelectionMode(false);
  }, []);

  const startSelection = useCallback((chatId) => {
    setSelectedChatIds([chatId]);
    setIsSelectionMode(true);
  }, []);

  return {
    selectedChatIds,
    isSelectionMode,
    toggleSelectChat,
    selectAll,
    clearSelection,
    startSelection,
  };
};
