import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import Logo from "./Logo";
import SendIcon from "./SendIcon";
import "./ChatArea.css";

interface Message {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  isRejected?: boolean;
}

interface Matiere {
  id: number | string;
  nom_matiere: string;
  niveau: string;
}

interface ChatAreaProps {
  matiere: Matiere | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  onSend: (text: string, file?: File | null) => void;
  onMenuToggle: () => void;
}

export default function ChatArea({
  matiere,
  messages,
  loading,
  error,
  onSend,
  onMenuToggle,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !file) || loading || !matiere) return;
    onSend(input, file);
    setInput("");
    setFile(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.target as HTMLTextAreaElement;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const showWelcome = messages.length === 0 && !loading;

  return (
    <main className="chat-area">
      <header className="chat-header">
        <button
          type="button"
          className="chat-menu-btn"
          onClick={onMenuToggle}
          aria-label="Menu"
        >
          ☰
        </button>
        <div className="chat-header-brand">
          <Logo size={32} />
          <span className="chat-brand-title gradient-text">Assistant GI</span>
        </div>
        <div className="chat-header-matiere">
          <h1 className="chat-title">
            {matiere ? matiere.nom_matiere : "Sélectionnez une matière"}
          </h1>
          {matiere && <span className="chat-badge">{matiere.niveau}</span>}
        </div>
      </header>

      <div className="chat-messages">
        {showWelcome && (
          <div className="welcome">
            <div className="welcome-icon">
              <Logo size={56} />
            </div>
            <h2 className="gradient-text">Assistant Pédagogique GI</h2>
            <p>
              Posez vos questions sur la matière sélectionnée. L&apos;assistante
              Gemini vous répond dans le contexte du cursus Génie Informatique.
            </p>
            {matiere && (
              <div className="welcome-chips">
                <button
                  type="button"
                  onClick={() =>
                    onSend(
                      "Peux-tu me donner un plan de révision pour cette matière ?"
                    )
                  }
                >
                  Plan de révision
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSend(
                      "Explique-moi les notions fondamentales de ce cours."
                    )
                  }
                >
                  Notions fondamentales
                </button>
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message-row ${msg.role === "user" ? "user" : "assistant"}`}
          >
            <div
              className={`message-avatar ${msg.role === "assistant" ? "assistant-avatar" : ""}`}
            >
              {msg.role === "user" ? "Vous" : <Logo size={28} />}
            </div>
            <div
              className={`message-bubble ${msg.isError ? "error" : ""} ${msg.isRejected ? "rejected" : ""}`}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-row assistant">
            <div className="message-avatar assistant-avatar">
              <Logo size={28} />
            </div>
            <div className="message-bubble typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <p className="chat-error">{error}</p>}

      <form className="chat-input-bar" onSubmit={handleSubmit}>
        {file && (
          <div className="chat-file-indicator">
            <span className="file-icon">📄</span>
            <span className="file-name">{file.name}</span>
            <button type="button" className="remove-file-btn" onClick={() => setFile(null)}>
              ✕
            </button>
          </div>
        )}
        <div className="chat-input-pill">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected && selected.type === "application/pdf") {
                setFile(selected);
              } else if (selected) {
                alert("Seuls les fichiers PDF sont autorisés !");
              }
            }}
            accept=".pdf"
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="attachment-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={!matiere || loading}
            aria-label="Joindre un PDF"
          >
            📎
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={autoResize}
            onKeyDown={handleKeyDown}
            placeholder={
              matiere
                ? "Posez votre question ou importez un PDF…"
                : "Choisissez une matière dans le menu"
            }
            disabled={!matiere || loading}
            rows={1}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!matiere || loading || (!input.trim() && !file)}
            aria-label="Envoyer"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </main>
  );
}
