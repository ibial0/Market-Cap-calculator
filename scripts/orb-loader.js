// Particle Wobble Orb Loader — Originkit
// Converted to pure Vanilla ES Module for Crypto MC Calc PNL Card Loading

const MAX_DPR = 2;
const TAU = Math.PI * 2;

const PERIOD = 5.4; // seconds for one loop at Speed 50
const BASE_SPREAD = 0.29; // sphere radius as a fraction of the ball box
const PERSPECTIVE = 3.5; // camera distance in ball radii
const DEPTH_SIZE = 1;
const DEPTH_FADE = 1;
const MIN_RADIUS = 0.6;
const MAX_DOTS = 1024;

function clamp01(x) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
}

function dotsN(base, n) {
    const v = Math.round(base * n);
    return v < 1 ? 1 : v;
}

// Fibonacci sphere: even coverage with no poles and no seam.
function fib(i, n) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = 2.399963 * i;
    return [Math.cos(th) * r, y, Math.sin(th) * r];
}

// Cartesian to [polar angle from +y, azimuth].
function polar(p) {
    return [Math.acos(Math.max(-1, Math.min(1, p[1]))), Math.atan2(p[2], p[0])];
}

// Yaw about the vertical axis, then pitch.
function spin(p, yaw, pitch) {
    const ca = Math.cos(yaw);
    const sa = Math.sin(yaw);
    const rx = p[0] * ca - p[2] * sa;
    let rz = p[0] * sa + p[2] * ca;
    const co = Math.cos(pitch);
    const so = Math.sin(pitch);
    const ry = p[1] * co - rz * so;
    rz = p[1] * so + rz * co;
    return [rx, ry, rz, p[3], p[4], p[5]];
}

// The loop itself: Particle Wobble
function frame(t, P, out) {
    const n = dotsN(150, P.n);
    for (let i = 0; i < n; i += 1) {
        const q = fib(i, n);
        const p = polar(q);
        // Unrelated frequencies, opposite directions: the sum never repeats inside a turn.
        const w =
            0.5 * Math.sin(3 * p[1] + 2 * p[0] + TAU * t) +
            0.5 * Math.sin(2 * p[1] - 3 * p[0] - 2 * TAU * t);
        const s = 1 + 0.15 * w;
        out.push(
            spin([q[0] * s, q[1] * s, q[2] * s, 0.7 + (0.6 * (w + 1)) / 2, 0.55 + (0.45 * (w + 1)) / 2], TAU * t, 0.36)
        );
    }
}

// Rotate, project, sort back to front, emit.
function project(pts, size, P, emit) {
    const c = size / 2;
    const R = size * BASE_SPREAD * P.sp;
    const pv = PERSPECTIVE;
    const yaw = P.yw + TAU * P.sn * P.t;
    const list = [];
    for (const p of pts) {
        const q = spin(p, yaw, P.pc);
        const z = q[2];
        const s = pv / (pv - z);
        const f = clamp01((z + 1.1) / 2.2);
        list.push([
            c + q[0] * R * s,
            c + q[1] * R * s,
            P.ds * (0.4 + 1.6 * DEPTH_SIZE * f) * s * (q[3] === undefined ? 1 : q[3]),
            (0.07 + 0.93 * Math.pow(f, 1.55 * DEPTH_FADE)) * (q[4] === undefined ? 1 : q[4]),
            q[5] || P.dot,
            z,
        ]);
    }
    list.sort((a, b) => a[5] - b[5]);
    for (const d of list) emit(d[0], d[1], d[2], d[3], d[4]);
}

const fitCache = new Map();
function autoFit(size, P, restYaw, restPitch) {
    const key = size + "/" + P.n + "/" + P.sp + "/" + restYaw + "/" + restPitch + "/" + P.sn;
    const hit = fitCache.get(key);
    if (hit !== undefined) return hit;
    const half = size / 2;
    let ext = 0;
    const probe = { ...P, ds: 1, dot: "#fff", acc: "#fff", t: 0, yw: restYaw, pc: restPitch };
    const emit = (x, y, r, a) => {
        if (a <= 0.05 || r <= 0.15) return;
        ext = Math.max(ext, Math.abs(x - half) + 0.5 * r, Math.abs(y - half) + 0.5 * r);
    };
    for (let k = 0; k < 20; k += 1) {
        probe.t = k / 20;
        const out = [];
        frame(probe.t, probe, out);
        project(out, size, probe, emit);
    }
    const fit = ext > 1 ? Math.max(0.55, Math.min(1.7, (0.415 * size) / ext)) : 1;
    fitCache.set(key, fit);
    return fit;
}

function dotScaleFor(size) {
    if (size <= 46) return 0.4;
    if (size <= 190) return 0.4 + ((size - 46) / 144) * 0.6;
    if (size <= 340) return 1 + ((size - 190) / 150) * 0.55;
    return 1.55;
}

function parseColor(input, fb) {
    if (!input) return fb;
    const str = String(input).trim();
    if (str.charAt(0) === "#") {
        let hex = str.slice(1);
        if (hex.length === 3 || hex.length === 4) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + (hex.length === 4 ? hex[3] + hex[3] : "");
        }
        if (hex.length >= 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b, a];
        }
        return fb;
    }
    const m = str.match(/[\d.]+/g);
    if (m && m.length >= 3) {
        return [
            Math.min(255, parseFloat(m[0])),
            Math.min(255, parseFloat(m[1])),
            Math.min(255, parseFloat(m[2])),
            m.length >= 4 ? Math.min(1, parseFloat(m[3])) : 1,
        ];
    }
    return fb;
}

function css(c) {
    return "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + c[3] + ")";
}

function num(v, fb) {
    return typeof v === "number" && isFinite(v) ? v : fb;
}

function clampN(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

const BALL_DEFAULTS = { spread: 100, turn: 0, tilt: 0 };
const POINTER_DEFAULTS = { drag: 100, damping: 20 };

export function createOrbNoise(container, props = {}) {
    if (!container) return null;

    const {
        dotColor = "#12e2fd", // Website blue theme
        density = 300,
        dotSize = 150, // originkitPresetProps
        speed = 50,
        spinTurns = 1,
        ball = {},
        pointer = {},
        width = 84,
        height = 84,
    } = props;

    const ball_ = { ...BALL_DEFAULTS, ...ball };
    const pointer_ = { ...POINTER_DEFAULTS, ...pointer };

    let canvas = container.querySelector('canvas.orb-noise-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'orb-noise-canvas';
        canvas.style.position = 'absolute';
        canvas.style.inset = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.style.touchAction = 'none';
        container.appendChild(canvas);
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("OrbNoise: 2D context unavailable");
        return null;
    }

    const v = {
        dot: dotColor,
        acc: dotColor,
        speed: clampN(num(speed, 50), -100, 100) / 50,
        density: clampN(num(density, 100), 20, 300) / 100,
        dotSize: clampN(num(dotSize, 100), 20, 300) / 100,
        spinTurns: Math.round(clampN(num(spinTurns, 1), -3, 3)),
        drag: clampN(num(pointer_.drag, 100), 0, 300) / 100,
        damping: clampN(num(pointer_.damping, 20), 1, 100),
        spread: clampN(num(ball_.spread, 100), 40, 180) / 100,
        turn: (clampN(num(ball_.turn, 0), -180, 180) * Math.PI) / 180,
        tilt: (clampN(num(ball_.tilt, 0), -90, 90) * Math.PI) / 180,
    };

    const drag = { active: false, lx: 0, ly: 0, lt: 0, yaw: 0, pitch: 0, vx: 0, vy: 0 };
    let raf = 0;
    let last = performance.now();
    let phase = 0;
    let isRunning = false;

    const render = (now) => {
        if (!isRunning) return;

        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        const cw = num(width, 0) || canvas.clientWidth || 84;
        const ch = num(height, 0) || canvas.clientHeight || 84;
        const bw = Math.max(1, Math.round(cw * dpr));
        const bh = Math.max(1, Math.round(ch * dpr));
        if (canvas.width !== bw || canvas.height !== bh) {
            canvas.width = bw;
            canvas.height = bh;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cw, ch);

        phase = (phase + (dt * v.speed) / PERIOD) % 1;
        if (phase < 0) phase += 1;

        const size = Math.max(4, Math.min(cw, ch));
        const bx = (cw - size) / 2;
        const by = (ch - size) / 2;

        const dotCol = css(parseColor(v.dot, [18, 226, 253, 1]));
        const accCol = css(parseColor(v.acc, [18, 226, 253, 1]));

        if (!drag.active) {
            const decay = Math.exp(-v.damping * 0.12 * dt);
            drag.yaw += drag.vx * dt;
            drag.pitch += drag.vy * dt;
            drag.vx *= decay;
            drag.vy *= decay;
        }
        const restPitch = v.tilt;
        drag.pitch = clampN(drag.pitch, -Math.PI / 2 - restPitch, Math.PI / 2 - restPitch);

        const P = {
            n: v.density,
            sp: v.spread,
            ds: dotScaleFor(size) * v.dotSize,
            yw: v.turn + drag.yaw,
            sn: v.spinTurns,
            pc: restPitch + drag.pitch,
            t: phase,
            dot: dotCol,
            acc: accCol,
        };

        const fit = autoFit(size, P, v.turn, restPitch);
        const half = size / 2;

        const out = [];
        frame(phase, P, out);
        let drawn = 0;
        project(out, size, P, (x, y, r, a, col) => {
            if (drawn >= MAX_DOTS) return;
            const rr = r * (0.55 + 0.45 * fit);
            if (rr <= 0.05 || a <= 0.004) return;
            const cx = bx + half + (x - half) * fit;
            const cy = by + half + (y - half) * fit;
            let dr = rr;
            let da = Math.min(1, a);
            if (dr < MIN_RADIUS) {
                da *= (dr / MIN_RADIUS) * (dr / MIN_RADIUS);
                dr = MIN_RADIUS;
            }
            ctx.globalAlpha = da;
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(cx, cy, dr, 0, TAU);
            ctx.fill();
            drawn += 1;
        });
        ctx.globalAlpha = 1;

        raf = requestAnimationFrame(render);
    };

    const onDown = (e) => {
        if (v.drag <= 0) return;
        drag.active = true;
        drag.lx = e.clientX;
        drag.ly = e.clientY;
        drag.lt = performance.now();
        drag.vx = 0;
        drag.vy = 0;
        try {
            canvas.setPointerCapture(e.pointerId);
        } catch (err) {}
    };

    const onMove = (e) => {
        if (!drag.active) return;
        const k = (v.drag * TAU) / Math.max(1, canvas.clientWidth || 84);
        const dx = (e.clientX - drag.lx) * k;
        const dy = (e.clientY - drag.ly) * k;
        const now2 = performance.now();
        const span = Math.max(1, now2 - drag.lt);
        drag.lx = e.clientX;
        drag.ly = e.clientY;
        drag.lt = now2;
        drag.yaw -= dx;
        drag.pitch += dy;
        drag.vx = (-dx / span) * 1000;
        drag.vy = (dy / span) * 1000;
    };

    const onUp = () => {
        drag.active = false;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return {
        start() {
            if (isRunning) return;
            isRunning = true;
            last = performance.now();
            render(last); // Render first frame immediately to eliminate delay
        },
        stop() {
            if (!isRunning) return;
            isRunning = false;
            cancelAnimationFrame(raf);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        destroy() {
            this.stop();
            canvas.removeEventListener("pointerdown", onDown);
            canvas.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }
    };
}
