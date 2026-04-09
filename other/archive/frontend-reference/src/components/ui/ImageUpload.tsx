'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onClear: () => void;
  preview: string | null;
}

export function ImageUpload({ onUpload, onClear, preview }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10 MB');
      return;
    }

    setUploading(true);
    abortRef.current = new AbortController();

    try {
      // Get Cloudinary signed params from backend
      const { data: signData } = await api.post<{
        data: { timestamp: number; signature: string; folder: string; cloudName: string; apiKey: string };
      }>('/upload/sign');
      const { timestamp, signature, folder, cloudName, apiKey } = signData.data;

      const form = new FormData();
      form.append('file', file);
      form.append('timestamp', String(timestamp));
      form.append('signature', signature);
      form.append('folder', folder);
      form.append('api_key', apiKey);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: form, signal: abortRef.current.signal },
      );
      const json = await res.json() as { secure_url?: string; error?: { message: string } };

      if (!res.ok || !json.secure_url) {
        throw new Error(json.error?.message ?? 'Upload failed');
      }
      onUpload(json.secure_url);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message ?? 'Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {preview ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" style={{ maxHeight: 100, borderRadius: 8 }} />
          <button
            type="button"
            onClick={() => { abortRef.current?.abort(); onClear(); }}
            style={{
              position: 'absolute', top: 4, right: 4,
              background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
              borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="_feed_inner_text_area_bottom_photo_link"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20">
              <path fill="#666" d="M13.916 0c3.109 0 5.18 2.429 5.18 5.914v8.17c0 3.486-2.072 5.916-5.18 5.916H5.999C2.89 20 .827 17.572.827 14.085v-8.17C.827 2.43 2.897 0 6 0h7.917zm0 1.504H5.999c-2.321 0-3.799 1.735-3.799 4.41v8.17c0 2.68 1.472 4.412 3.799 4.412h7.917c2.328 0 3.807-1.734 3.807-4.411v-8.17c0-2.678-1.478-4.411-3.807-4.411zm.65 8.68l.12.125 1.9 2.147a.803.803 0 01-.016 1.063.642.642 0 01-.894.058l-.076-.074-1.9-2.148a.806.806 0 00-1.205-.028l-.074.087-2.04 2.717c-.722.963-2.02 1.066-2.86.26l-.111-.116-.814-.91a.562.562 0 00-.793-.07l-.075.073-1.4 1.617a.645.645 0 01-.97.029.805.805 0 01-.09-.977l.064-.086 1.4-1.617c.736-.852 1.95-.897 2.734-.137l.114.12.81.905a.587.587 0 00.861.033l.07-.078 2.04-2.718c.81-1.08 2.27-1.19 3.205-.275zM6.831 4.64c1.265 0 2.292 1.125 2.292 2.51 0 1.386-1.027 2.511-2.292 2.511S4.54 8.537 4.54 7.152c0-1.386 1.026-2.51 2.291-2.51zm0 1.504c-.507 0-.918.451-.918 1.007 0 .555.411 1.006.918 1.006.507 0 .919-.451.919-1.006 0-.556-.412-1.007-.919-1.007z"/>
            </svg>
          </span>
          {uploading ? 'Uploading...' : 'Photo'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {error && <p style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}
