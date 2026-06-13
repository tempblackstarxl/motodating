import { useState, type ReactNode } from "react";
import type { User } from "../types";
import { t } from "../texts";

/**
 * Картка анкети. Використовується і в стрічці, і в попередньому перегляді.
 * Фото гортаються каруселлю: тап по лівій/правій частині фото.
 * footer — необовʼязковий блок під карткою (напр., кнопка "Подобається").
 */
export function ProfileCard({ user, footer }: { user: User; footer?: ReactNode }) {
  const [index, setIndex] = useState(0);
  const photos = user.photos;
  const count = photos.length;
  const current = photos[Math.min(index, Math.max(count - 1, 0))];

  function prev() {
    setIndex((i) => (i - 1 + count) % count);
  }
  function next() {
    setIndex((i) => (i + 1) % count);
  }

  return (
    <article className="card">
      <div className="card-photo">
        {current ? <img src={current.url} alt={user.name} /> : <div className="no-photo">{t.feed.noPhoto}</div>}

        {count > 1 && (
          <>
            <div className="carousel-bars">
              {photos.map((p, i) => (
                <span key={p.id} className={i === index ? "on" : ""} />
              ))}
            </div>
            <button className="carousel-zone left" aria-label="prev" onClick={prev} />
            <button className="carousel-zone right" aria-label="next" onClick={next} />
          </>
        )}

        <div className="card-overlay">
          <h3>
            {user.name}, {user.age}
          </h3>
          <span className="city">📍 {user.city}</span>
        </div>
      </div>
      {user.bio && <p className="card-bio">{user.bio}</p>}
      {footer}
    </article>
  );
}
