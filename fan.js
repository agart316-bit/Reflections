// fan.js — fan-of-cards. Click a card to expand it via FLIP animation.
// The FLIP overlay is rendered at full target resolution from frame zero,
// then transform-animated from the card's starting rect — crisp, no scale-blur.
// Expects: CHAPTERS (data.js) and CHAPTER_ID (set inline per page).

(function () {
  const ch = CHAPTERS.find(c => c.id === CHAPTER_ID);
  if (!ch) return;

  const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
  const toRoman = (n) => {
    const map = [['M',1000],['CM',900],['D',500],['CD',400],['C',100],
                 ['XC',90],['L',50],['XL',40],['X',10],['IX',9],
                 ['V',5],['IV',4],['I',1]];
    let r = '';
    map.forEach(([s,v]) => { while (n >= v) { r += s; n -= v; } });
    return r;
  };

  document.documentElement.style.setProperty('--accent', ch.color);
  document.getElementById('reading-chapter-num').textContent = `Chapter ${ROMAN[ch.id - 1] || ch.id}`;
  const sym = document.getElementById('reading-symbol');
  sym.textContent = ch.symbol; sym.style.color = ch.color;
  document.getElementById('reading-name').textContent = ch.name;
  document.getElementById('reading-question').textContent = ch.question;
  document.title = `Reflections — ${ch.name}`;

  let expandedIndex = -1;
  const readCards = new Set();
  let currentOverlay = null;

  const isMobile = () => window.innerWidth <= 640;

  function updateProgress() {
    const total = ch.cards.length;
    const done = readCards.size;
    document.getElementById('reading-progress').textContent =
      done === 0 ? `${total} card${total !== 1 ? 's' : ''}` :
      done === total ? 'all revealed' :
      `${done} of ${total} revealed`;
  }

  function buildFan() {
    const container = document.getElementById('fan-container');
    container.innerHTML = '';
    const total = ch.cards.length;

    if (isMobile()) {
      buildGrid(container, total);
      return;
    }

    container.classList.remove('grid-layout');
    const isRow = total <= 3;

    if (isRow) {
      container.classList.add('cards-minimal');
    } else {
      container.classList.remove('cards-minimal');
    }

    const spread = Math.min(Math.max(total * 18, 30), 142);
    const startAngle = -spread / 2;

    // Tablet-aware card sizing
    const isTablet = window.innerWidth <= 1024 && window.innerWidth > 640;
    const cardWMax = isTablet ? 150 : 168;
    const cardWPct = isTablet ? 0.14 : 0.16;
    const cardW = Math.min(cardWMax, Math.max(isTablet ? 110 : 120, window.innerWidth * cardWPct));
    const cardGap = Math.max(20, window.innerWidth * 0.022);
    const rowStep = cardW + cardGap;

    ch.cards.forEach((cardData, i) => {
      let angle, xOff, yOff;

      if (isRow) {
        angle = 0;
        xOff  = (i - (total - 1) / 2) * rowStep;
        yOff  = 0;
      } else {
        angle = total === 1 ? 0 :
          startAngle + (spread / Math.max(total - 1, 1)) * i;
        const t = total > 1 ? i / (total - 1) : 0.5;
        yOff  = Math.cos(t * Math.PI - Math.PI / 2) * 22;
        xOff  = 0;
      }

      const el = document.createElement('div');
      el.className = 'rcard';
      el.dataset.index = i;
      el.style.setProperty('--accent', ch.color);
      el.style.setProperty('--rest-rot', angle + 'deg');
      el.style.setProperty('--rest-x', xOff + 'px');
      el.style.setProperty('--rest-y', yOff + 'px');
      el.style.zIndex = isRow ? 10 : total - Math.abs(i - Math.floor(total / 2));
      el.style.opacity = '0';
      el.style.transform = `rotate(0deg) translateX(${xOff}px) translateY(60px)`;

      el.innerHTML = `
        <div class="rcard-inner">
          <div class="rcard-face-front">
            <span class="rcard-accent-bar"></span>
            <span class="rcard-symbol">${ch.symbol}</span>
            <div>
              <div class="rcard-title">${cardData.title}</div>
              <div class="rcard-title-rule"></div>
            </div>
            <span class="rcard-num">${toRoman(i + 1).toLowerCase()}</span>
          </div>
        </div>
      `;

      el.addEventListener('click', () => expandCard(i));
      container.appendChild(el);

      requestAnimationFrame(() => {
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = `rotate(${angle}deg) translateX(${xOff}px) translateY(${yOff}px)`;
        }, 220 + i * 90);
      });
    });
  }

  function buildGrid(container, total) {
    container.classList.add('grid-layout');
    container.classList.remove('cards-minimal');

    ch.cards.forEach((cardData, i) => {
      const el = document.createElement('div');
      el.className = 'rcard';
      el.dataset.index = i;
      el.style.setProperty('--accent', ch.color);
      el.style.setProperty('--rest-rot', '0deg');
      el.style.setProperty('--rest-x', '0px');
      el.style.setProperty('--rest-y', '0px');
      el.style.setProperty('--grid-i', i);
      el.style.zIndex = 1;

      el.innerHTML = `
        <div class="rcard-inner">
          <div class="rcard-face-front">
            <span class="rcard-accent-bar"></span>
            <span class="rcard-symbol">${ch.symbol}</span>
            <div>
              <div class="rcard-title">${cardData.title}</div>
              <div class="rcard-title-rule"></div>
            </div>
            <span class="rcard-num">${toRoman(i + 1).toLowerCase()}</span>
          </div>
        </div>
      `;

      el.addEventListener('click', () => expandCard(i));
      container.appendChild(el);
    });
  }

  function buildOverlay(index) {
    const cardData = ch.cards[index];

    const ov = document.createElement('div');
    ov.className = 'rcard-expanded';
    ov.style.setProperty('--accent', ch.color);

    // ── Original sizing (desktop) — untouched ──────────────────
    const W = Math.min(380, window.innerWidth * 0.82);
    const maxH = Math.min(window.innerHeight * 0.82, 620);
    const L = (window.innerWidth  - W) / 2;
    const T = (window.innerHeight - maxH) / 2;

    ov.style.width  = W + 'px';
    ov.style.height = maxH + 'px';
    ov.style.left   = L + 'px';
    ov.style.top    = T + 'px';

    ov.innerHTML = `
      <div class="rcard-exp-inner">
        <div class="rcard-exp-front">
          <span class="rcard-accent-bar"></span>
          <span class="rcard-symbol">${ch.symbol}</span>
          <div>
            <div class="rcard-title">${cardData.title}</div>
            <div class="rcard-title-rule"></div>
          </div>
          <span class="rcard-num">${toRoman(index + 1).toLowerCase()}</span>
        </div>
        <div class="rcard-exp-back"></div>
      </div>
    `;

    return { ov, W, maxH, L, T };
  }

  function _injectBackContent(ov, index) {
    const cardData = ch.cards[index];

    const aphHTML = cardData.aphorisms.map((a, k) => {
      const sep = k > 0
        ? `<div class="rb-sep" style="--i:${k - 0.5}" aria-hidden="true"><span style="color:${ch.color}">✦ &nbsp; ✦ &nbsp; ✦</span></div>`
        : '';
      return sep + `<p class="rb-aph" style="--i:${k}">${a}</p>`;
    }).join('');

    const back = ov.querySelector('.rcard-exp-back');
    back.innerHTML = `
      <button class="rb-close" aria-label="Close">✕</button>
      <header class="rb-head">
        <div class="rb-running">
          <span>Ch. ${ROMAN[ch.id - 1] || ch.id}</span>
          <span class="sym" style="color:${ch.color}">${ch.symbol}</span>
        </div>
        <h3 class="rb-title">${cardData.title}</h3>
        <div class="rb-rule" style="background:${ch.color}"></div>
      </header>
      <div class="rb-body">${aphHTML}</div>
    `;

    back.querySelector('.rb-close').addEventListener('click', (e) => {
      e.stopPropagation();
      collapseCard();
    });
  }

  function _doExpand(index) {
    expandedIndex = index;
    readCards.add(index);
    updateProgress();

    const card = document.querySelector(`.rcard[data-index="${index}"]`);
    card.classList.add('read-done');

    const { ov, W, maxH, L, T } = buildOverlay(index);
    const cardRect = card.getBoundingClientRect();

    const overlayCX = L + W / 2;
    const overlayCY = T + maxH / 2;
    const tx = (cardRect.left + cardRect.width  / 2) - overlayCX;
    const ty = (cardRect.top  + cardRect.height / 2) - overlayCY;
    const sx = cardRect.width  / W;
    const sy = cardRect.height / maxH;

    ov.style.transition = 'none';
    ov.style.opacity    = '0';
    ov.style.transform  = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
    document.body.appendChild(ov);
    currentOverlay = ov;

    void ov.offsetWidth;

    ov.style.transition = 'transform 0.8s cubic-bezier(0.16, 0.84, 0.34, 1), opacity 0.4s ease-out';
    ov.style.transform  = 'none';
    ov.style.opacity    = '1';

    document.getElementById('fan-dim').classList.add('visible');
    showNav(index);

    setTimeout(() => {
      if (!document.body.contains(ov)) return;

      ov.style.transition = 'transform 0.28s ease-in';
      ov.style.transform  = 'perspective(1200px) rotateY(90deg)';

      setTimeout(() => {
        if (!document.body.contains(ov)) return;

        ov.querySelector('.rcard-exp-front').style.display = 'none';
        _injectBackContent(ov, index);
        ov.querySelector('.rcard-exp-back').style.display = 'flex';

        ov.style.transition = 'none';
        ov.style.transform  = 'perspective(1200px) rotateY(-90deg)';
        void ov.offsetWidth;
        ov.style.transition = 'transform 0.32s ease-out';
        ov.style.transform  = 'none';
      }, 280);
    }, 900);
  }

  function expandCard(index) {
    if (expandedIndex === index) return;
    if (expandedIndex !== -1) { _collapseAndThen(index); return; }
    _doExpand(index);
  }

  function collapseCard() {
    if (expandedIndex === -1 || !currentOverlay) return;
    const ov   = currentOverlay;
    const card = document.querySelector(`.rcard[data-index="${expandedIndex}"]`);

    const cardRect = card.getBoundingClientRect();
    const ovRect   = ov.getBoundingClientRect();
    const tx = (cardRect.left + cardRect.width  / 2) - (ovRect.left + ovRect.width  / 2);
    const ty = (cardRect.top  + cardRect.height / 2) - (ovRect.top  + ovRect.height / 2);
    const sx = cardRect.width  / ovRect.width;
    const sy = cardRect.height / ovRect.height;

    ov.style.transition = 'transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.3s ease-in 0.25s';
    ov.style.transform  = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
    ov.style.opacity    = '0';

    card.classList.remove('is-expanded');
    setTimeout(() => { ov.remove(); currentOverlay = null; }, 700);

    expandedIndex = -1;
    document.getElementById('fan-dim').classList.remove('visible');
    document.getElementById('rcard-nav').classList.remove('visible');
  }

  function _collapseAndThen(nextIndex) {
    if (!currentOverlay) return;
    const ov = currentOverlay;
    const back = ov.querySelector('.rcard-exp-back');

    back.style.transition = 'opacity 0.18s ease-out';
    back.style.opacity = '0';

    setTimeout(() => {
      if (!document.body.contains(ov)) return;

      _injectBackContent(ov, nextIndex);

      expandedIndex = nextIndex;
      readCards.add(nextIndex);
      updateProgress();
      showNav(nextIndex);
      readCards.forEach(idx => {
        const c = document.querySelector(`.rcard[data-index="${idx}"]`);
        if (c) c.classList.add('read-done');
      });

      back.style.transition = 'opacity 0.22s ease-in';
      back.style.opacity = '1';

      setTimeout(() => {
        if (back && document.body.contains(ov)) back.style.transition = '';
      }, 220);
    }, 180);
  }

  function showNav(index) {
    const total = ch.cards.length;
    document.getElementById('rcard-nav').classList.add('visible');
    document.getElementById('nav-counter').textContent =
      `${toRoman(index + 1).toLowerCase()} · ${toRoman(total).toLowerCase()}`;
    document.getElementById('nav-prev').disabled = index === 0;
    document.getElementById('nav-next').disabled = index === total - 1;

    const allRead = readCards.size >= total;
    const prevChapterBtn = document.getElementById('nav-prev-chapter');
    const nextChapterBtn = document.getElementById('nav-next-chapter');
    if (prevChapterBtn) prevChapterBtn.style.display = (allRead && ch.id > 1)  ? 'inline-flex' : 'none';
    if (nextChapterBtn) nextChapterBtn.style.display = (allRead && ch.id < 12) ? 'inline-flex' : 'none';
  }

  document.getElementById('nav-prev').addEventListener('click', () => {
    if (expandedIndex > 0) expandCard(expandedIndex - 1);
  });
  document.getElementById('nav-next').addEventListener('click', () => {
    if (expandedIndex < ch.cards.length - 1) expandCard(expandedIndex + 1);
  });

  const prevChapterBtn = document.getElementById('nav-prev-chapter');
  const nextChapterBtn = document.getElementById('nav-next-chapter');
  if (prevChapterBtn) prevChapterBtn.addEventListener('click', () => {
    if (ch.id > 1) window.location.href = `chapter-${ch.id - 1}.html`;
  });
  if (nextChapterBtn) nextChapterBtn.addEventListener('click', () => {
    if (ch.id < 12) window.location.href = `chapter-${ch.id + 1}.html`;
  });

  document.getElementById('fan-dim').addEventListener('click', collapseCard);
  document.addEventListener('keydown', (e) => {
    if (expandedIndex === -1) return;
    if (e.key === 'Escape')     collapseCard();
    if (e.key === 'ArrowRight') document.getElementById('nav-next').click();
    if (e.key === 'ArrowLeft')  document.getElementById('nav-prev').click();
  });

  let _lastMobile = isMobile();
  window.addEventListener('resize', () => {
    if (expandedIndex !== -1) collapseCard();
    const nowMobile = isMobile();
    if (nowMobile !== _lastMobile) {
      _lastMobile = nowMobile;
      buildFan();
    }
  });

  updateProgress();
  buildFan();
})();
