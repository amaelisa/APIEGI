import { useCallback, useEffect, useState } from "react";
import { checkHealth, fetchMatieres, sendChatMessage, fetchChatHistory } from "../api/client";
import { useAuth } from "../context/AuthContext";
import ChatArea from "../components/ChatArea";
import Sidebar from "../components/Sidebar";
import "../App.css";

const NIVEAUX = ["L1", "L2", "L3"];

export default function ChatApp() {
  const { user, logout } = useAuth();
  const [matieres, setMatieres] = useState([]);
  const [niveauFilter, setNiveauFilter] = useState("L1");
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((open) => !open);

  const loadMatieres = useCallback(async (niveau) => {
    try {
      const data = await fetchMatieres(niveau);
      setMatieres(data.matieres || []);
      setSelectedMatiere((prev) => {
        if (prev && data.matieres?.some((m) => m.id === prev.id)) return prev;
        return data.matieres?.[0] || null;
      });
      setError(null);
    } catch (e) {
      setMatieres([]);
      setError(e.message);
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
          const formatted = (data.messages || []).map((m) => ({
            role: m.role,
            content: m.contenu,
            isRejected: m.role === "assistant" && m.contenu === "Désolé, je suis un assistant dédié exclusivement au cursus de Génie Informatique. Je ne suis pas autorisé à répondre à cette demande."
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

  const handleSelectMatiere = (matiere) => {
    setSelectedMatiere(matiere);
    closeSidebar();
  };

  const handleNiveauChange = (n) => {
    setNiveauFilter(n);
  };

  const handleSend = async (text, file = null) => {
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
    } catch (e) {
      setError(e.message);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Erreur : ${e.message}`, isError: true },
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
