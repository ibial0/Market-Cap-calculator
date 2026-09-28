// ═══════════════════════════════════════════════════════════
//  EMOTION CATEGORIES
//  Shared config for card background emotions.
//  Used by: admin upload, user emotion picker, bg-loader filter
// ═══════════════════════════════════════════════════════════

export const EMOTIONS = [
    // ── Profit emotions (highest to lowest) ──
    { id: 'legendary',  emoji: '🤑', label: 'Legendary',     type: 'profit',  desc: 'Life-changing profit' },
    { id: 'moon',       emoji: '🚀', label: 'To The Moon',   type: 'profit',  desc: 'Massive gains' },
    { id: 'bigwin',     emoji: '😎', label: 'Big Win',       type: 'profit',  desc: 'Major profit, feeling cool' },
    { id: 'happy',      emoji: '😄', label: 'Happy',         type: 'profit',  desc: 'Good profit, happy vibes' },
    { id: 'notbad',     emoji: '🙂', label: 'Not Bad',       type: 'profit',  desc: 'Decent profit' },
    { id: 'relief',     emoji: '😮‍💨', label: 'Relief',        type: 'profit',  desc: 'Barely survived, phew!' },

    // ── Neutral / Special ──
    { id: 'smirk',      emoji: '😏', label: 'Evil Grin',     type: 'neutral', desc: 'Outsmarted the market' },

    // ── Loss emotions (lowest to highest severity) ──
    { id: 'meh',        emoji: '😐', label: 'Meh',           type: 'loss',    desc: 'Tiny loss, whatever' },
    { id: 'worried',    emoji: '😟', label: 'Worried',       type: 'loss',    desc: 'Starting to worry' },
    { id: 'sad',        emoji: '😢', label: 'Sad',           type: 'loss',    desc: 'Significant loss' },
    { id: 'angry',      emoji: '😡', label: 'Furious',       type: 'loss',    desc: 'Repeated losses, rage' },
    { id: 'rekt',       emoji: '💀', label: 'Rekt',          type: 'loss',    desc: 'Devastating loss' },
    { id: 'destroyed',  emoji: '☠️',  label: 'Destroyed',     type: 'loss',    desc: 'Total wipeout, game over' },
];

/** Get emotion by ID */
export function getEmotionById(id) {
    return EMOTIONS.find(e => e.id === id) || null;
}

/** Get all emotion IDs */
export function getEmotionIds() {
    return EMOTIONS.map(e => e.id);
}
