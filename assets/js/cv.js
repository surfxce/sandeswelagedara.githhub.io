/* ============================================================
   CV DATA — this is the only part you should need to touch.
   ============================================================

   Each entry becomes a flip card on the timeline. Click it and the
   card expands into a centred panel with the long-form write-up,
   then a "Moments" grid you can scroll down to.

   FIELDS
     id       unique slug, used for the deep link (cv/#uqisc)
     title    the role / qualification
     org      club, employer or institution
     date     free text, shown above the card
     blurb    one line, shown on the BACK of the flip card
     detail   array of paragraphs shown in the expanded panel
     tags     small chips under the description
     tint     CSS background for the cover + placeholder art
     courses  optional [{term, items:[...]}] — renders as a course list
     moments  optional key events. Each flips to reveal its write-up.

   ADDING PHOTOS
     Drop files in assets/cv/ and list them in a moment's `photos`.
     Paths are relative to this page, so they start with "../".
     Missing files fall back to the gradient — nothing looks broken
     while you're still digging them out.
*/

const CV_TINTS = {
  clay:  'linear-gradient(150deg, var(--clay), var(--wheat))',
  bark:  'linear-gradient(150deg, var(--bark), var(--clay))',
  moss:  'linear-gradient(150deg, var(--moss), var(--fern))',
  fern:  'linear-gradient(150deg, var(--fern), var(--wheat))',
  wheat: 'linear-gradient(150deg, var(--wheat), var(--bark))'
};

const CV_DATA = [
  /* ---------------- EXPERIENCE ---------------- */
  {
    group:'experience', id:'uqisc', title:'Operations Executive',
    org:'Indian Students Club (UQISC)', date:'2026 —', tint:CV_TINTS.clay,
    blurb:'Running operations for one of UQ’s largest cultural clubs.',
    tags:['Operations','Event planning','Teamwork'],
    detail:[
      'Operations executive on the UQISC committee, working across the club’s event calendar.',
      'EDIT ME — write a paragraph here about what the operations role actually involves day to day: what you’re responsible for, how big the committee is, what a typical event takes to pull off.'
    ],
    moments:[
      { title:'EDIT ME — name a key event', desc:'What it was, what you ran, how many people came, what you’d do differently.', photos:[] },
      { title:'EDIT ME — another event', desc:'Same again. Delete this block if you only want one.', photos:[] }
    ]
  },
  {
    group:'experience', id:'uqlit', title:'Socials Executive',
    org:'Ladies in Technology (UQLIT)', date:'2026 —', tint:CV_TINTS.bark,
    blurb:'Socials and content for UQ’s women-in-tech society.',
    tags:['Social media','Content','Community'],
    detail:[
      'Socials executive for UQLIT, handling the club’s social presence and event promotion.',
      'EDIT ME — what does running socials for LIT involve? Which platforms, what kind of content, how you plan a campaign around an event, anything you’re proud of reach-wise.'
    ],
    moments:[
      { title:'EDIT ME — name a key event', desc:'The event, your role in it, how the socials campaign went.', photos:[] },
      { title:'EDIT ME — another event', desc:'Same again.', photos:[] }
    ]
  },
  {
    group:'experience', id:'uqnc', title:'General Executive',
    org:'Nepalese Club (UQNC)', date:'2025', tint:CV_TINTS.moss,
    blurb:'General committee member across the club’s 2025 calendar.',
    tags:['Committee','Events','Cultural appreciation'],
    detail:[
      'General executive on the UQNC committee through 2025, supporting the club’s events across the year.',
      'EDIT ME — a couple of lines on what you got out of it.'
    ],
    moments:[]
  },
  {
    group:'experience', id:'alchemy', title:'Tutor',
    org:'Alchemy Tuition', date:'2025 — 2026', tint:CV_TINTS.fern,
    blurb:'One-on-one tutoring in the sciences.',
    tags:['Tutoring','Communication'],
    detail:[
      'Private tutor with Alchemy Tuition, working one-on-one with secondary students.',
      'EDIT ME — which subjects and year levels, how you adapt an explanation when the first one doesn’t land.'
    ],
    moments:[]
  },
  {
    group:'experience', id:'strive', title:'Tutor',
    org:'Strive Tuition', date:'2024 — 2025', tint:CV_TINTS.wheat,
    blurb:'Tutoring secondary students across science subjects.',
    tags:['Tutoring','Communication'],
    detail:[
      'Tutor with Strive Tuition across 2024 and 2025.',
      'EDIT ME — what you taught and what you took from it.'
    ],
    moments:[]
  },
  {
    group:'experience', id:'mcdonalds', title:'Crew Member',
    org:'McDonald’s Australia', date:'2022', tint:CV_TINTS.clay,
    blurb:'First job — service under genuine time pressure.',
    tags:['Hospitality','Teamwork','Working under pressure'],
    detail:[
      'Crew member through 2022. The first job, and the one that taught the most about working a rush with a team you can’t stop to talk to.',
      'EDIT ME — optional, keep it short and a bit funny if you like.'
    ],
    moments:[]
  },

  /* ---------------- EDUCATION ---------------- */
  {
    group:'education', id:'mbbs', title:'Doctor of Medicine',
    org:'The University of Queensland', date:'2027 — 2030', tint:CV_TINTS.bark,
    blurb:'Provisional entry, commencing 2027.',
    tags:['Provisional entry','MD'],
    detail:[
      'Provisional entry into UQ’s Doctor of Medicine, commencing 2027 on completion of the Bachelor of Biomedical Science.'
    ],
    moments:[]
  },
  {
    group:'education', id:'biomed', title:'Bachelor of Biomedical Science',
    org:'The University of Queensland', date:'2024 — 2026', tint:CV_TINTS.moss,
    blurb:'Currently finishing third year. Course list inside.',
    tags:['Biomedical research','Data analysis','Lab competence'],
    detail:[
      'Third-year Bachelor of Biomedical Science at UQ. Coursework spans molecular and cellular biology, physiology, pharmacology and genetics, with electives outside the faculty in criminology, economics, anthropology and Spanish.',
      'Grades shown in brackets are on UQ’s 7-point scale.'
    ],
    courses:[
      { term:'2026 — Semester 1', items:[
        'Human Molecular Genetics in Health &amp; Disease (BIOC3003, 6)',
        'Systems Pharmacology (BIOM3401, 6)',
        'Integrated Endocrinology (BIOM3020, 5)'
      ]},
      { term:'2025 — Summer Semester', items:[
        'Anthropology of Current World Issues (ANTH1030, 7)',
        'Health &amp; Fitness through Diet &amp; Exercise (NUTR1023, 7)'
      ]},
      { term:'2025 — Semester 2', items:[
        'Systems Physiology (BIOM2012, 5)',
        'Principles of Pharmacology (BIOM2402, 5)',
        'Genetics (BIOL2202, 6)',
        'Writing &amp; Editing for the Professions (WRIT2000, 6)'
      ]},
      { term:'2025 — Semester 1', items:[
        'Integrative Cell &amp; Tissue Biology (BIOM2011, 6)',
        'Human Anatomy (BIOM2020, 5)',
        'Molecular Cell Biology (BIOL2200, 5)',
        'Introduction to Criminology (CRIM1000, 7)'
      ]},
      { term:'2024 — Semester 2', items:[
        'Cells to Organisms (BIOL1040, 6)',
        'Introductory Microeconomics (ECON1010, 7)',
        'Introductory Spanish B (SPAN1020, 6)'
      ]},
      { term:'2024 — Semester 1', items:[
        'Chemistry I (CHEM1100, 4)',
        'Theory &amp; Practice in Science (SCIE1000, 6)',
        'Analysis of Scientific Data (STAT1201, 6)'
      ]}
    ],
    moments:[]
  },
  {
    group:'education', id:'ib', title:'International Baccalaureate',
    org:'Queensland Academy of Health Science', date:'2023', tint:CV_TINTS.fern,
    blurb:'IB 37/45 — ATAR 98.9 adjusted and converted.',
    tags:['IB 37/45','ATAR 98.9'],
    detail:[
      'Completed the International Baccalaureate Diploma at Queensland Academy for Health Sciences, finishing on 37/45 — an ATAR of 98.9 once adjusted and converted.'
    ],
    courses:[
      { term:'Higher Level', items:[
        'Biology (6)', 'Psychology (7)', 'Chemistry (5)'
      ]},
      { term:'Standard Level', items:[
        'English Language &amp; Literature (5)',
        'Spanish ab initio (6)',
        'Mathematics Applications &amp; Interpretations (7)'
      ]}
    ],
    moments:[]
  },
  {
    group:'education', id:'cert4', title:'Certificate IV in Measurement &amp; Sampling',
    org:'ABC Training &amp; Consulting', date:'2021', tint:CV_TINTS.wheat,
    blurb:'Vocational qualification completed alongside school.',
    tags:['Measurement','Sampling'],
    detail:['Certificate IV in Measurement and Sampling, completed in 2021 alongside secondary study.'],
    moments:[]
  },
  {
    group:'education', id:'cert3', title:'Certificate III in Laboratory Skills',
    org:'ABC Training &amp; Consulting', date:'2021', tint:CV_TINTS.clay,
    blurb:'Vocational qualification completed alongside school.',
    tags:['Laboratory skills'],
    detail:['Certificate III in Laboratory Skills, completed in 2021 alongside secondary study.'],
    moments:[]
  },

  /* ---------------- PROJECTS ---------------- */
  {
    group:'projects', id:'beyond15', title:'Beyond15',
    org:'Personal project', date:'2026 —', tint:CV_TINTS.moss,
    blurb:'On-device health software, from patient to clinic.',
    tags:['Swift','On-device LLMs','Whisper','Xcode'],
    detail:[
      'Beyond15 is a suite of apps designed to augment the healthcare experience, from patient to clinic.',
      'The patient-facing app delivers powerful statistical analysis of a person’s own data — right on their device. The clinic-facing app acts as a scribe, helping practitioners with the ever-increasing burden of paperwork.',
      'What separates it from competitors is that it runs entirely on device and on premise. Nothing leaves the building.',
      'It started at the January Capital Hackathon hosted by UQIES, where the team produced a markup using Lovable, an AI agent that builds websites from a single prompt. After the hackathon a working prototype was developed in Swift, using open-weight large language models like Phi-4 and GPT-oss for note generation, and speech transcription models like Whisper to keep transcripts medically accurate. New features are being added by the day.'
    ],
    moments:[
      { title:'January Capital Hackathon', desc:'Hosted by UQIES. The team’s markup was built with Lovable — this is where the idea started.', photos:[] },
      { title:'EDIT ME — first working prototype', desc:'The Swift build. What worked first, what took longest.', photos:[] }
    ]
  }
];

/* ============================================================
   RENDER
   ============================================================ */
function esc(s){ return String(s).replace(/[<>]/g, c => ({'<':'&lt;','>':'&gt;'}[c])); }

function buildTimeline(){
  const tl = document.getElementById('timeline');
  if(!tl) return;

  CV_DATA.forEach(item => {
    const el = document.createElement('article');
    el.className = 'tl-item tl-show reveal';
    el.dataset.group = item.group;
    el.dataset.id = item.id;
    el.innerHTML = `
      <span class="tl-dot" style="background:${item.tint.match(/var\(--[a-z0-9]+\)/)[0]}"></span>
      <div class="tl-row">
        <p class="tl-date">${item.date}</p>
        <div class="flip" tabindex="0" role="button" aria-label="Open details for ${esc(item.title)}">
          <div class="flip-inner">
            <div class="flip-face front">
              <p class="flip-org">${item.org}</p>
              <h3 class="flip-title">${item.title}</h3>
              <p class="flip-hint">click to expand →</p>
            </div>
            <div class="flip-face back">
              <p class="flip-org">${item.org}</p>
              <p class="detail-desc" style="font-size:.92rem; margin-top:0;">${item.blurb}</p>
              <p class="flip-hint">click to expand →</p>
            </div>
          </div>
        </div>
      </div>`;

    const flip = el.querySelector('.flip');
    flip.addEventListener('mouseenter', () => flip.classList.add('flipped'));
    flip.addEventListener('mouseleave', () => flip.classList.remove('flipped'));
    flip.addEventListener('click', () => openDetail(item, flip));
    flip.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openDetail(item, flip); }
    });

    tl.append(el);
  });

  SW.observeReveal(tl);
}

/* ---------- tab filtering ---------- */
function initTabs(){
  const tabs = document.querySelectorAll('.cv-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const want = tab.dataset.group;
      document.querySelectorAll('.tl-item').forEach(item => {
        item.classList.toggle('tl-show', want === 'all' || item.dataset.group === want);
      });
    });
  });
}

/* ============================================================
   DETAIL PANEL — expands out of the card it was opened from
   ============================================================ */
let lastRect = null;
let lastTrigger = null;

function momentsHTML(item){
  if(!item.moments || !item.moments.length) return '';
  const cards = item.moments.map((m, i) => {
    const cover = (m.photos && m.photos.length)
      ? `<img class="moment-photo" data-src="${m.photos[0]}" alt="">`
      : '';
    const album = (m.photos && m.photos.length > 1)
      ? `<div class="moment-album">${m.photos.slice(1,7).map(() => `<span style="background:${item.tint}"></span>`).join('')}</div>`
      : `<div class="moment-album"><span style="background:${item.tint}"></span><span style="background:${item.tint};opacity:.55"></span><span style="background:${item.tint};opacity:.3"></span></div>`;
    return `
      <div class="moment-card" data-moment="${i}">
        <div class="moment-inner">
          <div class="moment-face front">
            <span class="cover-tint" style="background:${item.tint}"></span>
            ${cover}
            <span class="cover-label">${m.title}</span>
          </div>
          <div class="moment-face back">
            <p class="moment-back-title">${m.title}</p>
            <p class="moment-back-desc">${m.desc}</p>
            ${album}
          </div>
        </div>
      </div>`;
  }).join('');

  const anyPhotos = item.moments.some(m => m.photos && m.photos.length);
  const note = anyPhotos ? '' :
    '<p class="section-note" style="margin-top:.9rem;">Photos going up here soon — the tiles flip for the write-up in the meantime.</p>';

  return `
    <h4 class="moments-heading">Moments</h4>
    ${note}
    <div class="moments-grid">${cards}</div>`;
}

function coursesHTML(item){
  if(!item.courses || !item.courses.length) return '';
  return item.courses.map(c => `
    <div class="course-block">
      <p class="course-term">${c.term}</p>
      <ul class="tl-detail-list">${c.items.map(i => `<li>${i}</li>`).join('')}</ul>
    </div>`).join('');
}

function openDetail(item, triggerEl){
  const panel = document.getElementById('detailPanel');
  const backdrop = document.getElementById('detailBackdrop');
  const closeBtn = document.getElementById('detailClose');

  lastTrigger = triggerEl;
  lastRect = triggerEl.getBoundingClientRect();

  panel.innerHTML = `
    <div class="detail-scroll">
      <div class="detail-cover">
        <span class="tint" style="background:${item.tint}"></span>
        <p class="label">${item.title}</p>
      </div>
      <div class="detail-body">
        <p class="detail-org">${item.org} &middot; ${item.date}</p>
        ${item.detail.map(p => `<p class="detail-desc">${p}</p>`).join('')}
        ${item.tags && item.tags.length ? `<div class="detail-tags">${item.tags.map(t => `<span class="chip">${t}</span>`).join('')}</div>` : ''}
        ${coursesHTML(item)}
        ${momentsHTML(item)}
      </div>
    </div>`;

  // start life exactly on top of the card that was clicked
  panel.style.display = 'block';
  panel.style.top = lastRect.top + 'px';
  panel.style.left = lastRect.left + 'px';
  panel.style.width = lastRect.width + 'px';
  panel.style.height = lastRect.height + 'px';
  panel.style.borderRadius = '18px';
  panel.classList.remove('content-visible');

  backdrop.classList.add('open');
  document.body.classList.add('modal-open');

  // two frames so the browser commits the start position before animating
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const w = Math.min(920, window.innerWidth * 0.92);
    const h = Math.min(window.innerHeight * 0.88, 940);
    panel.style.top = ((window.innerHeight - h) / 2) + 'px';
    panel.style.left = ((window.innerWidth - w) / 2) + 'px';
    panel.style.width = w + 'px';
    panel.style.height = h + 'px';
    panel.style.borderRadius = '22px';
  }));

  setTimeout(() => {
    panel.classList.add('content-visible');
    closeBtn.classList.add('show');
    loadMomentPhotos(panel);
    bindMomentFlips(panel);
  }, 560);

  history.replaceState(null, '', '#' + item.id);
}

function closeDetail(){
  const panel = document.getElementById('detailPanel');
  const backdrop = document.getElementById('detailBackdrop');
  const closeBtn = document.getElementById('detailClose');
  if(panel.style.display !== 'block') return;

  panel.classList.remove('content-visible');
  closeBtn.classList.remove('show');
  backdrop.classList.remove('open');
  document.body.classList.remove('modal-open');

  if(lastTrigger) lastRect = lastTrigger.getBoundingClientRect();
  if(lastRect){
    panel.style.top = lastRect.top + 'px';
    panel.style.left = lastRect.left + 'px';
    panel.style.width = lastRect.width + 'px';
    panel.style.height = lastRect.height + 'px';
    panel.style.borderRadius = '18px';
  }
  setTimeout(() => { panel.style.display = 'none'; panel.innerHTML = ''; }, 560);
  history.replaceState(null, '', location.pathname);
}

/* photos are only fetched once the panel is actually open */
function loadMomentPhotos(panel){
  panel.querySelectorAll('img.moment-photo[data-src]').forEach(img => {
    const src = img.dataset.src;
    img.removeAttribute('data-src');
    SW.loadFirstWorkingImage(img, [src], () => {});
  });
}

function bindMomentFlips(panel){
  panel.querySelectorAll('.moment-card').forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('flipped'));
  });
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  buildTimeline();
  initTabs();

  document.getElementById('detailClose').addEventListener('click', closeDetail);
  document.getElementById('detailBackdrop').addEventListener('click', closeDetail);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeDetail(); });

  // deep link: cv/#beyond15 opens that entry
  openFromHash(400);
  // ...and again if the hash changes without a reload (in-page link, back button)
  window.addEventListener('hashchange', () => openFromHash(0));
});

function openFromHash(delay){
  const hash = location.hash.slice(1);
  if(!hash) return;
  const item = CV_DATA.find(d => d.id === hash);
  const el = document.querySelector(`.tl-item[data-id="${hash}"] .flip`);
  if(!item || !el) return;
  // make sure the entry isn't filtered out by the active tab
  el.closest('.tl-item').classList.add('tl-show');
  setTimeout(() => openDetail(item, el), delay);
}
