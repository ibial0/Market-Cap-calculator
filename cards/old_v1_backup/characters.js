export const CHARACTERS = [
    'cyber_trader', 'space_investor', 'samurai', 'robot_trader', 'bull',
    'crystal_spirit', 'anime_trader', 'luxury_biz', 'fantasy_mage', 'minimal_mascot'
];

export const getCharacter = (pal, emotion, isProfit, pickFn) => {
    const name = pickFn(CHARACTERS);
    return buildChar(name, pal, emotion, isProfit, pickFn);
};

const buildChar = (name, p, emotion, isProfit, pickFn) => {
    const em = emotion;
    const ac = p.ac, ac2 = p.ac2;
    const happy = ['satisfied','happy','excited','dominant','legendary','ultra'].includes(em);
    const sad   = ['disappointed','broken'].includes(em);
    const epic  = ['dominant','legendary','ultra'].includes(em);

    const eyesNorm = `<circle cx="-20" cy="0" r="9" fill="white"/><circle cx="-20" cy="0" r="6" fill="${ac}"/><circle cx="-17" cy="-3" r="2.5" fill="white"/><circle cx="20" cy="0" r="9" fill="white"/><circle cx="20" cy="0" r="6" fill="${ac}"/><circle cx="23" cy="-3" r="2.5" fill="white"/>`;
    const eyesHappy= `<path d="M-29,-4 Q-20,10 -11,-4" fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/><path d="M11,-4 Q20,10 29,-4" fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/>`;
    const eyesSad  = `<circle cx="-20" cy="0" r="9" fill="white"/><circle cx="-20" cy="4" r="6" fill="${ac}"/><circle cx="20" cy="0" r="9" fill="white"/><circle cx="20" cy="4" r="6" fill="${ac}"/>`;
    const eyesEpic = `<ellipse cx="-20" cy="0" rx="12" ry="7" fill="white"/><circle cx="-20" cy="0" r="6" fill="${ac}"/><ellipse cx="20" cy="0" rx="12" ry="7" fill="white"/><circle cx="20" cy="0" r="6" fill="${ac}"/>`;
    const eyes = sad ? eyesSad : epic ? eyesEpic : happy ? eyesHappy : eyesNorm;

    const mouthSmile= `<path d="M-26,0 Q0,22 26,0" fill="none" stroke="white" stroke-width="4.5" stroke-linecap="round"/>`;
    const mouthSad  = `<path d="M-26,0 Q0,-20 26,0" fill="none" stroke="white" stroke-width="4.5" stroke-linecap="round"/>`;
    const mouthWide = `<path d="M-32,-5 Q0,28 32,-5" fill="none" stroke="white" stroke-width="5.5" stroke-linecap="round"/>`;
    const mouthFlat = `<rect x="-22" y="-2.5" width="44" height="5" rx="2.5" fill="white" opacity="0.75"/>`;
    const mouth = sad ? mouthSad : epic ? mouthWide : happy ? mouthSmile : mouthFlat;

    const crown = epic ? `<path d="M0,-195 L12,-170 L30,-182 L22,-155 L-22,-155 L-30,-182 L-12,-170 Z" fill="${ac}" opacity="0.9"/>` : '';
    const aura  = epic ? `<circle cx="0" cy="-40" r="160" fill="none" stroke="${ac}" stroke-width="1.5" stroke-opacity="0.3" stroke-dasharray="10 5"/><circle cx="0" cy="-40" r="180" fill="none" stroke="${ac2}" stroke-width="1" stroke-opacity="0.18" stroke-dasharray="6 8"/>` : '';

    let svg = '';

    if (name === 'cyber_trader') {
        svg = `<g>
          ${aura}
          <rect x="-88" y="55" width="176" height="225" rx="22" fill="#181830"/>
          <rect x="-88" y="55" width="176" height="225" rx="22" fill="none" stroke="${ac}" stroke-width="2.5" stroke-opacity="0.7"/>
          <rect x="-50" y="90" width="100" height="70" rx="8" fill="#0a0a1a"/>
          <rect x="-50" y="90" width="100" height="70" rx="8" fill="none" stroke="${ac}" stroke-width="1.5" stroke-opacity="0.5"/>
          <rect x="-42" y="102" width="84" height="7" rx="3" fill="${ac}" opacity="0.55"/>
          <rect x="-42" y="116" width="62" height="5" rx="2.5" fill="${ac2}" opacity="0.4"/>
          <rect x="-42" y="129" width="74" height="5" rx="2.5" fill="${ac}" opacity="0.3"/>
          <circle cx="-64" cy="60" r="10" fill="${ac}33" stroke="${ac}" stroke-width="1.5"/>
          <circle cx="64" cy="60" r="10" fill="${ac}33" stroke="${ac}" stroke-width="1.5"/>
          <rect x="-130" y="240" width="260" height="18" rx="8" fill="#111" stroke="${ac}" stroke-width="1.5"/>
          <rect x="-115" y="228" width="230" height="14" rx="6" fill="${ac}2a"/>
          <ellipse cx="0" cy="-38" rx="68" ry="72" fill="#252540"/>
          <ellipse cx="0" cy="-38" rx="68" ry="72" fill="none" stroke="${ac}" stroke-width="1.5" stroke-opacity="0.4"/>
          <path d="M-68,-62 Q-25,-130 0,-120 Q25,-130 68,-62" fill="${ac2}" opacity="0.85"/>
          <ellipse cx="0" cy="-34" rx="52" ry="58" fill="#ecc4a0"/>
          <rect x="-54" y="-62" width="108" height="32" rx="12" fill="${ac}40"/>
          <rect x="-54" y="-62" width="108" height="32" rx="12" fill="none" stroke="${ac}" stroke-width="2"/>
          <g transform="translate(0,-46)">${eyes}</g>
          <g transform="translate(0,-8)">${mouth}</g>
          ${crown}
          <rect x="-115" y="68" width="30" height="115" rx="14" fill="#181830" stroke="${ac}" stroke-width="1.5" stroke-opacity="0.5"/>
          <rect x="85" y="68" width="30" height="115" rx="14" fill="#181830" stroke="${ac}" stroke-width="1.5" stroke-opacity="0.5"/>
        </g>`;
    } else if (name === 'space_investor') {
        svg = `<g>
          ${aura}
          <rect x="-88" y="48" width="176" height="240" rx="28" fill="#BB2200"/>
          <rect x="-88" y="48" width="176" height="240" rx="28" fill="none" stroke="${ac}" stroke-width="2"/>
          <rect x="-44" y="82" width="88" height="65" rx="8" fill="#992000"/>
          <circle cx="0" cy="114" r="18" fill="${ac}44" stroke="${ac}" stroke-width="2"/>
          <ellipse cx="-112" cy="175" rx="26" ry="32" fill="#992000"/>
          <ellipse cx="112" cy="175" rx="26" ry="32" fill="#992000"/>
          <rect x="-70" y="272" width="54" height="26" rx="12" fill="#992000"/>
          <rect x="16" y="272" width="54" height="26" rx="12" fill="#992000"/>
          <ellipse cx="0" cy="-48" rx="82" ry="88" fill="#CC4400"/>
          <ellipse cx="0" cy="-54" rx="62" ry="64" fill="${ac}55"/>
          <ellipse cx="0" cy="-54" rx="62" ry="64" fill="none" stroke="${ac}" stroke-width="3"/>
          <ellipse cx="0" cy="-54" rx="46" ry="47" fill="#e8c090"/>
          <g transform="translate(0,-60)">${eyes}</g>
          <g transform="translate(0,-32)">${mouth}</g>
          <path d="M-56,-105 Q-32,-125 -12,-94" fill="none" stroke="white" stroke-width="3" opacity="0.28" stroke-linecap="round"/>
          ${crown}
        </g>`;
    } else if (name === 'robot_trader') {
        const eyeLedColor = sad ? '#ff4444' : ac;
        svg = `<g>
          ${aura}
          <rect x="-82" y="58" width="164" height="205" rx="16" fill="#2a2a2a"/>
          <rect x="-82" y="58" width="164" height="205" rx="16" fill="none" stroke="${ac}" stroke-width="3"/>
          <rect x="-57" y="90" width="114" height="82" rx="9" fill="#111"/>
          <rect x="-57" y="90" width="114" height="82" rx="9" fill="none" stroke="${ac}" stroke-width="1.5"/>
          <circle cx="-35" cy="122" r="7" fill="${isProfit ? '#00ff88' : '#ff4444'}"/>
          <circle cx="-12" cy="122" r="7" fill="${ac}"/>
          <circle cx="11" cy="122" r="7" fill="${ac2}"/>
          <rect x="-47" y="145" width="94" height="5" rx="2.5" fill="${ac}" opacity="0.5"/>
          <rect x="-47" y="157" width="70" height="5" rx="2.5" fill="${ac2}" opacity="0.4"/>
          <polygon points="-28,32 0,16 28,32 0,48" fill="${ac}" opacity="0.92"/>
          <rect x="-72" y="-118" width="144" height="135" rx="22" fill="#333"/>
          <rect x="-72" y="-118" width="144" height="135" rx="22" fill="none" stroke="${ac}" stroke-width="3"/>
          <rect x="-7" y="-148" width="14" height="35" rx="7" fill="${ac}"/>
          <circle cx="0" cy="-156" r="12" fill="${ac}"/>
          <rect x="-45" y="-82" width="30" height="22" rx="7" fill="${eyeLedColor}" opacity="${epic ? 1 : 0.72}"/>
          <rect x="15" y="-82" width="30" height="22" rx="7" fill="${eyeLedColor}" opacity="${epic ? 1 : 0.72}"/>
          <rect x="-32" y="-35" width="64" height="12" rx="6" fill="${sad ? '#ff4444' : ac}" opacity="${epic ? 1 : 0.82}"/>
          <rect x="-112" y="68" width="32" height="125" rx="15" fill="#2a2a2a" stroke="${ac}" stroke-width="1.5"/>
          <rect x="80" y="68" width="32" height="125" rx="15" fill="#2a2a2a" stroke="${ac}" stroke-width="1.5"/>
          <rect x="-62" y="257" width="46" height="32" rx="13" fill="#2a2a2a" stroke="${ac}" stroke-width="1.5"/>
          <rect x="16" y="257" width="46" height="32" rx="13" fill="#2a2a2a" stroke="${ac}" stroke-width="1.5"/>
          ${crown}
        </g>`;
    } else if (name === 'samurai') {
        svg = `<g>
          ${aura}
          <rect x="-82" y="42" width="164" height="228" rx="12" fill="#1a0a00"/>
          <rect x="-78" y="52" width="156" height="30" rx="5" fill="${ac}44"/>
          <rect x="-78" y="88" width="156" height="30" rx="5" fill="${ac}33"/>
          <rect x="-78" y="124" width="156" height="30" rx="5" fill="${ac}44"/>
          <rect x="-78" y="160" width="156" height="30" rx="5" fill="${ac}33"/>
          <rect x="-82" y="42" width="164" height="228" rx="12" fill="none" stroke="${ac}" stroke-width="2"/>
          <rect x="-134" y="32" width="56" height="84" rx="8" fill="${ac}44" stroke="${ac}" stroke-width="1.5"/>
          <rect x="78" y="32" width="56" height="84" rx="8" fill="${ac}44" stroke="${ac}" stroke-width="1.5"/>
          <path d="M-66,-92 Q-72,-168 0,-188 Q72,-168 66,-92 Z" fill="#240e00"/>
          <path d="M-66,-92 Q-72,-168 0,-188 Q72,-168 66,-92 Z" fill="none" stroke="${ac}" stroke-width="2"/>
          <path d="M-22,-182 L0,-228 L22,-182" fill="${ac}88" stroke="${ac}" stroke-width="2"/>
          <rect x="-46" y="-52" width="92" height="58" rx="10" fill="#1a1a1a" stroke="${ac}" stroke-width="1.5"/>
          <ellipse cx="0" cy="-98" rx="52" ry="48" fill="#e8c090"/>
          <g transform="translate(0,-104)">${eyes}</g>
          <circle cx="0" cy="98" r="26" fill="none" stroke="${ac}" stroke-width="2"/>
          <circle cx="0" cy="98" r="16" fill="${ac}33"/>
          <rect x="88" y="-210" width="9" height="365" rx="4.5" fill="${ac}" opacity="0.92"/>
          <rect x="78" y="-210" width="9" height="365" rx="4.5" fill="${ac2}" opacity="0.45"/>
          <rect x="64" y="112" width="52" height="16" rx="6" fill="#777"/>
          ${crown}
        </g>`;
    } else if (name === 'bull') {
        svg = `<g>
          ${aura}
          <path d="M-92,58 Q-102,-4 -62,-12 L-42,42 L0,22 L42,42 L62,-12 Q102,-4 92,58 L92,285 L-92,285 Z" fill="#1a3d60"/>
          <path d="M-92,58 Q-102,-4 -62,-12 L-42,42 L0,22 L42,42 L62,-12 Q102,-4 92,58 L92,285 L-92,285 Z" fill="none" stroke="${ac}" stroke-width="2"/>
          <path d="M-16,22 L16,22 L26,125 L0,145 L-26,125 Z" fill="${ac}"/>
          <rect x="-42" y="22" width="84" height="105" fill="white" opacity="0.92"/>
          <ellipse cx="0" cy="-72" rx="82" ry="78" fill="#8B6810"/>
          <path d="M-77,-104 Q-124,-168 -82,-188 Q-60,-176 -56,-122" fill="#6a4f0e" stroke="${ac}" stroke-width="1.5"/>
          <path d="M77,-104 Q124,-168 82,-188 Q60,-176 56,-122" fill="#6a4f0e" stroke="${ac}" stroke-width="1.5"/>
          <ellipse cx="0" cy="-38" rx="42" ry="32" fill="#a07848"/>
          <ellipse cx="-13" cy="-34" rx="9" ry="7" fill="#6b5030"/>
          <ellipse cx="13" cy="-34" rx="9" ry="7" fill="#6b5030"/>
          <ellipse cx="-88" cy="-82" rx="19" ry="23" fill="#8B6810"/>
          <ellipse cx="88" cy="-82" rx="19" ry="23" fill="#8B6810"/>
          <g transform="translate(0,-82)">${eyes}</g>
          <g transform="translate(0,-52)">${mouth}</g>
          ${crown}
          <path d="M58,54 L74,54 L70,80 L54,80 Z" fill="${ac2}" opacity="0.8"/>
        </g>`;
    } else if (name === 'crystal_spirit') {
        svg = `<g>
          <ellipse cx="0" cy="0" rx="135" ry="95" fill="none" stroke="${ac}" stroke-width="1.5" stroke-opacity="0.28"/>
          <ellipse cx="0" cy="0" rx="155" ry="110" fill="none" stroke="${ac2}" stroke-width="1" stroke-opacity="0.15"/>
          <polygon points="0,-185 84,-42 52,105 -52,105 -84,-42" fill="${ac}30" stroke="${ac}" stroke-width="2.5"/>
          <polygon points="0,-145 64,-32 42,82 -42,82 -64,-32" fill="${ac}1a"/>
          <polygon points="-125,-65 -95,-108 -72,-55" fill="${ac2}55" stroke="${ac2}" stroke-width="1.5"/>
          <polygon points="92,-85 125,-44 104,2" fill="${ac}55" stroke="${ac}" stroke-width="1.5"/>
          <polygon points="-105,42 -84,85 -125,72" fill="${ac2}44" stroke="${ac2}" stroke-width="1.5"/>
          <polygon points="82,22 115,64 94,84" fill="${ac}44" stroke="${ac}" stroke-width="1.5"/>
          <circle cx="0" cy="-42" r="44" fill="${ac}" opacity="0.18"/>
          <circle cx="0" cy="-42" r="26" fill="${ac}" opacity="0.28"/>
          <circle cx="0" cy="-42" r="12" fill="white" opacity="0.82"/>
          <ellipse cx="-20" cy="-52" rx="9" ry="9" fill="${ac}" opacity="0.92"/>
          <ellipse cx="20" cy="-52" rx="9" ry="9" fill="${ac}" opacity="0.92"/>
          ${sad ? `<path d="M-16,-22 Q0,-36 16,-22" fill="none" stroke="${ac}" stroke-width="3.5" opacity="0.85"/>` : `<path d="M-16,-22 Q0,-8 16,-22" fill="none" stroke="${ac}" stroke-width="3.5" opacity="0.85"/>`}
          ${epic ? `<polygon points="0,-215 8,-194 30,-194 14,-182 20,-160 0,-172 -20,-160 -14,-182 -30,-194 -8,-194 Z" fill="${ac}" opacity="0.88"/>` : ''}
        </g>`;
    } else if (name === 'anime_trader') {
        svg = `<g>
          ${aura}
          <rect x="-72" y="48" width="144" height="242" rx="22" fill="#1e1040"/>
          <rect x="-72" y="48" width="144" height="242" rx="22" fill="none" stroke="${ac}" stroke-width="2"/>
          <path d="M-72,48 L-52,48 L0,82 L52,48 L72,48 L72,205 L-72,205 Z" fill="#140830"/>
          <path d="M-30,48 L0,82 L30,48" fill="none" stroke="${ac}" stroke-width="3"/>
          <ellipse cx="0" cy="-62" rx="84" ry="84" fill="#f8e0c8"/>
          <ellipse cx="-27" cy="-68" rx="24" ry="30" fill="white"/>
          <ellipse cx="-27" cy="-68" rx="17" ry="24" fill="${ac}"/>
          <ellipse cx="-27" cy="-68" rx="9" ry="12" fill="black"/>
          <circle cx="-21" cy="-76" r="6" fill="white"/>
          <ellipse cx="27" cy="-68" rx="24" ry="30" fill="white"/>
          <ellipse cx="27" cy="-68" rx="17" ry="24" fill="${ac}"/>
          <ellipse cx="27" cy="-68" rx="9" ry="12" fill="black"/>
          <circle cx="33" cy="-76" r="6" fill="white"/>
          ${sad ? `<path d="M-38,-64 Q-27,-52 -16,-64" fill="none" stroke="${ac}" stroke-width="3"/><path d="M16,-64 Q27,-52 38,-64" fill="none" stroke="${ac}" stroke-width="3"/>` : ''}
          <ellipse cx="-48" cy="-47" rx="14" ry="8" fill="#ffbbbb" opacity="0.55"/>
          <ellipse cx="48" cy="-47" rx="14" ry="8" fill="#ffbbbb" opacity="0.55"/>
          <g transform="translate(0,-32)">${mouth}</g>
          <path d="M-84,-74 Q-84,-168 0,-178 Q84,-168 84,-74" fill="${ac2}" opacity="0.88"/>
          <path d="M-44,-162 L-32,-212 L-20,-162" fill="${ac2}" opacity="0.82"/>
          <path d="M0,-172 L12,-218 L24,-172" fill="${ac2}" opacity="0.92"/>
          <path d="M32,-162 L44,-206 L56,-162" fill="${ac}" opacity="0.72"/>
          ${crown}
        </g>`;
    } else if (name === 'luxury_biz') {
        svg = `<g>
          ${aura}
          <rect x="-66" y="205" width="56" height="94" rx="9" fill="#09091a"/>
          <rect x="10" y="205" width="56" height="94" rx="9" fill="#09091a"/>
          <path d="M-82,38 Q-92,-12 -56,-22 L-32,62 L0,42 L32,62 L56,-22 Q92,-12 82,38 L82,275 L-82,275 Z" fill="#09091a"/>
          <path d="M-56,-22 L-32,62 L0,42" fill="#141428"/>
          <path d="M56,-22 L32,62 L0,42" fill="#141428"/>
          <rect x="-26" y="-22" width="52" height="85" fill="white" opacity="0.94"/>
          <polygon points="-11,-22 11,-22 22,62 0,82 -22,62" fill="${ac}"/>
          <rect x="-108" y="132" width="30" height="20" rx="6" fill="#222" stroke="${ac}" stroke-width="1.5"/>
          <circle cx="-93" cy="142" r="6" fill="${ac}" opacity="0.7"/>
          <path d="M57,52 L73,52 L69,80 L53,80 Z" fill="${ac2}" opacity="0.82"/>
          <ellipse cx="0" cy="-72" rx="62" ry="67" fill="#d4a574"/>
          <path d="M-62,-94 Q-18,-148 0,-140 Q18,-148 62,-94" fill="#1a0a00"/>
          <g transform="translate(0,-78)">${eyes}</g>
          <g transform="translate(0,-46)">${mouth}</g>
          ${crown}
        </g>`;
    } else if (name === 'fantasy_mage') {
        svg = `<g>
          ${aura}
          <path d="M-102,18 Q-124,105 -112,285 L112,285 Q124,105 102,18 Z" fill="#280848"/>
          <path d="M-102,18 Q-124,105 -112,285 L112,285 Q124,105 102,18 Z" fill="none" stroke="${ac}" stroke-width="2"/>
          <path d="M0,58 L0,265" stroke="${ac}" stroke-width="2" opacity="0.38" stroke-dasharray="8 5"/>
          <rect x="-158" y="-208" width="13" height="415" rx="6.5" fill="#4a3a00" stroke="${ac2}" stroke-width="1.5"/>
          <polygon points="-152,-208 -145,-208 -148,-228" fill="${ac}" opacity="0.92"/>
          <circle cx="-152" cy="-208" r="16" fill="${ac}55" stroke="${ac}" stroke-width="2"/>
          <circle cx="-152" cy="-208" r="9" fill="${ac}" opacity="0.82"/>
          <circle cx="105" cy="82" r="32" fill="${ac}30" stroke="${ac}" stroke-width="2"/>
          <circle cx="105" cy="82" r="19" fill="${ac}" opacity="0.58"/>
          <circle cx="105" cy="82" r="9" fill="white" opacity="0.88"/>
          <path d="M-62,-82 Q-18,-208 0,-258 Q18,-208 62,-82 Z" fill="#340a5a"/>
          <path d="M-62,-82 Q-18,-208 0,-258 Q18,-208 62,-82 Z" fill="none" stroke="${ac}" stroke-width="2"/>
          <rect x="-67" y="-84" width="134" height="20" rx="6" fill="${ac}62"/>
          <path d="M0,-148 L6,-130 L24,-130 L10,-118 L16,-100 L0,-112 L-16,-100 L-10,-118 L-24,-130 L-6,-130 Z" fill="${ac}" opacity="0.82"/>
          <ellipse cx="0" cy="-52" rx="59" ry="62" fill="#c4a870"/>
          <path d="M-36,8 Q-18,62 0,82 Q18,62 36,8" fill="#ddd" opacity="0.78"/>
          <g transform="translate(0,-58)">${eyes}</g>
          <g transform="translate(0,-22)">${mouth}</g>
          ${crown}
        </g>`;
    } else { // minimal_mascot
        const bodyFill = sad ? '#223' : epic ? ac : '#1e2e55';
        svg = `<g>
          <circle cx="0" cy="0" r="135" fill="${bodyFill}" stroke="${ac}" stroke-width="3"/>
          <circle cx="0" cy="0" r="102" fill="${ac}0e"/>
          <circle cx="-42" cy="-22" r="${epic ? 24 : 20}" fill="${ac}" opacity="0.92"/>
          <circle cx="-42" cy="-22" r="${epic ? 13 : 9}" fill="#000" opacity="0.82"/>
          <circle cx="-34" cy="-30" r="5.5" fill="white" opacity="0.82"/>
          <circle cx="42" cy="-22" r="${epic ? 24 : 20}" fill="${ac}" opacity="0.92"/>
          <circle cx="42" cy="-22" r="${epic ? 13 : 9}" fill="#000" opacity="0.82"/>
          <circle cx="50" cy="-30" r="5.5" fill="white" opacity="0.82"/>
          ${sad ? `<path d="M-36,36 Q0,18 36,36" fill="none" stroke="${ac}" stroke-width="5.5" stroke-linecap="round"/>` : epic ? `<path d="M-46,32 Q0,68 46,32" fill="${ac}45" stroke="${ac}" stroke-width="5.5" stroke-linecap="round"/>` : `<path d="M-36,32 Q0,58 36,32" fill="none" stroke="${ac}" stroke-width="5.5" stroke-linecap="round"/>`}
          <polygon points="-168,-65 -145,-108 -122,-65" fill="none" stroke="${ac}" stroke-width="2" opacity="0.48"/>
          <rect x="122" y="-82" width="48" height="48" rx="9" fill="none" stroke="${ac2}" stroke-width="2" opacity="0.45" transform="rotate(22,146,-58)"/>
          <circle cx="-160" cy="42" r="27" fill="${bodyFill}" stroke="${ac}" stroke-width="2"/>
          <circle cx="160" cy="42" r="27" fill="${bodyFill}" stroke="${ac}" stroke-width="2"/>
          ${epic ? `<path d="M0,-210 L9,-188 L32,-188 L14,-174 L22,-150 L0,-164 L-22,-150 L-14,-174 L-32,-188 L-9,-188 Z" fill="${ac}" opacity="0.88"/>` : ''}
        </g>`;
    }

    return svg;
};
