import { useState } from 'react';
import useSeo from '../useSeo.js';

const empty = { name: '', email: '', subject: '', message: '' };

export default function ContactUs() {
  useSeo();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState('');

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = 'Please enter your name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Please enter a valid email';
    if (form.message.trim().length < 10) err.message = 'Message should be at least 10 characters';
    return err;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length) return;
    setSending(true);
    setServerError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error);
      setSent(true);
      setForm(empty);
    } catch (ex) {
      setServerError(ex.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container static-page" id="mainContainer">
      <h1>
        Contact <span>Us</span>
      </h1>
      <p>Have a question, suggestion or feedback? Send us a message and we will get back to you.</p>

      {sent ? (
        <div className="form-success">
          <i className="fa-solid fa-circle-check"></i> Thank you! Your message has been sent.
          <button className="read-more-btn" onClick={() => setSent(false)}>
            <span className="text">New message</span>
            <span className="icon">&gt;</span>
          </button>
        </div>
      ) : (
        <form className="contact-form" onSubmit={submit} noValidate>
          <div className="form-row">
            <label>
              Name
              <input name="name" value={form.name} onChange={update} />
              {errors.name && <small>{errors.name}</small>}
            </label>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={update} />
              {errors.email && <small>{errors.email}</small>}
            </label>
          </div>
          <label>
            Subject
            <input name="subject" value={form.subject} onChange={update} />
          </label>
          <label>
            Message
            <textarea name="message" rows="6" value={form.message} onChange={update}></textarea>
            {errors.message && <small>{errors.message}</small>}
          </label>
          {serverError && <small className="form-error">{serverError}</small>}
          <button type="submit" className="read-more-btn" disabled={sending}>
            <span className="text">{sending ? 'Sending...' : 'Send'}</span>
            <span className="icon">&gt;</span>
          </button>
        </form>
      )}
    </div>
  );
}
