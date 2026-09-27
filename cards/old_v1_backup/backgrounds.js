export const getBackground = (pal, pickFn) => {
    const envMap = {
        divine_gold:'desert_dunes', fire_legend:'volcanic', amber_flame:'desert_dunes',
        neon_matrix:'cyberpunk_grid', cyber_teal:'cyberpunk_grid',
        crimson_fall:'volcanic', grey_ashes:'deep_space', void_purple:'deep_space', midnight_crash:'underwater',
        aurora_supreme:'arctic', arctic_white:'arctic',
        emerald_surge:'forest_glow', sakura:'forest_glow',
    };
    const all = ['deep_space','cyberpunk_grid','abstract_geo','volcanic','arctic','desert_dunes','underwater','forest_glow'];
    const env = envMap[pal.id] || pickFn(all);
    const W=1600, H=900, ac=pal.ac, ac2=pal.ac2, bg=pal.bg;
    let s = '';

    if (env === 'deep_space') {
        let stars='';
        for(let i=0;i<130;i++){
            const x=(Math.random()*W).toFixed(1),y=(Math.random()*H).toFixed(1),r=(Math.random()*1.6+0.3).toFixed(1),o=(Math.random()*0.7+0.2).toFixed(2);
            stars+=`<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${o}"/>`;
        }
        s=`<rect w="${W}" h="${H}" width="${W}" height="${H}" fill="${bg}"/>
        <defs><radialGradient id="nb1" cx="72%" cy="28%" r="50%"><stop offset="0%" stop-color="${ac}" stop-opacity="0.14"/><stop offset="100%" stop-color="transparent" stop-opacity="0"/></radialGradient>
        <radialGradient id="nb2" cx="18%" cy="75%" r="40%"><stop offset="0%" stop-color="${ac2}" stop-opacity="0.1"/><stop offset="100%" stop-color="transparent" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#nb1)"/><rect width="${W}" height="${H}" fill="url(#nb2)"/>
        ${stars}
        <ellipse cx="${W*0.75}" cy="${H*0.25}" rx="160" ry="160" fill="${ac}10" stroke="${ac}" stroke-width="1" stroke-opacity="0.12"/>`;
    } else if (env === 'cyberpunk_grid') {
        let hl='',vl='';
        for(let y=0;y<H;y+=55)hl+=`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${ac}" stroke-opacity="0.07" stroke-width="1"/>`;
        for(let x=0;x<W;x+=55)vl+=`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${ac}" stroke-opacity="0.07" stroke-width="1"/>`;
        s=`<rect width="${W}" height="${H}" fill="${bg}"/>
        <defs><radialGradient id="cg1" cx="50%" cy="100%" r="65%"><stop offset="0%" stop-color="${ac}" stop-opacity="0.22"/><stop offset="100%" stop-color="transparent" stop-opacity="0"/></radialGradient>
        <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg}" stop-opacity="0.55"/><stop offset="60%" stop-color="${bg}" stop-opacity="0"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#cg1)"/>${hl}${vl}<rect width="${W}" height="${H}" fill="url(#cg2)"/>`;
    } else if (env === 'abstract_geo') {
        let circles='';
        for(let i=0;i<7;i++){
            const cx=(Math.random()*W).toFixed(),cy=(Math.random()*H).toFixed(),r=(Math.random()*180+60).toFixed(),op=(Math.random()*0.1+0.04).toFixed(2),sw=(Math.random()*2.5+0.8).toFixed(1);
            circles+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${i%2?ac:ac2}" stroke-opacity="${op}" stroke-width="${sw}"/>`;
        }
        s=`<rect width="${W}" height="${H}" fill="${bg}"/>
        <defs><radialGradient id="ag1" cx="80%" cy="20%" r="55%"><stop offset="0%" stop-color="${ac}" stop-opacity="0.13"/><stop offset="100%" stop-color="transparent" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#ag1)"/>
        <polygon points="${W/2},-120 ${W+250},${H*0.85} -250,${H*0.85}" fill="${ac}" fill-opacity="0.025"/>
        ${circles}`;
    } else if (env === 'volcanic') {
        let embers='';
        for(let i=0;i<20;i++){
            const x=(Math.random()*W).toFixed(),y=(Math.random()*H).toFixed(),r=(Math.random()*4+1).toFixed(1),op=(Math.random()*0.5+0.1).toFixed(2);
            embers+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#FF5500" opacity="${op}"/>`;
        }
        s=`<rect width="${W}" height="${H}" fill="#080000"/>
        <defs><radialGradient id="lv1" cx="50%" cy="100%" r="60%"><stop offset="0%" stop-color="#FF5500" stop-opacity="0.55"/><stop offset="65%" stop-color="#8B0000" stop-opacity="0.18"/><stop offset="100%" stop-color="transparent" stop-opacity="0"/></radialGradient>
        <radialGradient id="lv2" cx="15%" cy="85%" r="32%"><stop offset="0%" stop-color="#FF8800" stop-opacity="0.35"/><stop offset="100%" stop-color="transparent" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#lv1)"/><rect width="${W}" height="${H}" fill="url(#lv2)"/>
        <path d="M0,${H} Q220,${H*0.58} 440,${H} Q660,${H*0.62} 880,${H} Q1100,${H*0.56} 1320,${H} Q1460,${H*0.65} ${W},${H}" fill="#FF440018"/>
        ${embers}`;
    } else if (env === 'arctic') {
        s=`<defs><linearGradient id="ar1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#000c18"/><stop offset="100%" stop-color="#001428"/></linearGradient>
        <radialGradient id="ar2" cx="50%" cy="38%" r="70%"><stop offset="0%" stop-color="${ac}" stop-opacity="0.17"/><stop offset="55%" stop-color="${ac2}" stop-opacity="0.07"/><stop offset="100%" stop-color="transparent" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#ar1)"/><rect width="${W}" height="${H}" fill="url(#ar2)"/>
        <path d="M0,${H*0.72} Q420,${H*0.58} 860,${H*0.68} Q1240,${H*0.52} ${W},${H*0.62} L${W},${H} L0,${H} Z" fill="rgba(210,235,255,0.06)"/>
        <path d="M0,${H*0.82} Q360,${H*0.7} 720,${H*0.78} Q1080,${H*0.66} ${W},${H*0.74} L${W},${H} L0,${H} Z" fill="rgba(210,235,255,0.04)"/>`;
    } else if (env === 'desert_dunes') {
        s=`<defs><linearGradient id="ds1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#080400"/><stop offset="60%" stop-color="#140a00"/><stop offset="100%" stop-color="#1e1000"/></linearGradient>
        <radialGradient id="ds2" cx="72%" cy="22%" r="22%"><stop offset="0%" stop-color="${ac}" stop-opacity="0.45"/><stop offset="100%" stop-color="transparent" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#ds1)"/><rect width="${W}" height="${H}" fill="url(#ds2)"/>
        <path d="M0,${H*0.68} Q${W*0.28},${H*0.48} ${W*0.52},${H*0.64} Q${W*0.76},${H*0.78} ${W},${H*0.58} L${W},${H} L0,${H} Z" fill="${ac}0e"/>
        <path d="M0,${H*0.78} Q${W*0.32},${H*0.6} ${W*0.62},${H*0.74} Q${W*0.82},${H*0.84} ${W},${H*0.7} L${W},${H} L0,${H} Z" fill="${ac}09"/>`;
    } else if (env === 'underwater') {
        let bub='';
        for(let i=0;i<22;i++){
            const x=(Math.random()*W).toFixed(),y=(Math.random()*H).toFixed(),r=(Math.random()*9+2).toFixed(1),op=(Math.random()*0.18+0.04).toFixed(2);
            bub+=`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${ac}" stroke-opacity="${op}" stroke-width="1.5"/>`;
        }
        s=`<defs><linearGradient id="uw1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#000820"/><stop offset="100%" stop-color="#001040"/></linearGradient>
        <radialGradient id="uw2" cx="62%" cy="38%" r="52%"><stop offset="0%" stop-color="${ac}" stop-opacity="0.13"/><stop offset="100%" stop-color="transparent" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#uw1)"/><rect width="${W}" height="${H}" fill="url(#uw2)"/>${bub}`;
    } else { // forest_glow
        s=`<defs><linearGradient id="fg1" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stop-color="#000900"/><stop offset="100%" stop-color="#001300"/></linearGradient>
        <radialGradient id="fg2" cx="50%" cy="60%" r="55%"><stop offset="0%" stop-color="${ac}" stop-opacity="0.16"/><stop offset="100%" stop-color="transparent" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#fg1)"/><rect width="${W}" height="${H}" fill="url(#fg2)"/>
        <path d="M0,${H} Q110,${H*0.38} 230,${H*0.66} Q340,${H*0.28} 480,${H*0.54} Q560,${H*0.18} 660,${H*0.48} L660,${H} Z" fill="${ac}1a"/>
        <path d="M${W},${H} Q${W-110},${H*0.38} ${W-230},${H*0.66} Q${W-340},${H*0.28} ${W-480},${H*0.54} L${W-480},${H} Z" fill="${ac}12"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;">${s}</svg>`;
};
