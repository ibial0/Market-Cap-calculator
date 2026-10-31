/**
 * Reaction / Emotion Selector Controller
 * - 7 Animated Emotions: Happy, Shock, Greed, Cry, Angry, Worried, Relieved
 * - Default "None" Mode: Continuously and smoothly alternates through all 7 emotions.
 * - Manual Selection Mode: Locks to the chosen emotion, replaying with a natural pause.
 * - "None" Option in Selector: Reverts back to automatic rotation.
 * - Horizontal floating popover on the LEFT side of the button.
 * - Interactive hover scaling (1.3x) with zero layout shifts.
 * - Low-CPU: Only the currently displayed animation actively plays.
 */

import { emojiHappyData } from '../assets/lottie/emoji-happy.js';
import { emojiShockData } from '../assets/lottie/emoji-shock.js';
import { emojiGreedData } from '../assets/lottie/emoji-greed.js';
import { emojiCryData } from '../assets/lottie/emoji-cry.js';
import { emojiAngryData } from '../assets/lottie/emoji-angry.js';
import { emojiWorriedData } from '../assets/lottie/emoji-worried.js';
import { emojiRelievedData } from '../assets/lottie/emoji-relieved.js';

export const REACTION_EMOTIONS = [
    { id: 'happy',    label: 'Happy',    data: emojiHappyData },
    { id: 'shock',    label: 'Shock',    data: emojiShockData },
    { id: 'greed',    label: 'Greed',    data: emojiGreedData },
    { id: 'cry',      label: 'Cry',      data: emojiCryData },
    { id: 'angry',    label: 'Angry',    data: emojiAngryData },
    { id: 'worried',  label: 'Worried',  data: emojiWorriedData },
    { id: 'relieved', label: 'Relieved', data: emojiRelievedData },
];

export function initReactionController({ onEmotionChange, getSelectedEmotion, setSelectedEmotion }) {
    const btnReactionPicker = document.getElementById('btn-reaction-picker');
    const reactionPopover   = document.getElementById('reaction-popover');

    if (!btnReactionPicker || !reactionPopover) {
        console.warn('[ReactionController] Required elements not found in DOM');
        return null;
    }

    let lottieContainer = btnReactionPicker.querySelector('.reaction-btn-lottie-container');
    if (!lottieContainer) {
        lottieContainer = document.createElement('div');
        lottieContainer.className = 'reaction-btn-lottie-container';
        btnReactionPicker.appendChild(lottieContainer);
    }

    // ── 1. Create Main Button Lottie Layers & Instances ───────
    const btnAnims = {};
    REACTION_EMOTIONS.forEach(item => {
        let layer = document.getElementById(`btn-lottie-${item.id}`);
        if (!layer) {
            // Also check legacy layer-smile / layer-shock
            if (item.id === 'happy') layer = document.getElementById('btn-lottie-smile');
            if (item.id === 'shock') layer = document.getElementById('btn-lottie-shock');
        }
        if (!layer) {
            layer = document.createElement('div');
            layer.id = `btn-lottie-${item.id}`;
            layer.className = `reaction-btn-lottie-layer layer-${item.id}`;
            lottieContainer.appendChild(layer);
        } else {
            layer.id = `btn-lottie-${item.id}`;
            layer.className = `reaction-btn-lottie-layer layer-${item.id}`;
            layer.innerHTML = ''; // reset container
        }

        const anim = lottie.loadAnimation({
            container: layer,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            animationData: item.data
        });

        btnAnims[item.id] = { anim, layer, item };
    });

    let currentVisibleId = null;
    let cycleIndex = 0;
    let switchTimeout = null;
    let safetyTimeout = null;

    // Helper: switch to an emotion on the main button
    function displayEmotion(emotionId) {
        if (switchTimeout) {
            clearTimeout(switchTimeout);
            switchTimeout = null;
        }
        if (safetyTimeout) {
            clearTimeout(safetyTimeout);
            safetyTimeout = null;
        }

        const target = btnAnims[emotionId];
        if (!target) return;

        // Fade out previously active layer and stop its animation
        if (currentVisibleId && currentVisibleId !== emotionId) {
            const prev = btnAnims[currentVisibleId];
            if (prev) {
                prev.layer.classList.remove('is-active');
                prev.anim.goToAndStop(0, true);
            }
        }

        // Fade in new layer and play animation
        currentVisibleId = emotionId;
        target.layer.classList.add('is-active');
        target.anim.goToAndPlay(0, true);

        // Safety timeout in case complete event doesn't fire (max 3.5s)
        safetyTimeout = setTimeout(() => {
            onAnimationFinished(emotionId);
        }, 3600);
    }

    function onAnimationFinished(emotionId) {
        if (safetyTimeout) {
            clearTimeout(safetyTimeout);
            safetyTimeout = null;
        }

        const selected = getSelectedEmotion();

        // ── Manual Mode ──────────────────────────────────────
        if (selected && selected !== 'none') {
            if (emotionId === selected) {
                // Breathing pause before replaying
                switchTimeout = setTimeout(() => {
                    const inst = btnAnims[selected];
                    if (inst && getSelectedEmotion() === selected) {
                        inst.anim.goToAndPlay(0, true);
                    }
                }, 1200);
            }
            return;
        }

        // ── Automatic Mode (None selected) ───────────────────
        // Advance to next emotion in the 7-emotion cycle
        cycleIndex = (cycleIndex + 1) % REACTION_EMOTIONS.length;
        const nextEmotion = REACTION_EMOTIONS[cycleIndex].id;

        // Smooth 350ms crossfade interval between emotions
        switchTimeout = setTimeout(() => {
            if (!getSelectedEmotion() || getSelectedEmotion() === 'none') {
                displayEmotion(nextEmotion);
            }
        }, 350);
    }

    // Attach complete listeners to each main button animation
    REACTION_EMOTIONS.forEach(item => {
        const entry = btnAnims[item.id];
        entry.anim.addEventListener('complete', () => {
            onAnimationFinished(item.id);
        });
    });

    // Start initial rotation on load (first emotion: Happy)
    const initialSelected = getSelectedEmotion();
    if (initialSelected && initialSelected !== 'none' && btnAnims[initialSelected]) {
        cycleIndex = REACTION_EMOTIONS.findIndex(e => e.id === initialSelected);
        if (cycleIndex < 0) cycleIndex = 0;
        displayEmotion(initialSelected);
        btnReactionPicker.classList.add('has-emotion');
    } else {
        cycleIndex = 0;
        displayEmotion(REACTION_EMOTIONS[0].id);
        btnReactionPicker.classList.remove('has-emotion');
    }

    // ── 2. Render Reaction Popover (None + 7 Emotions) ───────
    reactionPopover.innerHTML = '';
    reactionPopover.className = 'reaction-popover-horizontal';

    const popoverAnims = {};

    // A. "None" Button (Auto Rotation)
    const noneBtn = document.createElement('button');
    noneBtn.type = 'button';
    noneBtn.className = 'reaction-popover-item is-none';
    noneBtn.dataset.id = 'none';
    noneBtn.title = 'None (Auto Rotation)';
    noneBtn.setAttribute('aria-label', 'None (Auto Rotation)');
    noneBtn.innerHTML = `
        <div class="reaction-popover-none-icon" style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/>
            </svg>
        </div>
    `;
    reactionPopover.appendChild(noneBtn);

    noneBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedEmotion(null);
        btnReactionPicker.classList.remove('has-emotion');
        updatePopoverActiveState();
        closePopover();

        // Resume auto rotation from current or next emotion
        cycleIndex = (cycleIndex + 1) % REACTION_EMOTIONS.length;
        displayEmotion(REACTION_EMOTIONS[cycleIndex].id);

        if (typeof onEmotionChange === 'function') {
            onEmotionChange(null);
        }
    });

    // B. 7 Emotion Buttons
    REACTION_EMOTIONS.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'reaction-popover-item';
        btn.dataset.id = item.id;
        btn.title = item.label;
        btn.setAttribute('aria-label', item.label);

        const lottieBox = document.createElement('div');
        lottieBox.className = 'reaction-popover-lottie';
        btn.appendChild(lottieBox);

        reactionPopover.appendChild(btn);

        const popAnim = lottie.loadAnimation({
            container: lottieBox,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            animationData: item.data
        });
        popoverAnims[item.id] = popAnim;

        // Hover effect: scale up via CSS + play animation
        btn.addEventListener('mouseenter', () => {
            popAnim.goToAndPlay(0, true);
        });

        btn.addEventListener('mouseleave', () => {
            const selected = getSelectedEmotion();
            if (selected !== item.id) {
                popAnim.goToAndStop(0, true);
            }
        });

        // Click handler: select emotion or toggle off to None
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentSelected = getSelectedEmotion();

            if (currentSelected === item.id) {
                // Clicking already-selected emotion resets to None (Auto mode)
                setSelectedEmotion(null);
                btnReactionPicker.classList.remove('has-emotion');
                cycleIndex = (cycleIndex + 1) % REACTION_EMOTIONS.length;
                displayEmotion(REACTION_EMOTIONS[cycleIndex].id);
            } else {
                // Select individual emotion (Manual mode)
                setSelectedEmotion(item.id);
                btnReactionPicker.classList.add('has-emotion');
                cycleIndex = REACTION_EMOTIONS.findIndex(e => e.id === item.id);
                if (cycleIndex < 0) cycleIndex = 0;
                displayEmotion(item.id);
            }

            updatePopoverActiveState();
            closePopover();

            if (typeof onEmotionChange === 'function') {
                onEmotionChange(getSelectedEmotion());
            }
        });
    });

    function updatePopoverActiveState() {
        const selected = getSelectedEmotion();
        const isNone = !selected || selected === 'none';

        // None button active state
        noneBtn.classList.toggle('active', isNone);

        // Emotion buttons active state
        reactionPopover.querySelectorAll('.reaction-popover-item:not(.is-none)').forEach(b => {
            const isMatch = b.dataset.id === selected;
            b.classList.toggle('active', isMatch);
            if (isMatch) {
                popoverAnims[b.dataset.id]?.goToAndPlay(0, true);
            } else {
                popoverAnims[b.dataset.id]?.goToAndStop(0, true);
            }
        });
    }

    // ── 3. Popover Toggle, Hover & Outside Click ───────────────
    let hoverCloseTimer = null;

    function openPopover() {
        if (hoverCloseTimer) {
            clearTimeout(hoverCloseTimer);
            hoverCloseTimer = null;
        }
        reactionPopover.classList.add('open');
        btnReactionPicker.classList.add('active');
        updatePopoverActiveState();
    }

    function closePopover() {
        if (hoverCloseTimer) {
            clearTimeout(hoverCloseTimer);
            hoverCloseTimer = null;
        }
        reactionPopover.classList.remove('open');
        btnReactionPicker.classList.remove('active');
        Object.values(popoverAnims).forEach(anim => anim.goToAndStop(0, true));
    }

    // Hover interaction: automatically reveal emotion options on mouse hover
    const reactionWrapper = btnReactionPicker.closest('.reaction-tool-wrapper') || btnReactionPicker.parentElement;

    function handleHoverEnter() {
        if (hoverCloseTimer) {
            clearTimeout(hoverCloseTimer);
            hoverCloseTimer = null;
        }
        openPopover();
    }

    function handleHoverLeave() {
        if (hoverCloseTimer) {
            clearTimeout(hoverCloseTimer);
        }
        // 250ms grace window prevents any flickering when moving between button and popover
        hoverCloseTimer = setTimeout(() => {
            closePopover();
            hoverCloseTimer = null;
        }, 250);
    }

    if (reactionWrapper) {
        reactionWrapper.addEventListener('mouseenter', handleHoverEnter);
        reactionWrapper.addEventListener('mouseleave', handleHoverLeave);
    } else {
        btnReactionPicker.addEventListener('mouseenter', handleHoverEnter);
        btnReactionPicker.addEventListener('mouseleave', handleHoverLeave);
        reactionPopover.addEventListener('mouseenter', handleHoverEnter);
        reactionPopover.addEventListener('mouseleave', handleHoverLeave);
    }

    // Click/tap support for touch devices & toggle
    btnReactionPicker.addEventListener('click', (e) => {
        e.stopPropagation();
        if (reactionPopover.classList.contains('open')) {
            closePopover();
        } else {
            openPopover();
        }
    });

    document.addEventListener('click', (e) => {
        if (reactionPopover.classList.contains('open') &&
            !reactionPopover.contains(e.target) &&
            !btnReactionPicker.contains(e.target)) {
            closePopover();
        }
    });

    return {
        updateSelection(emotionId) {
            if (!emotionId || emotionId === 'none') {
                setSelectedEmotion(null);
                btnReactionPicker.classList.remove('has-emotion');
                cycleIndex = (cycleIndex + 1) % REACTION_EMOTIONS.length;
                displayEmotion(REACTION_EMOTIONS[cycleIndex].id);
            } else {
                setSelectedEmotion(emotionId);
                btnReactionPicker.classList.add('has-emotion');
                cycleIndex = REACTION_EMOTIONS.findIndex(e => e.id === emotionId);
                if (cycleIndex < 0) cycleIndex = 0;
                displayEmotion(emotionId);
            }
            updatePopoverActiveState();
        },
        open: openPopover,
        close: closePopover
    };
}
