/* Tab 2: Benjamin Franklin's 13 virtues, tracked week by week. */
(function () {
  'use strict';

  var App = window.App;
  var H = App.helpers;

  // Franklin's original precepts, from his Autobiography.
  var VIRTUES = [
    { name: 'Temperance', precept: 'Eat not to dullness; drink not to elevation.' },
    { name: 'Silence', precept: 'Speak not but what may benefit others or yourself; avoid trifling conversation.' },
    { name: 'Order', precept: 'Let all your things have their places; let each part of your business have its time.' },
    { name: 'Resolution', precept: 'Resolve to perform what you ought; perform without fail what you resolve.' },
    { name: 'Frugality', precept: 'Make no expense but to do good to others or yourself; i.e., waste nothing.' },
    { name: 'Industry', precept: 'Lose no time; be always employ\u2019d in something useful; cut off all unnecessary actions.' },
    { name: 'Sincerity', precept: 'Use no hurtful deceit; think innocently and justly, and, if you speak, speak accordingly.' },
    { name: 'Justice', precept: 'Wrong none by doing injuries, or omitting the benefits that are your duty.' },
    { name: 'Moderation', precept: 'Avoid extremes; forbear resenting injuries so much as you think they deserve.' },
    { name: 'Cleanliness', precept: 'Tolerate no uncleanliness in body, clothes, or habitation.' },
    { name: 'Tranquillity', precept: 'Be not disturbed at trifles, or at accidents common or unavoidable.' },
    { name: 'Chastity', precept: 'Rarely use venery but for health or offspring, never to dullness, weakness, or the injury of your own or another\u2019s peace or reputation.' },
    { name: 'Humility', precept: 'Imitate Jesus and Socrates.' }
  ];

  var weekStart = null; // Monday (Date) of the week on screen; null means the current week

  function viewMonday() {
    return weekStart || H.mondayOf(new Date());
  }

  function weekIsValid(monday) {
    return H.isValidKey(H.toKey(monday)) && H.isValidKey(H.toKey(H.addDays(monday, 6)));
  }

  function shiftWeek(delta) {
    var next = H.addDays(viewMonday(), delta * 7);
    if (!weekIsValid(next)) { return; }
    weekStart = next;
    render();
  }

  function pointsOf(key, v) {
    var day = App.state.virtues[key];
    return day && day[String(v)] ? day[String(v)] : 0;
  }

  function weekTitle(monday) {
    var sunday = H.addDays(monday, 6);
    if (monday.getFullYear() !== sunday.getFullYear()) {
      return H.fmtShort(monday) + ', ' + monday.getFullYear() + ' \u2013 ' + H.fmtShort(sunday) + ', ' + sunday.getFullYear();
    }
    return H.fmtShort(monday) + ' \u2013 ' + H.fmtShort(sunday) + ', ' + sunday.getFullYear();
  }

  function dotsBlock(points) {
    var wrap = H.mk('span', 'dots');
    wrap.setAttribute('aria-hidden', 'true');
    var idx = 0;
    [3, 2].forEach(function (count) {
      var row = H.mk('span', 'dots-row');
      for (var i = 0; i < count; i++) {
        row.appendChild(H.mk('span', idx < points ? 'dot on' : 'dot'));
        idx++;
      }
      wrap.appendChild(row);
    });
    return wrap;
  }

  function renderFocus(focusIdx, weekNum) {
    var box = document.getElementById('vir-focus');
    H.clear(box);
    box.appendChild(H.mk('p', 'focus-kicker', 'Focus virtue \u00b7 week ' + weekNum + ' of 13'));
    box.appendChild(H.mk('h3', 'focus-title', (focusIdx + 1) + '. ' + VIRTUES[focusIdx].name));
    box.appendChild(H.mk('p', 'focus-text', VIRTUES[focusIdx].precept));
  }

  function renderTable(monday, focusIdx, focusCell) {
    var table = document.getElementById('vir-table');
    var todayKey = H.toKey(new Date());
    var days = [];
    var i, j;
    for (i = 0; i < 7; i++) { days.push(H.addDays(monday, i)); }
    var dayTotals = [0, 0, 0, 0, 0, 0, 0];
    var weekTotal = 0;
    var focusBtn = null;

    H.clear(table);

    var caption = H.mk('caption', 'sr-only', 'Virtue points for the week of ' + weekTitle(monday));
    table.appendChild(caption);

    var thead = document.createElement('thead');
    var hr = document.createElement('tr');
    var corner = H.mk('th', 'vname', 'Virtue');
    corner.scope = 'col';
    hr.appendChild(corner);
    for (i = 0; i < 7; i++) {
      var th = H.mk('th', 'vday' + (H.toKey(days[i]) === todayKey ? ' today' : ''));
      th.scope = 'col';
      th.setAttribute('aria-label', H.fmtFull(days[i]));
      th.appendChild(H.mk('span', 'vday-name', H.DAYS[i].slice(0, 3)));
      th.appendChild(H.mk('span', 'vday-num', String(days[i].getDate())));
      hr.appendChild(th);
    }
    var totalHead = H.mk('th', 'vtotal', 'Total');
    totalHead.scope = 'col';
    hr.appendChild(totalHead);
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    for (j = 0; j < App.VIRTUE_COUNT; j++) {
      var tr = document.createElement('tr');
      if (j === focusIdx) { tr.className = 'focus-row'; }
      var rowHead = H.mk('th', 'vname', VIRTUES[j].name);
      rowHead.scope = 'row';
      tr.appendChild(rowHead);

      var rowTotal = 0;
      for (i = 0; i < 7; i++) {
        var key = H.toKey(days[i]);
        var pts = pointsOf(key, j);
        rowTotal += pts;
        dayTotals[i] += pts;
        var td = document.createElement('td');
        var btn = H.mk('button', 'vcell' + (pts ? ' has' : ''));
        btn.type = 'button';
        btn.setAttribute('data-key', key);
        btn.setAttribute('data-v', String(j));
        btn.setAttribute('aria-label', VIRTUES[j].name + ', ' + H.fmtFull(days[i]) + ': ' + pts + ' of ' +
          App.MAX_POINTS + ' points. Tap to ' + (pts >= App.MAX_POINTS ? 'reset to 0.' : 'add one.'));
        btn.appendChild(dotsBlock(pts));
        td.appendChild(btn);
        tr.appendChild(td);
        if (focusCell && focusCell.key === key && focusCell.v === j) { focusBtn = btn; }
      }
      weekTotal += rowTotal;
      var rt = H.mk('td', 'vtotal', String(rowTotal));
      rt.setAttribute('aria-label', 'Total for ' + VIRTUES[j].name + ': ' + rowTotal);
      tr.appendChild(rt);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    var tfoot = document.createElement('tfoot');
    var fr = document.createElement('tr');
    var fh = H.mk('th', 'vname', 'Total');
    fh.scope = 'row';
    fr.appendChild(fh);
    for (i = 0; i < 7; i++) {
      var dt = H.mk('td', 'vtotal', String(dayTotals[i]));
      dt.setAttribute('aria-label', 'Total for ' + H.fmtFull(days[i]) + ': ' + dayTotals[i]);
      fr.appendChild(dt);
    }
    var wt = H.mk('td', 'vtotal grand', String(weekTotal));
    wt.setAttribute('aria-label', 'Total for the week: ' + weekTotal);
    fr.appendChild(wt);
    tfoot.appendChild(fr);
    table.appendChild(tfoot);

    if (focusBtn) { focusBtn.focus({ preventScroll: true }); }
  }

  function renderList() {
    var list = document.getElementById('vir-list');
    if (list.childElementCount) { return; } // static content, build once
    VIRTUES.forEach(function (v) {
      var li = document.createElement('li');
      li.appendChild(H.mk('strong', null, v.name));
      li.appendChild(H.mk('span', null, v.precept));
      list.appendChild(li);
    });
  }

  function render(focusCell) {
    var monday = viewMonday();
    var cycleStart = H.fromKey(App.state.cycleStart);
    var weekIdx = Math.floor(H.diffDays(cycleStart, monday) / 7);
    var focusIdx = H.mod(weekIdx, App.VIRTUE_COUNT);
    var weekNum = focusIdx + 1;

    document.getElementById('vir-title').textContent = weekTitle(monday);
    document.getElementById('vir-prev').disabled = !weekIsValid(H.addDays(monday, -7));
    document.getElementById('vir-next').disabled = !weekIsValid(H.addDays(monday, 7));
    document.getElementById('vir-cycle').textContent = 'Week ' + weekNum + ' of 13' +
      (weekIdx >= 0 ? ' \u00b7 Round ' + (Math.floor(weekIdx / App.VIRTUE_COUNT) + 1) : '');
    document.getElementById('vir-start').value = App.state.cycleStart;

    renderFocus(focusIdx, weekNum);
    renderTable(monday, focusIdx, focusCell);
    renderList();
  }

  function onCellClick(e) {
    var btn = e.target.closest ? e.target.closest('.vcell') : null;
    if (!btn) { return; }
    var key = btn.getAttribute('data-key');
    var v = Number(btn.getAttribute('data-v'));
    if (!H.isValidKey(key) || !(v >= 0 && v < App.VIRTUE_COUNT)) { return; }

    var next = (pointsOf(key, v) + 1) % (App.MAX_POINTS + 1); // 0..5, then back to 0
    var day = App.state.virtues[key] || {};
    if (next === 0) { delete day[String(v)]; } else { day[String(v)] = next; }
    if (Object.keys(day).length) { App.state.virtues[key] = day; }
    else { delete App.state.virtues[key]; } // empty days are removed
    App.save();
    render({ key: key, v: v });
  }

  function onStartChange() {
    var input = document.getElementById('vir-start');
    if (H.isValidKey(input.value)) {
      App.state.cycleStart = H.toKey(H.mondayOf(H.fromKey(input.value)));
      App.save();
    }
    render();
  }

  function init() {
    document.getElementById('vir-prev').addEventListener('click', function () { shiftWeek(-1); });
    document.getElementById('vir-next').addEventListener('click', function () { shiftWeek(1); });
    document.getElementById('vir-today').addEventListener('click', function () { weekStart = null; render(); });
    document.getElementById('vir-table').addEventListener('click', onCellClick);
    document.getElementById('vir-start').addEventListener('change', onStartChange);
  }

  App.register({ init: init, render: function () { render(); } });
})();
