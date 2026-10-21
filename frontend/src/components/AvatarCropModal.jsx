import { useEffect, useRef, useState } from "react";
import { Check, Maximize2, Move, X, ZoomIn } from "lucide-react";

const FRAME_SIZE = 280;
const OUTPUT_SIZE = 320;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function AvatarCropModal({ file, onCancel, onSave }) {
  const [source] = useState(() => URL.createObjectURL(file));
  const [imageSize, setImageSize] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const imageRef = useRef(null);
  const dragRef = useRef(null);

  const baseScale = imageSize
    ? Math.max(FRAME_SIZE / imageSize.width, FRAME_SIZE / imageSize.height)
    : 1;
  const displayWidth = imageSize ? imageSize.width * baseScale * zoom : FRAME_SIZE;
  const displayHeight = imageSize ? imageSize.height * baseScale * zoom : FRAME_SIZE;
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      URL.revokeObjectURL(source);
    };
  }, [source]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && !saving) onCancel();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onCancel, saving]);

  function constrainPosition(nextPosition, nextZoom = zoom) {
    if (!imageSize) return nextPosition;
    const width = imageSize.width * baseScale * nextZoom;
    const height = imageSize.height * baseScale * nextZoom;
    const maxX = Math.max(0, (width - FRAME_SIZE) / 2);
    const maxY = Math.max(0, (height - FRAME_SIZE) / 2);
    return {
      x: clamp(nextPosition.x, -maxX, maxX),
      y: clamp(nextPosition.y, -maxY, maxY),
    };
  }

  function handleZoomChange(event) {
    const nextZoom = Number(event.target.value);
    setZoom(nextZoom);
    setPosition(current => constrainPosition(current, nextZoom));
  }

  function handlePointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      imageX: position.x,
      imageY: position.y,
    };
  }

  function handlePointerMove(event) {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    setPosition(constrainPosition({
      x: dragRef.current.imageX + event.clientX - dragRef.current.startX,
      y: dragRef.current.imageY + event.clientY - dragRef.current.startY,
    }));
  }

  function stopDragging(event) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }

  function handleCropKeyDown(event) {
    const step = event.shiftKey ? 12 : 4;
    const moves = {
      ArrowLeft: { x: position.x - step, y: position.y },
      ArrowRight: { x: position.x + step, y: position.y },
      ArrowUp: { x: position.x, y: position.y - step },
      ArrowDown: { x: position.x, y: position.y + step },
    };
    if (!moves[event.key]) return;
    event.preventDefault();
    setPosition(constrainPosition(moves[event.key]));
  }

  function fitToFrame() {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }

  async function saveCrop() {
    if (!imageSize || !imageRef.current) return;
    setSaving(true);
    setError("");

    try {
      const effectiveScale = baseScale * zoom;
      const sourceSize = FRAME_SIZE / effectiveScale;
      const sourceX = (imageSize.width - sourceSize) / 2 - position.x / effectiveScale;
      const sourceY = (imageSize.height - sourceSize) / 2 - position.y / effectiveScale;
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      context.drawImage(
        imageRef.current,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
      );
      await onSave(canvas.toDataURL("image/jpeg", 0.82));
    } catch (saveError) {
      setError(saveError.message || "Could not save this photo. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 id="avatar-crop-title" className="text-lg font-bold text-gray-900">Adjust profile picture</h2>
            <p className="mt-1 text-sm text-gray-500">Drag and zoom to frame your photo.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={saving} aria-label="Close photo editor" className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-gray-100 p-5">
            <div
              className="relative mx-auto h-[280px] w-[280px] max-w-full cursor-grab touch-none overflow-hidden rounded-full bg-gray-200 shadow-[0_0_0_4px_white,0_12px_35px_rgba(76,29,149,0.22)] active:cursor-grabbing focus:outline-none focus:ring-4 focus:ring-purple-200"
              tabIndex={0}
              aria-label="Photo crop area. Drag the photo or use arrow keys to reposition it."
              onKeyDown={handleCropKeyDown}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
            >
              <img
                ref={imageRef}
                src={source}
                alt="Profile crop preview"
                draggable="false"
                onLoad={event => {
                  setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight });
                  fitToFrame();
                }}
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: displayWidth,
                  height: displayHeight,
                  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
                }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/10" />
              {!imageSize && <div className="absolute inset-0 animate-pulse bg-gray-200" />}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-gray-500">
              <Move className="h-3.5 w-3.5" /> Drag to reposition
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-3">
              <ZoomIn className="h-4 w-4 shrink-0 text-gray-400" />
              <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={handleZoomChange} aria-label="Photo zoom" className="w-full accent-purple-600" />
              <span className="w-12 text-right text-xs font-semibold text-gray-500">{Math.round(zoom * 100)}%</span>
            </div>
            <button type="button" onClick={fitToFrame} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700">
              <Maximize2 className="h-4 w-4" /> Fit to frame
            </button>
          </div>

          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
          <button type="button" onClick={onCancel} disabled={saving} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40">Cancel</button>
          <button type="button" onClick={saveCrop} disabled={!imageSize || saving} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Check className="h-4 w-4" /> {saving ? "Saving…" : "Use photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
