import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Messages() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    api('/admin/messages').then(setItems).catch((e) => setError(e.message));
  }, []);

  const toggle = async (m) => {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.read) {
      try {
        const updated = await api(`/admin/messages/${m.id}/read`, { method: 'PUT', body: { read: true } });
        setItems((list) => list.map((x) => (x.id === m.id ? updated : x)));
      } catch {
        // not critical
      }
    }
  };

  const remove = async (m) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api(`/admin/messages/${m.id}`, { method: 'DELETE' });
      setItems((list) => list.filter((x) => x.id !== m.id));
    } catch (ex) {
      setError(ex.message);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>
          Mes<span>sages</span>
        </h1>
      </div>
      <p className="muted">Messages sent from the website’s Contact Us page.</p>
      {error && <div className="alert error">{error}</div>}

      {!items ? (
        <div className="spinner"></div>
      ) : items.length === 0 ? (
        <div className="panel empty">No messages yet.</div>
      ) : (
        <div className="messages">
          {items.map((m) => (
            <div className={`panel message${m.read ? '' : ' unread'}`} key={m.id}>
              <button className="message-head" onClick={() => toggle(m)}>
                <span className="message-from">
                  {!m.read && <span className="dot"></span>}
                  <strong>{m.name}</strong> <span className="muted">&lt;{m.email}&gt;</span>
                </span>
                <span className="message-subject">{m.subject || '(no subject)'}</span>
                <span className="muted small nowrap">{new Date(m.createdAt).toLocaleString()}</span>
              </button>
              {openId === m.id && (
                <div className="message-body">
                  <p>{m.message}</p>
                  <div className="head-actions">
                    <a
                      className="btn btn-primary sm"
                      href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Your message'))}`}
                    >
                      <i className="fa-solid fa-reply"></i> Reply
                    </a>
                    <button className="btn btn-danger sm" onClick={() => remove(m)}>
                      <i className="fa-solid fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
