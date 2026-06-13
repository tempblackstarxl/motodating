import { useEffect, useState } from "react";
import { api } from "../api";
import { openTelegramChat } from "../telegram";
import type { MatchItem } from "../types";
import { t } from "../texts";

export function MatchesPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMatches()
      .then(({ matches }) => setMatches(matches))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="center muted">{t.common.loading}</div>;
  if (matches.length === 0) return <div className="center muted pre">{t.matches.empty}</div>;

  return (
    <div className="page">
      <h2>{t.matches.title}</h2>
      <div className="match-list">
        {matches.map((m) =>
          m.user ? (
            <div className="match-row" key={m.matchId}>
              <div className="match-avatar">
                {m.user.photos[0] ? <img src={m.user.photos[0].url} alt={m.user.name} /> : <span>🏍️</span>}
              </div>
              <div className="match-info">
                <strong>
                  {m.user.name}, {m.user.age}
                </strong>
                <small>📍 {m.user.city}</small>
              </div>
              {m.user.username ? (
                <button className="chat-btn" onClick={() => openTelegramChat(m.user!.username!)}>
                  {t.matches.write}
                </button>
              ) : (
                <span className="muted small">{t.matches.noUsername}</span>
              )}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
