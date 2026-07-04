import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";

export default function DraggableUpload({
  onFilesChange,
  maxFiles = 1,
  label,
  required = false,
  disabled = false,
}) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");

  const addFiles = useCallback(
    (fileList) => {
      setError("");
      const newFiles = Array.from(fileList).map((f) =>
        Object.assign(f, {
          preview: URL.createObjectURL(f),
          id: Math.random().toString(36).slice(2),
        }),
      );
      const updated = [...files, ...newFiles].slice(0, maxFiles);
      setFiles(updated);
      onFilesChange(updated.map((f) => f.file || f));
    },
    [files, maxFiles, onFilesChange],
  );

  const onDrop = useCallback(
    (accepted, rejected) => {
      setError("");
      if (rejected.length > 0) {
        setError(rejected[0].errors[0]?.message || "Invalid file");
        return;
      }
      addFiles(accepted);
    },
    [addFiles],
  );

  useEffect(() => {
    if (disabled) return;
    const handler = (e) => {
      if (files.length >= maxFiles) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type?.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) imageFiles.push(blob);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        addFiles(imageFiles);
      }
    };
    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, [files.length, maxFiles, addFiles, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: maxFiles - files.length,
    disabled: disabled || files.length >= maxFiles,
    multiple: maxFiles > 1,
  });

  const remove = (id) => {
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    onFilesChange(updated.map((f) => f.file || f));
  };

  return (
    <div>
      {label && (
        <label className="text-[10px] text-muted/60 uppercase tracking-wide mb-1 block">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-4 transition text-center ${disabled ? "cursor-not-allowed opacity-30" : "cursor-pointer"} ${isDragActive ? "border-accent bg-accent/5" : "border-dark/20 hover:border-dark/40"} ${files.length >= maxFiles ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <p className="text-xs text-muted">
          {disabled
            ? "Select category first"
            : isDragActive
              ? "Drop here"
              : files.length >= maxFiles
                ? `Max ${maxFiles} file(s)`
                : "Drag & drop or click"}
        </p>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {files.map((f) => (
            <div key={f.id} className="relative group">
              <img
                src={f.preview}
                alt=""
                className="w-32 h-32 rounded-xl object-cover border border-dark/10"
              />
              <button
                type="button"
                onClick={() => remove(f.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-400 text-white rounded-full text-[10px] leading-none flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
