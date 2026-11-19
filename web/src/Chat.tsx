import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Database,
  Layers,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./chat.css";

import type { ChatScreen } from "./types";
type Source = { label: string; href: string };
type Turn = { role: "user" | "assistant"; content: string; sources?: Source[] };
type ChatResponse = { answer: string; sources: Source[] };

const prompts = [
  {
    icon: Database,
    question: "How many Tier A companies are in Canada?",
    label: "Count companies",
  },
  {
    icon: Layers,
    question: "Why do the top 10 combinations tie?",
    label: "Explain a finding",
  },
  {
    icon: BookOpen,
    question: "How did you value companies with no reported revenue?",
    label: "Explain the method",
  },
];
const hosted = import.meta.env.VITE_CLOUDFLARE_STATIC === "1";

export function Chat({
  open,
  screen,
  onOpenChange,
}: {
  open: boolean;
  screen: ChatScreen;
  onOpenChange: (open: boolean) => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [error, setError] = useState("");
  const launcher = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const pending = pendingQuestion !== "";

  useEffect(() => {
    if (open && (turns.length || pendingQuestion) && body.current) {
      body.current.scrollTop = body.current.scrollHeight;
    }
  }, [open, turns, pendingQuestion]);

  function close() {
    onOpenChange(false);
    launcher.current?.focus();
  }

  function toggle() {
    if (open) close();
    else {
      onOpenChange(true);
      // Focus the panel without opening the software keyboard on mobile.
      requestAnimationFrame(() => closeButton.current?.focus());
    }
  }

  async function ask() {
    const content = question.trim();
    if (!content || pending) return;
    const userTurn = { role: "user", content } as const;
    const history = [userTurn] as Pick<Turn, "role" | "content">[];
    let length = content.length;
    // Keep a short recent history so follow-ups work within the Worker limits.
    for (const turn of turns.slice(-8).reverse()) {
      const excerpt = turn.content.slice(0, 2000);
      if (length + excerpt.length > 7400) break;
      history.unshift({ role: turn.role, content: excerpt });
      length += excerpt.length;
    }

    setError("");
    setPendingQuestion(content);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: history, screen }),
        signal: AbortSignal.timeout(65000),
      });
      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        setError(failure?.error ?? "Chat is unavailable. Try again.");
        return;
      }
      const result: ChatResponse = await response.json();
      setTurns((previous) => [
        ...previous,
        userTurn,
        { role: "assistant", content: result.answer, sources: result.sources },
      ]);
      setQuestion("");
    } catch {
      setError(
        "The answer took too long or the connection dropped. Try again.",
      );
    } finally {
      setPendingQuestion("");
    }
  }

  const hostedLocation = new URLSearchParams(window.location.hash.slice(1));
  hostedLocation.set("chat", "1");
  if (screen.account) hostedLocation.set("about", screen.account);

  return (
    <div className="chat-dock">
      <section
        className="chat-panel"
        id="workbench-chat"
        aria-labelledby="workbench-chat-title"
        hidden={!open}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            close();
          }
        }}
      >
        <div className="chat-panel-heading">
          <h2 id="workbench-chat-title">Ask about the companies and results</h2>
          <div className="chat-panel-actions">
            {hosted && (
              <button
                className="button secondary"
                type="button"
                title="Start over. Refreshing also clears this conversation."
                disabled={pending || !turns.length}
                onClick={() => {
                  setTurns([]);
                  setQuestion("");
                  setError("");
                }}
              >
                New chat
              </button>
            )}
            <button
              ref={closeButton}
              className="icon-button"
              type="button"
              aria-label="Minimize chat"
              onClick={close}
            >
              <X size={19} aria-hidden="true" />
            </button>
          </div>
        </div>
        {!hosted ? (
          <div className="chat-hosted-link">
            <p>
              The online edition can answer questions using the submitted files.
            </p>
            <a
              className="button primary"
              href={`https://ninetynine-acquisition-workbench.imrahman.workers.dev/#${hostedLocation}`}
            >
              Open hosted chat <ArrowUpRight size={15} />
            </a>
          </div>
        ) : (
          <>
            <div className="chat-body" ref={body}>
              {!turns.length && !pending && (
                <div className="chat-starters">
                  {[
                    {
                      icon: BookOpen,
                      label: "Start here",
                      question:
                        screen.page === "groups" && !screen.account
                          ? "Explain the group on my screen in three sentences."
                          : "Explain company " +
                            (screen.account || "0004") +
                            " in three sentences.",
                    },
                    ...prompts,
                  ].map(({ label, question, icon: Icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setQuestion(question)}
                    >
                      <Icon size={20} aria-hidden="true" />
                      <strong>{label}</strong>
                      <span>{question}</span>
                    </button>
                  ))}
                </div>
              )}
              <div
                className="chat-transcript"
                role="log"
                aria-label="Conversation"
              >
                {turns.map(({ role, content, sources }, index) => (
                  <article className={"chat-turn " + role} key={index}>
                    <strong>{role === "user" ? "You" : "Workbench"}</strong>
                    {role === "assistant" ? (
                      <div className="chat-answer">
                        <Markdown
                          skipHtml
                          unwrapDisallowed
                          remarkPlugins={[remarkGfm]}
                          disallowedElements={["a", "img", "input"]}
                        >
                          {content}
                        </Markdown>
                      </div>
                    ) : (
                      <p>{content}</p>
                    )}
                    {sources?.length ? (
                      <div className="chat-sources" aria-label="Sources">
                        {sources.map((source) => (
                          <a href={source.href} key={source.href}>
                            {source.label} <ArrowUpRight size={13} />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
                {pending && (
                  <>
                    <article className="chat-turn user">
                      <strong>You</strong>
                      <p>{pendingQuestion}</p>
                    </article>
                    <p className="chat-pending" role="status">
                      Checking the submission and company data…
                    </p>
                  </>
                )}
              </div>
            </div>
            <form
              className="chat-form"
              onSubmit={(event) => {
                event.preventDefault();
                void ask();
              }}
            >
              <label className="chat-question">
                <span>Your question</span>
                <textarea
                  rows={3}
                  placeholder="What do you want to know?"
                  maxLength={2000}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  disabled={pending}
                  required
                />
              </label>
              {error && (
                <p className="chat-error" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="button primary"
                disabled={pending || !question.trim()}
              >
                <Send size={15} /> {pending ? "Answering…" : "Ask"}
              </button>
            </form>
          </>
        )}
      </section>
      <button
        ref={launcher}
        className="chat-launcher"
        type="button"
        aria-label={open ? "Minimize chat panel" : "Open chat"}
        aria-controls="workbench-chat"
        aria-expanded={open}
        onClick={toggle}
      >
        {open ? (
          <X size={24} aria-hidden="true" />
        ) : (
          <MessageSquare size={25} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
