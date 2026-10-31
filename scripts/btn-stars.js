/**
 * Generate Card Button — Dynamic Rising Star Particles
 * Recreates the exact 4-pointed sparkling star shower from the reference design.
 * 
 * Features:
 * - Pure Vanilla Canvas 2D, high-performance, 60fps
 * - DevicePixelRatio crisp rendering
 * - Exact 4-pointed sparkle star shapes with elongated vertical spikes
 * - Truly random spawn positions, sizes (tiny, small, medium, large, giant)
 * - Stars gently float UPWARDS from bottom to top within button bounds
 * - Pre-seeds stars on start for instant magical constellation
 * - 0% CPU when idle
 */

export function createBtnStars(container) {
    if (!container) return null;

    let canvas = container.querySelector('canvas.btn-stars-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'btn-stars-canvas';
        canvas.style.position = 'absolute';
        canvas.style.inset = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.borderRadius = 'inherit';
        canvas.style.display = 'block';
        container.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    let particles = [];
    let isRunning = false;
    let isFadingOut = false;
    let fadeOutAlpha = 1.0;
    let rafId = 0;
    let lastTime = 0;
    let spawnTimer = 0;

    // Helper: spawn a single randomized star particle
    function spawnParticle(w, h, initialProgress = 0) {
        // Pick horizontal zone: 46% left side, 46% right side, 8% middle
        const rZone = Math.random();
        let x;
        if (rZone < 0.46) {
            x = w * (0.06 + Math.random() * 0.36);
        } else if (rZone < 0.92) {
            x = w * (0.58 + Math.random() * 0.36);
        } else {
            x = w * (0.42 + Math.random() * 0.16);
        }

        // Weighted size distribution (half-width rx)
        const rSize = Math.random();
        let rx;
        if (rSize < 0.30) {
            rx = 2.5 + Math.random() * 1.5; // Tiny: 5-8px wide
        } else if (rSize < 0.62) {
            rx = 4.5 + Math.random() * 2.0; // Small: 9-13px wide
        } else if (rSize < 0.85) {
            rx = 7.0 + Math.random() * 2.5; // Medium: 14-19px wide
        } else if (rSize < 0.96) {
            rx = 10.0 + Math.random() * 2.5; // Large: 20-25px wide
        } else {
            rx = 13.5 + Math.random() * 2.5; // Giant feature star: 27-32px wide
        }

        // Vertical elongation: vertical tips are longer than horizontal tips
        const aspect = 1.20 + Math.random() * 0.15;
        const ry = rx * aspect;

        // Upward velocity (px per second)
        const vy = -(22 + Math.random() * 24);
        // Slight horizontal drift
        const vx = (Math.random() - 0.5) * 6;

        // Lifetime between 0.75s and 1.25s
        const maxLife = 0.75 + Math.random() * 0.5;
        const life = initialProgress * maxLife;

        // Start in the lower/middle half of button
        const startY = h * (0.65 + Math.random() * 0.30);
        const y = startY + (vy * life);

        return {
            x: x + (vx * life),
            y,
            rx,
            ry,
            vy,
            vx,
            life,
            maxLife,
            twinkleSpeed: 8 + Math.random() * 8,
            twinklePhase: Math.random() * Math.PI * 2,
            rot: (Math.random() - 0.5) * 0.15
        };
    }

    // Draw the 4-pointed sparkle star with concave curves
    function drawStar(c, x, y, rx, ry, rot, alpha) {
        if (alpha <= 0.02 || rx <= 0.5) return;
        c.save();
        c.translate(x, y);
        if (rot) c.rotate(rot);
        c.globalAlpha = Math.min(1, Math.max(0, alpha * fadeOutAlpha));
        c.fillStyle = '#ffffff';

        // Soft volumetric glow around star
        c.shadowColor = 'rgba(255, 255, 255, 0.95)';
        c.shadowBlur = Math.min(8, rx * 0.6);

        c.beginPath();
        c.moveTo(0, -ry);
        c.quadraticCurveTo(0, 0, rx, 0);
        c.quadraticCurveTo(0, 0, 0, ry);
        c.quadraticCurveTo(0, 0, -rx, 0);
        c.quadraticCurveTo(0, 0, 0, -ry);
        c.closePath();
        c.fill();
        c.restore();
    }

    function loop(now) {
        if (!isRunning) return;

        const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
        lastTime = now;

        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const cw = canvas.clientWidth || 380;
        const ch = canvas.clientHeight || 48;
        const bw = Math.max(1, Math.round(cw * dpr));
        const bh = Math.max(1, Math.round(ch * dpr));

        if (canvas.width !== bw || canvas.height !== bh) {
            canvas.width = bw;
            canvas.height = bh;
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cw, ch);

        if (isFadingOut) {
            fadeOutAlpha -= dt * 6.0; // fade out in ~160ms
            if (fadeOutAlpha <= 0) {
                stop();
                return;
            }
        } else {
            // Spawn new particles continuously
            spawnTimer += dt;
            const spawnInterval = 0.085; // new star every ~85ms
            while (spawnTimer >= spawnInterval) {
                spawnTimer -= spawnInterval;
                if (particles.length < 22) {
                    particles.push(spawnParticle(cw, ch, 0));
                }
            }
        }

        // Update and draw existing particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life += dt;
            p.y += p.vy * dt;
            p.x += p.vx * dt;

            const progress = p.life / p.maxLife;
            if (progress >= 1 || p.y < -p.ry) {
                particles.splice(i, 1);
                continue;
            }

            // Opacity curve:
            // 0 -> 0.25: fade in from 0 to 1
            // 0.25 -> 0.70: sparkle at peak opacity (0.85 - 1.0)
            // 0.70 -> 1.0: fade out to 0
            let alpha;
            if (progress < 0.25) {
                alpha = progress / 0.25;
            } else if (progress < 0.70) {
                alpha = 0.85 + 0.15 * Math.sin(p.twinklePhase + p.life * p.twinkleSpeed);
            } else {
                alpha = (1 - progress) / 0.30;
            }

            // Extra fade near top boundary so no abrupt clipping occurs
            if (p.y < 8) {
                alpha *= Math.max(0, p.y / 8);
            }

            // Scale progression: starts 0.65, peaks at 1.08, gently shrinks to 0.85
            let scale;
            if (progress < 0.30) {
                scale = 0.65 + (progress / 0.30) * 0.43;
            } else if (progress < 0.70) {
                scale = 1.08;
            } else {
                scale = 1.08 - ((progress - 0.70) / 0.30) * 0.23;
            }

            drawStar(ctx, p.x, p.y, p.rx * scale, p.ry * scale, p.rot, alpha);
        }

        rafId = requestAnimationFrame(loop);
    }

    function start() {
        if (isRunning && !isFadingOut) return;
        isRunning = true;
        isFadingOut = false;
        fadeOutAlpha = 1.0;
        spawnTimer = 0;
        lastTime = performance.now();

        const cw = canvas.clientWidth || 380;
        const ch = canvas.clientHeight || 48;

        // Pre-seed 8-11 particles at random stages of their lifecycles
        // so the button instantly blooms with stars upon click!
        particles = [];
        const initialCount = 9 + Math.floor(Math.random() * 3);
        for (let i = 0; i < initialCount; i++) {
            const p = spawnParticle(cw, ch, 0.1 + Math.random() * 0.65);
            particles.push(p);
        }

        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(loop);
    }

    function finish() {
        if (!isRunning) return;
        isFadingOut = true;
    }

    function stop() {
        isRunning = false;
        isFadingOut = false;
        fadeOutAlpha = 1.0;
        particles = [];
        cancelAnimationFrame(rafId);
        if (canvas.width && canvas.height) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    return {
        start,
        finish,
        stop,
        destroy() {
            stop();
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }
    };
}
