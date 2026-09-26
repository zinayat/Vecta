"use client";

import { useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { MAX_IMAGES } from "../../lib/observationMeta";

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.72;

// Resizes/re-encodes a photo client-side before it ever leaves the
// browser - a phone camera photo can easily be 4-8MB, and these get
// stored directly on the Observation document (no separate file storage
// configured anywhere in this app), so a handful of full-resolution
// photos would blow well past Mongo's 16MB document limit. Capping the
// longest edge and re-encoding as JPEG keeps each photo in the
// low-hundreds-of-KB range - plenty for "what did you see," not for
// pixel-level inspection.
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageUploadField({ images, onChange, readOnly }) {
  const list = images || [];
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    const room = MAX_IMAGES - list.length;
    if (room <= 0) {
      setError(`Up to ${MAX_IMAGES} photos per observation`);
      return;
    }
    setError("");
    setBusy(true);
    try {
      const compressed = await Promise.all(files.slice(0, room).map(compressImage));
      onChange([...list, ...compressed]);
    } catch {
      setError("Couldn't read one of those photos - try again");
    } finally {
      setBusy(false);
    }
  }

  function removeAt(i) {
    onChange(list.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {list.map((src, i) => (
          <div key={i} className="relative h-16 w-16 flex-shrink-0">
            <button type="button" onClick={() => setPreview(src)} className="block h-16 w-16 rounded-lg overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
              <img src={src} alt={`Observation photo ${i + 1}`} className="h-full w-full object-cover" />
            </button>
            {!readOnly && (
              <button type="button" onClick={() => removeAt(i)} className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center">
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        ))}

        {!readOnly && list.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="h-16 w-16 flex-shrink-0 rounded-lg border border-dashed flex flex-col items-center justify-center gap-0.5 opacity-50 hover:opacity-90 transition"
            style={{ borderColor: "var(--color-border)" }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            <span className="text-[9px] font-medium">{busy ? "" : "Add"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />

      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
      {!readOnly && <p className="text-[10px] opacity-35 mt-1">Up to {MAX_IMAGES} photos - resized automatically</p>}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setPreview(null)}>
          <img src={preview} alt="Observation photo, full size" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
