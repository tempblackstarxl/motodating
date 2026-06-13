import { useEffect, useState } from "react";
import { api } from "../api";
import type { User } from "../types";
import { t } from "../texts";
import { ProfileCard } from "./ProfileCard";

export function FeedPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchBanner, setMatchBanner] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { users } = await api.getFeed();
      setUsers(users);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function like(u: User) {
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
    try {
      const { matched } = await api.like(u.id);
      if (matched) {
        setMatchBanner(t.feed.match(u.name));
        setTimeout(() => setMatchBanner(null), 5000);
      }
    } catch {
      load();
    }
  }

  if (loading) return <div className="center muted">{t.feed.loading}</div>;
  if (users.length === 0) return <div className="center muted pre">{t.feed.empty}</div>;

  return (
    <div className="feed">
      {matchBanner && <div className="match-banner">{matchBanner}</div>}
      {users.map((u) => (
        <ProfileCard
          key={u.id}
          user={u}
          footer={
            <button className="like-btn" onClick={() => like(u)}>
              {t.feed.like}
            </button>
          }
        />
      ))}
    </div>
  );
}
