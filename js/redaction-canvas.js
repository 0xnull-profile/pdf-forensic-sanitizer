// @ts-check
/**
 * Edit redaction boxes in normalized, page-relative coordinates.
 * The overlay only previews those boxes. Actual removal happens when the
 * export engine draws them into each rasterized page.
 */

const MIN_RECT = 0.0001;
const MAX_BOXES = 2000;
const HIT_SIZE_PX = 12;
const DELETE_SIZE_PX = 24;

/** @typedef {{x:number,y:number,w:number,h:number}} Rect */
/** @typedef {Rect & {id:number,page:number}} RedactionBox */
/** @typedef {'select'|'redact'|'pan'} RedactionTool */

/** @param {number} value @param {number} [min] @param {number} [max] */
export function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Reject invalid geometry rather than silently exporting a differently shaped
 * redaction. Coordinates are relative to the RENDERED PDF.js viewport,
 * including its rotation and crop box.
 * @param {Rect} rect
 * @returns {Rect}
 */
export function validateRect(rect) {
  const { x, y, w, h } = rect ?? {};
  if (![x, y, w, h].every(Number.isFinite) || x < 0 || y < 0 ||
      w < MIN_RECT || h < MIN_RECT || x + w > 1 + 1e-10 || y + h > 1 + 1e-10) {
    throw new RangeError('Riquadro non valido: coordinate normalizzate comprese tra 0 e 1.');
  }
  return { x: clamp(x), y: clamp(y), w: Math.min(w, 1 - x), h: Math.min(h, 1 - y) };
}

/** @param {{x:number,y:number}} a @param {{x:number,y:number}} b */
export function rectBetween(a, b) {
  const x1 = clamp(Math.min(a.x, b.x));
  const y1 = clamp(Math.min(a.y, b.y));
  const x2 = clamp(Math.max(a.x, b.x));
  const y2 = clamp(Math.max(a.y, b.y));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** @param {Rect} rect @param {number} dx @param {number} dy */
export function moveRect(rect, dx, dy) {
  return { ...rect, x: clamp(rect.x + dx, 0, 1 - rect.w), y: clamp(rect.y + dy, 0, 1 - rect.h) };
}

/**
 * Include a small safety margin when converting a box to pixel bounds.
 * The upper bounds are exclusive. Coordinates follow the rendered PDF.js
 * viewport, so there is no bottom-left PDF coordinate conversion.
 * @param {Rect} rect @param {number} width @param {number} height @param {number} [bleed]
 */
export function rasterBounds(rect, width, height, bleed = 2) {
  validateRect(rect);
  if (![width, height, bleed].every(Number.isFinite) || width <= 0 || height <= 0 || bleed < 0) {
    throw new RangeError('Dimensioni del canvas di esportazione non valide.');
  }
  const x1 = clamp(Math.floor(rect.x * width) - bleed, 0, width);
  const y1 = clamp(Math.floor(rect.y * height) - bleed, 0, height);
  const x2 = clamp(Math.ceil((rect.x + rect.w) * width) + bleed, 0, width);
  const y2 = clamp(Math.ceil((rect.y + rect.h) * height) + bleed, 0, height);
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** Session-only, bounded state; snapshots are detached from the internal Map. */
export class RedactionStore {
  /** @type {Map<number, RedactionBox>} */
  #boxes = new Map();
  #nextId = 1;
  #revision = 0;

  get revision() { return this.#revision; }
  get count() { return this.#boxes.size; }
  /** @param {number} page */
  forPage(page) { return [...this.#boxes.values()].filter((item) => item.page === page).map((item) => ({ ...item })); }
  all() { return [...this.#boxes.values()].map((item) => ({ ...item })); }
  /** @param {number} id */
  get(id) { const value = this.#boxes.get(id); return value ? { ...value } : null; }
  /** @param {number} page @param {Rect} rect */
  add(page, rect) {
    if (!Number.isInteger(page) || page < 1) throw new RangeError('Pagina non valida.');
    if (this.#boxes.size >= MAX_BOXES) throw new RangeError('Limite massimo di 2.000 riquadri per sessione.');
    const item = { id: this.#nextId++, page, ...validateRect(rect) };
    this.#boxes.set(item.id, item);
    this.#revision += 1;
    return { ...item };
  }
  /** @param {number} id @param {Rect} rect */
  update(id, rect) {
    const item = this.#boxes.get(id);
    if (!item) return null;
    const next = { ...item, ...validateRect(rect) };
    if (["x", "y", "w", "h"].some((key) => next[key] !== item[key])) {
      this.#boxes.set(id, next);
      this.#revision += 1;
    }
    return { ...next };
  }
  /** @param {number} id */
  remove(id) {
    const removed = this.#boxes.delete(id);
    if (removed) this.#revision += 1;
    return removed;
  }
  /** @param {number} [page] */
  clear(page) {
    const before = this.#boxes.size;
    if (page === undefined) this.#boxes.clear();
    else for (const item of this.#boxes.values()) if (item.page === page) this.#boxes.delete(item.id);
    if (this.#boxes.size !== before) this.#revision += 1;
  }
}

/**
 * Canvas pointer editing plus hit testing; dialogs/lists/ARIA remain in app.js.
 * @param {RedactionBox} box @param {{x:number,y:number}} point
 * @param {number} width @param {number} height
 */
export function hitTestBox(box, point, width, height) {
  const toleranceX = HIT_SIZE_PX / width, toleranceY = HIT_SIZE_PX / height;
  const near = (/** @type {number} */ x, /** @type {number} */ y) =>
    Math.abs(point.x - x) <= toleranceX && Math.abs(point.y - y) <= toleranceY;
  // Never mistake the top-right delete target for a resize handle.
  if (point.x >= box.x + box.w - DELETE_SIZE_PX / width && point.x <= box.x + box.w &&
      point.y >= box.y && point.y <= box.y + DELETE_SIZE_PX / height) return 'delete';
  if (near(box.x, box.y)) return 'nw';
  if (near(box.x + box.w, box.y)) return 'ne';
  if (near(box.x, box.y + box.h)) return 'sw';
  if (near(box.x + box.w, box.y + box.h)) return 'se';
  if (point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h) return 'move';
  return null;
}

/**
 * @param {Rect} original @param {'nw'|'ne'|'sw'|'se'} handle
 * @param {{x:number,y:number}} pointer
 */
export function resizeRect(original, handle, pointer) {
  let left = original.x, top = original.y, right = left + original.w, bottom = top + original.h;
  if (handle.includes('w')) left = clamp(pointer.x, 0, right - MIN_RECT);
  else right = clamp(pointer.x, left + MIN_RECT, 1);
  if (handle.includes('n')) top = clamp(pointer.y, 0, bottom - MIN_RECT);
  else bottom = clamp(pointer.y, top + MIN_RECT, 1);
  return { x: left, y: top, w: right - left, h: bottom - top };
}

export class RedactionCanvas {
  /** @type {HTMLCanvasElement} */ #canvas;
  /** @type {CanvasRenderingContext2D} */ #ctx;
  /** @type {HTMLElement} */ #viewer;
  /** @type {RedactionStore} */ #store;
  /** @type {()=>void} */ #onChange;
  /** @type {(message:string)=>void} */ #onWarning;
  #abort = new AbortController();
  #page = 1;
  /** @type {RedactionTool} */ #tool = 'select';
  #enabled = false;
  /** @type {number|null} */ #selected = null;
  /** @type {null | {kind:string, pointerId:number, start:{x:number,y:number},box:RedactionBox|null,initialScrollX:number,initialScrollY:number,clientX:number,clientY:number}} */ #drag = null;
  /** @type {Rect|null} */ #draft = null;
  #longPressTimer = 0;

  /** @param {{canvas:HTMLCanvasElement,viewer:HTMLElement,store:RedactionStore,onChange:()=>void,onWarning:(message:string)=>void}} options */
  constructor({ canvas, viewer, store, onChange, onWarning }) {
    this.#canvas = canvas;
    this.#ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    this.#viewer = viewer;
    this.#store = store;
    this.#onChange = onChange;
    this.#onWarning = onWarning;
    if (!this.#ctx) throw new Error('Canvas overlay non disponibile.');
    const signal = this.#abort.signal;
    canvas.addEventListener('pointerdown', (event) => this.#down(event), { signal });
    canvas.addEventListener('pointermove', (event) => this.#move(event), { signal });
    canvas.addEventListener('pointerup', (event) => this.#up(event), { signal });
    canvas.addEventListener('pointercancel', () => this.#cancel(), { signal });
    canvas.addEventListener('lostpointercapture', () => this.#cancel(), { signal });
  }

  get selectedId() { return this.#selected; }
  get page() { return this.#page; }
  get tool() { return this.#tool; }
  /** @param {number} page */
  setPage(page) { this.#cancel(); this.#page = page; this.#selected = null; this.paint(); this.#onChange(); }
  /** @param {RedactionTool} tool */
  setTool(tool) { this.#cancel(); this.#tool = tool; this.paint(); }
  /** @param {boolean} enabled */
  setEnabled(enabled) { this.#enabled = enabled; if (!enabled) this.#cancel(); }
  /** @param {number|null} id */
  select(id) {
    const box = id == null ? null : this.#store.get(id);
    this.#selected = box?.page === this.#page ? id : null;
    this.paint(); this.#onChange();
  }
  /** @param {number} id */
  remove(id) {
    const changed = this.#store.remove(id);
    if (this.#selected === id) this.#selected = null;
    if (changed) { this.paint(); this.#onChange(); }
  }
  /** @param {number} page @param {Rect} rect */
  add(page, rect) {
    const box = this.#store.add(page, rect);
    if (page === this.#page) this.#selected = box.id;
    this.paint(); this.#onChange();
    return box;
  }
  reset() { this.#cancel(); this.#selected = null; this.#page = 1; this.#tool = 'select'; this.#store.clear(); this.paint(); this.#onChange(); }
  destroy() { this.#cancel(); this.#abort.abort(); this.#canvas.width = this.#canvas.height = 0; }

  /** @param {PointerEvent} event */
  #point(event) {
    const bounds = this.#canvas.getBoundingClientRect();
    return { x: clamp((event.clientX - bounds.left) / bounds.width),
      y: clamp((event.clientY - bounds.top) / bounds.height) };
  }
  #canvasSize() {
    const bounds = this.#canvas.getBoundingClientRect();
    return { width: bounds.width || 1, height: bounds.height || 1 };
  }

  /** @param {PointerEvent} event */
  #down(event) {
    if (!this.#enabled || this.#drag || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const start = this.#point(event);
    const current = this.#store.forPage(this.#page);
    const { width, height } = this.#canvasSize();
    if (this.#tool === 'pan') {
      this.#drag = { kind:'pan',pointerId:event.pointerId,start,box:null,
        initialScrollX:this.#viewer.scrollLeft,initialScrollY:this.#viewer.scrollTop,
        clientX:event.clientX,clientY:event.clientY };
    } else if (this.#tool === 'redact') {
      this.#drag = { kind:event.pointerType === 'touch' ? 'pending-touch' : 'new', pointerId:event.pointerId,start,
        box:null,initialScrollX:0,initialScrollY:0,clientX:event.clientX,clientY:event.clientY };
      if (event.pointerType === 'touch') {
        this.#longPressTimer = window.setTimeout(() => {
          if (this.#drag?.kind === 'pending-touch') { this.#drag.kind = 'new'; this.#draft = rectBetween(start, start); this.paint(); }
        }, 360);
      } else this.#draft = rectBetween(start, start);
    } else {
      for (const item of current.reverse()) {
        const hit = hitTestBox(item, start, width, height);
        if (!hit) continue;
        if (hit === 'delete') { this.remove(item.id); return; }
        this.#selected = item.id;
        this.#drag = { kind:hit,pointerId:event.pointerId,start,box:item,initialScrollX:0,
          initialScrollY:0,clientX:event.clientX,clientY:event.clientY };
        this.paint(); this.#onChange();
        break;
      }
      if (!this.#drag) { this.#selected = null; this.paint(); this.#onChange(); return; }
    }
    try { this.#canvas.setPointerCapture(event.pointerId); } catch { /* Pointer may already be released. */ }
    event.preventDefault();
  }

  /** @param {PointerEvent} event */
  #move(event) {
    const drag = this.#drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.kind === 'pending-touch') {
      if (Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) > 6) this.#cancel();
      return;
    }
    if (drag.kind === 'pan') {
      this.#viewer.scrollLeft = drag.initialScrollX - (event.clientX - drag.clientX);
      this.#viewer.scrollTop = drag.initialScrollY - (event.clientY - drag.clientY);
      return;
    }
    const point = this.#point(event);
    if (drag.kind === 'new') this.#draft = rectBetween(drag.start, point);
    else if (drag.box) {
      if (drag.kind === 'move') this.#draft = moveRect(drag.box, point.x - drag.start.x, point.y - drag.start.y);
      else if (['nw','ne','sw','se'].includes(drag.kind)) this.#draft = resizeRect(drag.box, /** @type {'nw'|'ne'|'sw'|'se'} */ (drag.kind), point);
    }
    this.paint();
  }

  /** @param {PointerEvent} event */
  #up(event) {
    const drag = this.#drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const kind = drag.kind;
    if (kind !== 'pan' && kind !== 'pending-touch') this.#move(event);
    const box = this.#draft;
    this.#cancel();
    if (!box || kind === 'pending-touch' || kind === 'pan') return;
    if (kind === 'new') {
      const { width, height } = this.#canvasSize();
      if (box.w * width < 5 || box.h * height < 5) {
        this.#onWarning('Trascina un riquadro di almeno 5 × 5 pixel sullo schermo.');
        return;
      }
      try { this.add(this.#page, box); }
      catch (error) { this.#onWarning(error instanceof Error ? error.message : 'Riquadro non valido.'); }
    } else if (drag.box) {
      try { this.#store.update(drag.box.id, box); this.#selected = drag.box.id; this.paint(); this.#onChange(); }
      catch (error) { this.#onWarning(error instanceof Error ? error.message : 'Impossibile modificare il riquadro.'); }
    }
  }

  #cancel() {
    window.clearTimeout(this.#longPressTimer);
    this.#longPressTimer = 0;
    this.#drag = null;
    this.#draft = null;
    this.paint();
  }

  paint() {
    const canvas = this.#canvas;
    const ctx = this.#ctx;
    if (!canvas.width || !canvas.height) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    const boxes = this.#store.forPage(this.#page);
    const ratio = width / this.#canvasSize().width;
    for (const box of boxes) {
      const rect = box.id === this.#selected && this.#draft && this.#drag?.kind !== 'new'
        ? this.#draft : box;
      const x = rect.x * width, y = rect.y * height, w = rect.w * width, h = rect.h * height;
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, w, h);
      // The delete target exists only in the editor overlay.
      const target = Math.min(DELETE_SIZE_PX * ratio, w, h);
      if (target >= 12) {
        ctx.fillStyle = 'rgba(255,255,255,.17)';
        ctx.fillRect(x + w - target, y, target, target);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1.4, ratio);
        ctx.beginPath();
        const m = target * 0.32, side = target - 2 * m;
        ctx.moveTo(x + w - target + m, y + m); ctx.lineTo(x + w - target + m + side, y + m + side);
        ctx.moveTo(x + w - target + m + side, y + m); ctx.lineTo(x + w - target + m, y + m + side);
        ctx.stroke();
      }
      if (box.id === this.#selected) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = Math.max(2, 1.5 * ratio);
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = '#F1F5F9';
        const r = 4.5 * ratio;
        for (const [hx,hy] of [[x,y],[x+w,y],[x,y+h],[x+w,y+h]]) ctx.fillRect(hx - r, hy - r, r * 2, r * 2);
      }
    }
    if (this.#drag?.kind === 'new' && this.#draft) {
      const { x,y,w,h } = this.#draft;
      ctx.fillStyle = 'rgba(239,68,68,0.12)';
      ctx.fillRect(x*width, y*height, w*width, h*height);
      ctx.setLineDash([6*ratio,4*ratio]);
      ctx.lineWidth = 2*ratio;
      ctx.strokeStyle = '#EF4444';
      ctx.strokeRect(x*width,y*height,w*width,h*height);
      ctx.setLineDash([]);
    }
  }
}
