import { State } from '../config/state.js';
import { Storage } from '../utils/storage.js';

export const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    State.theme = theme;
    Storage.set('theme', theme);
};

export const initTheme = () => {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            setTheme(State.theme === 'dark' ? 'light' : 'dark');
        });
    }
    setTheme(State.theme);
};
