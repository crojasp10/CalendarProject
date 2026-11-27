/* Tab 3: lessons inspired by "The Monk Who Sold His Ferrari" by Robin Sharma.
   All summaries are written in my own words; none of the book's text is reproduced. */
(function () {
  'use strict';

  var LESSONS = [
    {
      title: 'Master your mind',
      summary: 'Your thoughts shape your mood, choices and results. Instead of letting the mind run on autopilot, train it to focus on what you choose, the way you would train a muscle.',
      techniques: [
        'Spend a few minutes each day visualizing one calm, simple object (the book uses a rose) and gently bring your attention back every time it wanders.',
        'Notice a negative thought, name it, and replace it with a more useful one.',
        'Feed your mind on purpose: limit noise and doom-scrolling, and read or listen to things that build you up.'
      ]
    },
    {
      title: 'Follow your purpose',
      summary: 'A fulfilling life comes from doing work that fits your talents and values, not just from chasing status. Knowing why you do something gives you energy when it gets hard.',
      techniques: [
        'Write down what you would do even if no one paid you or applauded you.',
        'List your strengths and the activities in which time seems to disappear.',
        'Pick one small action this week that moves you toward that purpose.'
      ]
    },
    {
      title: 'Practice kaizen',
      summary: 'Kaizen means constant, gradual improvement. Small daily upgrades to your body, mind and habits add up to a big transformation over time.',
      techniques: [
        'Choose one tiny habit (a short walk, a page of reading, a glass of water) and do it daily.',
        'Give a new habit about three weeks of consistency before judging it.',
        'Each evening, note one thing you did better today than yesterday.'
      ]
    },
    {
      title: 'Live with discipline',
      summary: 'Discipline is doing what matters even when you do not feel like it. It starts with small, deliberate acts of self-control, which build confidence for larger ones.',
      techniques: [
        'Do one small thing you are tempted to skip, just to prove you can.',
        'Make your plan visible: set a specific time and place for the habit.',
        'Remove one distraction from your environment today.'
      ]
    },
    {
      title: 'Respect your time',
      summary: 'Time is the one resource you cannot get back. Guard it by choosing what deserves it, and spend it first on your priorities.',
      techniques: [
        'Each morning, pick the top three things that must get done and do the most important one first.',
        'Block time for deep work and for rest, and treat both as appointments.',
        'Say no to one low-value request this week.'
      ]
    },
    {
      title: 'Selflessly serve others',
      summary: 'Helping others, without expecting something back, gives life meaning and tends to bring more happiness than self-focus. Generosity is also a quiet way to grow.',
      techniques: [
        'Do one kind act each day, big or small, without telling anyone.',
        'Listen fully to someone today without trying to fix or reply.',
        'Share a skill or some time with a person or cause you care about.'
      ]
    },
    {
      title: 'Embrace the present',
      summary: 'Life only happens now. Worrying about the future or replaying the past steals the moment you actually have, so gratitude and attention bring peace.',
      techniques: [
        'Pause three times a day for a slow breath and notice what is around you.',
        'Write down three things you are grateful for each night.',
        'Give one conversation or one meal your full attention, with no screen.'
      ]
    }
  ];

  var rendered = false;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function render() {
    if (rendered) { return; }
    var container = document.getElementById('monk-list');
    if (!container) { return; }

    LESSONS.forEach(function (lesson, i) {
      var card = el('details', 'card');
      var summary = el('summary');
      summary.appendChild(el('span', 'num', String(i + 1)));
      summary.appendChild(document.createTextNode(lesson.title));
      card.appendChild(summary);

      var body = el('div', 'card-body');
      body.appendChild(el('p', '', lesson.summary));
      body.appendChild(el('h3', '', 'Try this'));
      var ul = el('ul');
      lesson.techniques.forEach(function (t) { ul.appendChild(el('li', '', t)); });
      body.appendChild(ul);
      card.appendChild(body);

      container.appendChild(card);
    });
    rendered = true;
  }

  window.App.register({ render: render });
})();
