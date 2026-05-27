import Logo from "./Logo";
import "./Sidebar.css";

interface Matiere {
  id: number | string;
  nom_matiere: string;
  niveau: string;
}

interface SidebarProps {
  user: { nom: string; email: string } | null;
  niveaux: string[];
  niveauFilter: string;
  onNiveauChange: (n: string) => void;
  matieres: Matiere[];
  selectedMatiere: Matiere | null;
  onSelectMatiere: (m: Matiere) => void;
  onNewChat: () => void;
  onLogout: () => void;
  apiOnline: boolean | null;
  isOpen?: boolean;
}

export default function Sidebar({
  user,
  niveaux,
  niveauFilter,
  onNiveauChange,
  matieres,
  selectedMatiere,
  onSelectMatiere,
  onNewChat,
  onLogout,
  apiOnline,
  isOpen = false,
}: SidebarProps) {
  return (
    <aside className={`sidebar${isOpen ? " open" : ""}`}>
      <div className="sidebar-header">
        <div className="logo">
          <Logo size={28} />
          <span className="logo-text gradient-text">Assistant GI</span>
        </div>
        <button type="button" className="btn-new" onClick={onNewChat}>
          + Nouvelle discussion
        </button>
      </div>

      {user && (
        <div className="user-panel">
          <p className="user-name">{user.nom}</p>
          <p className="user-meta">{user.email}</p>
        </div>
      )}

      <div className="niveau-tabs">
        {niveaux.map((n) => (
          <button
            key={n}
            type="button"
            className={`niveau-tab ${niveauFilter === n ? "active" : ""}`}
            onClick={() => onNiveauChange(n)}
            title={`Matières ${n}`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="matiere-list">
        <p className="matiere-list-label">
          Matières — {niveauFilter} ({matieres.length})
        </p>
        {matieres.length === 0 ? (
          <p className="matiere-empty">
            Aucune matière pour {niveauFilter}. Vérifiez la connexion API / Supabase.
          </p>
        ) : (
          matieres.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`matiere-item ${
                selectedMatiere?.id === m.id ? "active" : ""
              }`}
              onClick={() => onSelectMatiere(m)}
              title={m.nom_matiere}
            >
              {m.nom_matiere}
            </button>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="footer-status">
          <span
            className={`status-dot ${
              apiOnline === true
                ? "online"
                : apiOnline === false
                  ? "offline"
                  : ""
            }`}
          />
          <span className="status-text">
            {apiOnline === true
              ? "API connectée"
              : apiOnline === false
                ? "API hors ligne"
                : "Vérification…"}
          </span>
        </div>
        <button type="button" className="btn-logout" onClick={onLogout}>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
