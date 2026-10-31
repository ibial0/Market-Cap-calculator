// ═══════════════════════════════════════════════════════════
//  EMOTION CATEGORIES
//  Shared config for card background reactions.
//  Used by: admin upload, user reaction picker, bg-loader filter
// ═══════════════════════════════════════════════════════════

export const EMOTIONS = [
    { id: 'happy', label: 'Happy' }, { id: 'shock', label: 'Shock' },
    { id: 'greed', label: 'Greed' }, { id: 'cry', label: 'Cry' },
    { id: 'angry', label: 'Angry' }, { id: 'worried', label: 'Worried' },
    { id: 'relieved', label: 'Relieved' },
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
