// ═══════════════════════════════════════════════════════════
//  EMOTION CATEGORIES
//  Shared config for card background reactions.
//  Used by: admin upload, user reaction picker, bg-loader filter
// ═══════════════════════════════════════════════════════════

export const EMOTIONS = [
    { id: 'happy',    emoji: '😊', label: 'Happy',    type: 'profit',  desc: 'Positive vibes & joy' },
    { id: 'shock',    emoji: '😲', label: 'Shock',    type: 'loss',    desc: 'Shocked & astonished' },
    { id: 'greed',    emoji: '🤑', label: 'Greed',    type: 'profit',  desc: 'Greedy & money eyes' },
    { id: 'cry',      emoji: '😢', label: 'Cry',      type: 'loss',    desc: 'Crying & tears' },
    { id: 'angry',    emoji: '😡', label: 'Angry',    type: 'loss',    desc: 'Furious & steamy' },
    { id: 'worried',  emoji: '😰', label: 'Worried',  type: 'neutral', desc: 'Anxious & cold sweat' },
    { id: 'relieved', emoji: '😇', label: 'Relieved', type: 'profit',  desc: 'Blessed & angelic' },
];

/** Get emotion by ID (maps legacy IDs like smile/calm -> happy, stress/confused -> shock, angel -> relieved, crying -> cry) */
export function getEmotionById(id) {
    if (!id) return null;
    const direct = EMOTIONS.find(e => e.id === id);
    if (direct) return direct;
    if (id === 'smile' || id === 'calm') return EMOTIONS.find(e => e.id === 'happy') || null;
    if (id === 'stress' || id === 'confused') return EMOTIONS.find(e => e.id === 'shock') || null;
    if (id === 'angel') return EMOTIONS.find(e => e.id === 'relieved') || null;
    if (id === 'crying') return EMOTIONS.find(e => e.id === 'cry') || null;
    return null;
}

/** Get all emotion IDs */
export function getEmotionIds() {
    return EMOTIONS.map(e => e.id);
}
