export const TYPOGRAPHY_SYSTEMS = [
    { name:'mono_terminal', tok:"'Roboto Mono',monospace", num:"'Roboto Mono',monospace", body:"'Inter',sans-serif",       tokW:700, tokT:'0.06em', tokTx:'uppercase', numW:700, numT:'0.04em', lbl:'// ', lblU:true  },
    { name:'display_ultra', tok:"'Outfit',sans-serif",     num:"'Outfit',sans-serif",     body:"'Inter',sans-serif",        tokW:900, tokT:'-0.02em',tokTx:'none',      numW:900, numT:'-0.02em',lbl:'',    lblU:false },
    { name:'geo_sans',      tok:"'Space Grotesk',sans-serif",num:"'Space Grotesk',sans-serif",body:"'Inter',sans-serif",    tokW:700, tokT:'0em',   tokTx:'none',      numW:700, numT:'0.02em', lbl:'▸ ',  lblU:false },
    { name:'editorial',     tok:"'Outfit',sans-serif",     num:"'Roboto Mono',monospace", body:"'Inter',sans-serif",        tokW:900, tokT:'-0.01em',tokTx:'none',      numW:600, numT:'0.03em', lbl:'',    lblU:true  },
    { name:'bold_impact',   tok:"'Space Grotesk',sans-serif",num:"'Inter',sans-serif",    body:"'Roboto Mono',monospace",   tokW:700, tokT:'0.04em', tokTx:'uppercase', numW:800, numT:'0em',    lbl:'— ',  lblU:false },
];

export const pickTypography = (pickFn) => pickFn(TYPOGRAPHY_SYSTEMS);
