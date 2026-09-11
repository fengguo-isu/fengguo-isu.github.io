/* Research page behaviour for fengguo-isu.github.io
   Everything here is built from the paper lists in research.html:
   the journal-list filters and search, the topic bars, and the timeline.
   Plain JavaScript, no libraries, no build step.
   To rename a topic or change its colour, edit TOPICS below. */
(function () {
  'use strict';

  // Topic colours are the first six slots of a colour-blind-checked categorical
  // palette (dark-background steps), kept in this order so neighbouring lanes
  // stay distinguishable.
  var TOPICS = [
    { key: 'audit', name: 'Auditing',                  color: '#3987e5' },
    { key: 'ma',    name: 'M&A and valuation',         color: '#d95926' },
    { key: 'gov',   name: 'Governance and ESG',        color: '#199e70' },
    { key: 'disc',  name: 'Disclosure and reporting',  color: '#c98500' },
    { key: 'tech',  name: 'Technology and innovation', color: '#d55181' },
    { key: 'labor', name: 'Labor and human capital',   color: '#008300' }
  ];

  var LISTS = [
    { key: 'all',   label: 'All',   note: 'All peer-reviewed journal articles.' },
    { key: 'utd24', label: 'UTD24', note: 'The UT Dallas list of 24 leading business journals.' },
    { key: 'ft50',  label: 'FT50',  note: 'The Financial Times list of 50 journals used in its research rankings.' },
    { key: 'other', label: 'Other', note: 'Journals outside the UTD24 and FT50 lists.' }
  ];

  var TOPIC = {};
  TOPICS.forEach(function (t, i) { t.order = i; TOPIC[t.key] = t; });

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function words(s) { return (s || '').split(/\s+/).filter(Boolean); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function smooth() { return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function dotFor(color) { var i = el('i'); i.style.setProperty('--c', color); return i; }

  /* ---------- read the papers from the page ---------- */
  var papers = $$('#pubs .item, #wps .item').map(function (li) {
    var ttl = $('.ttl', li), ven = $('.ven', li), em = ven ? $('em', ven) : null;
    var venueName = '';
    if (ven) {
      venueName = Array.prototype.filter.call(ven.childNodes, function (n) { return n.nodeType === 3; })
        .map(function (n) { return n.textContent; }).join(' ').replace(/\s+/g, ' ').trim();
    }
    return {
      el: li,
      wp: !!li.closest('#wps'),
      lists: words(li.getAttribute('data-lists')),
      topics: words(li.getAttribute('data-topics')).filter(function (k) { return TOPIC[k]; }),
      year: parseInt(li.getAttribute('data-year'), 10) || null,
      authors: $$('.co', li).map(function (s) { return s.textContent.replace(/\s+/g, ' ').trim(); }),
      title: ttl ? ttl.textContent.replace(/\s+/g, ' ').trim() : '',
      venue: venueName,
      forthcoming: !!(em && /forthcoming/i.test(em.textContent)),
      status: em && em.classList.contains('st') ? em.textContent.replace(/\s+/g, ' ').trim() : '',
      text: li.textContent.replace(/\s+/g, ' ').toLowerCase()
    };
  });
  if (!papers.length) return;
  var pubs = papers.filter(function (p) { return !p.wp; });

  function venueLine(p) {
    if (p.wp) return 'Working paper' + (p.status ? ' \u00b7 ' + p.status : '');
    return p.venue + ' (' + (p.forthcoming ? 'forthcoming' : p.year) + ')';
  }

  /* ---------- filter state ---------- */
  var state = { list: 'all', topic: null, author: null, q: '' };

  function inList(p, key) {
    if (p.wp || key === 'all') return true;
    if (key === 'other') return p.lists.indexOf('utd24') < 0 && p.lists.indexOf('ft50') < 0;
    return p.lists.indexOf(key) > -1;
  }
  function matches(p) {
    return inList(p, state.list) &&
      (!state.topic || p.topics.indexOf(state.topic) > -1) &&
      (!state.author || p.authors.indexOf(state.author) > -1) &&
      (!state.q || p.text.indexOf(state.q) > -1);
  }
  function setF(kind, val, jump) {
    if (kind === 'list') state.list = val;
    else state[kind] = (state[kind] === val ? null : val);
    apply();
    if (jump) $('#pubs-h').scrollIntoView({ behavior: smooth() ? 'smooth' : 'auto', block: 'start' });
  }
  function clearAll() {
    state = { list: 'all', topic: null, author: null, q: '' };
    search.value = '';
    apply();
  }

  /* ---------- journal-list pills, search, chips ---------- */
  var pillBox = $('#pills'), note = $('#listnote'), count = $('#count'), chips = $('#chips'), search = $('#q');

  LISTS.forEach(function (l) {
    var n = pubs.filter(function (p) { return inList(p, l.key); }).length;
    var b = el('button', 'pill');
    b.type = 'button';
    b.setAttribute('data-list', l.key);
    b.appendChild(document.createTextNode(l.label));
    b.appendChild(el('span', 'n', String(n)));
    b.addEventListener('click', function () { state.list = l.key; apply(); });
    pillBox.appendChild(b);
  });
  pillBox.hidden = false;
  $('#tools').hidden = false;

  var timer;
  search.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { state.q = search.value.trim().toLowerCase(); apply(); }, 120);
  });
  $$('[data-clear]').forEach(function (b) { b.addEventListener('click', clearAll); });

  function chip(label, onRemove) {
    var c = el('button', 'chip');
    c.type = 'button';
    c.setAttribute('aria-label', 'Remove filter: ' + label);
    c.appendChild(document.createTextNode(label));
    var x = el('span', 'x', '×');
    x.setAttribute('aria-hidden', 'true');
    c.appendChild(x);
    c.addEventListener('click', onRemove);
    return c;
  }

  /* ---------- journal marks, topic tags, clickable coauthors ---------- */
  papers.forEach(function (p) {
    var box = el('div', 'marks');
    if (!p.wp) {
      ['utd24', 'ft50'].forEach(function (k) {
        if (p.lists.indexOf(k) < 0) return;
        var b = el('button', 'mark', k.toUpperCase());
        b.type = 'button';
        b.title = 'Show ' + k.toUpperCase() + ' papers';
        b.addEventListener('click', function () { setF('list', k); });
        box.appendChild(b);
      });
    }
    p.topics.forEach(function (k) {
      var t = TOPIC[k], b = el('button', 'tag');
      b.type = 'button';
      b.title = 'Show papers on ' + t.name;
      b.appendChild(dotFor(t.color));
      b.appendChild(document.createTextNode(t.name));
      b.addEventListener('click', function () { setF('topic', k); });
      box.appendChild(b);
    });
    var ven = $('.ven', p.el);
    if (box.children.length && ven) ven.parentNode.insertBefore(box, ven.nextSibling);

    $$('.co', p.el).forEach(function (s) {
      var name = s.textContent.replace(/\s+/g, ' ').trim();
      s.setAttribute('role', 'button');
      s.tabIndex = 0;
      s.title = 'Show papers with ' + name;
      s.addEventListener('click', function () { setF('author', name); });
      s.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setF('author', name); }
      });
    });
  });

  /* ---------- topic bars ---------- */
  var tcount = {};
  papers.forEach(function (p) { p.topics.forEach(function (k) { tcount[k] = (tcount[k] || 0) + 1; }); });
  var tsorted = TOPICS.filter(function (t) { return tcount[t.key]; })
    .sort(function (a, b) { return (tcount[b.key] - tcount[a.key]) || (a.order - b.order); });
  var tmax = Math.max.apply(null, tsorted.map(function (t) { return tcount[t.key]; }));
  var tbars = $('#tbars');
  tsorted.forEach(function (t) {
    var n = tcount[t.key];
    var b = el('button', 'tbar');
    b.type = 'button';
    b.setAttribute('data-topic', t.key);
    b.setAttribute('aria-label', t.name + ': ' + plural(n, 'paper', 'papers') + '. Show them.');
    var nm = el('span', 'tname');
    nm.appendChild(dotFor(t.color));
    nm.appendChild(document.createTextNode(t.name));
    var tr = el('span', 'ttrack');
    var f = el('span', 'tfill');
    f.style.width = (n / tmax * 86).toFixed(1) + '%';
    tr.appendChild(f);
    tr.appendChild(el('span', 'tval', String(n)));
    b.appendChild(nm);
    b.appendChild(tr);
    b.addEventListener('click', function () { setF('topic', t.key, true); });
    tbars.appendChild(b);
  });

  /* ---------- timeline: one lane per topic, one mark per paper ---------- */
  var lanes = $('#lanes');
  var years = papers.filter(function (p) { return p.year; }).map(function (p) { return p.year; });
  var y0 = Math.min.apply(null, years), y1 = Math.max.apply(null, years);
  if (y1 === y0) { y0 -= 1; y1 += 1; }
  function xpct(y) { return 4 + (y - y0) / (y1 - y0) * 92; }

  var tip = el('div', 'tip');
  tip.hidden = true;

  function place(tipEl, box, anchor) {
    var tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
    var left = Math.max(0, Math.min(anchor.cx - tw / 2, box.width - tw));
    var top = anchor.top - th - 8;
    if (top < 0) top = anchor.bottom + 8;
    tipEl.style.left = left + 'px';
    tipEl.style.top = top + 'px';
  }
  function showTip(d, p) {
    tip.textContent = '';
    tip.appendChild(el('b', null, p.title));
    tip.appendChild(el('span', null, venueLine(p)));
    tip.hidden = false;
    var box = lanes.getBoundingClientRect(), r = d.getBoundingClientRect();
    place(tip, box, { cx: r.left - box.left + r.width / 2, top: r.top - box.top, bottom: r.bottom - box.top });
    d.classList.add('on');
  }
  function hideTip() {
    tip.hidden = true;
    $$('.ldot.on').forEach(function (x) { x.classList.remove('on'); });
  }
  function goTo(p) {
    clearAll();
    hideTip();
    p.el.scrollIntoView({ behavior: smooth() ? 'smooth' : 'auto', block: 'center' });
    p.el.classList.remove('flash');
    void p.el.offsetWidth;
    p.el.classList.add('flash');
    var a = $('.ttl a', p.el);
    if (a) setTimeout(function () { a.focus({ preventScroll: true }); }, 450);
  }

  TOPICS.forEach(function (t) {
    var inLane = papers.filter(function (p) { return p.year && p.topics.indexOf(t.key) > -1; });
    if (!inLane.length) return;
    var nm = el('div', 'lname');
    nm.appendChild(dotFor(t.color));
    nm.appendChild(document.createTextNode(t.name));
    var tr = el('div', 'ltrack');
    for (var y = y0; y <= y1; y++) {
      var g = el('span', 'yl');
      g.style.left = xpct(y) + '%';
      tr.appendChild(g);
    }
    var byYear = {};
    inLane.forEach(function (p) { (byYear[p.year] = byYear[p.year] || []).push(p); });
    Object.keys(byYear).forEach(function (yr) {
      var arr = byYear[yr];
      // Up to three marks in a year sit side by side; more stack in two rows.
      // The group is nudged inward so it never runs past either end of the track.
      var rows = arr.length > 3 ? 2 : 1;
      var perRow = Math.ceil(arr.length / rows);
      var reach = (perRow - 1) / 2 * 13 + 7;
      var centre = 'clamp(' + reach + 'px, ' + xpct(+yr).toFixed(2) + '%, 100% - ' + reach + 'px)';
      arr.forEach(function (p, i) {
        var second = i >= perRow;
        var n = second ? arr.length - perRow : perRow, j = second ? i - perRow : i;
        var off = (j - (n - 1) / 2) * 13;
        var d = el('button', 'ldot' + (p.wp ? ' wp' : ''));
        d.type = 'button';
        d.style.left = 'calc(' + centre + ' + ' + off + 'px)';
        if (rows > 1) d.style.top = 'calc(50% ' + (second ? '+' : '-') + ' 7px)';
        d.style.setProperty('--c', t.color);
        d.setAttribute('aria-label', p.title + '. ' + venueLine(p) + '. ' + t.name + '.');
        d.addEventListener('pointerenter', function () { showTip(d, p); });
        d.addEventListener('pointerleave', hideTip);
        d.addEventListener('focus', function () { showTip(d, p); });
        d.addEventListener('blur', hideTip);
        d.addEventListener('click', function () { goTo(p); });
        tr.appendChild(d);
      });
    });
    lanes.appendChild(nm);
    lanes.appendChild(tr);
  });
  var axis = el('div', 'laxis');
  axis.setAttribute('aria-hidden', 'true');
  for (var yy = y0; yy <= y1; yy++) {
    var lab = el('span', (yy - y0) % 2 ? 'odd' : '', String(yy));
    lab.style.left = xpct(yy) + '%';
    axis.appendChild(lab);
  }
  lanes.appendChild(axis);
  lanes.appendChild(tip);
  $('#lkey').hidden = false;

  /* ---------- render the filtered view ---------- */
  function apply() {
    var nPub = 0, nWp = 0;
    papers.forEach(function (p) {
      var ok = matches(p);
      p.el.hidden = !ok;
      if (ok) { if (p.wp) nWp++; else nPub++; }
    });
    $$('[data-group-head]').forEach(function (h) {
      var list = document.getElementById(h.getAttribute('data-group-head'));
      h.hidden = !(list && $('.item:not([hidden])', list));
    });
    $$('.pill', pillBox).forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-list') === state.list));
    });
    note.textContent = LISTS.filter(function (l) { return l.key === state.list; })[0].note;
    count.textContent = plural(nPub, 'paper', 'papers');
    $('#pubs-empty').hidden = nPub > 0;
    $('#wps-empty').hidden = nWp > 0;
    chips.textContent = '';
    if (state.topic) chips.appendChild(chip(TOPIC[state.topic].name, function () { state.topic = null; apply(); }));
    if (state.author) chips.appendChild(chip(state.author, function () { state.author = null; apply(); }));
    $$('.tbar').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-topic') === state.topic)); });
  }
  apply();
})();
