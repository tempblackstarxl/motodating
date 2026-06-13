import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { User } from "./types";
import { isInTelegram } from "./telegram";
import { t } from "./texts";
import { ProfilePage } from "./components/ProfilePage";
import { FeedPage } from "./components/FeedPage";
import { MatchesPage } from "./components/MatchesPage";
import { DevBar } from "./components/DevBar";
import { AgeGate, isAgeConfirmed } from "./components/AgeGate";

type Tab = "feed" | "matches" | "profile";

export default function App() {
  const [ageOk, setAgeOk] = useState(isAgeConfirmed());
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("feed");

  const reloadMe = useCallback(async () => {
    setLoading(true);
    try {
      const { user } = await api.getMe();
      setMe(user);
      if (!user) setTab("profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ageOk) reloadMe();
  }, [ageOk, reloadMe]);

  if (!ageOk) return <AgeGate onConfirm={() => setAgeOk(true)} />;

  if (loading) {
    return (
      <div className="app">
        <div className="center muted">{t.common.loading}</div>
      </div>
    );
  }

  const hasProfile = Boolean(me);

  return (
    <div className="app">
      {!isInTelegram() && <DevBar onSwitch={reloadMe} />}

      <header className="header">
        <span className="logo">🏍️ {t.brand}</span>
        <small className="tagline">{t.tagline}</small>
      </header>

      <main className="content">
        {tab === "feed" &&
          (hasProfile ? <FeedPage /> : <div className="center muted">{t.common.needProfile}</div>)}
        {tab === "matches" &&
          (hasProfile ? <MatchesPage /> : <div className="center muted">{t.common.needProfile}</div>)}
        {tab === "profile" && <ProfilePage me={me} onSaved={reloadMe} />}
      </main>

      <nav className="tabbar">
        <button className={tab === "feed" ? "active" : ""} onClick={() => setTab("feed")}>
          <span>🔥</span>
          <small>{t.tabs.feed}</small>
        </button>
        <button className={tab === "matches" ? "active" : ""} onClick={() => setTab("matches")}>
          <span>💬</span>
          <small>{t.tabs.matches}</small>
        </button>
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>
          <span>👤</span>
          <small>{t.tabs.profile}</small>
        </button>
      </nav>
    </div>
  );
}
