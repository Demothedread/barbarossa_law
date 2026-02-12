/**
 * useStudyCanvas — Pannable/Zoomable Canvas Composable
 * Provides mouse-drag panning, scroll-wheel zooming, and touch support
 * for the flowchart/mind-map study experience.
 */
import { computed, ref } from "vue";

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export function useStudyCanvas(options?: {
  minZoom?: number;
  maxZoom?: number;
  initialScale?: number;
  initialX?: number;
  initialY?: number;
}) {
  const minZoom = options?.minZoom ?? 0.15;
  const maxZoom = options?.maxZoom ?? 2.5;

  const transform = ref<CanvasTransform>({
    x: options?.initialX ?? 0,
    y: options?.initialY ?? 0,
    scale: options?.initialScale ?? 0.7,
  });

  const isDragging = ref(false);
  const dragStart = ref({ x: 0, y: 0 });
  const containerRef = ref<HTMLElement | null>(null);

  const transformStyle = computed(() => ({
    transform: `translate(${transform.value.x}px, ${transform.value.y}px) scale(${transform.value.scale})`,
    transformOrigin: "0 0",
  }));

  // ── Pan ──
  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return; // left click only
    isDragging.value = true;
    dragStart.value = {
      x: e.clientX - transform.value.x,
      y: e.clientY - transform.value.y,
    };
    (e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging.value) return;
    transform.value.x = e.clientX - dragStart.value.x;
    transform.value.y = e.clientY - dragStart.value.y;
  }

  function onPointerUp() {
    isDragging.value = false;
  }

  // ── Zoom ──
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(
      minZoom,
      Math.min(maxZoom, transform.value.scale * delta),
    );

    // Zoom towards cursor position
    const rect = containerRef.value?.getBoundingClientRect();
    if (rect) {
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const ratio = 1 - newScale / transform.value.scale;
      transform.value.x += (mx - transform.value.x) * ratio;
      transform.value.y += (my - transform.value.y) * ratio;
    }

    transform.value.scale = newScale;
  }

  // ── Fit to View ──
  function fitToView(
    contentWidth: number,
    contentHeight: number,
    padding = 80,
  ) {
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    const scaleX = (rect.width - padding * 2) / contentWidth;
    const scaleY = (rect.height - padding * 2) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1.2);

    transform.value = {
      scale,
      x: (rect.width - contentWidth * scale) / 2,
      y: (rect.height - contentHeight * scale) / 2,
    };
  }

  // ── Center on point ──
  function centerOn(px: number, py: number, targetScale?: number) {
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    const s = targetScale ?? transform.value.scale;
    transform.value = {
      scale: s,
      x: rect.width / 2 - px * s,
      y: rect.height / 2 - py * s,
    };
  }

  // ── Zoom controls ──
  function zoomIn() {
    const newScale = Math.min(maxZoom, transform.value.scale * 1.25);
    transform.value.scale = newScale;
  }

  function zoomOut() {
    const newScale = Math.max(minZoom, transform.value.scale * 0.8);
    transform.value.scale = newScale;
  }

  function resetZoom() {
    transform.value = { x: 0, y: 0, scale: 0.7 };
  }

  // ── Touch support for pinch-zoom ──
  let lastTouchDistance = 0;

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const delta = distance / lastTouchDistance;
      const newScale = Math.max(
        minZoom,
        Math.min(maxZoom, transform.value.scale * delta),
      );
      transform.value.scale = newScale;
      lastTouchDistance = distance;
    }
  }

  return {
    transform,
    transformStyle,
    isDragging,
    containerRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    onTouchStart,
    onTouchMove,
    fitToView,
    centerOn,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
