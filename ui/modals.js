import { State } from '../config/state.js';
import { Storage } from '../utils/storage.js';

export const initModals = (onCalculateNeeded) => {
    const settingsOverlay = document.getElementById('settings-overlay');
    const previewOverlay = document.getElementById('preview-overlay');
    
    const closeSettings = document.getElementById('close-settings');
    const closePreview = document.getElementById('close-preview');
    
    const settingBdtRate = document.getElementById('setting-bdt-rate');
    const settingShowBdt = document.getElementById('setting-show-bdt');

    // Make sure when settings open it has the latest state
    // (This can be triggered whenever settings opens)
    const updateSettingsInputs = () => {
        if (settingBdtRate) settingBdtRate.value = State.bdtRate;
        if (settingShowBdt) settingShowBdt.checked = State.showBdt;
    };
    // Observe settings overlay open state if needed, or we just rely on state bound properly.
    // For simplicity, attach an observer or just rely on state.
    // Actually, we can hook it up globally so anyone opening settings triggers this.
    document.addEventListener('settings-opened', updateSettingsInputs);

    if (closeSettings) {
        closeSettings.addEventListener('click', () => {
            settingsOverlay.classList.remove('active');
        });
    }

    if (closePreview) {
        closePreview.addEventListener('click', () => {
            previewOverlay.classList.remove('active');
            const previewImg = document.getElementById('preview-img');
            if (previewImg) previewImg.classList.remove('loaded');
        });
    }

    if (settingBdtRate) {
        settingBdtRate.addEventListener('input', (e) => {
            State.bdtRate = parseFloat(e.target.value) || 0;
            Storage.set('bdtRate', State.bdtRate);
            if (onCalculateNeeded) onCalculateNeeded();
        });
    }

    if (settingShowBdt) {
        settingShowBdt.addEventListener('change', (e) => {
            State.showBdt = e.target.checked;
            Storage.set('showBdt', State.showBdt);
            if (onCalculateNeeded) onCalculateNeeded();
        });
    }
};
