/* ====================================================================
   Interviewest — static site logic
   ====================================================================
   Everything an owner is likely to want to change lives in CONFIG
   below: contact info, links, and prices. Edit those values and
   reload the page — no other code needs to change for normal use.
   ==================================================================== */

const CONFIG = {
  // Brand colors
  accent: '#17714A',       // Interview track (green)
  accentBlue: '#1D5FC4',   // Essay track (blue)

  // Contact
  whatsapp: '732-692-7042',
  email: 'ssaavirs123@gmail.com',
  instagram: '',                                   // without the @, leave '' to hide
  bookingUrl: 'https://calendar.app.google/yrZLhzQuLBe9WcQJA',
  intakeFormUrl: 'https://forms.gle/ah8V3LgYmaRvEzyu5',

  // Interview-track prices
  priceDiagnostic: 20,
  priceClass: 10,
  priceMock: 25,
  priceExtremeClass: 12,

  // Essay-track prices
  priceEConsult: 10,
  priceEClass: 8,
  priceEReview: 12,
  priceEHighClass: 10,

  // Discount tiers applied to the bigger programs
  discountMid: 5,   // percent
  discountHigh: 10,  // percent
};

/* ---------------------------------------------------------------- */
/* State                                                             */
/* ---------------------------------------------------------------- */

const state = {
  track: 'interview',   // 'interview' | 'essay'
  mode: 'online',       // interview High Rigor: 'online' | 'inperson'
  eMode: 'online',      // essay High Rigor
  selected: 0,          // interview pricing-table selection
  eSelected: 0,         // essay pricing-table selection

  // Readiness check (interview)
  rParent: '', rChild: '', rAcad: '', rPass: '', rEcs: '', rWhy: '', rNerv: '',
  // Essay check
  erParent: '', erChild: '', erAcad: '', erPass: '', erEcs: '', erWhy: '', erNerv: '',
  // Special package request
  cName: '', cAcademy: '', cText: '',
  // General question
  qName: '', qText: '',
};

/* ---------------------------------------------------------------- */
/* Helpers                                                            */
/* ---------------------------------------------------------------- */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(n) { return '$' + n; }
function dash(v) { return v.trim() ? v.trim() : '-'; }
function inc(...items) { return items.map((x) => ({ text: x })); }

function computeDerived() {
  const p = CONFIG;
  let digits = String(p.whatsapp || '').replace(/\D/g, '');
  if (digits.length === 10) digits = '1' + digits;
  const local = digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits;
  const waPretty = local.length === 10
    ? '(' + local.slice(0, 3) + ') ' + local.slice(3, 6) + '-' + local.slice(6)
    : local;
  const email = String(p.email || '').trim();
  const ig = String(p.instagram || '').trim().replace(/^@/, '');
  let bookUrl = String(p.bookingUrl || '').trim();
  if (bookUrl && !/^https?:\/\//i.test(bookUrl)) bookUrl = 'https://' + bookUrl;
  let formUrl = String(p.intakeFormUrl || '').trim();
  if (formUrl && !/^https?:\/\//i.test(formUrl)) formUrl = 'https://' + formUrl;
  return { digits, waPretty, email, ig, bookUrl, formUrl };
}

function wa(msg, digits) {
  return digits ? 'https://wa.me/' + digits + '?text=' + encodeURIComponent(msg) : '#contact';
}
function mailHref(subject, body, email) {
  return email ? 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body) : '#contact';
}
function discFor(tier, discMid, discHigh) {
  return tier === 0 ? 0 : (tier === 1 ? discMid : discHigh);
}

function buildProgram(o, t) {
  const classCost = o.classes * o.rate;
  const weeklyCost = o.weeks * t.weeklyPrice;
  const sub = classCost + weeklyCost;
  const total = Math.round(sub * (100 - o.disc) / 100);
  const saved = sub - total;
  const lines = [
    { label: o.classes + ' one-hour classes at ' + money(o.rate), amount: money(classCost) },
    { label: o.weeks + ' ' + t.plural + ' at ' + money(t.weeklyPrice), amount: money(weeklyCost) },
  ];
  if (o.disc > 0) lines.push({ label: o.disc + '% program discount', amount: '-' + money(saved) });
  return {
    name: o.name, price: total, tag: '', blurb: o.blurb, includes: o.includes,
    lines, hasDiscount: o.disc > 0, wasText: money(sub), saveText: 'Save ' + o.disc + '%',
  };
}

/* Shared pricing-engine factory — same math for the interview track
   (mock interviews) and the essay track (draft reviews). */
function makeTrack(t, derived, discMid, discHigh, mode, selectedIdx) {
  const modeLabel = mode === 'inperson' ? 'in person' : 'online';

  const prog = (name, classes, weeks, discTier) => buildProgram({
    name, classes, weeks, rate: t.classRate, disc: discFor(discTier, discMid, discHigh),
    blurb: classes + ' classes and ' + weeks + ' ' + t.plural + ' over ' + weeks + ' weeks.',
    includes: inc(classes + ' one-hour classes, one on one', weeks + ' ' + t.plural + ', one each week', 'Notes after every ' + t.singular),
  }, t);

  const hr = buildProgram({
    name: 'High Rigor', classes: t.hr.classes, weeks: t.hr.weeks, rate: t.hrRate, disc: discHigh,
    blurb: t.hr.blurb, includes: inc(...t.hr.includes),
  }, t);

  const progs = t.progs.map((a) => prog(a[0], a[1], a[2], a[3]));
  const defs = [t.consult].concat(progs, [hr]);

  const courses = defs.map((c, i) => ({
    ...c,
    priceText: money(c.price),
    hasTag: c.tag !== '',
    selected: i === selectedIdx,
    bookHref: wa(t.signup + c.name + (c.name === 'High Rigor' ? ' (' + modeLabel + ')' : '') + '.', derived.digits),
    idx: i,
  }));

  const packs = [1, 2, 6, 10].map((n) => ({
    label: n === 1 ? '1 ' + t.packWord : n + ' ' + t.packWord + 's',
    totalText: money(n * t.weeklyPrice),
    each: money(t.weeklyPrice) + ' per ' + t.packWord,
    bookHref: wa('Hi, I would like a set of ' + n + ' ' + (n > 1 ? t.plural : t.singular) + '.', derived.digits),
  }));

  return {
    courses,
    cards: courses.slice(0, 5),
    hr: courses[5],
    sel: courses[selectedIdx] || courses[0],
    packs,
    priceNote: 'Everything is one on one. Each class is one hour and costs ' + money(t.classRate) + '. Every week also includes a ' + t.singular + ' at ' + money(t.weeklyPrice) + '. The bigger programs get a small discount.',
    packNote: t.packNote,
    modeOnline: mode === 'online',
    modeInPerson: mode === 'inperson',
  };
}

function ivTrackDef(derived) {
  return {
    weeklyPrice: CONFIG.priceMock, classRate: CONFIG.priceClass, hrRate: CONFIG.priceExtremeClass,
    plural: 'mock interviews', singular: 'mock interview', packWord: 'interview',
    signup: 'Hi, I would like to sign up for: ',
    packNote: 'Buy them on their own at ' + money(CONFIG.priceMock) + ' per interview. Every mock is timed and comes with notes on what to fix.',
    consult: {
      name: 'Mock interview diagnostic', price: CONFIG.priceDiagnostic, tag: 'Start here',
      blurb: 'One session with a mock interview, so we can see where you are and what to work on first.',
      includes: inc('A live mock interview with a coach', 'Scored on a simple rubric', 'Your top three things to work on', 'A one-page summary for you and your parents'),
      lines: [{ label: 'Mock interview diagnostic', amount: money(CONFIG.priceDiagnostic) }],
      hasDiscount: false, wasText: '', saveText: '',
    },
    progs: [
      ['4 weeks, 1 class a week', 4, 4, 0],
      ['4 weeks, 2 classes a week', 8, 4, 1],
      ['6 weeks, 1 class a week', 6, 6, 1],
      ['6 weeks, 2 classes a week', 12, 6, 2],
    ],
    hr: {
      classes: 18, weeks: 6,
      blurb: '18 classes and 6 mock interviews over 6 weeks (3 classes a week), online or in person.',
      includes: ['18 one-hour classes, one on one', '6 mock interviews, one each week', 'Curveball questions and tougher follow-ups', 'Online or in person, your choice'],
    },
  };
}

function esTrackDef(derived) {
  return {
    weeklyPrice: CONFIG.priceEReview, classRate: CONFIG.priceEClass, hrRate: CONFIG.priceEHighClass,
    plural: 'draft reviews', singular: 'draft review', packWord: 'review',
    signup: 'Hi, I would like to sign up for the essay program: ',
    packNote: 'Buy them on their own at ' + money(CONFIG.priceEReview) + ' per review. Every review comes with written notes on what to fix.',
    consult: {
      name: 'Essay consultation', price: CONFIG.priceEConsult, tag: 'Start here',
      blurb: 'One session where we look at your prompt or draft, so we can see where you are and what to work on first.',
      includes: inc('A one-on-one session with a coach', 'Feedback on your ideas, structure, and voice', 'Your top three things to work on', 'A one-page summary for you and your parents'),
      lines: [{ label: 'Essay consultation', amount: money(CONFIG.priceEConsult) }],
      hasDiscount: false, wasText: '', saveText: '',
    },
    progs: [
      ['2 weeks, 1 class a week', 2, 2, 0],
      ['2 weeks, 2 classes a week', 4, 2, 1],
      ['4 weeks, 1 class a week', 4, 4, 1],
      ['4 weeks, 2 classes a week', 8, 4, 2],
    ],
    hr: {
      classes: 10, weeks: 5,
      blurb: '10 classes and 5 draft reviews over 5 weeks (2 classes a week), online or in person.',
      includes: ['10 one-hour classes, one on one', '5 draft reviews, one each week', 'Brainstorming, outlining, and several rounds of revision', 'Online or in person, your choice'],
    },
  };
}

function readinessMessage(prefix, title, labels) {
  const v = (k) => state[prefix + k] || '';
  return title + '\n' +
    'Parent or guardian: ' + dash(v('Parent')) + '\n' +
    'Student: ' + dash(v('Child')) + '\n' +
    '1. ' + labels[0] + ': ' + dash(v('Acad')) + '\n' +
    '2. ' + labels[1] + ': ' + dash(v('Pass')) + '\n' +
    '3. ' + labels[2] + ': ' + dash(v('Ecs')) + '\n' +
    '4. ' + labels[3] + ': ' + dash(v('Why')) + '\n' +
    '5. ' + labels[4] + ': ' + dash(v('Nerv'));
}

/* ---------------------------------------------------------------- */
/* Small shared markup pieces                                        */
/* ---------------------------------------------------------------- */

function iconCheck(color, size) {
  size = size || 20;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0"><path d="M5 12l5 5L20 7"></path></svg>`;
}

function bullet(color, text, size) {
  return `<div style="display:flex;align-items:flex-start;gap:10px;font-size:${size || 15}px">${iconCheck(color, size === 17 ? 22 : 18)}<span>${text}</span></div>`;
}

/* ---------------------------------------------------------------- */
/* Page render                                                       */
/* ---------------------------------------------------------------- */

function render() {
  const derived = computeDerived();
  const app = document.getElementById('app');
  app.innerHTML = state.track === 'essay' ? renderEssay(derived) : renderInterview(derived);
  window.scrollTo === window.scrollTo; // no-op, keeps linters quiet
}

/* ---- Interview track (green) ------------------------------------ */

function renderInterview(derived) {
  const accent = CONFIG.accent;
  const iv = makeTrack(ivTrackDef(derived), derived, CONFIG.discountMid, CONFIG.discountHigh, state.mode, state.selected);
  const waDiag = wa('Hi, I would like to book the mock interview diagnostic.', derived.digits);
  const waReadiness = wa(readinessMessage('r', 'Readiness check for Interviewest', [
    'Strongest subjects and what they enjoy learning', 'Passions and free time', 'Clubs, projects, and competitions', 'Academy and why', 'Worries and goals',
  ]), derived.digits);

  const cardsHtml = iv.cards.map((c) => `
    <div style="flex:1 1 320px;background:#F6FBF8;border:1px solid #CFE3D6;border-radius:20px;padding:28px;box-sizing:border-box;display:flex;flex-direction:column;gap:14px">
      ${c.hasTag ? `<div style="align-self:flex-start;padding:3px 10px;border-radius:999px;background:${accent};color:#FFFFFF;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">${c.tag}</div>` : ''}
      <div style="font-weight:600;font-size:20px">${c.name}</div>
      <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 12px">
        <span style="font-family:'Bricolage Grotesque','Segoe UI',sans-serif;font-weight:700;font-size:38px;line-height:1">${c.priceText}</span>
        ${c.hasDiscount ? `<span style="font-size:15px;color:#4B6356;text-decoration:line-through">${c.wasText}</span><span style="font-size:13px;font-weight:600;color:${accent}">${c.saveText}</span>` : ''}
      </div>
      <div style="color:#4B6356;font-size:15px">${c.blurb}</div>
      <div style="display:flex;flex-direction:column;gap:8px;flex-grow:1">
        ${c.includes.map((x) => bullet(accent, x.text, 14)).join('')}
      </div>
      <a href="${c.bookHref}" style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 24px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:15px">Sign up</a>
    </div>`).join('');

  const packsHtml = iv.packs.map((k) => `
    <div style="flex:1 1 220px;background:#F6FBF8;border:1px solid #CFE3D6;border-radius:20px;padding:24px;box-sizing:border-box;display:flex;flex-direction:column;gap:10px">
      <div style="font-weight:600;font-size:18px">${k.label}</div>
      <div style="font-family:'Bricolage Grotesque','Segoe UI',sans-serif;font-weight:700;font-size:36px;line-height:1">${k.totalText}</div>
      <div style="font-size:14px;color:#4B6356;flex-grow:1">${k.each}</div>
      <a href="${k.bookHref}" style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;box-sizing:border-box;border-radius:999px;border:1.5px solid #0E2A1E;color:#0E2A1E;font-weight:600;font-size:15px">Get this set</a>
    </div>`).join('');

  const coursePicker = iv.courses.map((c) => `
    <button type="button" aria-pressed="${c.selected}" onclick="App.pick('iv', ${c.idx})" style="width:100%;min-height:56px;padding:0 20px;box-sizing:border-box;border-radius:14px;border:2px solid ${c.selected ? '#0E2A1E' : '#B9D3C2'};background:${c.selected ? '#0E2A1E' : '#FFFFFF'};color:${c.selected ? '#FFFFFF' : '#0E2A1E'};font-family:inherit;font-size:16px;font-weight:600;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px">
      <span>${c.name}</span><span>${c.priceText}</span>
    </button>`).join('');

  const sel = iv.sel;
  const selLines = sel.lines.map((ln) => `<div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #CFE3D6;font-size:16px"><span>${ln.label}</span><span style="font-weight:600">${ln.amount}</span></div>`).join('');
  const selIncludes = sel.includes.map((x) => bullet(accent, x.text, 15)).join('');

  const modeBtn = (key, label, active) => `<button type="button" aria-pressed="${active}" onclick="App.setMode('iv','${key}')" style="flex:1 1 140px;min-height:48px;padding:0 16px;box-sizing:border-box;border-radius:12px;border:2px solid ${active ? '#0E2A1E' : '#B9D3C2'};background:${active ? '#0E2A1E' : '#FFFFFF'};color:${active ? '#FFFFFF' : '#0E2A1E'};font-family:inherit;font-size:15px;font-weight:600">${label}</button>`;

  const faq = [
    ['Where should we start?', 'With the diagnostic. It’s one session, and afterward we’ll tell you which program makes sense.'],
    ['How do I book a session?', 'Message us to sign up. We’ll send you our Zelle details on WhatsApp, and once we confirm your payment, you can pick a time on our calendar.'],
    ['Is it really one on one?', 'Yes. Every program is one on one, so your coach’s time is all yours.'],
    ['Do the programs include mock interviews?', 'Yes. Every program has a mock interview each week, and the price already counts them.'],
    ['Can you promise my child will get in?', 'No, and nobody can. We can help your child practice so they go in ready.'],
    ['Are you part of BCA?', 'No. We’re BCA students who went through the same process, but this is our own thing and the school isn’t involved.'],
    ['Will you tell us the real interview questions?', 'No. We write our own practice questions. The goal is to help your child think and answer in their own words.'],
    ['Where do sessions happen?', 'Over Zoom. The High Rigor course can also be done in person, and we’ll set up the place with you. Parents are welcome to sit in, and we only record with a parent’s permission.'],
    ['How long is a class?', 'One hour.'],
  ];
  const faqHtml = faq.map((f, i) => `<div style="padding:20px 0;${i === faq.length - 1 ? 'border-bottom:1px solid #B9D3C2;' : ''}border-top:1px solid #B9D3C2;display:flex;flex-direction:column;gap:6px"><div style="font-weight:600;font-size:18px">${f[0]}</div><div style="color:#4B6356;font-size:15px">${f[1]}</div></div>`).join('');

  const teamCard = () => `
    <div style="flex:1 1 260px;max-width:360px;display:flex;flex-direction:column;gap:12px">
      <div style="width:100%;aspect-ratio:4/5;box-sizing:border-box;border-radius:20px;background:#DDEDE3;border:2px dashed #6E9580;display:flex;align-items:center;justify-content:center;text-align:center;padding:16px;color:#4B6356;font-size:14px">Photo goes here</div>
      <div style="font-family:'Bricolage Grotesque','Segoe UI',sans-serif;font-weight:700;font-size:24px;letter-spacing:-0.01em">[NAME]</div>
      <div style="font-size:14px;font-weight:600;color:${accent}">BCA student, [ACADEMY], class of [YEAR]</div>
      <div style="color:#4B6356;font-size:15px">[Two or three sentences: what you’re into, what you did in the interview, and one thing you wish you’d known.]</div>
    </div>`;

  const cMsg = 'Hi, this is ' + (state.cName.trim() || 'a parent') + '. I would like a special package. Academy: ' + (state.cAcademy.trim() || 'not sure yet') + '. What I am looking for: ' + (state.cText.trim() || '[tell us what you need]');
  const qMsg = 'Hi, this is ' + (state.qName.trim() || 'a parent') + '. My question: ' + (state.qText.trim() || '[type your question]');

  return `
<div style="width:100%;background:#FFFFFF;color:#0E2A1E;font-family:'Figtree',system-ui,sans-serif;line-height:1.55">

  <div style="background:#FFFFFF;border-bottom:1px solid #CFE3D6">
    <div style="max-width:1120px;margin:0 auto;padding:10px clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px">
      <span style="font-size:14px;color:#4B6356">I need help with</span>
      <button type="button" aria-pressed="true" style="min-height:40px;padding:0 20px;box-sizing:border-box;border-radius:999px;font-size:15px;font-weight:600;border:2px solid ${accent};background:${accent};color:#FFFFFF">Interview</button>
      <button type="button" aria-pressed="false" onclick="App.setTrack('essay')" style="min-height:40px;padding:0 20px;box-sizing:border-box;border-radius:999px;font-size:15px;font-weight:600;border:2px solid #B9D3C2;background:#FFFFFF;color:#0E2A1E">Essay</button>
    </div>
  </div>

  <div style="background:${accent};color:#FFFFFF">
    <div style="max-width:1120px;margin:0 auto;padding:12px clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 16px;text-align:center;font-size:15px">
      <span style="font-weight:600">Take the readiness check: answer 5 questions and we'll tell you where to start.</span>
      <a href="#readiness" style="display:inline-flex;align-items:center;min-height:40px;padding:0 18px;box-sizing:border-box;border-radius:999px;background:#FFFFFF;color:${accent};font-weight:600;font-size:14px">Start</a>
    </div>
  </div>

  <div style="max-width:1120px;margin:0 auto;padding:20px clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px">
    <div style="font-family:'Bricolage Grotesque','Segoe UI',sans-serif;font-weight:700;font-size:24px;letter-spacing:-0.02em">Interviewest</div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px">
      <a href="#programs" style="display:inline-flex;align-items:center;min-height:44px;padding:0 12px;box-sizing:border-box;color:#0E2A1E;font-weight:500;font-size:15px">Programs</a>
      <a href="#pricing" style="display:inline-flex;align-items:center;min-height:44px;padding:0 12px;box-sizing:border-box;color:#0E2A1E;font-weight:500;font-size:15px">Pricing</a>
      <a href="#team" style="display:inline-flex;align-items:center;min-height:44px;padding:0 12px;box-sizing:border-box;color:#0E2A1E;font-weight:500;font-size:15px">Head leaders</a>
      <a href="#intake" style="display:inline-flex;align-items:center;min-height:44px;padding:0 12px;box-sizing:border-box;color:#0E2A1E;font-weight:500;font-size:15px">Student form</a>
      <a href="#faq" style="display:inline-flex;align-items:center;min-height:44px;padding:0 12px;box-sizing:border-box;color:#0E2A1E;font-weight:500;font-size:15px">FAQ</a>
      <a href="#contact" style="display:inline-flex;align-items:center;min-height:44px;padding:0 20px;box-sizing:border-box;border-radius:999px;background:#0E2A1E;color:#FFFFFF;font-weight:600;font-size:15px">Contact</a>
    </div>
  </div>

  <div style="max-width:1120px;margin:0 auto;padding:clamp(32px,6vw,72px) clamp(20px,5vw,48px) clamp(48px,7vw,88px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;gap:48px">
    <div style="flex:1 1 420px;display:flex;flex-direction:column;gap:24px">
      <div style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${accent}">BCA interview prep, run by BCA students</div>
      <h1 style="margin:0;font-weight:700;font-size:clamp(36px,6vw,62px);line-height:1.05;letter-spacing:-0.025em">Walk into your BCA interview feeling ready.</h1>
      <p style="margin:0;font-size:clamp(17px,2vw,20px);color:#4B6356;max-width:560px">Every student can get better with practice. We work one on one, at your pace, over Zoom. Start with a diagnostic and we'll work out what you need.</p>
      <p style="margin:0;font-size:15px;font-weight:600;color:${accent}">For Bergen County 8th graders applying to BCA.</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        <a href="${waDiag}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Book the diagnostic</a>
        <a href="#programs" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;border:1.5px solid #0E2A1E;color:#0E2A1E;font-weight:600;font-size:16px">See the programs</a>
      </div>
      <p style="margin:0;font-size:14px;color:#4B6356;max-width:520px">We're BCA students, but this is our own thing. We're not part of the school and we can't promise admission.</p>
    </div>
    <div style="flex:1 1 340px;background:#F6FBF8;border:2px solid ${accent};border-radius:24px;padding:32px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
      <div style="align-self:flex-start;padding:4px 12px;border-radius:999px;background:${accent};color:#FFFFFF;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase">Start here</div>
      <div style="font-weight:700;font-size:28px;line-height:1.15;letter-spacing:-0.01em">Mock interview diagnostic</div>
      <div style="display:flex;align-items:baseline;gap:10px">
        <span style="font-weight:700;font-size:52px;line-height:1">${money(CONFIG.priceDiagnostic)}</span>
        <span style="font-size:15px;color:#4B6356">one session</span>
      </div>
      <div style="color:#4B6356;font-size:16px">Do one mock interview with us so we can see where you are. Then we'll tell you what to fix first.</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${bullet(accent, 'A live mock interview with a coach')}
        ${bullet(accent, 'Scored on a simple rubric')}
        ${bullet(accent, 'Your top three things to work on')}
        ${bullet(accent, 'A one-page summary for you and your parents')}
      </div>
      <a href="${waDiag}" style="display:inline-flex;align-items:center;justify-content:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Book the diagnostic</a>
    </div>
  </div>

  <div id="readiness" style="background:#EAF5EE">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:flex-start;gap:40px 64px">
      <div style="flex:1 1 320px;max-width:440px;display:flex;flex-direction:column;gap:18px">
        <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Readiness check</h2>
        <p style="margin:0;font-size:17px;color:#4B6356">Not sure where to start? Answer five questions about your student. We'll read them and message you back with where we'd start.</p>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:flex-start;gap:12px;font-size:16px"><span style="font-weight:700;font-size:18px;color:${accent};min-width:22px">1</span><span>You answer five open-ended questions.</span></div>
          <div style="display:flex;align-items:flex-start;gap:12px;font-size:16px"><span style="font-weight:700;font-size:18px;color:${accent};min-width:22px">2</span><span>We read them and message you back with a recommendation.</span></div>
          <div style="display:flex;align-items:flex-start;gap:12px;font-size:16px"><span style="font-weight:700;font-size:18px;color:${accent};min-width:22px">3</span><span>If you like, book the diagnostic for a full mock interview and a scored rubric.</span></div>
        </div>
        <p style="margin:0;font-size:14px;color:#4B6356">Share only what you're comfortable with. This is a starting point for a conversation, not a prediction of admission.</p>
      </div>
      <div style="flex:2 1 440px;background:#FFFFFF;border:1px solid #CFE3D6;border-radius:24px;padding:clamp(24px,4vw,40px);box-sizing:border-box;display:flex;flex-direction:column;gap:18px">
        <div style="font-weight:700;font-size:24px">Five questions</div>
        <div style="display:flex;flex-wrap:wrap;gap:16px">
          <div style="flex:1 1 240px;display:flex;flex-direction:column;gap:6px">
            <label for="rparent" style="font-size:14px;font-weight:600">Your name (parent or guardian)</label>
            <input id="rparent" type="text" placeholder="Your name" value="${escapeHtml(state.rParent)}" onchange="App.setField('rParent', this.value)" style="width:100%;min-height:48px;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6E9580;border-radius:12px;background:#FFFFFF;color:#0E2A1E;font-size:16px">
          </div>
          <div style="flex:1 1 240px;display:flex;flex-direction:column;gap:6px">
            <label for="rchild" style="font-size:14px;font-weight:600">Student's first name</label>
            <input id="rchild" type="text" placeholder="Your child's first name" value="${escapeHtml(state.rChild)}" onchange="App.setField('rChild', this.value)" style="width:100%;min-height:48px;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6E9580;border-radius:12px;background:#FFFFFF;color:#0E2A1E;font-size:16px">
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label for="racad" style="font-size:15px;font-weight:600">1. What subjects are you strongest in, and what have you enjoyed learning most this year?</label>
          <textarea id="racad" rows="4" placeholder="A few sentences is plenty." onchange="App.setField('rAcad', this.value)" style="width:100%;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6E9580;border-radius:12px;background:#FFFFFF;color:#0E2A1E;font-size:16px;resize:vertical">${escapeHtml(state.rAcad)}</textarea>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label for="rpass" style="font-size:15px;font-weight:600">2. What are you most passionate about? What do you do in your free time?</label>
          <textarea id="rpass" rows="4" placeholder="A few sentences is plenty." onchange="App.setField('rPass', this.value)" style="width:100%;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6E9580;border-radius:12px;background:#FFFFFF;color:#0E2A1E;font-size:16px;resize:vertical">${escapeHtml(state.rPass)}</textarea>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label for="recs" style="font-size:15px;font-weight:600">3. What clubs, sports, projects, or competitions have you done? Include anything related to the academy you want.</label>
          <textarea id="recs" rows="4" placeholder="A few sentences is plenty." onchange="App.setField('rEcs', this.value)" style="width:100%;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6E9580;border-radius:12px;background:#FFFFFF;color:#0E2A1E;font-size:16px;resize:vertical">${escapeHtml(state.rEcs)}</textarea>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label for="rwhy" style="font-size:15px;font-weight:600">4. Which academy are you applying to, and what draws you to it?</label>
          <textarea id="rwhy" rows="4" placeholder="A few sentences is plenty." onchange="App.setField('rWhy', this.value)" style="width:100%;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6E9580;border-radius:12px;background:#FFFFFF;color:#0E2A1E;font-size:16px;resize:vertical">${escapeHtml(state.rWhy)}</textarea>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label for="rnerv" style="font-size:15px;font-weight:600">5. What worries you most about the interview, and what would you like to get better at?</label>
          <textarea id="rnerv" rows="4" placeholder="A few sentences is plenty." onchange="App.setField('rNerv', this.value)" style="width:100%;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6E9580;border-radius:12px;background:#FFFFFF;color:#0E2A1E;font-size:16px;resize:vertical">${escapeHtml(state.rNerv)}</textarea>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px">
          <a href="${waReadiness}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Send on WhatsApp</a>
        </div>
        <div style="font-size:14px;color:#4B6356">This opens WhatsApp with your answers filled in. Nothing is sent until you press send there.</div>
      </div>
    </div>
  </div>

  <div style="background:${accent};color:#FFFFFF">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(48px,7vw,80px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;gap:32px 64px">
      <div style="flex:1 1 360px;display:flex;flex-direction:column;gap:16px">
        <div style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#DDF0E4">Who we are</div>
        <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,42px);line-height:1.1;letter-spacing:-0.02em">We're BCA students. We did this already.</h2>
        <p style="margin:0;font-size:18px;color:#EAF5EE;max-width:520px">Everyone on the team went through the same admissions process, interview included.</p>
      </div>
      <div style="flex:1 1 360px;display:flex;flex-direction:column;gap:16px">
        ${bullet('#FFFFFF', 'We remember how nervous we were.', 17)}
        ${bullet('#FFFFFF', 'We know which questions caught us off guard.', 17)}
        ${bullet('#FFFFFF', "We'll tell you what worked for us, and be honest about what didn't.", 17)}
      </div>
    </div>
  </div>

  <div id="how" style="background:#EAF5EE">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-direction:column;gap:40px">
      <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">How it works</h2>
      <div style="display:flex;flex-wrap:wrap;gap:24px">
        <div style="flex:1 1 220px;display:flex;flex-direction:column;gap:8px"><div style="font-weight:700;font-size:32px;color:${accent}">01</div><div style="font-weight:600;font-size:18px">Do the diagnostic</div><div style="color:#4B6356;font-size:15px">One session, one mock interview. We see where you are and what to work on first.</div></div>
        <div style="flex:1 1 220px;display:flex;flex-direction:column;gap:8px"><div style="font-weight:700;font-size:32px;color:${accent}">02</div><div style="font-weight:600;font-size:18px">Pick a program</div><div style="color:#4B6356;font-size:15px">Once or twice a week, for 4 or 6 weeks. Every class is one hour and one on one.</div></div>
        <div style="flex:1 1 220px;display:flex;flex-direction:column;gap:8px"><div style="font-weight:700;font-size:32px;color:${accent}">03</div><div style="font-weight:600;font-size:18px">Mock interview every week</div><div style="color:#4B6356;font-size:15px">You practice the real thing, then get notes on what to fix.</div></div>
        <div style="flex:1 1 220px;display:flex;flex-direction:column;gap:8px"><div style="font-weight:700;font-size:32px;color:${accent}">04</div><div style="font-weight:600;font-size:18px">Fix it and go again</div><div style="color:#4B6356;font-size:15px">We work on your weak spots, and you try the same questions again.</div></div>
      </div>
    </div>
  </div>

  <div id="programs" style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-direction:column;gap:40px">
    <div style="display:flex;flex-direction:column;gap:12px;max-width:680px">
      <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Programs</h2>
      <p style="margin:0;font-size:17px;color:#4B6356">${iv.priceNote}</p>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:20px;align-items:stretch">${cardsHtml}</div>
  </div>

  <div id="extreme" style="background:#0E2A1E;color:#FFFFFF">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;gap:40px 64px">
      <div style="flex:1 1 400px;display:flex;flex-direction:column;gap:20px">
        <div style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#C5DACD">For students who want to over-prepare</div>
        <h2 style="margin:0;font-weight:800;font-size:clamp(40px,7vw,72px);line-height:0.98;letter-spacing:-0.03em">High Rigor</h2>
        <p style="margin:0;font-size:18px;color:#C5DACD;max-width:520px">Our hardest course. It's more rigorous than the other programs, with tougher questions and tougher follow-ups. It's a lot of prep, and it's meant to be.</p>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${bullet('#7EE0A8', '18 one-hour classes, one on one', 17)}
          ${bullet('#7EE0A8', 'A mock interview every week', 17)}
          ${bullet('#7EE0A8', 'Curveball questions and tougher follow-ups', 17)}
          ${bullet('#7EE0A8', 'Online or in person, your choice', 17)}
        </div>
      </div>
      <div style="flex:1 1 340px;max-width:460px;background:#FFFFFF;color:#0E2A1E;border-radius:24px;padding:clamp(24px,4vw,36px);box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
        <div style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#4B6356">High Rigor course</div>
        <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 12px">
          <span style="font-weight:700;font-size:52px;line-height:1;color:${accent}">${iv.hr.priceText}</span>
          ${iv.hr.hasDiscount ? `<span style="font-size:15px;color:#4B6356;text-decoration:line-through">${iv.hr.wasText}</span><span style="font-size:13px;font-weight:600;color:${accent}">${iv.hr.saveText}</span>` : ''}
        </div>
        <div style="color:#4B6356;font-size:15px">${iv.hr.blurb}</div>
        <div style="font-size:14px;font-weight:600">How do you want to do it?</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          ${modeBtn('online', 'Online', iv.modeOnline)}
          ${modeBtn('inperson', 'In person', iv.modeInPerson)}
        </div>
        <div style="font-size:14px;color:#4B6356">If you choose in person, we'll set up the place with you.</div>
        <a href="${iv.hr.bookHref}" style="display:inline-flex;align-items:center;justify-content:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Sign up for High Rigor</a>
      </div>
    </div>
  </div>

  <div id="mocks" style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-direction:column;gap:40px">
    <div style="display:flex;flex-direction:column;gap:12px;max-width:680px">
      <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Just want mock interviews?</h2>
      <p style="margin:0;font-size:17px;color:#4B6356">${iv.packNote}</p>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:20px">${packsHtml}</div>
    <div style="display:flex;flex-wrap:wrap;gap:20px">
      <div style="flex:1 1 240px;display:flex;flex-direction:column;gap:6px;padding-top:14px;border-top:2px solid #0E2A1E"><div style="font-weight:600;font-size:17px">Timed, like the real one</div><div style="color:#4B6356;font-size:15px">We use a timer and a formal start, so your first real interview isn't your first time.</div></div>
      <div style="flex:1 1 240px;display:flex;flex-direction:column;gap:6px;padding-top:14px;border-top:2px solid #0E2A1E"><div style="font-weight:600;font-size:17px">Follow-up questions</div><div style="color:#4B6356;font-size:15px">If you give a memorized answer, we'll keep asking why until you're actually thinking it through.</div></div>
      <div style="flex:1 1 240px;display:flex;flex-direction:column;gap:6px;padding-top:14px;border-top:2px solid #0E2A1E"><div style="font-weight:600;font-size:17px">Built for your academy</div><div style="color:#4B6356;font-size:15px">The questions change depending on which academy you're applying to.</div></div>
      <div style="flex:1 1 240px;display:flex;flex-direction:column;gap:6px;padding-top:14px;border-top:2px solid #0E2A1E"><div style="font-weight:600;font-size:17px">Honest notes</div><div style="color:#4B6356;font-size:15px">After every mock you get written notes, so you know exactly what to work on.</div></div>
    </div>
  </div>

  <div id="pricing" style="background:#EAF5EE">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-direction:column;gap:40px">
      <div style="display:flex;flex-direction:column;gap:12px;max-width:680px">
        <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Check your price</h2>
        <p style="margin:0;font-size:17px;color:#4B6356">Pick a program and see exactly what you're paying for.</p>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start">
        <div style="flex:1 1 300px;max-width:440px;display:flex;flex-direction:column">${coursePicker}</div>
        <div style="flex:2 1 360px;background:#FFFFFF;border:1px solid #CFE3D6;border-radius:24px;padding:clamp(24px,4vw,40px);box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
          <div style="font-weight:700;font-size:28px;line-height:1.15;letter-spacing:-0.01em">${sel.name}</div>
          <div style="color:#4B6356;font-size:16px">${sel.blurb}</div>
          <div style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#4B6356">What you pay</div>
          <div style="display:flex;flex-direction:column">
            ${selLines}
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:14px 0 4px"><span style="font-weight:600;font-size:18px">Total</span><span style="font-weight:700;font-size:40px;line-height:1;color:${accent}">${sel.priceText}</span></div>
          </div>
          <div style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#4B6356">What's included</div>
          <div style="display:flex;flex-direction:column;gap:10px">${selIncludes}</div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;padding-top:8px">
            <a href="${sel.bookHref}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Sign up</a>
            <a href="#contact" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;border:1.5px solid #0E2A1E;color:#0E2A1E;font-weight:600;font-size:16px">Ask a question first</a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="custom" style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;gap:40px 64px">
    <div style="flex:1 1 340px;display:flex;flex-direction:column;gap:16px">
      <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Want something different?</h2>
      <p style="margin:0;font-size:17px;color:#4B6356">Maybe you need more mock interviews, a shorter timeline, or a plan built around one academy. Tell us what you're after and we'll get back to you with a price.</p>
    </div>
    <div style="flex:1 1 400px;background:#F6FBF8;border:1px solid #CFE3D6;border-radius:24px;padding:clamp(24px,4vw,36px);box-sizing:border-box;display:flex;flex-direction:column;gap:18px">
      <div style="font-weight:700;font-size:24px">Request a special package</div>
      <div style="display:flex;flex-direction:column;gap:6px"><label for="cname" style="font-size:14px;font-weight:600">Your name</label><input id="cname" type="text" placeholder="Parent or guardian name" value="${escapeHtml(state.cName)}" onchange="App.setField('cName', this.value)" style="width:100%;min-height:48px;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6E9580;border-radius:12px;background:#FFFFFF;color:#0E2A1E;font-size:16px"></div>
      <div style="display:flex;flex-direction:column;gap:6px"><label for="cacademy" style="font-size:14px;font-weight:600">Academy you're applying to</label><input id="cacademy" type="text" placeholder="It's fine if you're not sure yet" value="${escapeHtml(state.cAcademy)}" onchange="App.setField('cAcademy', this.value)" style="width:100%;min-height:48px;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6E9580;border-radius:12px;background:#FFFFFF;color:#0E2A1E;font-size:16px"></div>
      <div style="display:flex;flex-direction:column;gap:6px"><label for="ctext" style="font-size:14px;font-weight:600">What kind of course do you want?</label><textarea id="ctext" rows="5" placeholder="For example: 10 mock interviews over 3 weeks, or extra practice on one type of question" onchange="App.setField('cText', this.value)" style="width:100%;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6E9580;border-radius:12px;background:#FFFFFF;color:#0E2A1E;font-size:16px;resize:vertical">${escapeHtml(state.cText)}</textarea></div>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        <a href="${wa(cMsg, derived.digits)}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Send on WhatsApp</a>
        <a href="${mailHref('Special package request', cMsg, derived.email)}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;border:1.5px solid #0E2A1E;color:#0E2A1E;font-weight:600;font-size:16px">Send by email</a>
      </div>
      <div style="font-size:14px;color:#4B6356">This opens WhatsApp or your email app with your request filled in. We'll reply with a price.</div>
    </div>
  </div>

  <div id="intake" style="background:#EAF5EE">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:flex-start;gap:40px 64px">
      <div style="flex:1 1 320px;max-width:440px;display:flex;flex-direction:column;gap:18px">
        <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Tell us about your student</h2>
        <p style="margin:0;font-size:17px;color:#4B6356">The more we know, the better we can shape the mock interviews. Fill this out and we'll use it to plan your child's sessions.</p>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${bullet(accent, 'We pick questions that fit their academy.', 16)}
          ${bullet(accent, 'We match the difficulty to their math and English level.', 16)}
          ${bullet(accent, 'We ask about activities they have actually done.', 16)}
        </div>
        <p style="margin:0;font-size:14px;color:#4B6356">Share only what you're comfortable with. You don't need to send grades, addresses, or anything private. We only use this to plan your child's sessions.</p>
      </div>
      <div style="flex:2 1 440px;background:#FFFFFF;border:1px solid #CFE3D6;border-radius:24px;padding:clamp(28px,4vw,48px);box-sizing:border-box;display:flex;flex-direction:column;align-items:flex-start;gap:18px">
        <div style="font-weight:700;font-size:26px">Student information</div>
        <div style="font-size:17px;color:#4B6356;max-width:520px">It's a short form. Tell us your student's academy, town, math and English level, and interests, and it goes straight to our team.</div>
        <a href="${derived.formUrl || '#intake'}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Open the student form</a>
        <div style="font-size:14px;color:#4B6356">The form opens in Google Forms.</div>
      </div>
    </div>
  </div>

  <div id="team" style="background:#FFFFFF">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-direction:column;gap:40px">
      <div style="display:flex;flex-direction:column;gap:12px;max-width:680px">
        <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Head leaders</h2>
        <p style="margin:0;font-size:17px;color:#4B6356">Our head leaders are all BCA students who went through the same process you're about to.</p>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:28px">${teamCard()}${teamCard()}${teamCard()}</div>
    </div>
  </div>

  <div id="faq" style="background:#EAF5EE">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-direction:column;gap:32px">
      <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Questions parents ask</h2>
      <div style="display:flex;flex-direction:column;max-width:760px">${faqHtml}</div>
    </div>
  </div>

  <div id="contact" style="background:#0E2A1E;color:#FFFFFF">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-direction:column;gap:40px">
      <div style="display:flex;flex-direction:column;gap:12px;max-width:680px">
        <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,44px);line-height:1.1;letter-spacing:-0.02em">Get in touch</h2>
        <p style="margin:0;font-size:18px;color:#C5DACD">Parents, reach us whichever way is easiest, or send a question below.</p>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:16px">
        <a href="${derived.bookUrl || '#contact'}" style="flex:1 1 260px;display:flex;flex-direction:column;gap:4px;padding:20px 24px;box-sizing:border-box;border-radius:16px;border:1px solid #2F6A4D;background:#17402D;color:#FFFFFF"><span style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#C5DACD">Book a time</span><span style="font-size:18px;font-weight:600">Pick a time on our calendar</span></a>
        <a href="${derived.digits ? 'https://wa.me/' + derived.digits : '#contact'}" style="flex:1 1 260px;display:flex;flex-direction:column;gap:4px;padding:20px 24px;box-sizing:border-box;border-radius:16px;border:1px solid #2F6A4D;background:#17402D;color:#FFFFFF"><span style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#C5DACD">WhatsApp</span><span style="font-size:18px;font-weight:600">${derived.digits ? derived.waPretty : '[YOUR NUMBER]'}</span></a>
        <a href="${derived.email ? 'mailto:' + derived.email : '#contact'}" style="flex:1 1 260px;display:flex;flex-direction:column;gap:4px;padding:20px 24px;box-sizing:border-box;border-radius:16px;border:1px solid #2F6A4D;background:#17402D;color:#FFFFFF"><span style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#C5DACD">Email</span><span style="font-size:18px;font-weight:600;overflow-wrap:anywhere">${derived.email || '[YOUR EMAIL]'}</span></a>
        <a href="${derived.ig ? 'https://instagram.com/' + derived.ig : '#contact'}" style="flex:1 1 260px;display:flex;flex-direction:column;gap:4px;padding:20px 24px;box-sizing:border-box;border-radius:16px;border:1px solid #2F6A4D;background:#17402D;color:#FFFFFF"><span style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#C5DACD">Instagram</span><span style="font-size:18px;font-weight:600;overflow-wrap:anywhere">${derived.ig ? '@' + derived.ig : '[YOUR INSTAGRAM]'}</span></a>
      </div>
      <div style="background:#FFFFFF;color:#0E2A1E;border-radius:24px;padding:clamp(24px,4vw,40px);box-sizing:border-box;display:flex;flex-direction:column;gap:20px;max-width:720px">
        <div style="font-weight:700;font-size:26px">Send us a question</div>
        <div style="color:#4B6356;font-size:15px">Type your question and pick how to send it. It opens WhatsApp or your email app with the message filled in.</div>
        <div style="display:flex;flex-direction:column;gap:6px"><label for="qname" style="font-size:14px;font-weight:600">Your name</label><input id="qname" type="text" placeholder="Parent or guardian name" value="${escapeHtml(state.qName)}" onchange="App.setField('qName', this.value)" style="width:100%;min-height:48px;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6E9580;border-radius:12px;background:#FFFFFF;color:#0E2A1E;font-size:16px"></div>
        <div style="display:flex;flex-direction:column;gap:6px"><label for="qtext" style="font-size:14px;font-weight:600">Your question</label><textarea id="qtext" rows="5" placeholder="Ask about programs, timing, pricing, or anything else" onchange="App.setField('qText', this.value)" style="width:100%;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6E9580;border-radius:12px;background:#FFFFFF;color:#0E2A1E;font-size:16px;resize:vertical">${escapeHtml(state.qText)}</textarea></div>
        <div style="display:flex;flex-wrap:wrap;gap:12px">
          <a href="${wa(qMsg, derived.digits)}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Send on WhatsApp</a>
          <a href="${mailHref('Question about Interviewest', qMsg, derived.email)}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;border:1.5px solid #0E2A1E;color:#0E2A1E;font-weight:600;font-size:16px">Send by email</a>
        </div>
      </div>
    </div>
  </div>

  <div style="max-width:1120px;margin:0 auto;padding:32px clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;font-size:14px;color:#4B6356">
    <div>Interviewest</div>
    <div>Run by BCA students. Not affiliated with Bergen County Academies.</div>
  </div>

</div>`;
}

/* ---- Essay track (blue) ------------------------------------------ */

function renderEssay(derived) {
  const accent = CONFIG.accentBlue;
  const es = makeTrack(esTrackDef(derived), derived, CONFIG.discountMid, CONFIG.discountHigh, state.eMode, state.eSelected);
  const waDiag = wa('Hi, I would like to book the essay consultation.', derived.digits);
  const waReadiness = wa(readinessMessage('er', 'Essay check for Interviewest', [
    'Strongest subjects and what they enjoy learning', 'Passions and free time', 'Clubs, projects, and competitions', 'Essay prompt', 'Where they are in the essay and worries',
  ]), derived.digits);

  const cardsHtml = es.cards.map((c) => `
    <div style="flex:1 1 320px;background:#F4F8FE;border:1px solid #C9D9EE;border-radius:20px;padding:28px;box-sizing:border-box;display:flex;flex-direction:column;gap:14px">
      ${c.hasTag ? `<div style="align-self:flex-start;padding:3px 10px;border-radius:999px;background:${accent};color:#FFFFFF;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">${c.tag}</div>` : ''}
      <div style="font-weight:600;font-size:20px">${c.name}</div>
      <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 12px">
        <span style="font-family:'Bricolage Grotesque','Segoe UI',sans-serif;font-weight:700;font-size:38px;line-height:1">${c.priceText}</span>
        ${c.hasDiscount ? `<span style="font-size:15px;color:#465A78;text-decoration:line-through">${c.wasText}</span><span style="font-size:13px;font-weight:600;color:${accent}">${c.saveText}</span>` : ''}
      </div>
      <div style="color:#465A78;font-size:15px">${c.blurb}</div>
      <div style="display:flex;flex-direction:column;gap:8px;flex-grow:1">
        ${c.includes.map((x) => bullet(accent, x.text, 14)).join('')}
      </div>
      <a href="${c.bookHref}" style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 24px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:15px">Sign up</a>
    </div>`).join('');

  const packsHtml = es.packs.map((k) => `
    <div style="flex:1 1 220px;background:#F4F8FE;border:1px solid #C9D9EE;border-radius:20px;padding:24px;box-sizing:border-box;display:flex;flex-direction:column;gap:10px">
      <div style="font-weight:600;font-size:18px">${k.label}</div>
      <div style="font-family:'Bricolage Grotesque','Segoe UI',sans-serif;font-weight:700;font-size:36px;line-height:1">${k.totalText}</div>
      <div style="font-size:14px;color:#465A78;flex-grow:1">${k.each}</div>
      <a href="${k.bookHref}" style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;box-sizing:border-box;border-radius:999px;border:1.5px solid #0B2545;color:#0B2545;font-weight:600;font-size:15px">Get this set</a>
    </div>`).join('');

  const coursePicker = es.courses.map((c) => `
    <button type="button" aria-pressed="${c.selected}" onclick="App.pick('es', ${c.idx})" style="width:100%;min-height:56px;padding:0 20px;box-sizing:border-box;border-radius:14px;border:2px solid ${c.selected ? '#0B2545' : '#B4C8E4'};background:${c.selected ? '#0B2545' : '#FFFFFF'};color:${c.selected ? '#FFFFFF' : '#0B2545'};font-family:inherit;font-size:16px;font-weight:600;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px">
      <span>${c.name}</span><span>${c.priceText}</span>
    </button>`).join('');

  const sel = es.sel;
  const selLines = sel.lines.map((ln) => `<div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #C9D9EE;font-size:16px"><span>${ln.label}</span><span style="font-weight:600">${ln.amount}</span></div>`).join('');
  const selIncludes = sel.includes.map((x) => bullet(accent, x.text, 15)).join('');

  const modeBtn = (key, label, active) => `<button type="button" aria-pressed="${active}" onclick="App.setMode('es','${key}')" style="flex:1 1 140px;min-height:48px;padding:0 16px;box-sizing:border-box;border-radius:12px;border:2px solid ${active ? '#0B2545' : '#B4C8E4'};background:${active ? '#0B2545' : '#FFFFFF'};color:${active ? '#FFFFFF' : '#0B2545'};font-family:inherit;font-size:15px;font-weight:600">${label}</button>`;

  const faq = [
    ['Where should we start?', 'With a consultation. It’s one session, and afterward we’ll tell you which program makes sense.'],
    ['How do I book a session?', 'Message us to sign up. We’ll send you our Zelle details on WhatsApp, and once we confirm your payment, you can pick a time on our calendar.'],
    ['Is it really one on one?', 'Yes. Every program is one on one, so your coach’s time is all yours.'],
    ['Do the programs include draft reviews?', 'Yes. Every program has a draft review each week, and the price already counts them.'],
    ['Can you promise my child will get in?', 'No, and nobody can. We can help your child write an essay they’re proud of.'],
    ['Are you part of BCA?', 'No. We’re BCA students who went through the same process, but this is our own thing and the school isn’t involved.'],
    ['Will you write the essay for my child?', 'No. We give ideas and feedback, and your child writes every word. Admissions essays should sound like the student.'],
    ['Where do sessions happen?', 'Over Zoom. The High Rigor course can also be done in person, and we’ll set up the place with you. Parents are welcome to sit in.'],
    ['How long is a class?', 'One hour.'],
  ];
  const faqHtml = faq.map((f, i) => `<div style="padding:20px 0;${i === faq.length - 1 ? 'border-bottom:1px solid #B4C8E4;' : ''}border-top:1px solid #B4C8E4;display:flex;flex-direction:column;gap:6px"><div style="font-weight:600;font-size:18px">${f[0]}</div><div style="color:#465A78;font-size:15px">${f[1]}</div></div>`).join('');

  const teamCard = () => `
    <div style="flex:1 1 260px;max-width:360px;display:flex;flex-direction:column;gap:12px">
      <div style="width:100%;aspect-ratio:4/5;box-sizing:border-box;border-radius:20px;background:#DCE8F7;border:2px dashed #6F8DB8;display:flex;align-items:center;justify-content:center;text-align:center;padding:16px;color:#465A78;font-size:14px">Photo goes here</div>
      <div style="font-family:'Bricolage Grotesque','Segoe UI',sans-serif;font-weight:700;font-size:24px;letter-spacing:-0.01em">[NAME]</div>
      <div style="font-size:14px;font-weight:600;color:${accent}">BCA student, [ACADEMY], class of [YEAR]</div>
      <div style="color:#465A78;font-size:15px">[Two or three sentences: what you’re into, what you wrote about in your essay, and one thing you wish you’d known.]</div>
    </div>`;

  const cMsg = 'Hi, this is ' + (state.cName.trim() || 'a parent') + '. I would like a special package for the essay. Academy: ' + (state.cAcademy.trim() || 'not sure yet') + '. What I am looking for: ' + (state.cText.trim() || '[tell us what you need]');
  const qMsg = 'Hi, this is ' + (state.qName.trim() || 'a parent') + '. My question: ' + (state.qText.trim() || '[type your question]');

  return `
<div style="width:100%;background:#FFFFFF;color:#0B2545;font-family:'Figtree',system-ui,sans-serif;line-height:1.55">

  <div style="background:#FFFFFF;border-bottom:1px solid #C9D9EE">
    <div style="max-width:1120px;margin:0 auto;padding:10px clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px">
      <span style="font-size:14px;color:#465A78">I need help with</span>
      <button type="button" aria-pressed="false" onclick="App.setTrack('interview')" style="min-height:40px;padding:0 20px;box-sizing:border-box;border-radius:999px;font-size:15px;font-weight:600;border:2px solid #B4C8E4;background:#FFFFFF;color:#0B2545">Interview</button>
      <button type="button" aria-pressed="true" style="min-height:40px;padding:0 20px;box-sizing:border-box;border-radius:999px;font-size:15px;font-weight:600;border:2px solid ${accent};background:${accent};color:#FFFFFF">Essay</button>
    </div>
  </div>

  <div style="background:${accent};color:#FFFFFF">
    <div style="max-width:1120px;margin:0 auto;padding:12px clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 16px;text-align:center;font-size:15px">
      <span style="font-weight:600">Take the essay check: answer 5 questions and we'll tell you where to start.</span>
      <a href="#readiness" style="display:inline-flex;align-items:center;min-height:40px;padding:0 18px;box-sizing:border-box;border-radius:999px;background:#FFFFFF;color:${accent};font-weight:600;font-size:14px">Start</a>
    </div>
  </div>

  <div style="max-width:1120px;margin:0 auto;padding:20px clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px">
    <div style="font-family:'Bricolage Grotesque','Segoe UI',sans-serif;font-weight:700;font-size:24px;letter-spacing:-0.02em">Interviewest</div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px">
      <a href="#programs" style="display:inline-flex;align-items:center;min-height:44px;padding:0 12px;box-sizing:border-box;color:#0B2545;font-weight:500;font-size:15px">Programs</a>
      <a href="#pricing" style="display:inline-flex;align-items:center;min-height:44px;padding:0 12px;box-sizing:border-box;color:#0B2545;font-weight:500;font-size:15px">Pricing</a>
      <a href="#team" style="display:inline-flex;align-items:center;min-height:44px;padding:0 12px;box-sizing:border-box;color:#0B2545;font-weight:500;font-size:15px">Head leaders</a>
      <a href="#intake" style="display:inline-flex;align-items:center;min-height:44px;padding:0 12px;box-sizing:border-box;color:#0B2545;font-weight:500;font-size:15px">Student form</a>
      <a href="#faq" style="display:inline-flex;align-items:center;min-height:44px;padding:0 12px;box-sizing:border-box;color:#0B2545;font-weight:500;font-size:15px">FAQ</a>
      <a href="#contact" style="display:inline-flex;align-items:center;min-height:44px;padding:0 20px;box-sizing:border-box;border-radius:999px;background:#0B2545;color:#FFFFFF;font-weight:600;font-size:15px">Contact</a>
    </div>
  </div>

  <div style="max-width:1120px;margin:0 auto;padding:clamp(32px,6vw,72px) clamp(20px,5vw,48px) clamp(48px,7vw,88px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;gap:48px">
    <div style="flex:1 1 420px;display:flex;flex-direction:column;gap:24px">
      <div style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${accent}">BCA application essay help, from BCA students</div>
      <h1 style="margin:0;font-weight:700;font-size:clamp(36px,6vw,62px);line-height:1.05;letter-spacing:-0.025em">Write a BCA essay that sounds like you.</h1>
      <p style="margin:0;font-size:clamp(17px,2vw,20px);color:#465A78;max-width:560px">Every student has something worth writing about. We work one on one, at your pace, over Zoom. Start with a consultation and we'll work out what you need.</p>
      <p style="margin:0;font-size:15px;font-weight:600;color:${accent}">For Bergen County 8th graders applying to BCA.</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        <a href="${waDiag}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Book a consultation</a>
        <a href="#programs" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;border:1.5px solid #0B2545;color:#0B2545;font-weight:600;font-size:16px">See the programs</a>
      </div>
      <p style="margin:0;font-size:14px;color:#465A78;max-width:520px">We're BCA students, but this is our own thing. We're not part of the school and we can't promise admission. We give feedback and ideas, but the essay is always your own writing.</p>
    </div>
    <div style="flex:1 1 340px;background:#F4F8FE;border:2px solid ${accent};border-radius:24px;padding:32px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
      <div style="align-self:flex-start;padding:4px 12px;border-radius:999px;background:${accent};color:#FFFFFF;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase">Start here</div>
      <div style="font-weight:700;font-size:28px;line-height:1.15;letter-spacing:-0.01em">Essay consultation</div>
      <div style="display:flex;align-items:baseline;gap:10px">
        <span style="font-weight:700;font-size:52px;line-height:1">${money(CONFIG.priceEConsult)}</span>
        <span style="font-size:15px;color:#465A78">one session</span>
      </div>
      <div style="color:#465A78;font-size:16px">Share your prompt or a draft, and we'll look at where you are. Then we'll tell you what to work on first.</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${bullet(accent, 'A one-on-one session with a coach')}
        ${bullet(accent, 'Feedback on your ideas, structure, and voice')}
        ${bullet(accent, 'Your top three things to work on')}
        ${bullet(accent, 'A one-page summary for you and your parents')}
      </div>
      <a href="${waDiag}" style="display:inline-flex;align-items:center;justify-content:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Book a consultation</a>
    </div>
  </div>

  <div id="readiness" style="background:#E8F0FB">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:flex-start;gap:40px 64px">
      <div style="flex:1 1 320px;max-width:440px;display:flex;flex-direction:column;gap:18px">
        <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Essay check</h2>
        <p style="margin:0;font-size:17px;color:#465A78">Not sure where to start? Answer five questions about your student and their essay. We'll read them and message you back with where we'd start.</p>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:flex-start;gap:12px;font-size:16px"><span style="font-weight:700;font-size:18px;color:${accent};min-width:22px">1</span><span>You answer five open-ended questions.</span></div>
          <div style="display:flex;align-items:flex-start;gap:12px;font-size:16px"><span style="font-weight:700;font-size:18px;color:${accent};min-width:22px">2</span><span>We read them and message you back with a recommendation.</span></div>
          <div style="display:flex;align-items:flex-start;gap:12px;font-size:16px"><span style="font-weight:700;font-size:18px;color:${accent};min-width:22px">3</span><span>If you like, book a consultation for a closer look at your prompt or draft.</span></div>
        </div>
        <p style="margin:0;font-size:14px;color:#465A78">Share only what you're comfortable with. This is a starting point for a conversation, not a prediction of admission.</p>
      </div>
      <div style="flex:2 1 440px;background:#FFFFFF;border:1px solid #C9D9EE;border-radius:24px;padding:clamp(24px,4vw,40px);box-sizing:border-box;display:flex;flex-direction:column;gap:18px">
        <div style="font-weight:700;font-size:24px">Five questions</div>
        <div style="display:flex;flex-wrap:wrap;gap:16px">
          <div style="flex:1 1 240px;display:flex;flex-direction:column;gap:6px"><label for="erparent" style="font-size:14px;font-weight:600">Your name (parent or guardian)</label><input id="erparent" type="text" placeholder="Your name" value="${escapeHtml(state.erParent)}" onchange="App.setField('erParent', this.value)" style="width:100%;min-height:48px;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6F8DB8;border-radius:12px;background:#FFFFFF;color:#0B2545;font-size:16px"></div>
          <div style="flex:1 1 240px;display:flex;flex-direction:column;gap:6px"><label for="erchild" style="font-size:14px;font-weight:600">Student's first name</label><input id="erchild" type="text" placeholder="Your child's first name" value="${escapeHtml(state.erChild)}" onchange="App.setField('erChild', this.value)" style="width:100%;min-height:48px;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6F8DB8;border-radius:12px;background:#FFFFFF;color:#0B2545;font-size:16px"></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px"><label for="eracad" style="font-size:15px;font-weight:600">1. What are you strongest at in school, and what do you enjoy learning most?</label><textarea id="eracad" rows="4" placeholder="A few sentences is plenty." onchange="App.setField('erAcad', this.value)" style="width:100%;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6F8DB8;border-radius:12px;background:#FFFFFF;color:#0B2545;font-size:16px;resize:vertical">${escapeHtml(state.erAcad)}</textarea></div>
        <div style="display:flex;flex-direction:column;gap:6px"><label for="erpass" style="font-size:15px;font-weight:600">2. What are you most passionate about? What do you do in your free time?</label><textarea id="erpass" rows="4" placeholder="A few sentences is plenty." onchange="App.setField('erPass', this.value)" style="width:100%;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6F8DB8;border-radius:12px;background:#FFFFFF;color:#0B2545;font-size:16px;resize:vertical">${escapeHtml(state.erPass)}</textarea></div>
        <div style="display:flex;flex-direction:column;gap:6px"><label for="erecs" style="font-size:15px;font-weight:600">3. What clubs, sports, projects, or competitions have you done? Include anything related to the academy you want.</label><textarea id="erecs" rows="4" placeholder="A few sentences is plenty." onchange="App.setField('erEcs', this.value)" style="width:100%;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6F8DB8;border-radius:12px;background:#FFFFFF;color:#0B2545;font-size:16px;resize:vertical">${escapeHtml(state.erEcs)}</textarea></div>
        <div style="display:flex;flex-direction:column;gap:6px"><label for="erwhy" style="font-size:15px;font-weight:600">4. What is the essay prompt, or what do you think it is asking?</label><textarea id="erwhy" rows="4" placeholder="A few sentences is plenty." onchange="App.setField('erWhy', this.value)" style="width:100%;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6F8DB8;border-radius:12px;background:#FFFFFF;color:#0B2545;font-size:16px;resize:vertical">${escapeHtml(state.erWhy)}</textarea></div>
        <div style="display:flex;flex-direction:column;gap:6px"><label for="ernerv" style="font-size:15px;font-weight:600">5. Where are you in the essay (no ideas yet, an outline, a draft)? What worries you about it?</label><textarea id="ernerv" rows="4" placeholder="A few sentences is plenty." onchange="App.setField('erNerv', this.value)" style="width:100%;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6F8DB8;border-radius:12px;background:#FFFFFF;color:#0B2545;font-size:16px;resize:vertical">${escapeHtml(state.erNerv)}</textarea></div>
        <div style="display:flex;flex-wrap:wrap;gap:12px"><a href="${waReadiness}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Send on WhatsApp</a></div>
        <div style="font-size:14px;color:#465A78">This opens WhatsApp with your answers filled in. Nothing is sent until you press send there.</div>
      </div>
    </div>
  </div>

  <div style="background:${accent};color:#FFFFFF">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(48px,7vw,80px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;gap:32px 64px">
      <div style="flex:1 1 360px;display:flex;flex-direction:column;gap:16px">
        <div style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#DCE8F7">Who we are</div>
        <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,42px);line-height:1.1;letter-spacing:-0.02em">We're BCA students. We wrote these essays too.</h2>
        <p style="margin:0;font-size:18px;color:#E8F0FB;max-width:520px">Everyone on the team went through the same application process, essay included.</p>
      </div>
      <div style="flex:1 1 360px;display:flex;flex-direction:column;gap:16px">
        ${bullet('#FFFFFF', 'We remember staring at a blank page.', 17)}
        ${bullet('#FFFFFF', 'We know what it is like to write about yourself.', 17)}
        ${bullet('#FFFFFF', "We'll tell you what worked for us, and be honest about what didn't.", 17)}
      </div>
    </div>
  </div>

  <div id="how" style="background:#E8F0FB">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-direction:column;gap:40px">
      <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">How it works</h2>
      <div style="display:flex;flex-wrap:wrap;gap:24px">
        <div style="flex:1 1 220px;display:flex;flex-direction:column;gap:8px"><div style="font-weight:700;font-size:32px;color:${accent}">01</div><div style="font-weight:600;font-size:18px">Book a consultation</div><div style="color:#465A78;font-size:15px">One session. We look at your prompt or draft and what to work on first.</div></div>
        <div style="flex:1 1 220px;display:flex;flex-direction:column;gap:8px"><div style="font-weight:700;font-size:32px;color:${accent}">02</div><div style="font-weight:600;font-size:18px">Pick a program</div><div style="color:#465A78;font-size:15px">Once or twice a week, for a few weeks. Every class is one hour and one on one.</div></div>
        <div style="flex:1 1 220px;display:flex;flex-direction:column;gap:8px"><div style="font-weight:700;font-size:32px;color:${accent}">03</div><div style="font-weight:600;font-size:18px">A draft review every week</div><div style="color:#465A78;font-size:15px">You send your latest draft and get written notes on what to fix.</div></div>
        <div style="flex:1 1 220px;display:flex;flex-direction:column;gap:8px"><div style="font-weight:700;font-size:32px;color:${accent}">04</div><div style="font-weight:600;font-size:18px">Revise and repeat</div><div style="color:#465A78;font-size:15px">We work on the weak parts with you, and you write another draft.</div></div>
      </div>
    </div>
  </div>

  <div id="programs" style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-direction:column;gap:40px">
    <div style="display:flex;flex-direction:column;gap:12px;max-width:680px">
      <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Programs</h2>
      <p style="margin:0;font-size:17px;color:#465A78">${es.priceNote}</p>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:20px;align-items:stretch">${cardsHtml}</div>
  </div>

  <div id="extreme" style="background:#0B2545;color:#FFFFFF">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;gap:40px 64px">
      <div style="flex:1 1 400px;display:flex;flex-direction:column;gap:20px">
        <div style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#C3D3EA">For students who want to polish every word</div>
        <h2 style="margin:0;font-weight:800;font-size:clamp(40px,7vw,72px);line-height:0.98;letter-spacing:-0.03em">High Rigor</h2>
        <p style="margin:0;font-size:18px;color:#C3D3EA;max-width:520px">Our most in-depth essay course. It's more rigorous than the other programs, with several rounds of revision from first idea to final polish.</p>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${bullet('#8DBBFF', '10 one-hour classes, one on one', 17)}
          ${bullet('#8DBBFF', 'A draft review every week', 17)}
          ${bullet('#8DBBFF', 'Brainstorming, outlining, and several rounds of revision', 17)}
          ${bullet('#8DBBFF', 'Online or in person, your choice', 17)}
        </div>
      </div>
      <div style="flex:1 1 340px;max-width:460px;background:#FFFFFF;color:#0B2545;border-radius:24px;padding:clamp(24px,4vw,36px);box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
        <div style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#465A78">High Rigor course</div>
        <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 12px">
          <span style="font-weight:700;font-size:52px;line-height:1;color:${accent}">${es.hr.priceText}</span>
          ${es.hr.hasDiscount ? `<span style="font-size:15px;color:#465A78;text-decoration:line-through">${es.hr.wasText}</span><span style="font-size:13px;font-weight:600;color:${accent}">${es.hr.saveText}</span>` : ''}
        </div>
        <div style="color:#465A78;font-size:15px">${es.hr.blurb}</div>
        <div style="font-size:14px;font-weight:600">How do you want to do it?</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          ${modeBtn('online', 'Online', es.modeOnline)}
          ${modeBtn('inperson', 'In person', es.modeInPerson)}
        </div>
        <div style="font-size:14px;color:#465A78">If you choose in person, we'll set up the place with you.</div>
        <a href="${es.hr.bookHref}" style="display:inline-flex;align-items:center;justify-content:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Sign up for High Rigor</a>
      </div>
    </div>
  </div>

  <div id="mocks" style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-direction:column;gap:40px">
    <div style="display:flex;flex-direction:column;gap:12px;max-width:680px">
      <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Just want draft reviews?</h2>
      <p style="margin:0;font-size:17px;color:#465A78">${es.packNote}</p>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:20px">${packsHtml}</div>
    <div style="display:flex;flex-wrap:wrap;gap:20px">
      <div style="flex:1 1 240px;display:flex;flex-direction:column;gap:6px;padding-top:14px;border-top:2px solid #0B2545"><div style="font-weight:600;font-size:17px">Fresh eyes on your draft</div><div style="color:#465A78;font-size:15px">Send us your draft and we read it closely, so you're not guessing what works.</div></div>
      <div style="flex:1 1 240px;display:flex;flex-direction:column;gap:6px;padding-top:14px;border-top:2px solid #0B2545"><div style="font-weight:600;font-size:17px">Questions, not rewrites</div><div style="color:#465A78;font-size:15px">We ask questions and give ideas. You do the writing.</div></div>
      <div style="flex:1 1 240px;display:flex;flex-direction:column;gap:6px;padding-top:14px;border-top:2px solid #0B2545"><div style="font-weight:600;font-size:17px">Your voice, not ours</div><div style="color:#465A78;font-size:15px">We help your essay sound like you, not like everyone else.</div></div>
      <div style="flex:1 1 240px;display:flex;flex-direction:column;gap:6px;padding-top:14px;border-top:2px solid #0B2545"><div style="font-weight:600;font-size:17px">Honest notes</div><div style="color:#465A78;font-size:15px">Every review comes with written notes, so you know exactly what to fix.</div></div>
    </div>
  </div>

  <div id="pricing" style="background:#E8F0FB">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-direction:column;gap:40px">
      <div style="display:flex;flex-direction:column;gap:12px;max-width:680px">
        <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Check your price</h2>
        <p style="margin:0;font-size:17px;color:#465A78">Pick a program and see exactly what you're paying for.</p>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start">
        <div style="flex:1 1 300px;max-width:440px;display:flex;flex-direction:column">${coursePicker}</div>
        <div style="flex:2 1 360px;background:#FFFFFF;border:1px solid #C9D9EE;border-radius:24px;padding:clamp(24px,4vw,40px);box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
          <div style="font-weight:700;font-size:28px;line-height:1.15;letter-spacing:-0.01em">${sel.name}</div>
          <div style="color:#465A78;font-size:16px">${sel.blurb}</div>
          <div style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#465A78">What you pay</div>
          <div style="display:flex;flex-direction:column">
            ${selLines}
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:14px 0 4px"><span style="font-weight:600;font-size:18px">Total</span><span style="font-weight:700;font-size:40px;line-height:1;color:${accent}">${sel.priceText}</span></div>
          </div>
          <div style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#465A78">What's included</div>
          <div style="display:flex;flex-direction:column;gap:10px">${selIncludes}</div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;padding-top:8px">
            <a href="${sel.bookHref}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Sign up</a>
            <a href="#contact" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;border:1.5px solid #0B2545;color:#0B2545;font-weight:600;font-size:16px">Ask a question first</a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="custom" style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;gap:40px 64px">
    <div style="flex:1 1 340px;display:flex;flex-direction:column;gap:16px">
      <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Want something different?</h2>
      <p style="margin:0;font-size:17px;color:#465A78">Maybe you need help with more than one essay, a shorter timeline, or feedback on a specific prompt. Tell us what you're after and we'll get back to you with a price.</p>
    </div>
    <div style="flex:1 1 400px;background:#F4F8FE;border:1px solid #C9D9EE;border-radius:24px;padding:clamp(24px,4vw,36px);box-sizing:border-box;display:flex;flex-direction:column;gap:18px">
      <div style="font-weight:700;font-size:24px">Request a special package</div>
      <div style="display:flex;flex-direction:column;gap:6px"><label for="ecname" style="font-size:14px;font-weight:600">Your name</label><input id="ecname" type="text" placeholder="Parent or guardian name" value="${escapeHtml(state.cName)}" onchange="App.setField('cName', this.value)" style="width:100%;min-height:48px;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6F8DB8;border-radius:12px;background:#FFFFFF;color:#0B2545;font-size:16px"></div>
      <div style="display:flex;flex-direction:column;gap:6px"><label for="ecacademy" style="font-size:14px;font-weight:600">Academy you're applying to</label><input id="ecacademy" type="text" placeholder="It's fine if you're not sure yet" value="${escapeHtml(state.cAcademy)}" onchange="App.setField('cAcademy', this.value)" style="width:100%;min-height:48px;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6F8DB8;border-radius:12px;background:#FFFFFF;color:#0B2545;font-size:16px"></div>
      <div style="display:flex;flex-direction:column;gap:6px"><label for="ectext" style="font-size:14px;font-weight:600">What kind of course do you want?</label><textarea id="ectext" rows="5" placeholder="For example: help brainstorming, or three rounds of feedback on one draft" onchange="App.setField('cText', this.value)" style="width:100%;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6F8DB8;border-radius:12px;background:#FFFFFF;color:#0B2545;font-size:16px;resize:vertical">${escapeHtml(state.cText)}</textarea></div>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        <a href="${wa(cMsg, derived.digits)}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Send on WhatsApp</a>
        <a href="${mailHref('Special package request (essay)', cMsg, derived.email)}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;border:1.5px solid #0B2545;color:#0B2545;font-weight:600;font-size:16px">Send by email</a>
      </div>
      <div style="font-size:14px;color:#465A78">This opens WhatsApp or your email app with your request filled in. We'll reply with a price.</div>
    </div>
  </div>

  <div id="intake" style="background:#E8F0FB">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:flex-start;gap:40px 64px">
      <div style="flex:1 1 320px;max-width:440px;display:flex;flex-direction:column;gap:18px">
        <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Tell us about your student</h2>
        <p style="margin:0;font-size:17px;color:#465A78">The more we know, the better we can shape the feedback. Fill this out and we'll use it to plan your child's sessions.</p>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${bullet(accent, 'We tailor our feedback to their academy.', 16)}
          ${bullet(accent, 'We match our guidance to their writing level.', 16)}
          ${bullet(accent, 'We ask about the activities they can write about.', 16)}
        </div>
        <p style="margin:0;font-size:14px;color:#465A78">Share only what you're comfortable with. You don't need to send grades, addresses, or anything private. We only use this to plan your child's sessions.</p>
      </div>
      <div style="flex:2 1 440px;background:#FFFFFF;border:1px solid #C9D9EE;border-radius:24px;padding:clamp(28px,4vw,48px);box-sizing:border-box;display:flex;flex-direction:column;align-items:flex-start;gap:18px">
        <div style="font-weight:700;font-size:26px">Student information</div>
        <div style="font-size:17px;color:#465A78;max-width:520px">It's a short form. Tell us your student's academy, town, math and English level, and interests, and it goes straight to our team.</div>
        <a href="${derived.formUrl || '#intake'}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Open the student form</a>
        <div style="font-size:14px;color:#465A78">The form opens in Google Forms.</div>
      </div>
    </div>
  </div>

  <div id="team" style="background:#FFFFFF">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-direction:column;gap:40px">
      <div style="display:flex;flex-direction:column;gap:12px;max-width:680px">
        <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Head leaders</h2>
        <p style="margin:0;font-size:17px;color:#465A78">Our head leaders are all BCA students who went through the same process you're about to.</p>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:28px">${teamCard()}${teamCard()}${teamCard()}</div>
    </div>
  </div>

  <div id="faq" style="background:#E8F0FB">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-direction:column;gap:32px">
      <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-0.02em">Questions parents ask</h2>
      <div style="display:flex;flex-direction:column;max-width:760px">${faqHtml}</div>
    </div>
  </div>

  <div id="contact" style="background:#0B2545;color:#FFFFFF">
    <div style="max-width:1120px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-direction:column;gap:40px">
      <div style="display:flex;flex-direction:column;gap:12px;max-width:680px">
        <h2 style="margin:0;font-weight:700;font-size:clamp(28px,4vw,44px);line-height:1.1;letter-spacing:-0.02em">Get in touch</h2>
        <p style="margin:0;font-size:18px;color:#C3D3EA">Parents, reach us whichever way is easiest, or send a question below.</p>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:16px">
        <a href="${derived.bookUrl || '#contact'}" style="flex:1 1 260px;display:flex;flex-direction:column;gap:4px;padding:20px 24px;box-sizing:border-box;border-radius:16px;border:1px solid #2F5A94;background:#14345F;color:#FFFFFF"><span style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#C3D3EA">Book a time</span><span style="font-size:18px;font-weight:600">Pick a time on our calendar</span></a>
        <a href="${derived.digits ? 'https://wa.me/' + derived.digits : '#contact'}" style="flex:1 1 260px;display:flex;flex-direction:column;gap:4px;padding:20px 24px;box-sizing:border-box;border-radius:16px;border:1px solid #2F5A94;background:#14345F;color:#FFFFFF"><span style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#C3D3EA">WhatsApp</span><span style="font-size:18px;font-weight:600">${derived.digits ? derived.waPretty : '[YOUR NUMBER]'}</span></a>
        <a href="${derived.email ? 'mailto:' + derived.email : '#contact'}" style="flex:1 1 260px;display:flex;flex-direction:column;gap:4px;padding:20px 24px;box-sizing:border-box;border-radius:16px;border:1px solid #2F5A94;background:#14345F;color:#FFFFFF"><span style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#C3D3EA">Email</span><span style="font-size:18px;font-weight:600;overflow-wrap:anywhere">${derived.email || '[YOUR EMAIL]'}</span></a>
        <a href="${derived.ig ? 'https://instagram.com/' + derived.ig : '#contact'}" style="flex:1 1 260px;display:flex;flex-direction:column;gap:4px;padding:20px 24px;box-sizing:border-box;border-radius:16px;border:1px solid #2F5A94;background:#14345F;color:#FFFFFF"><span style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#C3D3EA">Instagram</span><span style="font-size:18px;font-weight:600;overflow-wrap:anywhere">${derived.ig ? '@' + derived.ig : '[YOUR INSTAGRAM]'}</span></a>
      </div>
      <div style="background:#FFFFFF;color:#0B2545;border-radius:24px;padding:clamp(24px,4vw,40px);box-sizing:border-box;display:flex;flex-direction:column;gap:20px;max-width:720px">
        <div style="font-weight:700;font-size:26px">Send us a question</div>
        <div style="color:#465A78;font-size:15px">Type your question and pick how to send it. It opens WhatsApp or your email app with the message filled in.</div>
        <div style="display:flex;flex-direction:column;gap:6px"><label for="eqname" style="font-size:14px;font-weight:600">Your name</label><input id="eqname" type="text" placeholder="Parent or guardian name" value="${escapeHtml(state.qName)}" onchange="App.setField('qName', this.value)" style="width:100%;min-height:48px;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6F8DB8;border-radius:12px;background:#FFFFFF;color:#0B2545;font-size:16px"></div>
        <div style="display:flex;flex-direction:column;gap:6px"><label for="eqtext" style="font-size:14px;font-weight:600">Your question</label><textarea id="eqtext" rows="5" placeholder="Ask about programs, timing, pricing, or anything else" onchange="App.setField('qText', this.value)" style="width:100%;padding:12px 14px;box-sizing:border-box;border:1.5px solid #6F8DB8;border-radius:12px;background:#FFFFFF;color:#0B2545;font-size:16px;resize:vertical">${escapeHtml(state.qText)}</textarea></div>
        <div style="display:flex;flex-wrap:wrap;gap:12px">
          <a href="${wa(qMsg, derived.digits)}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;background:${accent};color:#FFFFFF;font-weight:600;font-size:16px">Send on WhatsApp</a>
          <a href="${mailHref('Question about Interviewest', qMsg, derived.email)}" style="display:inline-flex;align-items:center;min-height:52px;padding:0 28px;box-sizing:border-box;border-radius:999px;border:1.5px solid #0B2545;color:#0B2545;font-weight:600;font-size:16px">Send by email</a>
        </div>
      </div>
    </div>
  </div>

  <div style="max-width:1120px;margin:0 auto;padding:32px clamp(20px,5vw,48px);box-sizing:border-box;display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;font-size:14px;color:#465A78">
    <div>Interviewest</div>
    <div>Run by BCA students. Not affiliated with Bergen County Academies.</div>
  </div>

</div>`;
}

/* ---------------------------------------------------------------- */
/* App controller — exposed globally for inline event handlers        */
/* ---------------------------------------------------------------- */

const App = {
  setTrack(track) {
    state.track = track;
    render();
    window.scrollTo(0, 0);
  },
  setMode(track, mode) {
    if (track === 'iv') state.mode = mode; else state.eMode = mode;
    render();
  },
  pick(track, idx) {
    if (track === 'iv') state.selected = idx; else state.eSelected = idx;
    render();
    const el = document.getElementById('pricing');
    if (el) el.scrollIntoView({ block: 'nearest' });
  },
  setField(key, value) {
    state[key] = value;
    // Re-render only when necessary (these fields feed WhatsApp/email
    // links shown elsewhere on the page), but avoid stealing focus
    // from the field the user just left by re-rendering after blur
    // (onchange already only fires on blur/change, so this is safe).
    render();
  },
};
window.App = App;

render();
