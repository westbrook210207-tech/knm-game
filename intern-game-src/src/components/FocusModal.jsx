import { useEffect } from 'react';

export default function FocusModal({
  open,
  title,
  subtitle = '',
  onClose,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="route-zoom-overlay" onClick={onClose} role="presentation">
      <div
        className="route-zoom-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="route-zoom-header">
          <div>
            <p className="route-shell__eyebrow">CHẾ ĐỘ PHÓNG TO</p>
            <h2>{title}</h2>
            {subtitle ? <p className="route-muted-text">{subtitle}</p> : null}
          </div>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Đóng
          </button>
        </div>
        <div className="route-zoom-body">{children}</div>
      </div>
    </div>
  );
}
