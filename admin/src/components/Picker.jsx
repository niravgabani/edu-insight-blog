import { useEffect, useState } from 'react';

// Ordered multi-select: pick items from a dropdown, reorder or remove them.
// options: [{ value, label, image? }] — must include the chosen values.
// search: optional async (text) => options; shows a search box instead of the dropdown (for long lists).
export default function Picker({ options, value, onChange, max, placeholder = '+ Add...', search }) {
  const chosen = value.map((v) => options.find((o) => o.value === v)).filter(Boolean);
  const available = options.filter((o) => !value.includes(o.value));

  const move = (i, dir) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div className="picker">
      {chosen.length > 0 && (
        <ol>
          {chosen.map((o, i) => (
            <li key={o.value}>
              <span className="picker-num">{i + 1}</span>
              {o.image && <img src={o.image} alt="" />}
              <span className="picker-label">{o.label}</span>
              <div className="picker-actions">
                <button type="button" className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} title="Move up">
                  <i className="fa-solid fa-arrow-up"></i>
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  disabled={i === chosen.length - 1}
                  onClick={() => move(i, 1)}
                  title="Move down"
                >
                  <i className="fa-solid fa-arrow-down"></i>
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => onChange(value.filter((v) => v !== o.value))}
                  title="Remove"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      {(!max || chosen.length < max) && search && (
        <SearchAdd search={search} exclude={value} placeholder={placeholder} onPick={(v) => onChange([...value, v])} />
      )}
      {(!max || chosen.length < max) && !search && available.length > 0 && (
        <select value="" onChange={(e) => e.target.value && onChange([...value, e.target.value])}>
          <option value="">{placeholder}</option>
          {available.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function SearchAdd({ search, exclude, placeholder, onPick }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = setTimeout(() => search(text.trim()).then((r) => active && setResults(r)), 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [text, open, search]);

  const shown = results.filter((o) => !exclude.includes(o.value));
  return (
    <div className="picker-search">
      <input
        value={text}
        placeholder={placeholder.replace(/^\+ ?(add )?/i, 'Search to add ')}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onChange={(e) => setText(e.target.value)}
      />
      {open && shown.length > 0 && (
        <ul>
          {shown.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  onPick(o.value);
                  setText('');
                }}
              >
                {o.image && <img src={o.image} alt="" />}
                <span className="picker-label">{o.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
