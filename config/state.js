import { Storage } from '../utils/storage.js';

export const State = {
    initVal: 0,
    initMul: 1000,
    targetVal: 0,
    targetMul: 1000,
    inv: 10,
    
    tokenName: Storage.get('tokenName', ''),
    userName: Storage.get('userName', ''),
    
    bdtRate: Storage.get('bdtRate', 115),
    showBdt: Storage.get('showBdt', false),
    theme: Storage.get('theme', 'dark')
};
