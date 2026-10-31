import { useEffect, useRef, useState } from 'react';

// Lightweight WYSIWYG editor (contentEditable) with a raw-HTML mode.
const tools = [
  { icon: 'fa-paragraph', title: 'Paragraph', cmd: 'formatBlock', arg: '<p>' },
  { label: 'H2', title: 'Heading', cmd: 'formatBlock', arg: '<h2>' },
  { label: 'H3', title: 'Sub-heading', cmd: 'formatBlock', arg: '<h3>' },
  { icon: 'fa-bold', title: 'Bold', cmd: 'bold' },
  { icon: 'fa-italic', title: 'Italic', cmd: 'italic' },
  { icon: 'fa-underline', title: 'Underline', cmd: 'underline' },
  { icon: 'fa-list-ul', title: 'Bullet list', cmd: 'insertUnorderedList' },
  { icon: 'fa-list-ol', title: 'Numbered list', cmd: 'insertOrderedList' },
  { icon: 'fa-quote-right', title: 'Quote', cmd: 'formatBlock', arg: '<blockquote>' },
  { icon: 'fa-link', title: 'Insert link', cmd: 'createLink', prompt: 'Link URL (https://...)' },
  { icon: 'fa-image', title: 'Insert image by URL', cmd: 'insertImage', prompt: 'Image URL' },
  { icon: 'fa-link-slash', title: 'Remove link', cmd: 'unlink' },
  { icon: 'fa-eraser', title: 'Clear formatting', cmd: 'removeFormat' },
];

export default function RichEditor({ value, onChange }) {
  const ref = useRef(null);
  const [htmlMode, setHtmlMode] = useState(false);

  // Only push outside changes into the editable area (typing already matches `value`)
  useEffect(() => {
    if (!htmlMode && ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || '';
  }, [value, htmlMode]);

  const run = (tool) => {
    let arg = tool.arg;
    if (tool.prompt) {
      arg = window.prompt(tool.prompt);
      if (!arg) return;
    }
    ref.current.focus();
    document.execCommand(tool.cmd, false, arg);
    onChange(ref.current.innerHTML);
  };

  return (
    <div className="editor">
      <div className="editor-toolbar">
        {!htmlMode &&
          tools.map((t) => (
            <button
              type="button"
              key={t.title}
              title={t.title}
              onMouseDown={(e) => e.preventDefault()} // keep the text selection
              onClick={() => run(t)}
            >
              {t.icon ? <i className={`fa-solid ${t.icon}`}></i> : t.label}
            </button>
          ))}
        <button type="button" className="html-toggle" onClick={() => setHtmlMode((m) => !m)}>
          <i className="fa-solid fa-code"></i> {htmlMode ? 'Visual' : 'HTML'}
        </button>
      </div>
      {htmlMode ? (
        <textarea className="editor-html" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      ) : (
        <div
          ref={ref}
          className="editor-area"
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange(e.currentTarget.innerHTML)}
        />
      )}
    </div>
  );
}
