import { useRef, useState } from "react";
import { api } from "../api";
import type { Role, User } from "../types";
import { t } from "../texts";
import { MAX_BIO, MAX_PHOTOS, MIN_AGE } from "../constants";
import { DEFAULT_CITY } from "../cities";
import { CityAutocomplete } from "./CityAutocomplete";
import { ProfileCard } from "./ProfileCard";

export function ProfilePage({ me, onSaved }: { me: User | null; onSaved: () => void }) {
  const [name, setName] = useState(me?.name ?? "");
  const [role, setRole] = useState<Role>(me?.role ?? "girl");
  const [age, setAge] = useState(me?.age ? String(me.age) : "");
  const [city, setCity] = useState(me?.city ?? DEFAULT_CITY);
  const [bio, setBio] = useState(me?.bio ?? "");
  const [isVisible, setIsVisible] = useState(me?.isVisible ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(!me);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [locating, setLocating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function detectCity() {
    if (!navigator.geolocation) {
      setError(t.profile.locationUnsupported);
      return;
    }
    setError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { item } = await api.reverseCity(pos.coords.latitude, pos.coords.longitude);
          if (item) setCity(item.name);
          else setError(t.profile.locationError);
        } catch {
          setError(t.profile.locationError);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError(t.profile.locationError);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function doDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setDeleting(true);
    try {
      await api.deleteProfile();
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  async function save() {
    setError(null);
    const ageNum = Number(age);
    if (!name.trim()) return setError(t.profile.errName);
    if (!Number.isInteger(ageNum) || ageNum < MIN_AGE) return setError(t.profile.errAge);
    if (city.trim().length < 2) return setError(t.profile.errCity);
    setSaving(true);
    try {
      await api.saveProfile({
        name: name.trim(),
        role,
        age: ageNum,
        city: city.trim(),
        bio: bio.trim(),
        isVisible,
      });
      setEditing(false);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      await api.uploadPhoto(file);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto(id: string) {
    await api.deletePhoto(id);
    onSaved();
  }

  if (me && !editing) {
    return (
      <div className="page">
        <h2>{t.profile.previewTitle}</h2>
        <ProfileCard user={me} />
        <button className="primary" style={{ marginTop: 16 }} onClick={() => setEditing(true)}>
          {t.profile.edit}
        </button>
        <button className="danger" onClick={doDelete} disabled={deleting}>
          {deleting ? t.profile.deleting : confirmDelete ? t.profile.deleteConfirm : t.profile.deleteProfile}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="page">
      <h2>{me ? t.profile.titleEdit : t.profile.titleCreate}</h2>

      <label className="field">
        <span>{t.profile.iAm}</span>
        <div className="role-toggle">
          <button className={role === "girl" ? "on" : ""} onClick={() => setRole("girl")} type="button">
            {t.profile.roleGirl}
          </button>
          <button className={role === "rider" ? "on" : ""} onClick={() => setRole("rider")} type="button">
            {t.profile.roleRider}
          </button>
        </div>
      </label>

      <label className="field">
        <span>{t.profile.name}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={t.profile.namePlaceholder} />
      </label>

      <label className="field">
        <span>{t.profile.age}</span>
        <input
          value={age}
          onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          maxLength={2}
          placeholder={t.profile.agePlaceholder}
        />
      </label>

      <label className="field">
        <span>{t.profile.city}</span>
        <div className="city-row">
          <CityAutocomplete value={city} onChange={setCity} placeholder={t.profile.cityPlaceholder} />
          <button type="button" className="loc-btn" onClick={detectCity} disabled={locating}>
            {locating ? t.profile.locating : t.profile.useLocation}
          </button>
        </div>
      </label>

      <label className="field">
        <span>{t.profile.bio}</span>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={MAX_BIO} rows={4} placeholder={t.profile.bioPlaceholder} />
      </label>

      <label className="field row">
        <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
        <span>{t.profile.visible}</span>
      </label>

      {me && (
        <div className="field">
          <span>{t.profile.photos(me.photos.length)}</span>
          <div className="photos">
            {me.photos.map((p) => (
              <div className="photo-thumb" key={p.id}>
                <img src={p.url} alt="" />
                <button onClick={() => removePhoto(p.id)} type="button">
                  ✕
                </button>
              </div>
            ))}
            {me.photos.length < MAX_PHOTOS && (
              <button className="photo-add" type="button" onClick={() => fileRef.current?.click()}>
                +
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
        </div>
      )}

      {!me && <p className="muted small">{t.profile.photosHint}</p>}
      {error && <p className="error">{error}</p>}

      <button className="primary" onClick={save} disabled={saving}>
        {saving ? t.profile.saving : t.profile.saveProfile}
      </button>
      {me && (
        <button className="ghost" onClick={() => setEditing(false)} disabled={saving}>
          {t.profile.cancel}
        </button>
      )}
    </div>
  );
}
