import { pickPalette } from './palettes.js';
import { getBackground } from './backgrounds.js';
import { getCharacter } from './characters.js';
import { pickTypography } from './typography.js';
import { pickLayout, getBadge, getDecoration, getInfoHTML } from './layouts.js';

export class CardEngine {
    constructor(data) {
        this.d = data;
        this.isProfit = data.profit >= 0;
        this.m = data.multiplier;
        this.node = document.getElementById('card-node');
        this.tier = this._getTier();
        this.emotion = this._getEmotion();
    }

    _getTier() {
        const m = this.m;
        if (!this.isProfit) return m < 0.5 ? 'heavy_loss' : 'loss';
        if (m >= 100) return 'ultra';
        if (m >= 50)  return 'legendary';
        if (m >= 10)  return 'moon';
        if (m >= 3)   return 'large';
        if (m >= 1.5) return 'medium';
        return 'small';
    }

    _getEmotion() {
        return { ultra:'ultra', legendary:'legendary', moon:'dominant',
                 large:'excited', medium:'happy', small:'satisfied',
                 loss:'disappointed', heavy_loss:'broken' }[this.tier];
    }

    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    fmt(val, rate) {
        rate = rate || 1;
        const v = val * rate;
        if (v >= 1e9) return (v/1e9).toFixed(2) + 'B';
        if (v >= 1e6) return (v/1e6).toFixed(2) + 'M';
        if (v >= 1e3) return (v/1e3).toFixed(2) + 'K';
        return v.toLocaleString('en-US', {maximumFractionDigits:2});
    }

    buildHTML() {
        const d = this.d;
        const pal = pickPalette(this.tier, this.pick.bind(this));
        const typ = pickTypography(this.pick.bind(this));
        const layout = pickLayout(this.tier, this.isProfit, this.pick.bind(this));
        
        const sym = d.showBdt ? '৳' : '$';
        const rate = d.showBdt ? d.bdtRate : 1;
        const pc = this.isProfit ? pal.ac : '#FF4444';
        const roi = (this.isProfit ? '+' : '') + d.roi.toLocaleString('en-US', {maximumFractionDigits:1}) + '%';
        const mul = d.multiplier.toFixed(2) + 'X';
        const pStr = (this.isProfit ? '+' : '-') + sym + this.fmt(Math.abs(d.profit), rate);
        const inv = sym + this.fmt(d.inv, rate);
        const fin = sym + this.fmt(d.finalValue, rate);
        const ent = sym + this.fmt(d.initMC, rate);
        const ext = sym + this.fmt(d.targetMC, rate);
        const tok = d.tokenName || 'CRYPTO';
        const usr = d.userName || '';
        const tokSz = tok.length > 14 ? 58 : tok.length > 10 ? 70 : 88;

        const bg = getBackground(pal, this.pick.bind(this));
        const dec = getDecoration(pal, this.pick.bind(this));
        const badge = getBadge(this.tier, this.isProfit, pal, typ);
        const charSVG = getCharacter(pal, this.emotion, this.isProfit, this.pick.bind(this));

        const glow1 = `<div style="position:absolute;top:-120px;right:-120px;width:580px;height:580px;border-radius:50%;background:radial-gradient(circle,${pal.glow} 0%,transparent 72%);pointer-events:none;z-index:1;"></div>`;
        const glow2 = `<div style="position:absolute;bottom:-160px;left:-160px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,${pal.ac}1a 0%,transparent 72%);pointer-events:none;z-index:1;"></div>`;
        const charBox = (w,h,op,extra) => `<div style="position:relative;${extra||''}display:flex;align-items:center;justify-content:center;overflow:visible;">
            <div style="position:absolute;width:${w*0.8}px;height:${w*0.8}px;border-radius:50%;background:radial-gradient(circle,${pal.glow} 0%,transparent 70%);pointer-events:none;"></div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="-195 -295 390 590" style="width:${w}px;height:${h}px;position:relative;filter:drop-shadow(0 0 28px ${pal.glow});opacity:${op||1};">${charSVG}</svg>
        </div>`;

        const tokEl = (extra) => `<div style="font-size:${tokSz}px;font-family:${typ.tok};font-weight:${typ.tokW};letter-spacing:${typ.tokT};text-transform:${typ.tokTx};color:${pal.ac};line-height:1.1;overflow-wrap:break-word;max-width:100%;filter:drop-shadow(0 0 18px ${pal.glow});${extra||''}">${tok}</div>`;
        const usrEl = () => usr ? `<div style="font-size:28px;font-family:${typ.body};font-weight:600;color:${pal.text};opacity:0.68;white-space:nowrap;">${usr}</div>` : '';
        const heroNum = (n,sz,extra) => `<div style="font-size:${sz}px;font-family:${typ.num};font-weight:900;color:${pc};line-height:1;word-break:break-all;filter:drop-shadow(0 0 22px ${pal.glow});${extra||''}">${n}</div>`;
        const sub = (n,sz) => `<div style="font-size:${sz}px;font-family:${typ.num};font-weight:${typ.numW};color:${pal.text};opacity:0.68;line-height:1.15;">${n}</div>`;

        const base = `width:1600px;height:900px;box-sizing:border-box;position:relative;overflow:hidden;font-family:${typ.body};color:${pal.text};`;

        let inner = '';

        if (layout === 'cinematic_split') {
            inner = `${glow1}${glow2}
            <div style="position:relative;z-index:2;width:100%;height:100%;display:grid;grid-template-columns:44% 56%;align-items:stretch;">
              <div style="display:flex;align-items:center;justify-content:center;padding:40px 20px 40px 55px;">
                ${charBox(380,520,1)}
              </div>
              <div style="padding:58px 68px 58px 38px;display:flex;flex-direction:column;justify-content:space-between;border-left:1px solid ${pal.ac}1e;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
                  ${tokEl()}${usrEl()}
                </div>
                <div>
                  ${heroNum(mul, mul.length>5?115:145)}
                  ${sub(roi+' ROI', 50)}
                </div>
                <div>
                  ${getInfoHTML(d,pal,typ,{v:'pills',vsz:32,lsz:17,gap:18},this.isProfit,this.fmt.bind(this))}
                  ${badge?`<div style="margin-top:26px;">${badge}</div>`:''}
                </div>
              </div>
            </div>`;
        } else if (layout === 'backdrop_hero') {
            inner = `${glow1}
            <div style="position:absolute;top:0;right:0;width:65%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:1;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="-195 -295 390 590" style="width:100%;height:100%;filter:drop-shadow(0 0 55px ${pal.glow});opacity:0.55;">${charSVG}</svg>
            </div>
            <div style="position:relative;z-index:2;width:100%;height:100%;padding:68px 80px;display:flex;flex-direction:column;justify-content:space-between;">
              <div>${tokEl('max-width:58%;')}${badge?`<div style="margin-top:22px;">${badge}</div>`:''}</div>
              <div style="max-width:58%;">
                ${heroNum(roi,roi.length>7?115:155)}
                ${sub(mul+' MULTIPLIER',62)}
              </div>
              <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:35px;flex-wrap:wrap;">
                <div style="background:rgba(0,0,0,0.52);backdrop-filter:blur(18px);border:1px solid ${pal.ac}2e;border-radius:22px;padding:36px 46px;max-width:62%;">
                  ${getInfoHTML(d,pal,typ,{v:'list',vsz:34,lsz:18,rp:12},this.isProfit,this.fmt.bind(this))}
                </div>
                ${usr?`<div style="font-size:32px;font-family:${typ.body};font-weight:700;color:${pal.text};opacity:0.72;background:rgba(0,0,0,0.42);border:1px solid ${pal.ac}2e;border-radius:14px;padding:18px 32px;">${usr}</div>`:''}
              </div>
            </div>`;
        } else if (layout === 'diagonal_cut') {
            inner = `${glow1}
            <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" style="position:absolute;top:0;left:0;z-index:1;pointer-events:none;">
              <polygon points="0,0 660,0 380,900 0,900" fill="${pal.card}" opacity="0.88"/>
              <line x1="660" y1="0" x2="380" y2="900" stroke="${pal.ac}" stroke-width="2" opacity="0.45"/>
            </svg>
            <div style="position:relative;z-index:2;width:100%;height:100%;padding:62px;display:grid;grid-template-columns:36% 64%;gap:0;align-items:stretch;">
              <div style="display:flex;align-items:center;justify-content:center;">
                ${charBox(320,460,1)}
              </div>
              <div style="padding:0 0 0 55px;display:flex;flex-direction:column;justify-content:space-between;">
                <div style="display:flex;flex-direction:column;gap:14px;">${tokEl()}${usrEl()}</div>
                <div>
                  ${heroNum(mul,mul.length>5?118:152)}
                  ${sub(roi,52)}
                </div>
                <div>
                  ${getInfoHTML(d,pal,typ,{v:'grid',vsz:32,lsz:17,gap:28},this.isProfit,this.fmt.bind(this))}
                  ${badge?`<div style="margin-top:22px;">${badge}</div>`:''}
                </div>
              </div>
            </div>`;
        } else if (layout === 'poster_mode') {
            inner = `${glow1}${glow2}
            <div style="position:relative;z-index:2;width:100%;height:100%;padding:48px 78px;display:flex;flex-direction:column;justify-content:space-between;">
              <div style="width:100%;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
                ${tokEl(`max-width:65%;`)}${usrEl()}
              </div>
              <div style="display:flex;align-items:center;gap:52px;justify-content:center;flex:1;padding:18px 0;">
                ${charBox(320,440,1,'flex-shrink:0;')}
                <div>
                  ${heroNum(roi,roi.length>7?108:145)}
                  ${sub(mul,55)}
                  ${badge?`<div style="margin-top:18px;">${badge}</div>`:''}
                </div>
              </div>
              <div style="width:100%;display:flex;justify-content:space-between;padding:24px 36px;background:rgba(0,0,0,0.5);backdrop-filter:blur(18px);border:1px solid ${pal.ac}20;border-radius:18px;flex-wrap:wrap;gap:18px;">
                ${[['Entry MC',ent],['Exit MC',ext],['Investment',inv],['Profit',pStr,pc]].map(([l,v,c])=>`<div><div style="font-size:16px;font-family:${typ.body};color:${pal.text};opacity:0.48;letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;">${l}</div><div style="font-size:33px;font-family:${typ.num};font-weight:700;color:${c||pal.text};">${v}</div></div>`).join('')}
              </div>
            </div>`;
        } else if (layout === 'command_center') {
            inner = `${glow1}
            <div style="position:absolute;top:0;right:0;width:360px;height:455px;z-index:1;opacity:0.48;overflow:hidden;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="-195 -295 390 590" style="width:100%;height:100%;filter:drop-shadow(0 0 35px ${pal.glow});">${charSVG}</svg>
            </div>
            <div style="position:relative;z-index:2;width:100%;height:100%;padding:58px 68px;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                ${tokEl('max-width:72%;')}
                <div style="display:flex;gap:26px;align-items:center;margin-top:18px;flex-wrap:wrap;">${badge}${usrEl()}</div>
              </div>
              <div style="display:flex;gap:75px;align-items:baseline;flex-wrap:wrap;">
                <div><div style="font-size:18px;font-family:${typ.body};color:${pal.text};opacity:0.48;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">ROI</div>${heroNum(roi,roi.length>7?100:132,'')}</div>
                <div><div style="font-size:18px;font-family:${typ.body};color:${pal.text};opacity:0.48;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Multiplier</div>${sub(mul,76)}</div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:26px;">
                ${[['Entry MC',ent],['Exit MC',ext],['Investment',inv],['Profit',pStr,pc]].map(([l,v,c])=>`<div style="background:${pal.ac}0c;border:1px solid ${pal.ac}20;border-radius:14px;padding:22px;"><div style="font-size:15px;color:${pal.text};opacity:0.48;letter-spacing:2px;text-transform:uppercase;margin-bottom:7px;">${l}</div><div style="font-size:31px;font-family:${typ.num};font-weight:700;color:${c||pal.text};overflow-wrap:break-word;">${v}</div></div>`).join('')}
              </div>
            </div>`;
        } else if (layout === 'data_terminal') {
            const mf = "'Roboto Mono',monospace";
            inner = `<div style="position:absolute;top:0;left:0;width:100%;height:100%;background:repeating-linear-gradient(0deg,transparent,transparent 27px,${pal.ac}06 27px,${pal.ac}06 28px);pointer-events:none;z-index:1;"></div>
            ${glow1}
            <div style="position:relative;z-index:2;width:100%;height:100%;padding:58px 78px;display:flex;flex-direction:column;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
                <div style="display:flex;gap:9px;"><div style="width:18px;height:18px;border-radius:50%;background:#ff5f57;"></div><div style="width:18px;height:18px;border-radius:50%;background:#ffbd2e;"></div><div style="width:18px;height:18px;border-radius:50%;background:#28ca41;"></div></div>
                <div style="font-size:22px;font-family:${mf};color:${pal.ac};opacity:0.65;">${tok} // pnl_report.exe</div>
                ${usr?`<div style="margin-left:auto;font-size:20px;font-family:${mf};color:${pal.text};opacity:0.45;">${usr}</div>`:''}
              </div>
              <div style="flex:1;display:flex;gap:72px;align-items:flex-start;padding-top:22px;">
                <div style="flex:1;">
                  <div style="font-size:22px;font-family:${mf};color:${pal.ac};margin-bottom:18px;opacity:0.58;">&gt; analyzing trade...</div>
                  <div style="font-size:22px;font-family:${mf};color:${pal.text};opacity:0.42;margin-bottom:32px;">&gt; report generated.</div>
                  ${[['ENTRY MC',ent],['EXIT MC',ext],['INVESTMENT',inv]].map(([l,v])=>`<div style="font-size:20px;font-family:${mf};color:${pal.text};opacity:0.48;margin-bottom:7px;">&gt; ${l}</div><div style="font-size:38px;font-family:${mf};font-weight:700;color:${pal.text};margin-bottom:26px;">${v}</div>`).join('')}
                </div>
                <div style="flex-shrink:0;text-align:right;">
                  <div style="font-size:18px;font-family:${mf};color:${pal.text};opacity:0.44;margin-bottom:7px;">OUTPUT :: PROFIT</div>
                  ${heroNum(pStr,pStr.length>10?75:102,'text-align:right;')}
                  <div style="font-size:18px;font-family:${mf};color:${pal.text};opacity:0.44;margin-top:18px;margin-bottom:7px;">OUTPUT :: ROI</div>
                  ${sub(roi,72)}
                  <div style="font-size:18px;font-family:${mf};color:${pal.text};opacity:0.44;margin-top:18px;margin-bottom:7px;">OUTPUT :: MULTIPLIER</div>
                  ${sub(mul,54)}
                  ${badge?`<div style="margin-top:26px;text-align:right;">${badge}</div>`:''}
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;padding-top:22px;border-top:1px solid ${pal.ac}30;flex-wrap:wrap;gap:14px;">
                <div style="font-size:20px;font-family:${mf};color:${pal.ac};opacity:0.58;">&gt; STATUS: ${this.isProfit?'PROFITABLE ✓':'LOSS ✗'}</div>
                <div style="font-size:20px;font-family:${mf};color:${pal.text};opacity:0.32;">[MC CALC v2.0]</div>
              </div>
            </div>`;
        } else if (layout === 'magazine_spread') {
            inner = `${glow1}
            <div style="position:relative;z-index:2;width:100%;height:100%;display:grid;grid-template-rows:auto 1fr auto;">
              <div style="padding:28px 68px;background:${pal.ac};display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                <div style="font-size:20px;font-family:${typ.body};font-weight:800;color:#000;letter-spacing:4px;text-transform:uppercase;">TRADE REPORT</div>
                <div style="font-size:${tok.length>12?28:36}px;font-family:${typ.tok};font-weight:900;color:#000;letter-spacing:2px;text-transform:uppercase;overflow-wrap:break-word;max-width:55%;text-align:center;">${tok}</div>
                ${usr?`<div style="font-size:20px;font-family:${typ.body};font-weight:600;color:#000;opacity:0.68;">${usr}</div>`:'<div></div>'}
              </div>
              <div style="display:grid;grid-template-columns:38% 62%;align-items:stretch;">
                <div style="background:${pal.card};display:flex;align-items:center;justify-content:center;padding:35px;">
                  ${charBox(295,405,1)}
                </div>
                <div style="padding:46px 55px;display:flex;flex-direction:column;justify-content:center;gap:30px;">
                  <div style="border-left:5px solid ${pal.ac};padding-left:26px;">
                    ${heroNum(pStr,pStr.length>10?72:96,'')}
                    <div style="font-size:28px;font-family:${typ.body};color:${pal.text};opacity:0.55;margin-top:7px;">Net Profit</div>
                  </div>
                  <div style="display:flex;gap:44px;flex-wrap:wrap;">
                    <div><div style="font-size:16px;font-family:${typ.body};color:${pal.text};opacity:0.48;text-transform:uppercase;letter-spacing:2px;margin-bottom:5px;">ROI</div>${sub(roi,58)}</div>
                    <div><div style="font-size:16px;font-family:${typ.body};color:${pal.text};opacity:0.48;text-transform:uppercase;letter-spacing:2px;margin-bottom:5px;">Multiplier</div>${sub(mul,58)}</div>
                  </div>
                  ${badge}
                </div>
              </div>
              <div style="padding:22px 68px;background:${pal.card};display:grid;grid-template-columns:repeat(4,1fr);gap:18px;border-top:2px solid ${pal.ac}3a;">
                ${[['Entry MC',ent],['Exit MC',ext],['Investment',inv],['Current Value',fin,pc]].map(([l,v,c])=>`<div><div style="font-size:15px;color:${pal.text};opacity:0.48;text-transform:uppercase;letter-spacing:2px;">${l}</div><div style="font-size:29px;font-family:${typ.num};font-weight:700;color:${c||pal.text};overflow-wrap:break-word;">${v}</div></div>`).join('')}
              </div>
            </div>`;
        } else if (layout === 'trophy_pedestal') {
            inner = `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:680px;height:680px;border-radius:50%;background:radial-gradient(circle,${pal.glow} 0%,transparent 72%);pointer-events:none;z-index:1;"></div>
            ${glow1}
            <div style="position:relative;z-index:2;width:100%;height:100%;padding:48px 68px;display:flex;flex-direction:column;justify-content:space-between;align-items:center;">
              <div style="width:100%;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:18px;">
                ${tokEl('max-width:60%;')}
                <div style="text-align:right;">${badge}${usr?`<div style="font-size:27px;font-family:${typ.body};font-weight:600;color:${pal.text};opacity:0.65;margin-top:10px;">${usr}</div>`:''}</div>
              </div>
              <div style="display:flex;align-items:flex-end;gap:72px;justify-content:center;">
                <div style="text-align:center;">
                  ${charBox(275,380,1,'flex-shrink:0;')}
                  <div style="background:linear-gradient(135deg,${pal.ac}40,${pal.ac2}20);border:2px solid ${pal.ac}55;border-radius:10px 10px 4px 4px;padding:10px 44px;margin-top:-8px;backdrop-filter:blur(8px);">
                    <div style="font-size:20px;font-family:${typ.body};font-weight:700;color:${pal.ac};letter-spacing:3px;text-transform:uppercase;white-space:nowrap;">TRADER</div>
                  </div>
                </div>
                <div>
                  ${heroNum(roi,roi.length>7?102:138)}
                  ${sub(mul,48)}
                  ${sub(pStr,42)}
                </div>
              </div>
              <div style="width:100%;display:grid;grid-template-columns:repeat(4,1fr);gap:18px;padding:22px 28px;background:rgba(0,0,0,0.42);border:1px solid ${pal.ac}1e;border-radius:18px;backdrop-filter:blur(18px);">
                ${[['Entry MC',ent],['Exit MC',ext],['Investment',inv],['Current Value',fin,pc]].map(([l,v,c])=>`<div style="text-align:center;"><div style="font-size:14px;color:${pal.text};opacity:0.48;text-transform:uppercase;letter-spacing:2px;margin-bottom:5px;">${l}</div><div style="font-size:27px;font-family:${typ.num};font-weight:700;color:${c||pal.text};overflow-wrap:break-word;">${v}</div></div>`).join('')}
              </div>
            </div>`;
        } else if (layout === 'corner_char') {
            inner = `<div style="position:absolute;bottom:-50px;right:-35px;width:440px;height:560px;z-index:1;opacity:0.65;overflow:hidden;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="-195 -295 390 590" style="width:100%;height:100%;filter:drop-shadow(0 0 28px ${pal.glow});">${charSVG}</svg>
            </div>
            ${glow1}
            <div style="position:relative;z-index:2;width:100%;height:100%;padding:62px 78px;display:flex;flex-direction:column;justify-content:space-between;">
              <div style="max-width:68%;">${tokEl()}${usr?`<div style="font-size:30px;font-family:${typ.body};font-weight:600;color:${pal.text};opacity:0.62;margin-top:14px;">${usr}</div>`:''}</div>
              <div style="max-width:62%;">
                ${heroNum(mul,mul.length>5?120:165)}
                ${sub(roi+' ROI',55)}
              </div>
              <div style="max-width:68%;">
                ${getInfoHTML(d,pal,typ,{v:'duo',vsz:40,lsz:17},this.isProfit,this.fmt.bind(this))}
                ${badge?`<div style="margin-top:18px;">${badge}</div>`:''}
              </div>
            </div>`;
        } else {
            inner = `<div style="position:absolute;top:0;right:4%;width:52%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:1;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="-195 -295 390 590" style="height:92%;filter:drop-shadow(0 0 45px ${pal.glow});">${charSVG}</svg>
            </div>
            ${glow1}${glow2}
            <div style="position:relative;z-index:2;width:100%;height:100%;padding:62px 72px;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                ${tokEl('max-width:52%;')}
                ${badge?`<div style="margin-top:20px;">${badge}</div>`:''}
              </div>
              <div style="max-width:50%;">
                ${heroNum(roi,roi.length>7?112:152)}
                ${sub(mul+' · '+pStr,48)}
              </div>
              <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:18px;max-width:52%;">
                <div style="display:flex;gap:44px;flex-wrap:wrap;">
                  ${[['Entry MC',ent],['Exit MC',ext],['Investment',inv]].map(([l,v])=>`<div><div style="font-size:16px;color:${pal.text};opacity:0.48;text-transform:uppercase;letter-spacing:2px;margin-bottom:5px;">${l}</div><div style="font-size:33px;font-family:${typ.num};font-weight:700;">${v}</div></div>`).join('')}
                </div>
                ${usr?`<div style="font-size:30px;font-family:${typ.body};font-weight:700;color:${pal.text};opacity:0.7;background:rgba(0,0,0,0.48);border:1px solid ${pal.ac}2a;border-radius:12px;padding:14px 28px;">${usr}</div>`:''}
              </div>
            </div>`;
        }

        return `<div style="${base}">${bg}${dec}${inner}</div>`;
    }
}
