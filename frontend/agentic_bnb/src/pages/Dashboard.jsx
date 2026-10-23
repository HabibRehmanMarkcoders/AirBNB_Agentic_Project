import { useEffect, useRef, useState } from 'react'
import { LogOut, Menu, Pencil, SquarePen, Trash2, X } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import AirbnbLogo from '../components/AirbnbLogo'
import { useAuth } from '../context/AuthContext'
import * as chatStore from '../lib/chatStore'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const SAVE_DEBOUNCE_MS = 300

function createChat(title = 'New chat') {
  return {
    id: crypto.randomUUID(),
    title,
    messages: [],
    createdAt: Date.now(),
  }
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const userName = user?.username || user?.name || ''
  const [chats, setChats] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [ready, setReady] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const inputRef = useRef(null)
  const renameInputRef = useRef(null)
  const saveTimerRef = useRef(null)
  const chatStageRef = useRef(null)
  const messagesEndRef = useRef(null)
  const savedChatsRef = useRef([])

  const activeChat = chats.find((c) => c.id === activeId) || chats[0]
  const messageCount = activeChat?.messages?.length || 0
  const savedChats = chats.filter((c) => c.messages.length > 0)
  savedChatsRef.current = savedChats
  const isNewChatDisabled = savedChats.length === 0

  const scrollChatToBottom = (behavior = 'smooth') => {
    const stage = chatStageRef.current
    if (stage) {
      stage.scrollTo({ top: stage.scrollHeight, behavior })
    }
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' })
  }

  useEffect(() => {
    if (!ready || messageCount === 0) return
    scrollChatToBottom(sending ? 'auto' : 'smooth')
  }, [ready, activeId, messageCount, sending])

  useEffect(() => {
    if (!user?.id) return undefined

    let cancelled = false
    setReady(false)
    setChats([])
    setActiveId(null)
    setDraft('')
    setRenamingId(null)
    setRenameValue('')

    async function hydrate() {
      try {
        const stored = await chatStore.loadAll(user.id)
        if (cancelled) return

        if (stored.length === 0) {
          const first = createChat()
          setChats([first])
          setActiveId(first.id)
          chatStore.setActiveId(user.id, first.id)
        } else {
          const savedActive = chatStore.getActiveId(user.id)
          const nextActive = stored.find((c) => c.id === savedActive)?.id || stored[0].id
          setChats(stored)
          setActiveId(nextActive)
          chatStore.setActiveId(user.id, nextActive)
        }
      } catch {
        if (cancelled) return
        const first = createChat()
        setChats([first])
        setActiveId(first.id)
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    inputRef.current?.focus()
  }, [activeId])

  useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [renamingId])

  useEffect(() => {
    if (!ready || !activeId || !user?.id) return
    chatStore.setActiveId(user.id, activeId)
  }, [activeId, ready, user?.id])

  useEffect(() => {
    if (!ready || !user?.id) return

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      chatStore.saveAll(user.id, chats).catch(() => {
        // Persistence failures should not break chat UI
      })
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [chats, ready, user?.id])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = async () => {
    closeMenu()
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNewChat = () => {
    if (savedChatsRef.current.length === 0) return

    const chat = createChat()
    setChats((prev) => [chat, ...prev])
    setActiveId(chat.id)
    setDraft('')
    setRenamingId(null)
    closeMenu()
  }

  const selectChat = (chatId) => {
    setActiveId(chatId)
    closeMenu()
  }

  const startRename = (chat, e) => {
    e.stopPropagation()
    setRenamingId(chat.id)
    setRenameValue(chat.title || '')
  }

  const commitRename = () => {
    if (!renamingId) return
    const nextTitle = renameValue.trim() || 'Untitled chat'
    setChats((prev) =>
      prev.map((chat) => (chat.id === renamingId ? { ...chat, title: nextTitle } : chat)),
    )
    setRenamingId(null)
    setRenameValue('')
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameValue('')
  }

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitRename()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelRename()
    }
  }

  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation()
    const remaining = chats.filter((chat) => chat.id !== chatId)

    if (remaining.length === 0) {
      const fresh = createChat()
      setChats([fresh])
      setActiveId(fresh.id)
    } else {
      setChats(remaining)
      if (activeId === chatId) {
        const next =
          remaining.find((c) => c.messages.length > 0) || remaining[0]
        setActiveId(next.id)
      }
    }

    if (renamingId === chatId) {
      setRenamingId(null)
      setRenameValue('')
    }
  }

  const appendMessages = (chatId, messages, title) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) return chat
        return {
          ...chat,
          title: title ?? chat.title,
          messages: [...chat.messages, ...messages],
        }
      }),
    )
  }

  const handleSend = async (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || !activeChat || sending) return

    const chatId = activeChat.id
    const isFirst = activeChat.messages.length === 0
    const userMessage = { id: crypto.randomUUID(), role: 'user', text }

    appendMessages(chatId, [userMessage])
    setDraft('')
    setSending(true)

    try {
      const history = activeChat.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, text: m.text }))

      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
        signal: AbortSignal.timeout(45000),
      })

      const payload = await res.json().catch(() => ({}))

      if (!res.ok || !payload.success) {
        appendMessages(chatId, [
          {
            id: crypto.randomUUID(),
            role: 'error',
            text: payload.message || 'Something went wrong. Please try again.',
          },
        ])
        return
      }

      const aiTitle = isFirst ? payload.data?.title : undefined
      appendMessages(
        chatId,
        [
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: payload.data?.reply || 'No reply received.',
          },
        ],
        aiTitle,
      )
    } catch (err) {
      const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError'
      appendMessages(chatId, [
        {
          id: crypto.randomUUID(),
          role: 'error',
          text: timedOut
            ? 'Reply timed out. Please try again.'
            : 'Could not reach the server. Is the backend running?',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  if (!ready) {
    return (
      <div className="dash">
        <main className="dash-main">
          <div className="dash-stage">
            <p className="recent-empty">Loading chats…</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={menuOpen ? 'dash menu-open' : 'dash'}>
      <button
        type="button"
        className="menu-backdrop"
        aria-label="Close menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={closeMenu}
      />

      <aside className="dash-sidebar" id="dash-sidebar">
        <div className="sidebar-top">
          <div className="dash-brand">
            <AirbnbLogo size={26} />
            <span>Air BNB</span>
          </div>
          <button
            type="button"
            className="menu-close-btn"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <button
          type="button"
          className="new-chat-btn"
          onClick={handleNewChat}
          disabled={isNewChatDisabled}
          aria-disabled={isNewChatDisabled}
        >
          <span className="new-chat-icon" aria-hidden="true">
            <SquarePen size={16} strokeWidth={2} />
          </span>
          New chat
        </button>

        <div className="recent-section">
          <h2>Recent Chats</h2>
          {savedChats.length === 0 ? (
            <p className="recent-empty">No chats yet</p>
          ) : (
            <ul className="recent-list">
              {savedChats.map((chat) => {
                const isActive = chat.id === activeId
                const isRenaming = renamingId === chat.id

                return (
                  <li key={chat.id} className={isActive ? 'recent-row active' : 'recent-row'}>
                    {isRenaming ? (
                      <input
                        ref={renameInputRef}
                        className="rename-input"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={handleRenameKeyDown}
                        aria-label="Rename chat"
                      />
                    ) : (
                      <button
                        type="button"
                        className="recent-item"
                        onClick={() => selectChat(chat.id)}
                        title={chat.title}
                      >
                        <span className="recent-title">{chat.title}</span>
                      </button>
                    )}

                    {!isRenaming ? (
                      <div className="recent-actions">
                        <button
                          type="button"
                          className="recent-action rename"
                          onClick={(e) => startRename(chat, e)}
                          aria-label={`Rename ${chat.title}`}
                          title="Rename"
                        >
                          <Pencil size={14} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="recent-action delete"
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          aria-label={`Delete ${chat.title}`}
                          title="Delete"
                        >
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="user-avatar">{userName.charAt(0).toUpperCase()}</span>
            <span className="user-name">{userName}</span>
          </div>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            <LogOut size={15} strokeWidth={2} aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <header className="mobile-topbar">
          <button
            type="button"
            className="menu-toggle-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-controls="dash-sidebar"
            aria-expanded={menuOpen}
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <div className="mobile-topbar-brand">
            <AirbnbLogo size={22} />
            <span>Air BNB</span>
          </div>
          <button
            type="button"
            className="mobile-new-chat"
            onClick={handleNewChat}
            disabled={isNewChatDisabled}
            aria-disabled={isNewChatDisabled}
            aria-label="New chat"
          >
            <SquarePen size={18} strokeWidth={2} />
          </button>
        </header>

        <div className="dash-stage" ref={chatStageRef}>
          {activeChat?.messages.length === 0 ? (
            <div className="welcome-box">
              <p>
                Wanna fly high <span className="welcome-name">{userName}</span>
              </p>
            </div>
          ) : (
            <div className="message-list">
              {activeChat.messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <p>{msg.text}</p>
                </div>
              ))}
              {sending ? (
                <div className="message assistant pending">
                  <p>Thinking…</p>
                </div>
              ) : null}
              <div ref={messagesEndRef} aria-hidden="true" />
            </div>
          )}
        </div>

        <form className="composer" onSubmit={handleSend}>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Whats new today..."
            aria-label="Message"
            disabled={sending}
          />
          <button type="submit" className="send-btn" disabled={!draft.trim() || sending} aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </main>
    </div>
  )
}
