import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CornerDownLeft, Minimize2, Trash2 } from "lucide-react";
import {
  CHATBOT_OPEN_EVENT,
  sendChatbotMessage,
} from "../api";
import { useSharedNotifications } from "../hooks/useSharedNotifications";
import { getCachedAuthenticatedSession, getCurrentSession, waitForAuthenticatedSession } from "../lib/authClient.js";
import chatbotIcon from "../assets/chatbot-icon-professional.png";
import chatbotGreeting from "../assets/chatbot-greeting.mp3";

const QUICK_PROMPTS = [
  "How do I classify a question?",
  "Explain my dashboard stats",
  "Why is the LLM slow?",
];

const STARTER_MESSAGE = {
  role: "assistant",
  content:
    "Welcome to QDCA. I can help with question classification, dashboard insights, subject detection, PDF analysis, RAG guidance, and LLM troubleshooting.",
};
const CHATBOT_REQUEST_TIMEOUT_MS = 35000;

export default function AiChatbot({ initiallyOpen = false }) {
  const [session, setSession] = useState(() => getCachedAuthenticatedSession() ?? undefined);
  const [open, setOpen] = useState(initiallyOpen);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([STARTER_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const viewportRef = useRef(null);
  const greetingAudioRef = useRef(null);
  const greetingAudioUrlRef = useRef(null);
  const greetingAudioLoadPromiseRef = useRef(null);
  const greetingAudioEndedHandlerRef = useRef(null);
  const hasPlayedGreetingRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const { unreadCount: notificationCount } = useSharedNotifications();

  useEffect(() => {
    let cancelled = false;

    async function resolveSession() {
      try {
        const currentSession = await getCurrentSession();
        const resolvedSession = currentSession?.user?.id
          ? currentSession
          : await waitForAuthenticatedSession({ attempts: 3, delayMs: 200 });

        if (!cancelled) {
          setSession(resolvedSession || null);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
        }
      }
    }

    resolveSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const ensureGreetingAudio = useCallback(async () => {
    if (greetingAudioRef.current) {
      return greetingAudioRef.current;
    }

    if (!greetingAudioLoadPromiseRef.current) {
      greetingAudioLoadPromiseRef.current = (async () => {
        try {
          const response = await fetch(chatbotGreeting, {
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error("Greeting audio could not be loaded.");
          }

          const audioBlob = await response.blob();
          const objectUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(objectUrl);
          audio.preload = "metadata";

          const handleEnded = () => {
            audio.pause();
            audio.currentTime = 0;
          };

          audio.addEventListener("ended", handleEnded);
          greetingAudioEndedHandlerRef.current = handleEnded;
          greetingAudioUrlRef.current = objectUrl;
          greetingAudioRef.current = audio;

          return audio;
        } catch {
          return null;
        } finally {
          greetingAudioLoadPromiseRef.current = null;
        }
      })();
    }

    return greetingAudioLoadPromiseRef.current;
  }, []);

  const playGreetingAudio = useCallback(async (force = false) => {
    const audio = await ensureGreetingAudio();
    if (!audio) return;
    if (hasPlayedGreetingRef.current && !force) return;

    hasPlayedGreetingRef.current = true;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      hasPlayedGreetingRef.current = false;
    });
  }, [ensureGreetingAudio]);

  function openAssistant() {
    setOpen(true);
    void playGreetingAudio();
  }

  useEffect(() => {
    if (open) {
      const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 180);
      return () => window.clearTimeout(focusTimer);
    }
  }, [open]);

  useEffect(() => {
    if (!initiallyOpen) return undefined;
    setOpen(true);
    return undefined;
  }, [initiallyOpen]);

  useEffect(() => {
    if (!open) return undefined;
    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
      void playGreetingAudio();
    }

    window.addEventListener(CHATBOT_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(CHATBOT_OPEN_EVENT, handleOpen);
  }, [playGreetingAudio]);

  useEffect(() => {
    if (!open || hasPlayedGreetingRef.current) return undefined;
    void playGreetingAudio();

    return undefined;
  }, [open, playGreetingAudio]);

  useEffect(() => {
    if (open) return undefined;
    const audio = greetingAudioRef.current;
    if (!audio || audio.ended) return undefined;
    audio.pause();
    audio.currentTime = 0;
    return undefined;
  }, [open]);

  useEffect(() => {
    return () => {
      const audio = greetingAudioRef.current;
      const handleEnded = greetingAudioEndedHandlerRef.current;

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        if (handleEnded) {
          audio.removeEventListener("ended", handleEnded);
        }
      }

      if (greetingAudioUrlRef.current) {
        URL.revokeObjectURL(greetingAudioUrlRef.current);
      }

      greetingAudioEndedHandlerRef.current = null;
      greetingAudioUrlRef.current = null;
      greetingAudioRef.current = null;
      greetingAudioLoadPromiseRef.current = null;
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function submitMessage(text = input) {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CHATBOT_REQUEST_TIMEOUT_MS);

    try {
      const response = await sendChatbotMessage(toApiMessages(nextMessages), {
        signal: controller.signal,
      });
      setMessages([...nextMessages, { role: "assistant", content: response.reply }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (error?.name === "AbortError" || message.toLowerCase().includes("timed out")) {
        setError("The AI assistant took too long to respond. Please try again.");
      } else {
        setError(message || "I could not reach the AI assistant. Check that the backend and Ollama are running.");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitMessage();
  }

  const messageMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10, scale: 0.985 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 4 },
        transition: { duration: 0.24, ease: "easeOut" },
      };

  return (
    <div ref={viewportRef} className="pointer-events-none fixed inset-0 z-[70]">
      <AnimatePresence>
        {open && (
          <motion.section
            id="qdca-ai-assistant"
            role="dialog"
            aria-modal="false"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            style={{ transformOrigin: "bottom right" }}
            className="pointer-events-auto absolute bottom-4 right-4 flex h-[min(620px,calc(100dvh-32px))] w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-2xl shadow-purple-950/15 sm:bottom-6 sm:right-6 sm:w-[390px]"
            aria-label="QDCA AI assistant"
          >
            <header className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={chatbotIcon}
                  alt="QDCA AI Assistant"
                  className="h-10 w-10 shrink-0 rounded-xl object-cover ring-2 ring-purple-100"
                />
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-gray-900">QDCA</h2>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <span
                      className={`inline-block h-2 w-2 rounded-full bg-emerald-500 ${
                        shouldReduceMotion ? "" : "animate-pulse"
                      }`}
                      aria-hidden="true"
                    />
                    <span>Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
                  aria-label="Minimize assistant"
                >
                  <Minimize2 className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => setMessages([STARTER_MESSAGE])}
                  className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
                  aria-label="Clear chat"
                  title="Clear conversation"
                >
                  <Trash2 className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </header>

            <div
              ref={listRef}
              className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50/90 px-4 py-4 pr-3 sm:pr-4"
              aria-live="polite"
              aria-relevant="additions text"
            >
              <div className="space-y-4 pb-1">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <ChatBubble
                      key={`${message.role}-${index}`}
                      message={message}
                      avatarSrc={chatbotIcon}
                      shouldReduceMotion={shouldReduceMotion}
                      motionProps={messageMotion}
                    />
                  ))}

                  {loading && (
                    <TypingMessage
                      key="assistant-typing"
                      avatarSrc={chatbotIcon}
                      shouldReduceMotion={shouldReduceMotion}
                      motionProps={messageMotion}
                    />
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

            </div>

            <div className="border-t border-gray-100 bg-white px-4 py-3">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submitMessage(prompt)}
                    className="shrink-0 rounded-full border border-purple-100 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm transition-transform transition-shadow duration-200 hover:-translate-y-0.5 hover:bg-purple-50 hover:shadow-md active:scale-[0.98]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={!session}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      submitMessage();
                    }
                  }}
                  rows={1}
                  placeholder="Ask about QDCA..."
                  className="max-h-24 min-h-11 flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition-shadow transition-colors focus:border-purple-300 focus:ring-2 focus:ring-purple-200 focus:shadow-[0_0_0_4px_rgba(168,85,247,0.14)]"
                />
                <button
                  type="submit"
                  disabled={!session || loading || !input.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-200 transition-transform transition-colors duration-200 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  aria-label="Send message"
                >
                  <CornerDownLeft className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {!open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: [0, -6, 0] }}
          transition={shouldReduceMotion ? { duration: 0.18 } : { duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="pointer-events-none absolute bottom-4 right-4 sm:bottom-6 sm:right-6"
        >
          <motion.button
            type="button"
            drag
            dragConstraints={viewportRef}
            dragElastic={0}
            dragMomentum={false}
            onClick={openAssistant}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="group pointer-events-auto relative flex h-14 w-14 touch-none cursor-grab items-center justify-center rounded-2xl bg-purple-600 text-white shadow-2xl shadow-purple-900/25 ring-4 ring-white/80 active:cursor-grabbing"
            aria-label="Open AI assistant. Drag to reposition."
            aria-expanded="false"
            aria-controls="qdca-ai-assistant"
            title="Ask QDCA AI"
          >
            <img src={chatbotIcon} alt="" className="h-14 w-14 rounded-2xl object-cover" />
            {notificationCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
            <span className="pointer-events-none absolute right-[calc(100%+16px)] top-1/2 z-20 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 md:block">
              Ask QDCA AI
            </span>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

function toApiMessages(messages) {
  return messages.map(({ role, content }) => ({ role, content }));
}

function ChatBubble({ message, avatarSrc, shouldReduceMotion, motionProps }) {
  const isUser = message.role === "user";
  const wrapperClass = isUser ? "justify-end" : "justify-start";
  const bubbleClass = isUser
    ? "rounded-[22px] rounded-br-md bg-purple-600 px-4 py-3 text-white shadow-[0_12px_30px_rgba(126,34,206,0.16)]"
    : "rounded-[22px] rounded-bl-md border border-purple-100/80 bg-white px-4 py-3 text-gray-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)]";

  return (
    <motion.div {...motionProps} className={`flex w-full ${wrapperClass}`}>
      <div
        className={`flex w-full items-end gap-2.5 ${isUser ? "max-w-[82%] flex-row-reverse pl-10" : "max-w-[88%] pr-6"}`}
      >
        {!isUser && <AssistantAvatar src={avatarSrc} isThinking={false} shouldReduceMotion={shouldReduceMotion} />}
        <div
          className={`${bubbleClass} min-w-[68px] max-w-full whitespace-pre-wrap break-words text-sm leading-relaxed`}
        >
          {message.content}
        </div>
      </div>
    </motion.div>
  );
}

function TypingMessage({ avatarSrc, shouldReduceMotion, motionProps }) {
  return (
    <motion.div {...motionProps} className="flex justify-start" aria-live="polite" aria-label="QDCA is typing">
      <div className="flex w-full max-w-[88%] items-end gap-2.5 pr-6">
        <AssistantAvatar src={avatarSrc} isThinking shouldReduceMotion={shouldReduceMotion} />
        <div className="rounded-[22px] rounded-bl-md border border-purple-100/80 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <TypingIndicator shouldReduceMotion={shouldReduceMotion} />
        </div>
      </div>
    </motion.div>
  );
}

function AssistantAvatar({ src, isThinking, shouldReduceMotion }) {
  return (
    <div className="relative mb-0.5 h-9 w-9 shrink-0">
      {isThinking && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-purple-400/30 blur-md"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1, 1.18, 1],
                  opacity: [0.3, 0.55, 0.3],
                }
          }
          transition={{
            duration: 1.8,
            ease: "easeInOut",
            repeat: shouldReduceMotion ? 0 : Number.POSITIVE_INFINITY,
          }}
        />
      )}
      <motion.img
        src={src}
        alt=""
        className="relative h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm"
        animate={
          isThinking && !shouldReduceMotion
            ? {
                scale: [1, 1.04, 1],
              }
            : undefined
        }
        transition={{
          duration: 1.8,
          ease: "easeInOut",
          repeat: isThinking && !shouldReduceMotion ? Number.POSITIVE_INFINITY : 0,
        }}
      />
    </div>
  );
}

function TypingIndicator({ shouldReduceMotion }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="h-2 w-2 rounded-full bg-purple-400"
          animate={
            shouldReduceMotion
              ? { opacity: 0.6 }
              : {
                  opacity: [0.35, 1, 0.35],
                  y: [0, -2, 0],
                }
          }
          transition={{
            duration: 0.9,
            ease: "easeInOut",
            repeat: shouldReduceMotion ? 0 : Number.POSITIVE_INFINITY,
            delay: dot * 0.12,
          }}
        />
      ))}
    </div>
  );
}
