export const PALETTES = [
    // Ultra / Legendary
    { id:'divine_gold',      bg:'#0a0600', card:'#140c00', text:'#fff', ac:'#FFD700', ac2:'#FFA500', sub:'#7a5500', glow:'rgba(255,215,0,0.45)',   tiers:['ultra','legendary'] },
    { id:'cosmic_platinum',  bg:'#04040f', card:'#0b0b1e', text:'#eeeeff', ac:'#C0C0FF', ac2:'#8080FF', sub:'#5050aa', glow:'rgba(192,192,255,0.4)', tiers:['ultra','legendary','moon'] },
    { id:'fire_legend',      bg:'#0f0000', card:'#1e0500', text:'#fff', ac:'#FF6B00', ac2:'#FF2200', sub:'#8b2200', glow:'rgba(255,107,0,0.5)',    tiers:['ultra','legendary'] },
    { id:'aurora_supreme',   bg:'#000b08', card:'#001410', text:'#fff', ac:'#00FFB3', ac2:'#00C4FF', sub:'#007766', glow:'rgba(0,255,179,0.4)',    tiers:['ultra','legendary','moon'] },
    // Moon / Large
    { id:'emerald_surge',    bg:'#001408', card:'#002010', text:'#fff', ac:'#00E576', ac2:'#00C45E', sub:'#005533', glow:'rgba(0,229,118,0.35)',   tiers:['moon','large','medium'] },
    { id:'electric_blue',    bg:'#000614', card:'#000c24', text:'#ddf0ff', ac:'#00AAFF', ac2:'#0055FF', sub:'#002d99', glow:'rgba(0,170,255,0.35)', tiers:['moon','large'] },
    { id:'violet_ascent',    bg:'#06000f', card:'#0e001e', text:'#eedeff', ac:'#B366FF', ac2:'#7B2FFF', sub:'#4a00bb', glow:'rgba(179,102,255,0.4)', tiers:['moon','large','medium'] },
    { id:'neon_matrix',      bg:'#000800', card:'#001000', text:'#ddffee', ac:'#00FF41', ac2:'#00CC33', sub:'#006600', glow:'rgba(0,255,65,0.35)',  tiers:['moon','large'] },
    { id:'solar_flare',      bg:'#0f0700', card:'#1a0e00', text:'#fff', ac:'#FF8800', ac2:'#FF3300', sub:'#882200', glow:'rgba(255,136,0,0.4)',    tiers:['moon','large'] },
    // Medium / Small
    { id:'rose_gold',        bg:'#110707', card:'#1c0e0e', text:'#fff', ac:'#FF88A0', ac2:'#FF4477', sub:'#bb2255', glow:'rgba(255,68,119,0.35)', tiers:['large','medium','small'] },
    { id:'arctic_white',     bg:'#030c18', card:'#071220', text:'#fff', ac:'#80E8FF', ac2:'#40BBFF', sub:'#007aaa', glow:'rgba(128,232,255,0.3)', tiers:['medium','small','large'] },
    { id:'sakura',           bg:'#10080f', card:'#1c0c1c', text:'#ffe8f5', ac:'#FF77BB', ac2:'#FF3399', sub:'#990055', glow:'rgba(255,51,153,0.3)', tiers:['small','medium'] },
    { id:'cyber_teal',       bg:'#001010', card:'#001c1c', text:'#dfffff', ac:'#00FFCC', ac2:'#00BBAA', sub:'#006655', glow:'rgba(0,255,204,0.3)', tiers:['small','medium','large'] },
    { id:'amber_flame',      bg:'#0f0700', card:'#1a0f00', text:'#fff', ac:'#FFB800', ac2:'#FF8800', sub:'#996600', glow:'rgba(255,184,0,0.4)',    tiers:['medium','large'] },
    { id:'royal_purple',     bg:'#060010', card:'#0e0018', text:'#eedfff', ac:'#9966FF', ac2:'#6633CC', sub:'#3a1199', glow:'rgba(153,102,255,0.35)', tiers:['medium','small'] },
    // Loss
    { id:'crimson_fall',     bg:'#100000', card:'#1c0000', text:'#fff', ac:'#FF3333', ac2:'#CC0000', sub:'#770000', glow:'rgba(255,51,51,0.4)',    tiers:['loss','heavy_loss'] },
    { id:'grey_ashes',       bg:'#080808', card:'#101010', text:'#ccc', ac:'#888888', ac2:'#555555', sub:'#2a2a2a', glow:'rgba(136,136,136,0.3)', tiers:['loss','heavy_loss'] },
    { id:'void_purple',      bg:'#050008', card:'#090010', text:'#ccbbee', ac:'#6633AA', ac2:'#441188', sub:'#1c0044', glow:'rgba(102,51,170,0.3)', tiers:['loss','heavy_loss'] },
    { id:'midnight_crash',   bg:'#000810', card:'#000f1e', text:'#aac0d8', ac:'#3355AA', ac2:'#223388', sub:'#0d1a55', glow:'rgba(51,85,170,0.3)', tiers:['loss','heavy_loss'] },
];

export const pickPalette = (tier, pickFn) => {
    const avail = PALETTES.filter(p => p.tiers.includes(tier));
    return pickFn(avail.length ? avail : PALETTES);
};
