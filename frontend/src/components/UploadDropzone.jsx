import { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';

export default function UploadDropzone({
  onFileSelect,
  accept = 'image/jpeg,image/png,image/webp',
  maxSizeMB = 5,
  hint = 'JPEG, PNG, or WebP — up to 5MB',
  preview,
  onRemove,
  label = 'Click or drag an image to upload',
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = (files) => {
    const file = files?.[0];
    if (!file) return;
    setError('');

    if (!accept.split(',').includes(file.type)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }
    onFileSelect(file);
  };

  if (preview) {
    return (
      <div className="dropzone__preview">
        <img src={preview} alt="Upload preview" />
        {onRemove && (
          <button type="button" className="dropzone__remove" onClick={onRemove} aria-label="Remove image">
            <X size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click(); }}
      >
        <UploadCloud className="dropzone__icon" />
        <p className="dropzone__text">{label}</p>
        <p className="dropzone__hint">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="dropzone__input"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="field__error" style={{ marginTop: '0.5rem' }}>{error}</p>}
    </div>
  );
}
