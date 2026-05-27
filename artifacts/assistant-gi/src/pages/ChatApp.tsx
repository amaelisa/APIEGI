import { useCallback, useEffect, useState } from "react";
import { checkHealth, fetchMatieres, sendChatMessage, fetchChatHistory } from "../api/client";
import { useAuth } from "../context/AuthContext";
import ChatArea from "../components/ChatArea";
import Sidebar from "../components/Sidebar";
import "../App.css";

interface Matiere {
  id: number | string;
  nom_matiere: string;
  niveau: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  isRejected?: boolean;
}

const NIVEAUX = ["L1", "L2", "L3"];

export default function ChatApp() {
  const { user, logout } = useAuth();
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [niveauFilter, setNiveauFilter] = useState("L1");
  const [selectedMatiere, setSelectedMatiere] = useState<Matiere | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((open) => !open);

  const loadMatieres = useCallback(async (niveau: string) => {
    try {
      const data = await fetchMatieres(niveau);
      setMatieres(data.matieres || []);
      setSelectedMatiere((prev) => {
        if (prev && data.matieres?.some((m: Matiere) => m.id === prev.id)) return prev;
        return data.matieres?.[0] || null;
      });
      setError(null);
    } catch (e: unknown) {
      setMatieres([]);
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    checkHealth().then(setApiOnline).catch(() => setApiOnline(false));
  }, []);

  useEffect(() => {
    if (user) loadMatieres(niveauFilter);
  }, [niveauFilter, loadMatieres, user]);

  useEffect(() => {
    if (!selectedMatiere) {
      setMessages([]);
      return;
    }
    let active = true;
    const loadHistory = async () => {
      try {
        const data = await fetchChatHistory(selectedMatiere.id);
        if (active) {
          const formatted: Message[] = (data.messages || []).map((m: { role: string; contenu: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.contenu,
            isRejected: m.role === "assistant" && m.contenu === "Désolé, je suis un assistant dédié exclusivement au cursus de Génie Informatique. Je ne suis pas autorisé à répondre à cette demande.",
          }));
          setMessages(formatted);
        }
      } catch (e) {
        console.error("Erreur historique:", e);
        if (active) setMessages([]);
      }
    };
    loadHistory();
    return () => {
      active = false;
    };
  }, [selectedMatiere]);

  const handleSelectMatiere = (matiere: Matiere) => {
    setSelectedMatiere(matiere);
    closeSidebar();
  };

  const handleNiveauChange = (n: string) => {
    setNiveauFilter(n);
  };

  const handleSend = async (text: string, file: File | null = null) => {
    if (!selectedMatiere || (!text.trim() && !file)) return;

    const userMessageContent = file
      ? `[Fichier joint : ${file.name}]\n\n${text.trim() || "Analyse de document"}`
      : text.trim();

    setMessages((prev) => [...prev, { role: "user", content: userMessageContent }]);
    setLoading(true);
    setError(null);

    try {
      const data = await sendChatMessage(selectedMatiere.id, text.trim() || "Analyse de document", file);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          isRejected: data.autorise === false,
        },
      ]);
    } catch (e: unknown) {
      setError((e as Error).message);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Erreur : ${(e as Error).message}`, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => setMessages([]);

  return (
    <div className={`app${sidebarOpen ? " sidebar-open" : ""}`}>
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fermer le menu"
          onClick={closeSidebar}
        />
      )}
      <Sidebar
        user={user}
        niveaux={NIVEAUX}
        niveauFilter={niveauFilter}
        onNiveauChange={handleNiveauChange}
        matieres={matieres}
        selectedMatiere={selectedMatiere}
        onSelectMatiere={handleSelectMatiere}
        onNewChat={() => {
          handleNewChat();
          closeSidebar();
        }}
        onLogout={logout}
        apiOnline={apiOnline}
        isOpen={sidebarOpen}
      />
      <ChatArea
        matiere={selectedMatiere}
        messages={messages}
        loading={loading}
        error={error}
        onSend={handleSend}
        onMenuToggle={toggleSidebar}
      />
    </div>
  );
}
