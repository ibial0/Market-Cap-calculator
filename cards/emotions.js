// ═══════════════════════════════════════════════════════════
//  EMOTION CATEGORIES
//  Shared config for card background emotions.
//  Used by: admin upload, user emotion picker, bg-loader filter
// ═══════════════════════════════════════════════════════════

export const EMOTIONS = [
    { id: 'confused', emoji: '😕', label: 'Confused', type: 'neutral', desc: 'Not sure what happened' },
    { id: 'calm',     emoji: '😌', label: 'Calm',     type: 'profit',  desc: 'Relaxed and steady' },
    { id: 'stress',   emoji: '😫', label: 'Stress',   type: 'loss',    desc: 'Frustrated and stressed' },
    { id: 'happy',    emoji: '😊', label: 'Happy',    type: 'profit',  desc: 'Genuinely happy vibes' },
];

/** Get emotion by ID */
export function getEmotionById(id) {
    return EMOTIONS.find(e => e.id === id) || null;
}

/** Get all emotion IDs */
export function getEmotionIds() {
    return EMOTIONS.map(e => e.id);
}
