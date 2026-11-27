/* Tab 3: The Monk. 21-day cycles, one lesson per cycle, inspired by The Monk Who Sold His Ferrari. */
(function () {
  'use strict';

  var App = window.App;
  var H = App.helpers;

  var CYCLE_DAYS = 21;

  // Seven lessons, summarized in my own words, each with three practical techniques.
  var LESSONS = [
    {
      title: 'Master your mind',
      summary: 'Your thoughts steer your mood and your actions. Treat your mind like a garden: decide what you plant in it and pull out what you do not want to grow.',
      tips: [
        'Start the day with five quiet minutes and choose one intention for the day.',
        'When a negative thought shows up, name it and replace it with a calmer, more useful one.',
        'Give one task ten minutes of full attention, with no phone and no switching.'
      ]
    },
    {
      title: 'Follow your purpose',
      summary: 'A clear sense of what matters gives your days direction. Put your purpose and your goals in writing so that your daily choices can be measured against them.',
      tips: [
        'Write a short statement of what you want your life and work to stand for.',
        'Pick one goal, give it a deadline and write the next small step.',
        'Each evening, ask yourself whether today moved you closer to that goal.'
      ]
    },
    {
      title: 'Practice kaizen',
      summary: 'Lasting change comes from small, steady improvements rather than from dramatic overhauls. Getting a little better each day adds up faster than you expect.',
      tips: [
        'Choose one tiny habit and improve it by just 1% today.',
        'Do one small thing that is slightly outside your comfort zone.',
        'Before bed, write down one thing you learned and one thing to improve tomorrow.'
      ]
    },
    {
      title: 'Live with discipline',
      summary: 'Discipline is a skill built by keeping small promises to yourself. Each time you follow through, you get stronger and willpower stops feeling like a fight.',
      tips: [
        'Do the hardest small task of the day first, before checking messages.',
        'Make one promise to yourself today and keep it, however small.',
        'Remove one temptation or distraction from your surroundings.'
      ]
    },
    {
      title: 'Respect your time',
      summary: 'Time is the one resource you cannot get back. Plan it on purpose, protect your focus and learn to say no to what does not serve your priorities.',
      tips: [
        'The night before, choose your top three priorities for tomorrow.',
        'Block out sixty minutes of focused work with notifications off.',
        'Politely decline or postpone one request that does not match your priorities.'
      ]
    },
    {
      title: 'Selflessly serve others',
      summary: 'Helping people without expecting anything back gives your life meaning and connects you with others. Giving attention, time and knowledge counts as much as giving money.',
      tips: [
        'Do one kind thing today without being asked and without telling anyone.',
        'Listen to someone for a full conversation without interrupting or checking your phone.',
        'Share a skill, an idea or some of your time with someone who can use it.'
      ]
    },
    {
      title: 'Embrace the present',
      summary: 'Life only happens right now. Worrying about the future or replaying the past steals today, so practice returning your attention to what is in front of you.',
      tips: [
        'Slow down one routine, such as a meal, and give it your full attention.',
        'Take three deep breaths before you switch from one task to another.',
        'Each evening, write down three things you are grateful for.'
      ]
    }
  ];

  var viewCycle = null; // 0-based cycle index on screen; null means the current cycle

  function startDate() { return H.fromKey(App.state.monkStart); }

  function currentCycleIndex() {
    var elapsed = H.diffDays(startDate(), new Date());
    return elapsed < 0 ? 0 : Math.floor(elapsed / CYCLE_DAYS);
  }

  function shownCycleIndex() {
    return viewCycle === null ? currentCycleIndex() : viewCycle;
  }

  function cycleFirstDay(idx) { return H.addDays(startDate(), idx * CYCLE_DAYS); }

  function cycleIsValid(idx) {
    return idx >= 0 &&
      H.isValidKey(H.toKey(cycleFirstDay(idx))) &&
      H.isValidKey(H.toKey(H.addDays(cycleFirstDay(idx), CYCLE_DAYS - 1)));
  }

  function rangeText(first, last) {
    if (first.getFullYear() !== last.getFullYear()) {
      return H.fmtShort(first) + ', ' + first.getFullYear() + ' \u2013 ' + H.fmtShort(last) + ', ' + last.getFullYear();
    }
    return H.fmtShort(first) + ' \u2013 ' + H.fmtShort(last) + ', ' + last.getFullYear();
  }

  function techniquesList(tips) {
    var ol = H.mk('ol', 'tips');
    tips.forEach(function (t) { ol.appendChild(H.mk('li', null, t)); });
    return ol;
  }

  function renderFocus(idx, lessonIdx, first, last) {
    var box = document.getElementById('monk-focus');
    var lesson = LESSONS[lessonIdx];
    H.clear(box);
    box.appendChild(H.mk('p', 'focus-kicker', rangeText(first, last)));
    box.appendChild(H.mk('p', 'focus-meta', 'Lesson ' + (lessonIdx + 1) + ' of ' + LESSONS.length +
      ' \u00b7 Round ' + (Math.floor(idx / LESSONS.length) + 1)));
    box.appendChild(H.mk('h3', 'focus-title', lesson.title));
    box.appendChild(H.mk('p', 'focus-text', lesson.summary));
    box.appendChild(H.mk('h4', 'tips-title', 'Try this'));
    box.appendChild(techniquesList(lesson.tips));
  }

  function renderGrid(first, focusKey) {
    var grid = document.getElementById('monk-grid');
    var todayKey = H.toKey(new Date());
    var done = 0;
    var focusBtn = null;
    H.clear(grid);
    for (var i = 0; i < CYCLE_DAYS; i++) {
      var date = H.addDays(first, i);
      var key = H.toKey(date);
      var valid = H.isValidKey(key);
      var marked = valid && App.state.monkDays[key] === true;
      if (marked) { done++; }
      var btn = H.mk('button', 'monk-day');
      btn.type = 'button';
      btn.setAttribute('data-key', key);
      btn.disabled = !valid;
      btn.setAttribute('aria-pressed', marked ? 'true' : 'false');
      btn.setAttribute('aria-label', 'Day ' + (i + 1) + ' of ' + CYCLE_DAYS + ', ' + H.fmtFull(date) +
        (key === todayKey ? ', today' : '') + (marked ? ', done' : ', not done'));
      if (marked) { btn.classList.add('done'); }
      if (key === todayKey) { btn.classList.add('today'); }
      btn.appendChild(H.mk('span', 'monk-num', String(date.getDate())));
      var dot = H.mk('span', marked ? 'monk-dot on' : 'monk-dot');
      dot.setAttribute('aria-hidden', 'true');
      btn.appendChild(dot);
      grid.appendChild(btn);
      if (key === focusKey) { focusBtn = btn; }
    }
    if (focusBtn) { focusBtn.focus({ preventScroll: true }); }
    return done;
  }

  function renderReference() {
    var wrap = document.getElementById('monk-lessons');
    if (wrap.childElementCount) { return; } // static content, build once
    LESSONS.forEach(function (lesson, i) {
      var details = H.mk('details', 'lesson-card');
      details.appendChild(H.mk('summary', null, (i + 1) + '. ' + lesson.title));
      details.appendChild(H.mk('p', null, lesson.summary));
      details.appendChild(H.mk('h4', 'tips-title', 'Try this'));
      var ul = H.mk('ul', 'tips');
      lesson.tips.forEach(function (t) { ul.appendChild(H.mk('li', null, t)); });
      details.appendChild(ul);
      wrap.appendChild(details);
    });
  }

  function render(focusKey) {
    var idx = shownCycleIndex();
    if (!cycleIsValid(idx)) { viewCycle = null; idx = currentCycleIndex(); }
    var lessonIdx = H.mod(idx, LESSONS.length);
    var first = cycleFirstDay(idx);
    var last = H.addDays(first, CYCLE_DAYS - 1);

    document.getElementById('monk-title').textContent = 'Cycle ' + (idx + 1) + ' \u00b7 ' + LESSONS[lessonIdx].title;
    document.getElementById('monk-prev').disabled = idx <= 0;
    document.getElementById('monk-next').disabled = !cycleIsValid(idx + 1);
    document.getElementById('monk-start').value = App.state.monkStart;

    renderFocus(idx, lessonIdx, first, last);
    var done = renderGrid(first, focusKey);
    document.getElementById('monk-progress').textContent = done + '/' + CYCLE_DAYS + ' days done';
    renderReference();
  }

  function shiftCycle(delta) {
    var next = shownCycleIndex() + delta;
    if (!cycleIsValid(next)) { return; }
    viewCycle = next;
    render();
  }

  function onDayClick(e) {
    var btn = e.target.closest ? e.target.closest('.monk-day') : null;
    if (!btn) { return; }
    var key = btn.getAttribute('data-key');
    if (!H.isValidKey(key)) { return; }
    if (App.state.monkDays[key] === true) { delete App.state.monkDays[key]; }
    else { App.state.monkDays[key] = true; }
    App.save();
    render(key);
  }

  function onStartChange() {
    var input = document.getElementById('monk-start');
    if (H.isValidKey(input.value)) {
      App.state.monkStart = input.value;
      App.save();
      viewCycle = null; // back to the current cycle
    }
    render();
  }

  function init() {
    document.getElementById('monk-prev').addEventListener('click', function () { shiftCycle(-1); });
    document.getElementById('monk-next').addEventListener('click', function () { shiftCycle(1); });
    document.getElementById('monk-current').addEventListener('click', function () { viewCycle = null; render(); });
    document.getElementById('monk-grid').addEventListener('click', onDayClick);
    document.getElementById('monk-start').addEventListener('change', onStartChange);
  }

  App.register({
    init: init,
    render: function () {
      render();
    }
  });
})();
