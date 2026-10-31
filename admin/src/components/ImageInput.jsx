import { useRef, useState } from 'react';
import { api } from '../api.js';

export default function ImageInput({ value, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const form = new FormData();
    form.append('image', file);
    setUploading(true);
    setError('');
    try {
      const { url } = await api('/admin/upload', { method: 'POST', body: form });
      onChange(url);
    } catch (ex) {
      setError(ex.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-input">
      {value ? (
        <div className="image-preview">
          <img src={value} alt="" />
          <button type="button" className="icon-btn danger" onClick={() => onChange('')} title="Remove image">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      ) : (
        <button type="button" className="image-drop" onClick={() => fileRef.current.click()} disabled={uploading}>
          <i className="fa-regular fa-image"></i>
          {uploading ? 'Uploading...' : 'Upload image'}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
      <div className="row">
        <input
          type="text"
          placeholder="...or paste image URL"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button type="button" className="btn btn-light" onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? '...' : 'Replace'}
          </button>
        )}
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
