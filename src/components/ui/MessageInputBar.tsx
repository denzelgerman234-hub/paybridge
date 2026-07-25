import { useRef, useState } from 'react';
import { Paperclip, X, Send } from 'lucide-react';

export interface Attachment {
  file: File;
  previewUrl: string | null; // null for non-image files
}

interface MessageInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (attachments: Attachment[]) => void;
  placeholder?: string;
  disabled?: boolean;
  sendLabel?: string;
}

const ACCEPTED = 'image/*,.pdf,.doc,.docx,.txt,.csv';

export function MessageInputBar({
  value,
  onChange,
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
  sendLabel,
}: MessageInputBarProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const next: Attachment[] = Array.from(files).map(file => ({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setAttachments(prev => [...prev, ...next]);
  }

  function removeAttachment(index: number) {
    setAttachments(prev => {
      const copy = [...prev];
      if (copy[index].previewUrl) URL.revokeObjectURL(copy[index].previewUrl!);
      copy.splice(index, 1);
      return copy;
    });
  }

  function handleSend() {
    if (!value.trim() && attachments.length === 0) return;
    onSend(attachments);
    setAttachments([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const canSend = !disabled && (value.trim().length > 0 || attachments.length > 0);

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="relative flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium"
              style={{ background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C', maxWidth: 200 }}
            >
              {att.previewUrl ? (
                <img src={att.previewUrl} alt="" className="w-6 h-6 object-cover rounded" />
              ) : (
                <Paperclip size={12} />
              )}
              <span className="truncate max-w-[120px]">{att.file.name}</span>
              <button
                onClick={() => removeAttachment(i)}
                className="ml-1 flex-shrink-0 hover:text-red-400 transition-colors"
                type="button"
                aria-label="Remove attachment"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        {/* Hidden file picker */}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
          // Reset value so same file can be re-attached after removal
          onClick={e => ((e.target as HTMLInputElement).value = '')}
        />

        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          title="Attach file (PDF, image, doc)"
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded transition-colors"
          style={{
            color: 'rgba(241,240,218,0.45)',
            background: 'rgba(241,240,218,0.06)',
            border: '1px solid rgba(241,240,218,0.10)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#C9A84C')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(241,240,218,0.45)')}
        >
          <Paperclip size={14} />
        </button>

        {/* Text input */}
        <input
          type="text"
          className="input-dark flex-1"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="btn-primary flex-shrink-0 flex items-center gap-1.5 px-3"
          style={{ opacity: canSend ? 1 : 0.4, cursor: canSend ? 'pointer' : 'not-allowed' }}
        >
          <Send size={14} />
          {sendLabel && <span className="hidden sm:inline text-xs">{sendLabel}</span>}
        </button>
      </div>
    </div>
  );
}
