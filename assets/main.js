/* Sanexia — secuencia "Cómo funciona" y animaciones de aparición */
(function () {
  'use strict';

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Aparición al hacer scroll */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Secuencia ---------- */
  var root = document.getElementById('seq');
  if (!root) return;

  var NAVY = '#2E2747', SOFT = '#4F4768', MINT = '#E2F7EB', LINE = 'rgba(46,39,71,0.12)';
  var T = 42, STEP = 110, N_SCENES = 6;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var S = [
    { kicker: 'El punto de partida', title: 'De lunes a viernes, el hospital va a pleno.', text: 'Consultas y quirófanos trabajan toda la semana. Aun así, la lista de espera no deja de crecer.' },
    { kicker: 'La oportunidad', title: 'El fin de semana, las salas se quedan vacías.', text: 'Infraestructura pública ya pagada que no se utiliza sábados ni domingos.' },
    { kicker: 'Análisis y visita', title: 'Estudiamos su caso y recorremos el circuito.', text: 'Analizamos la demanda, visitamos el centro con nuestro responsable clínico y acordamos un protocolo conjunto.' },
    { kicker: 'Llega el equipo', title: 'Desplegamos un equipo clínico completo.', text: 'Con el contrato firmado y los currículums aprobados, un equipo estable ocupa el fin de semana.' },
    { kicker: 'Actividad', title: 'Los pacientes se atienden en su propio hospital.', text: 'Mismas salas, misma historia clínica, sus protocolos. El paciente no sale del sistema público.' },
    { kicker: 'Seguimiento', title: 'La lista baja y medimos el impacto.', text: 'Gestor de cuenta dedicado, informes periódicos y, cuando el circuito está rodado, ampliación a pruebas y quirófano.' }
  ];

  var state = { scene: 0, tick: 0, userPaused: false, visible: false };
  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  var css = function (e, obj) { for (var k in obj) e.style[k] = obj[k]; };

  var ICON_PAUSE = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1" fill="#fff"/><rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="#fff"/></svg>';
  var ICON_PLAY = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="#fff"/></svg>';
  var ICON_ROOM = '<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><rect x="4" y="6" width="20" height="16" rx="3" fill="none" stroke="#2E2747" stroke-width="2"/><path d="M4 11h20" stroke="#2E2747" stroke-width="2"/></svg>';
  var ICON_PERSON = '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="#2E2747" stroke-width="2"/><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5" fill="none" stroke="#2E2747" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_TICK = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7.5l2.5 2.5L11 4.5" fill="none" stroke="#2E2747" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_ARROW = '<svg width="40" height="20" viewBox="0 0 40 20" aria-hidden="true"><path d="M2 10h32M28 4l7 6-7 6" fill="none" stroke="#2E2747" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* Barra de progreso */
  var fills = [];
  var prog = $('seq-progress');
  S.forEach(function (s, i) {
    var b = el('button', null, '<span class="track"><span class="fill"></span></span>');
    b.type = 'button';
    b.setAttribute('aria-label', 'Escena ' + (i + 1) + ': ' + s.kicker);
    b.addEventListener('click', function () { go(i); });
    prog.appendChild(b);
    fills.push(b.querySelector('.fill'));
  });

  /* Semana */
  var cells = [];
  var week = $('seq-week');
  ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach(function (l) {
    var d = el('div', 'day');
    d.appendChild(el('span', 'day-label', l));
    var c = el('span', 'cell');
    d.appendChild(c);
    week.appendChild(d);
    cells.push(c);
  });

  /* Paneles por escena: cada uno devuelve una función update(p) */
  function dotsBlock(parent, n) {
    var wrap = el('div', 'dots'), arr = [];
    for (var i = 0; i < n; i++) { var d = el('span', 'dot'); wrap.appendChild(d); arr.push(d); }
    parent.appendChild(wrap);
    return arr;
  }

  var builders = [
    function (panel) {
      var box = el('div', 'stack'); box.style.gap = '12px';
      box.appendChild(el('p', 'ptitle', 'Lista de espera'));
      var dots = dotsBlock(box, 20);
      box.appendChild(el('p', 'pnote', 'La demanda sigue entrando más rápido de lo que la semana puede absorber.'));
      panel.appendChild(box);
      return function (p) {
        dots.forEach(function (d, j) {
          var shown = j < 12 || p > (j - 12) / 9;
          css(d, { opacity: shown ? 1 : 0, transform: 'scale(' + (shown ? 1 : 0.3) + ')' });
        });
      };
    },
    function (panel) {
      var grid = el('div', 'rooms'), rooms = [];
      ['Consulta 1', 'Consulta 2', 'Quirófano'].forEach(function (n) {
        var r = el('div', 'room', ICON_ROOM + '<span class="ptitle">' + n + '</span><span class="tag pulse">Sin uso</span>');
        grid.appendChild(r); rooms.push(r);
      });
      panel.appendChild(grid);
      return function (p) {
        rooms.forEach(function (r, i) {
          var vis = p > i * 0.18;
          css(r, { opacity: vis ? 1 : 0, transform: 'translateY(' + (vis ? 0 : 12) + 'px)' });
        });
      };
    },
    function (panel) {
      var C = [
        ['Datos de lista de espera y salas libres', 'Aporta el hospital'],
        ['Visita clínica al circuito del paciente', 'Responsable clínico de Sanexia'],
        ['Protocolo operativo conjunto', 'Hospital y Sanexia'],
        ['Contrato firmado y currículums aprobados', 'Hospital']
      ];
      var list = el('div', 'checks'), rows = [];
      C.forEach(function (c) {
        var row = el('div', 'check', '<span class="box">' + ICON_TICK + '</span><span class="stack"><span class="ptitle">' + c[0] + '</span><span class="who">' + c[1] + '</span></span>');
        list.appendChild(row); rows.push(row);
      });
      panel.appendChild(list);
      return function (p) {
        rows.forEach(function (row, i) {
          var ok = p > (i + 0.6) / C.length, vis = p > i / C.length - 0.05;
          css(row, { background: ok ? MINT : 'transparent', opacity: vis ? 1 : 0.25 });
          var box = row.querySelector('.box');
          box.style.background = ok ? MINT : '#fff';
          box.querySelector('svg').style.opacity = ok ? 1 : 0;
        });
      };
    },
    function (panel) {
      var grid = el('div', 'team-grid'), ms = [];
      ['Especialistas', 'Enfermería', 'Auxiliares', 'Gestor de cuenta'].forEach(function (r) {
        var m = el('div', 'member', '<span class="av">' + ICON_PERSON + '</span><span>' + r + '</span>');
        grid.appendChild(m); ms.push(m);
      });
      panel.appendChild(grid);
      return function (p) {
        ms.forEach(function (m, i) {
          var vis = p > i * 0.2;
          css(m, { opacity: vis ? 1 : 0, transform: 'translateY(' + (vis ? 0 : 18) + 'px)' });
        });
      };
    },
    function (panel) {
      var flow = el('div', 'flow');
      var left = el('div'); left.appendChild(el('p', 'ptitle', 'Lista de espera'));
      var q = dotsBlock(left, 20);
      var arrow = el('div', 'arrow', ICON_ARROW); arrow.style.display = 'flex';
      var right = el('div', 'seen'); right.appendChild(el('p', 'ptitle', 'Atendidos en su hospital'));
      var seen = dotsBlock(right, 20);
      flow.appendChild(left); flow.appendChild(arrow); flow.appendChild(right);
      panel.appendChild(flow);
      return function (p) {
        for (var j = 0; j < 20; j++) {
          var done = p > (j + 1) / 22;
          css(q[j], { opacity: done ? 0.12 : 1, transform: 'scale(' + (done ? 0.6 : 1) + ')' });
          css(seen[j], { opacity: done ? 1 : 0, transform: 'scale(' + (done ? 1 : 0.3) + ')' });
        }
      };
    },
    function (panel) {
      var box = el('div', 'stack'); box.style.gap = '12px';
      box.appendChild(el('p', 'ptitle', 'Lista de espera, semana a semana'));
      var bars = el('div', 'bars'), bs = [];
      for (var k = 0; k < 10; k++) {
        var b = el('span', 'bar');
        css(b, { height: (100 - k * 9.5) + '%', background: k === 0 ? NAVY : SOFT });
        bars.appendChild(b); bs.push(b);
      }
      box.appendChild(bars);
      var tags = el('div', 'tags', '<span>Informe periódico</span><span>Reunión de seguimiento</span><span>Ampliación a pruebas y quirófano</span>');
      box.appendChild(tags);
      panel.appendChild(box);
      var ts = tags.querySelectorAll('span');
      return function (p) {
        bs.forEach(function (b, k) {
          var v = p > k / 10;
          css(b, { opacity: v ? 1 : 0, transform: 'scaleY(' + (v ? 1 : 0.2) + ')' });
        });
        ts[0].style.opacity = p > 0.45 ? 1 : 0;
        ts[1].style.opacity = p > 0.65 ? 1 : 0;
        ts[2].style.opacity = p > 0.85 ? 1 : 0;
      };
    }
  ];

  var panel = $('seq-panel'), updatePanel = null;

  function buildScene() {
    var s = S[state.scene];
    $('seq-kicker').textContent = 'Escena ' + (state.scene + 1) + ' · ' + s.kicker;
    $('seq-title').textContent = s.title;
    $('seq-desc').textContent = s.text;
    $('seq-counter').textContent = (state.scene + 1) + ' / ' + N_SCENES;
    $('seq-peek').textContent = S[(state.scene + 1) % N_SCENES].kicker;
    var txt = $('seq-text');
    txt.classList.remove('seq-fade'); void txt.offsetWidth; txt.classList.add('seq-fade');
    panel.innerHTML = '';
    updatePanel = builders[state.scene](panel);
  }

  function paintDays(p) {
    var sc = state.scene;
    cells.forEach(function (c, i) {
      var st = { background: 'transparent', color: NAVY, border: '0' }, text = '', pulse = false;
      if (i < 5) {
        var lit = sc > 0 || p > i * 0.16;
        st.background = lit ? NAVY : LINE; st.color = '#fff'; text = lit ? 'SNS' : '';
      } else if (sc === 0) {
        st.border = '1.5px dashed ' + LINE;
      } else if (sc <= 2) {
        st.border = '2px dashed ' + SOFT; st.color = SOFT; text = 'Libre'; pulse = sc === 1;
      } else {
        var on = sc > 3 || p > (i - 5) * 0.35 + 0.1;
        st.background = on ? MINT : 'transparent';
        st.border = '2px ' + (on ? 'solid ' + NAVY : 'dashed ' + SOFT);
        text = on ? 'Sanexia' : 'Libre';
      }
      css(c, st);
      c.classList.toggle('pulse', pulse);
      if (c.textContent !== text) c.textContent = text;
    });
  }

  function render() {
    var p = reduce ? 1 : Math.min(state.tick / (T * 0.8), 1);
    fills.forEach(function (f, i) {
      var v = i < state.scene ? 1 : (i === state.scene ? Math.min(state.tick / T, 1) : 0);
      f.style.width = (v * 100) + '%';
    });
    paintDays(p);
    if (updatePanel) updatePanel(p);
    var btn = $('seq-play');
    var running = !state.userPaused;
    btn.innerHTML = running ? ICON_PAUSE : ICON_PLAY;
    btn.setAttribute('aria-label', running ? 'Pausar' : 'Reproducir');
  }

  function go(i) {
    state.scene = ((i % N_SCENES) + N_SCENES) % N_SCENES;
    state.tick = 0;
    buildScene();
    render();
  }

  setInterval(function () {
    if (state.userPaused || !state.visible || document.hidden) return;
    state.tick++;
    if (state.tick >= T) { go(state.scene + 1); return; }
    render();
  }, STEP);

  $('seq-play').addEventListener('click', function () { state.userPaused = !state.userPaused; render(); });
  $('seq-prev').addEventListener('click', function () { go(state.scene - 1); });
  $('seq-next').addEventListener('click', function () { go(state.scene + 1); });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { go(state.scene + 1); }
    if (e.key === 'ArrowLeft') { go(state.scene - 1); }
  });

  if (reduce) state.userPaused = true;

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      state.visible = entries[0].isIntersecting;
    }, { threshold: 0.35 }).observe(root);
  } else {
    state.visible = true;
  }

  buildScene();
  render();
})();
