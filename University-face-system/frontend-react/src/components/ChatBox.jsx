import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mascot } from 'page-mascot';
import './ChatBox.css';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = rawApiUrl.replace(/\/api\/?$/, '');

const SUGGESTED_QUESTIONS = [
  'Cach them sinh vien?',
  'Loi khong scan duoc mat?',
  'Cach dang ky khuon mat?',
  'Loi "Qua nhieu request"?',
];

function ChatBox() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Xin chào ${user?.name || 'bạn'}! Tôi là Trợ lý AI Hệ thống Điểm danh Khuôn mặt. Tôi có thể giúp bạn giải đáp thắc mắc về lịch học, lịch thi, danh sách sinh viên và hướng dẫn sử dụng.` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null); // to cancel stream

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  const getToken = () =>
    localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Add empty assistant message that we'll fill via stream
    const assistantPlaceholder = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantPlaceholder]);

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;
          try {
            const obj = JSON.parse(payload);
            if (obj.chunk) {
              // Append chunk to last assistant message
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + obj.chunk,
                };
                return updated;
              });
            }
            if (obj.error) {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: `Lỗi: ${obj.error}` };
                return updated;
              });
            }
          } catch (_) { }
        }
      }

      if (!isOpen) setHasUnread(true);
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Lỗi kết nối: ${err.message}`,
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Dragging state for Mascot
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem('chatbox_mascot_pos');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [isDraggingState, setIsDraggingState] = useState(false);
  const dragInfoRef = useRef(null);
  const isMovedRef = useRef(false);

  const startDrag = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Current position
    const currentX = pos ? pos.x : (window.innerWidth - 84);
    const currentY = pos ? pos.y : (window.innerHeight - 84);

    dragInfoRef.current = {
      startX: clientX,
      startY: clientY,
      elemX: currentX,
      elemY: currentY,
    };
    isMovedRef.current = false;

    const onMove = (moveEvent) => {
      if (!dragInfoRef.current) return;
      const curX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const curY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaX = curX - dragInfoRef.current.startX;
      const deltaY = curY - dragInfoRef.current.startY;

      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        isMovedRef.current = true;
        setIsDraggingState(true);
      }

      let newX = dragInfoRef.current.elemX + deltaX;
      let newY = dragInfoRef.current.elemY + deltaY;

      // Clamping inside viewport
      newX = Math.max(10, Math.min(window.innerWidth - 74, newX));
      newY = Math.max(10, Math.min(window.innerHeight - 74, newY));

      const newPos = { x: newX, y: newY };
      setPos(newPos);
    };

    const onEnd = () => {
      if (dragInfoRef.current && isMovedRef.current) {
        setPos((latestPos) => {
          if (latestPos) {
            try {
              localStorage.setItem('chatbox_mascot_pos', JSON.stringify(latestPos));
            } catch (_) {}
          }
          return latestPos;
        });
      }
      dragInfoRef.current = null;
      setTimeout(() => setIsDraggingState(false), 50);

      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  const handleFabClick = () => {
    if (isMovedRef.current) return; // ignore click if dragging
    setIsOpen(true);
  };

  if (!user) return null;

  // Calculate active mascot position (either custom pos or default bottom-right)
  const mascotX = pos ? pos.x : (window.innerWidth - 84);
  const mascotY = pos ? pos.y : (window.innerHeight - 84);

  const isBottomHalf = mascotY > (window.innerHeight / 2);
  const isRightHalf = mascotX > (window.innerWidth / 2);

  const quadrant = isBottomHalf
    ? (isRightHalf ? 'bottom-right' : 'bottom-left')
    : (isRightHalf ? 'top-right' : 'top-left');

  let wrapperStyle = {};
  if (isOpen) {
    const pWidth = isMaximized ? Math.min(window.innerWidth * 0.9, 950) : 450;
    const pHeight = isMaximized ? Math.min(window.innerHeight * 0.85, 580) : 580;

    let panelLeft;
    if (isRightHalf) {
      panelLeft = Math.max(60, Math.min(mascotX - pWidth + 50, window.innerWidth - pWidth - 65));
    } else {
      panelLeft = Math.max(60, Math.min(mascotX, window.innerWidth - pWidth - 65));
    }

    let panelTop;
    if (isBottomHalf) {
      panelTop = Math.max(20, Math.min(mascotY - pHeight + 50, window.innerHeight - pHeight - 20));
    } else {
      panelTop = Math.max(20, Math.min(mascotY, window.innerHeight - pHeight - 20));
    }

    wrapperStyle = {
      position: 'fixed',
      left: `${panelLeft}px`,
      top: `${panelTop}px`,
      zIndex: 9999,
    };
  } else if (pos) {
    wrapperStyle = {
      position: 'fixed',
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      zIndex: 9999,
    };
  }

  return (
    <div className={`chatbox-wrapper ${isDraggingState ? 'chatbox-wrapper--dragging' : ''}`} style={wrapperStyle}>
      {/* FAB — chỉ hiện khi chatbox đóng */}
      {!isOpen && (
        <div
          className="chatbox-fab"
          onClick={handleFabClick}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          role="button"
          tabIndex={0}
          aria-label="Mở hỗ trợ AI (Có thể kéo thả)"
          title="Kéo thả Mascot đến vị trí bất kỳ"
          id="chatbox-fab-btn"
          onKeyDown={e => e.key === 'Enter' && setIsOpen(true)}
        >
          <Mascot
            directions="/mascots/drone-directions.webp"
            reactions="/mascots/drone-reactions.webp"
            style={{ width: 56, height: 56, pointerEvents: 'none' }}
          />
          {hasUnread && <span className="chatbox-fab__badge" />}
        </div>
      )}

      {/* Panel */}
      {isOpen && (
        <div className={`chatbox-panel ${isMaximized ? 'chatbox-panel--maximized' : ''}`} id="chatbox-panel">
          {/* Mascot Robot AI nhỏ nhắn đính ở góc viền ngoài (Khoanh đỏ) */}
          <div
            className={`chatbox-mascot-corner chatbox-mascot-corner--${quadrant}`}
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            title="Kéo thả vị trí Mascot"
          >
            <Mascot
              directions="/mascots/drone-directions.webp"
              reactions="/mascots/drone-reactions.webp"
              style={{ width: 44, height: 44, pointerEvents: 'none' }}
            />
          </div>
          {/* Header */}
          <div className="chatbox-header">

            <div className="chatbox-header__info">
              <span className="chatbox-header__name">Trợ lý Hệ thống</span>
              <span className="chatbox-header__status">
                <span className={`chatbox-status-dot ${loading ? 'chatbox-status-dot--typing' : ''}`} />
                {loading
                  ? (messages[messages.length - 1]?.content ? 'Đang trả lời...' : 'Đang suy nghĩ...')
                  : 'Trực tuyến'}
              </span>
            </div>
            <button
              className="chatbox-header__action-btn"
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Thu nhỏ cửa sổ" : "Phóng to cửa sổ"}
              aria-label={isMaximized ? "Thu nhỏ" : "Phóng to"}
            >
              {isMaximized ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              )}
            </button>
            <button className="chatbox-header__close" onClick={() => setIsOpen(false)} aria-label="Đóng">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chatbox-messages" id="chatbox-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chatbox-msg chatbox-msg--${msg.role}`}>

                <div className="chatbox-msg__bubble">
                  {msg.content === '' && loading && idx === messages.length - 1 ? (
                    <div className="chatbox-thinking">
                      <span className="chatbox-thinking__label">AI đang suy nghĩ</span>
                      <div className="chatbox-thinking__dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  ) : (
                    msg.content.split('\n').map((line, i, arr) => (
                      <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
                    ))
                  )}
                  {/* Blinking cursor while streaming */}
                  {msg.role === 'assistant' && loading && idx === messages.length - 1 && msg.content !== '' && (
                    <span className="chatbox-cursor-blink" />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="chatbox-suggestions">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button key={i} className="chatbox-suggestion-btn" onClick={() => sendMessage(q)} disabled={loading}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chatbox-input-area">
            <textarea
              ref={inputRef}
              className="chatbox-input"
              id="chatbox-input"
              placeholder="Nhap cau hoi..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
              maxLength={1000}
            />
            <button
              className="chatbox-send-btn"
              id="chatbox-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="Gui"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBox;
