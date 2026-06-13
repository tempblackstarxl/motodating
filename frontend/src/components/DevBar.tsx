import { getDevId, setDevId } from "../api";
import { DEV_PRESETS } from "../constants";
import { t } from "../texts";

/**
 * Панель лише для локального тесту в браузері (поза Telegram).
 * Дозволяє перемикати "користувача", щоб перевірити лайки та метчі.
 */
export function DevBar({ onSwitch }: { onSwitch: () => void }) {
  const current = getDevId();

  return (
    <div className="devbar">
      <span>{t.dev.label}</span>
      <select
        value={current}
        onChange={(e) => {
          setDevId(e.target.value);
          onSwitch();
        }}
      >
        {DEV_PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
