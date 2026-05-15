import { useState } from 'react';

export default function RoleLoginCard({
  title,
  description,
  accentLabel,
  loading,
  error,
  inputLabel = 'Tài khoản',
  inputPlaceholder = 'Nhập tài khoản',
  defaultIdentifier = '',
  onSubmit,
}) {
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({ identifier, password });
  }

  return (
    <div className="route-info-card">
      <h2>{title}</h2>
      <p>{description}</p>
      {accentLabel ? <p className="route-muted-text">{accentLabel}</p> : null}

      <form className="route-form" onSubmit={handleSubmit}>
        <label className="route-form__group">
          <span>{inputLabel}</span>
          <input
            className="route-input"
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={inputPlaceholder}
            autoComplete="username"
            required
          />
        </label>

        <label className="route-form__group">
          <span>Mật khẩu</span>
          <input
            className="route-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            required
          />
        </label>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Đang vào...' : 'Đăng nhập'}
        </button>
      </form>

      {error ? <p className="route-error-text">{error}</p> : null}
    </div>
  );
}
