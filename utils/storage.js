export const Storage = {
    get: (key, def) => {
        const val = localStorage.getItem('mccalc_' + key);
        return val !== null ? JSON.parse(val) : def;
    },
    set: (key, val) => {
        localStorage.setItem('mccalc_' + key, JSON.stringify(val));
    }
};
