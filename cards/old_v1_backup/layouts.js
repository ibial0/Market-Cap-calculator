export const pickLayout = (tier, isProfit, pickFn) => {
    const epic = ['ultra','legendary'].includes(tier);
    if (epic) return pickFn(['trophy_pedestal','backdrop_hero','full_char_bg','poster_mode']);
    if (!isProfit) return pickFn(['data_terminal','magazine_spread','corner_char','cinematic_split']);
    return pickFn(['cinematic_split','backdrop_hero','diagonal_cut','poster_mode','command_center','data_terminal','magazine_spread','trophy_pedestal','corner_char']);
};

export const getBadge = (tier, isProfit, pal, typ) => {
    if (!isProfit) return '';
    const map = {
        ultra:    { txt:'⬡ 100X ULTRA LEGEND', bg:pal.ac,  col:'#000' },
        legendary:{ txt:'✦ LEGENDARY 50X+',    bg:pal.ac,  col:'#000' },
        moon:     { txt:'◈ MOON SHOT',          bg:pal.ac,  col:'#000' },
        large:    { txt:'▲ STRONG RUN',         bg:pal.ac2, col:'#fff' },
        medium:   { txt:'↑ SOLID GAIN',         bg:pal.ac2+'88',col:pal.text },
        small:    { txt:'· PROFITABLE',          bg:pal.ac2+'44',col:pal.ac  },
    };
    const b = map[tier]; if(!b) return '';
    return `<div style="display:inline-flex;align-items:center;padding:10px 28px;background:${b.bg};color:${b.col};border-radius:50px;font-size:22px;font-weight:800;font-family:${typ.tok};letter-spacing:3px;white-space:nowrap;box-shadow:0 0 28px ${pal.glow};">${b.txt}</div>`;
};

export const getDecoration = (pal, pickFn) => {
    const W=1600,H=900,ac=pal.ac;
    const type = pickFn(['particles','circuit','hex','none','none']);
    let s='';
    if (type==='particles'){
        for(let i=0;i<28;i++){
            const x=(Math.random()*W).toFixed(),y=(Math.random()*H).toFixed(),r=(Math.random()*3+1).toFixed(1),o=(Math.random()*0.38+0.08).toFixed(2);
            s+=`<circle cx="${x}" cy="${y}" r="${r}" fill="${ac}" opacity="${o}"/>`;
        }
    } else if(type==='circuit'){
        for(let i=0;i<9;i++){
            const y=(i*105)+30,w=Math.random()*220+80,x=Math.random()*(W-w);
            s+=`<line x1="${x.toFixed()}" y1="${y}" x2="${(x+w).toFixed()}" y2="${y}" stroke="${ac}" stroke-width="1" opacity="0.14"/><circle cx="${(x+w).toFixed()}" cy="${y}" r="3" fill="${ac}" opacity="0.18"/>`;
        }
    } else if(type==='hex'){
        for(let i=0;i<11;i++){
            const cx=Math.random()*W,cy=Math.random()*H,r=Math.random()*32+14;
            const pts=[];
            for(let a=0;a<6;a++)pts.push(`${(cx+r*Math.cos(a*Math.PI/3)).toFixed(1)},${(cy+r*Math.sin(a*Math.PI/3)).toFixed(1)}`);
            s+=`<polygon points="${pts.join(' ')}" fill="none" stroke="${ac}" stroke-width="1" opacity="0.11"/>`;
        }
    }
    if(!s) return '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="position:absolute;top:0;left:0;pointer-events:none;z-index:1;">${s}</svg>`;
};

export const getInfoHTML = (d, pal, typ, cfg, isProfit, fmtFn) => {
    const sym=d.showBdt?'৳':'$', rate=d.showBdt?d.bdtRate:1;
    const E=sym+fmtFn(d.initMC,rate), X=sym+fmtFn(d.targetMC,rate),
          I=sym+fmtFn(d.inv,rate),     V=sym+fmtFn(d.finalValue,rate);
    const pc=isProfit?pal.ac:'#FF4444';
    const pStr=(isProfit?'+':'-')+sym+fmtFn(Math.abs(d.profit),rate);
    const lsz=cfg.lsz||20, vsz=cfg.vsz||42;
    const lbl=(t)=>`<div style="font-size:${lsz}px;font-family:${typ.body};color:${pal.text};opacity:0.52;font-weight:600;letter-spacing:2px;text-transform:${typ.lblU?'uppercase':'none'};margin-bottom:7px;">${typ.lbl}${t}</div>`;
    const val=(v,c,s)=>`<div style="font-size:${s||vsz}px;font-family:${typ.num};font-weight:${typ.numW};color:${c||pal.text};letter-spacing:${typ.numT};line-height:1.1;overflow-wrap:break-word;">${v}</div>`;
    const cell=(l,v,c,s)=>`<div>${lbl(l)}${val(v,c,s)}</div>`;
    
    if(cfg.v==='grid'){return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:${cfg.gap||38}px;">${cell('Entry MC',E)}${cell('Exit MC',X)}${cell('Investment',I)}${cell('Current Value',V,pc)}</div>`;}
    if(cfg.v==='list'){return['Entry MC|'+E,'Exit MC|'+X,'Investment|'+I,'Profit|'+pStr+'|'+pc].map(r=>{const[l,v,c]=r.split('|');return`<div style="display:flex;justify-content:space-between;align-items:baseline;padding:${cfg.rp||14}px 0;border-bottom:1px solid ${pal.ac}1a;">${lbl(l)}${val(v,c)}</div>`;}).join('');}
    if(cfg.v==='pills'){return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">${[['Entry MC',E],['Exit MC',X],['Investment',I],['Current Value',V,pc]].map(([l,v,c])=>`<div style="background:${pal.ac}0e;border:1px solid ${pal.ac}2a;border-radius:14px;padding:18px 26px;">${lbl(l)}${val(v,c,cfg.vsz||36)}</div>`).join('')}</div>`;}
    if(cfg.v==='duo'){return `<div style="display:flex;gap:52px;flex-wrap:wrap;">${cell('Investment',I,undefined,vsz)}${cell('Current Value',V,pc,vsz)}</div><div style="margin-top:26px;display:flex;gap:52px;flex-wrap:wrap;">${cell('Entry MC',E,undefined,vsz-6)}${cell('Exit MC',X,undefined,vsz-6)}</div>`;}
    return `<div style="display:flex;flex-direction:column;gap:${cfg.gap||26}px;">${cell('Entry MC',E)}${cell('Exit MC',X)}${cell('Investment',I)}${cell('Profit',pStr,pc,cfg.psz||50)}</div>`;
};
