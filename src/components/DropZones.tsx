import React from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileImage, Volume2, Sparkles, Trash2 } from "lucide-react";

export type FileState = {
  logo: File[];
  subject: File[];
  reference: File | null;
  audio: File | null;
};

type FileSetter = React.Dispatch<React.SetStateAction<FileState>>;

/* ── Logo ──────────────────────────────────────────── */
export function LogoDropZone({
  files,
  setFiles,
}: {
  files: FileState;
  setFiles: FileSetter;
}) {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (accepted) =>
      setFiles((prev) => ({ ...prev, logo: [...prev.logo, ...accepted] })),
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-50/50 p-3 rounded-lg text-center cursor-pointer transition-colors"
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto text-gray-400 mb-1" size={18} />
      <p className="text-xs text-gray-600 font-medium">
        Upload Logo (Drag & Drop)
      </p>
      {files.logo.length > 0 && (
        <p className="text-[10px] text-blue-600 font-bold mt-1">
          {files.logo.length} logo terupload
        </p>
      )}
    </div>
  );
}

/* ── Subject / Produk ─────────────────────────────── */
export function SubjectDropZone({
  files,
  setFiles,
}: {
  files: FileState;
  setFiles: FileSetter;
}) {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (accepted) =>
      setFiles((prev) => ({ ...prev, subject: [...prev.subject, ...accepted] })),
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-50/50 p-3 rounded-lg text-center cursor-pointer transition-colors"
    >
      <input {...getInputProps()} />
      <FileImage className="mx-auto text-gray-400 mb-1" size={18} />
      <p className="text-xs text-gray-600 font-medium">
        Foto Produk / Subjek Utama
      </p>
      {files.subject.length > 0 && (
        <p className="text-[10px] text-blue-600 font-bold mt-1">
          {files.subject.length} foto terupload
        </p>
      )}
    </div>
  );
}

/* ── Reference / Sketsa ───────────────────────────── */
export function ReferenceDropZone({
  files,
  setFiles,
  extractMode,
  setExtractMode,
}: {
  files: FileState;
  setFiles: FileSetter;
  extractMode: "full" | "background_only";
  setExtractMode: (mode: "full" | "background_only") => void;
}) {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: (accepted) =>
      setFiles((prev) => ({ ...prev, reference: accepted[0] || null })),
  });

  const removeReference = () =>
    setFiles((prev) => ({ ...prev, reference: null }));

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-blue-300 hover:border-blue-600 bg-blue-50/30 hover:bg-blue-50 p-4 rounded-xl text-center cursor-pointer transition-colors"
      >
        <input {...getInputProps()} />
        {files.reference ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="text-blue-600" size={18} />
              <span className="text-xs font-semibold text-blue-800 truncate">
                {files.reference.name}
              </span>
            </div>
            <button
              type="button"
              className="text-red-500 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                removeReference();
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto text-blue-500 mb-1" size={20} />
            <p className="text-xs font-semibold text-gray-700">
              Upload Reference / Sketsa Desain
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              AI Vision akan menganalisis gaya seni dari gambar ini
            </p>
          </>
        )}
      </div>

      {/* Mode Ekstraksi Toggle */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-700 rounded-lg p-2">
        <span className="text-[11px] text-slate-300 font-medium">Mode AI Vision:</span>
        <div className="flex gap-1">
          <button
            type="button"
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
              extractMode === "full"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
            onClick={() => setExtractMode("full")}
          >
            Full Desain
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
              extractMode === "background_only"
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
            onClick={() => setExtractMode("background_only")}
          >
            Background Saja
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Audio ─────────────────────────────────────────── */
export function AudioDropZone({
  files,
  setFiles,
}: {
  files: FileState;
  setFiles: FileSetter;
}) {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "audio/*": [] },
    maxFiles: 1,
    onDrop: (accepted) =>
      setFiles((prev) => ({ ...prev, audio: accepted[0] || null })),
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-300 hover:border-purple-500 bg-gray-50 hover:bg-purple-50/50 p-3 rounded-lg text-center cursor-pointer transition-colors"
    >
      <input {...getInputProps()} />
      {files.audio ? (
        <p className="text-xs font-bold text-purple-700 truncate">
          {files.audio.name}
        </p>
      ) : (
        <>
          <Volume2 className="mx-auto text-gray-400 mb-1" size={18} />
          <p className="text-xs text-gray-600 font-medium">
            Upload File Audio (.mp3 / .wav)
          </p>
        </>
      )}
    </div>
  );
}
