import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "../components/layout/Navbar";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  Code2,
  Compass,
  GraduationCap,
  LoaderCircle,
  Menu,
  MessageSquare,
  MessageSquarePlus,
  MoreHorizontal,
  PanelLeftClose,
  Plus,
  Sparkles,
  Trash2,
  User,
  Wifi,
  X,
} from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
};

const API_BASE_URL =  import.meta.env.VITE_API_BASE_URL || "https://skillora-backend-114x.onrender.com";
  

const createWelcomeMessage = (): ChatMessage => ({
  role: "assistant",
  content:
    "Hey! 👋 I'm Skillora AI, your personal learning companion. I can help you understand concepts, write code, debug projects, explore career paths, and much more. What would you like to work on today?",
});

const suggestions = [
  {
    title: "Learn something new",
    description: "Understand AI and machine learning",
    prompt:
      "Explain artificial intelligence and machine learning with examples.",
    icon: BrainCircuit,
  },
  {
    title: "Build a project",
    description: "Turn an idea into a working app",
    prompt:
      "Suggest a practical full-stack project I can build, including its features and technology stack.",
    icon: Code2,
  },
  {
    title: "Explore your career",
    description: "Discover skills and career paths",
    prompt:
      "Create a roadmap to become an AI engineer, starting from beginner level.",
    icon: Compass,
  },
  {
    title: "Get study help",
    description: "Break down difficult topics",
    prompt:
      "Teach me an important computer science concept in simple words with examples.",
    icon: GraduationCap,
  },
];

function getChatTitle(message: string) {
  const title = message.replace(/\s+/g, " ").trim();
  return title.length > 30 ? `${title.slice(0, 30)}…` : title;
}

function createId() {
  return crypto.randomUUID();
}

export default function AssistantPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const requestIdRef = useRef(0);
  const conversationRef = useRef<HTMLDivElement>(null);

  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? null;

  const messages = activeSession?.messages ?? [];

  const isWelcomeScreen =
    !activeSession ||
    (messages.length === 1 && messages[0].role === "assistant");

  // Scroll only the conversation panel, never the entire page.
  useEffect(() => {
    if (!isWelcomeScreen && conversationRef.current) {
      conversationRef.current.scrollTo({
        top: conversationRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading, isWelcomeScreen]);

  // Prevent the browser document itself from scrolling.
  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyMargin = document.body.style.margin;
    const previousBodyHeight = document.body.style.height;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.height = "100%";

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setShowChatMenu(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.margin = previousBodyMargin;
      document.body.style.height = previousBodyHeight;

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function updateSessionMessages(
    sessionId: string,
    updatedMessages: ChatMessage[],
  ) {
    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId
          ? { ...session, messages: updatedMessages }
          : session,
      ),
    );
  }

  function showWelcomeScreen() {
    if (loading) return;

    requestIdRef.current += 1;
    setActiveSessionId(null);
    setInput("");
    setError("");
    setShowChatMenu(false);
    setSidebarOpen(false);
  }

  function startNewChat() {
    if (loading) return;

    requestIdRef.current += 1;

    const newSession: ChatSession = {
      id: createId(),
      title: "New conversation",
      messages: [createWelcomeMessage()],
    };

    setSessions((current) => [newSession, ...current]);
    setActiveSessionId(newSession.id);
    setInput("");
    setError("");
    setShowChatMenu(false);
    setSidebarOpen(false);

    window.setTimeout(() => inputRef.current?.focus(), 50);
  }

  function openChat(sessionId: string) {
    if (loading) return;

    setActiveSessionId(sessionId);
    setInput("");
    setError("");
    setSidebarOpen(false);
    setShowChatMenu(false);
  }

  async function sendMessage(
    event?: FormEvent<HTMLFormElement>,
    suggestedMessage?: string,
  ) {
    event?.preventDefault();

    const text = (suggestedMessage ?? input).trim();

    if (!text || loading) return;

    let session = activeSession;

    if (!session) {
      session = {
        id: createId(),
        title: "New conversation",
        messages: [createWelcomeMessage()],
      };

      setSessions((current) => [session!, ...current]);
      setActiveSessionId(session.id);
    }

    const sessionId = session.id;

    // Keep the original welcome message out of the API history.
    const previousMessages = session.messages.filter(
      (message) =>
        !message.content.startsWith("Hey! 👋 I'm Skillora AI"),
    );

    const updatedMessages: ChatMessage[] = [
      ...previousMessages,
      { role: "user", content: text },
    ];

    const currentRequestId = ++requestIdRef.current;

    setSessions((current) =>
      current.map((item) =>
        item.id === sessionId
          ? {
              ...item,
              title:
                item.title === "New conversation"
                  ? getChatTitle(text)
                  : item.title,
              messages: updatedMessages,
            }
          : item,
      ),
    );

    setActiveSessionId(sessionId);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: previousMessages.slice(-10),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            `Request failed with status ${response.status}`,
        );
      }

      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The AI returned an empty response. Please try again.");
      }

      if (requestIdRef.current !== currentRequestId) return;

      updateSessionMessages(sessionId, [
        ...updatedMessages,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      if (requestIdRef.current !== currentRequestId) return;

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to Skillora AI.",
      );
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
        inputRef.current?.focus();
      }
    }
  }

  function clearCurrentChat() {
    if (loading || !activeSession) return;

    updateSessionMessages(activeSession.id, [createWelcomeMessage()]);

    setSessions((current) =>
      current.map((session) =>
        session.id === activeSession.id
          ? { ...session, title: "New conversation" }
          : session,
      ),
    );

    setError("");
    setInput("");
    setShowChatMenu(false);
  }

  function deleteChat(sessionId: string) {
    if (loading) return;

    const remaining = sessions.filter(
      (session) => session.id !== sessionId,
    );

    setSessions(remaining);

    if (activeSessionId === sessionId) {
      setActiveSessionId(remaining[0]?.id ?? null);
    }
  }

  function handleComposerKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="assistant-page flex h-[100dvh] flex-col overflow-hidden bg-[#070b14] text-white">
      {/* Website Navbar */}
      <div className="relative z-[60] shrink-0">
        <Navbar />
      </div>

      {/* AI workspace occupies the remaining viewport height */}
      <main
        className="relative flex min-h-0 w-full flex-1 overflow-hidden bg-[#070b14] text-white"
        style={{ overscrollBehavior: "none" }}
      >
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            absolute inset-y-0 left-0 z-50 flex h-full shrink-0
            flex-col overflow-hidden border-r border-white/[0.07]
            bg-[#0a0f1b] transition-all duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            ${
              sidebarCollapsed
                ? "w-[76px] lg:relative lg:w-[76px]"
                : "w-[270px] lg:relative lg:w-[270px]"
            }
            lg:inset-y-0 lg:translate-x-0
          `}
        >
          {/* Brand */}
          <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={showWelcomeScreen}
                className="flex min-w-0 items-center gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-gradient-to-br from-emerald-400/20 to-teal-400/5 text-emerald-300">
                  <BrainCircuit size={22} />
                </div>

                <span className="text-lg font-bold tracking-tight">
                  Skillora<span className="text-emerald-400"> AI</span>
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                } else {
                  setSidebarCollapsed((current) => !current);
                }
              }}
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
            >
              {sidebarOpen ? <X size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* New conversation */}
          <div className="shrink-0 px-3 pt-4">
            <button
              type="button"
              onClick={startNewChat}
              disabled={loading}
              title="New chat"
              className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.08] px-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-300/40 hover:bg-emerald-400/[0.14] disabled:opacity-40"
            >
              <MessageSquarePlus size={18} />
              {!sidebarCollapsed && <span>New chat</span>}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="shrink-0 px-5 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Workspace
              </div>

              <nav className="shrink-0 space-y-1 px-3">
                <button
                  type="button"
                  onClick={showWelcomeScreen}
                  className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm transition ${
                    !activeSessionId
                      ? "bg-white/[0.06] text-white"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <Sparkles size={17} className="text-emerald-400" />
                  New conversation
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/ai-recommendations";
                  }}
                  className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
                >
                  <GraduationCap size={17} />
                  AI recommendations
                </button>
              </nav>

              <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-6">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Recent chats
                </span>
                <MessageSquare size={14} className="text-slate-600" />
              </div>

              {/* Only this sidebar list may scroll */}
              <div className="hide-scrollbar smooth-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-3">
                {sessions.length === 0 ? (
                  <p className="px-3 py-3 text-xs leading-5 text-slate-600">
                    Your conversations will appear here.
                  </p>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group flex items-center gap-1 rounded-xl transition ${
                        activeSessionId === session.id
                          ? "bg-white/[0.07]"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => openChat(session.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
                      >
                        <MessageSquare
                          size={15}
                          className="shrink-0 text-slate-500"
                        />
                        <span className="truncate text-xs text-slate-300">
                          {session.title}
                        </span>
                      </button>

                      <button
                        type="button"
                        title="Delete conversation"
                        aria-label={`Delete ${session.title}`}
                        onClick={() => deleteChat(session.id)}
                        disabled={loading}
                        className="mr-2 rounded-md p-1.5 text-slate-600 transition hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-30"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="shrink-0 border-t border-white/[0.06] p-3">
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <Wifi size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-300">
                      Skillora AI
                    </p>
                    <p className="mt-1 truncate text-[11px] text-slate-600">
                      Your learning companion
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Main workspace */}
        <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* Fixed-height header */}
          <header className="z-20 flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#070b14] px-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                className="rounded-lg border border-white/[0.08] p-2 text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
              >
                <Menu size={18} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-sm font-semibold sm:text-base">
                    {activeSession?.title ?? "AI Workspace"}
                  </h1>
                  <ChevronDown size={14} className="shrink-0 text-slate-600" />
                </div>

                <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500 sm:text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  General-purpose AI assistant
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/[0.05] px-3 py-1.5 text-[11px] text-emerald-300 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                AI ready
              </div>

              <button
                type="button"
                onClick={startNewChat}
                disabled={loading}
                title="New chat"
                aria-label="New chat"
                className="rounded-xl border border-white/[0.08] p-2.5 text-slate-400 transition hover:border-emerald-400/30 hover:text-emerald-300 disabled:opacity-40"
              >
                <Plus size={18} />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowChatMenu((current) => !current)}
                  title="Conversation options"
                  aria-label="Conversation options"
                  className="rounded-xl border border-white/[0.08] p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <MoreHorizontal size={18} />
                </button>

                {showChatMenu && (
                  <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-white/10 bg-[#101725] p-1.5 shadow-2xl">
                    <button
                      type="button"
                      onClick={clearCurrentChat}
                      disabled={loading || !activeSession}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                      Clear current chat
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowChatMenu(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                      <X size={15} />
                      Close menu
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content region fills the remaining viewport */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {isWelcomeScreen ? (
              /* Welcome screen without page scrolling */
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
                <div className="w-full max-w-3xl">
                  <div className="mb-3 flex justify-center sm:mb-4">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-gradient-to-br from-emerald-300/15 via-emerald-400/[0.05] to-teal-400/10 shadow-[0_0_35px_rgba(52,211,153,0.08)] sm:h-12 sm:w-12">
                      <BrainCircuit
                        size={24}
                        className="text-emerald-300"
                      />
                      <Sparkles
                        size={12}
                        className="absolute -right-1 -top-1 text-emerald-200"
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[9px] text-slate-400 sm:mb-4 sm:text-[10px]">
                      <Sparkles size={12} className="text-emerald-300" />
                      YOUR PERSONAL AI WORKSPACE
                    </div>

                    <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl xl:text-[44px]">
                      What are we{" "}
                      <span className="bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
                        exploring
                      </span>{" "}
                      today?
                    </h2>

                    <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-slate-400 sm:mt-3 sm:text-sm sm:leading-6">
                      Ask questions, solve problems, build projects, or learn
                      something new. Let&apos;s turn your curiosity into progress.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-3">
                    {suggestions.map((suggestion) => {
                      const Icon = suggestion.icon;

                      return (
                        <button
                          key={suggestion.title}
                          type="button"
                          onClick={() =>
                            void sendMessage(undefined, suggestion.prompt)
                          }
                          disabled={loading}
                          className="group flex min-h-[66px] items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-left transition duration-200 hover:border-emerald-400/25 hover:bg-emerald-400/[0.035] disabled:opacity-50 sm:min-h-[76px] sm:gap-3.5 sm:p-3.5"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-400/[0.07] text-emerald-300 transition group-hover:bg-emerald-400/[0.12]">
                            <Icon size={18} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-semibold text-slate-200 transition group-hover:text-emerald-200 sm:text-sm">
                              {suggestion.title}
                            </h3>
                            <p className="mt-1 text-[10px] leading-4 text-slate-500 sm:text-xs">
                              {suggestion.description}
                            </p>
                          </div>

                          <ArrowDown
                            size={14}
                            className="-rotate-45 shrink-0 text-slate-600 transition group-hover:text-emerald-300"
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-2 text-center text-[9px] text-slate-600 sm:mt-4 sm:text-[10px]">
                    <Check
                      size={12}
                      className="shrink-0 text-emerald-400/70"
                    />
                    Programming · AI · Data science · Projects · Careers
                  </div>
                </div>
              </div>
            ) : (
              /* Only the conversation panel scrolls */
              <div
                ref={conversationRef}
                className="hide-scrollbar smooth-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
              >
                <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
                  {messages.map((message, index) => (
                    <article
                      key={`${activeSessionId}-${index}`}
                      className={`flex items-start gap-3 sm:gap-4 ${
                        message.role === "user" ? "justify-end" : ""
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300">
                          <Bot size={19} />
                        </div>
                      )}

                      <div
                        className={`min-w-0 ${
                          message.role === "user"
                            ? "max-w-[88%] rounded-2xl rounded-tr-md border border-emerald-300/10 bg-emerald-400/[0.09] px-4 py-3 text-slate-100 sm:max-w-[80%] sm:px-5"
                            : "flex-1 pt-1 text-slate-300"
                        }`}
                      >
                        <div className="mb-2 text-[11px] font-medium text-slate-500">
                          {message.role === "assistant" ? "Skillora AI" : "You"}
                        </div>

                        {message.role === "assistant" ? (
                          <div
                            className="
                              max-w-none break-words text-sm leading-7
                              [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white
                              [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white
                              [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-emerald-300
                              [&_p]:my-3
                              [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6
                              [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6
                              [&_li]:pl-1
                              [&_strong]:font-semibold [&_strong]:text-white
                              [&_em]:italic
                              [&_a]:text-emerald-300 [&_a]:underline [&_a]:underline-offset-4
                              [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-emerald-400/50 [&_blockquote]:pl-4 [&_blockquote]:text-slate-400
                              [&_hr]:my-5 [&_hr]:border-white/10
                              [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse
                              [&_th]:border [&_th]:border-white/10 [&_th]:bg-white/5 [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold
                              [&_td]:border [&_td]:border-white/10 [&_td]:p-2
                              [&_pre]:my-4 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-white/10 [&_pre]:bg-[#03060c] [&_pre]:p-4
                              [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-slate-200
                              [&_code]:rounded [&_code]:bg-white/[0.07] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-emerald-200
                            "
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                a: ({ ...props }) => (
                                  <a
                                    {...props}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  />
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap break-words text-sm leading-7">
                            {message.content}
                          </div>
                        )}
                      </div>

                      {message.role === "user" && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-400/15 bg-indigo-400/[0.08] text-indigo-300">
                          <User size={18} />
                        </div>
                      )}
                    </article>
                  ))}

                  {loading && (
                    <div className="flex items-start gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300">
                        <Bot size={19} />
                      </div>

                      <div className="pt-1">
                        <p className="mb-3 text-[11px] font-medium text-slate-500">
                          Skillora AI
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <LoaderCircle
                            size={16}
                            className="animate-spin text-emerald-300"
                          />
                          Thinking through your question…
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div
                      role="alert"
                      className="ml-12 rounded-xl border border-red-400/20 bg-red-400/[0.04] p-4 text-sm leading-6 text-red-300"
                    >
                      <p>{error}</p>
                      <p className="mt-2 text-xs text-red-300/70">
                        Your message is still available above. You can send it
                        again to retry.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Composer stays at the bottom of the workspace */}
            <div className="z-20 shrink-0 border-t border-white/[0.05] bg-[#070b14] px-3 pb-2 pt-2 sm:px-6 sm:pb-3 sm:pt-3 lg:px-8">
              <div className="mx-auto w-full max-w-3xl">
                <form
                  onSubmit={(event) => void sendMessage(event)}
                  className="rounded-2xl border border-white/[0.10] bg-[#101624] shadow-[0_12px_45px_rgba(0,0,0,0.22)] transition focus-within:border-emerald-400/30"
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Message Skillora AI..."
                    rows={1}
                    maxLength={10000}
                    disabled={loading}
                    aria-label="Your message"
                    className="hide-scrollbar max-h-24 min-h-[46px] w-full resize-none overflow-y-auto bg-transparent px-4 pb-1 pt-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 disabled:opacity-60 sm:px-5"
                  />

                  <div className="flex items-center justify-between gap-3 px-3 pb-2">
                    <div className="flex min-w-0 items-center gap-2 pl-1 text-[10px] text-slate-600 sm:text-[11px]">
                      <Sparkles
                        size={13}
                        className="shrink-0 text-emerald-400/70"
                      />
                      <span className="truncate">
                        Ask anything. Learn something new.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      aria-label="Send message"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-[#07120e] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {loading ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : (
                        <ArrowUp size={19} />
                      )}
                    </button>
                  </div>
                </form>

                <p className="mt-1.5 text-center text-[9px] leading-4 text-slate-600 sm:text-[10px]">
                  Skillora AI can make mistakes. Verify important information.
                  <span className="hidden sm:inline">
                    {" "}Press Enter to send · Shift + Enter for a new line
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}