import { useState } from "react";
import { t } from "../texts";

const KEY = "motodating_age_ok";

export function isAgeConfirmed(): boolean {
  return localStorage.getItem(KEY) === "1";
}

export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const [blocked, setBlocked] = useState(false);

  function confirm() {
    localStorage.setItem(KEY, "1");
    onConfirm();
  }

  return (
    <div className="agegate">
      <div className="agegate-card">
        <div className="agegate-emoji">🔞</div>
        <h2>{t.ageGate.title}</h2>
        {blocked ? (
          <p className="muted">{t.ageGate.blocked}</p>
        ) : (
          <>
            <p className="muted">{t.ageGate.text}</p>
            <button className="primary" onClick={confirm}>
              {t.ageGate.confirm}
            </button>
            <button className="ghost" onClick={() => setBlocked(true)}>
              {t.ageGate.leave}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
