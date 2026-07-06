/* ============================================================
   data/quotes.js  ->  LifeOS.Quotes
   Motivational fuel: best-selling books + Qur'an & hadith.
   ============================================================ */
(function (NS) {
  'use strict';
  const ALL = [
    { q: 'You do not rise to the level of your goals. You fall to the level of your systems.', by: 'James Clear', src: 'Atomic Habits' },
    { q: 'Every action you take is a vote for the type of person you wish to become.', by: 'James Clear', src: 'Atomic Habits' },
    { q: 'Verily, with hardship comes ease.', by: "Qur'an 94:6", src: 'Ash-Sharh', arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا' },
    { q: 'The strong believer is better and more beloved to Allah than the weak believer, though there is good in both.', by: 'Prophet Muhammad ﷺ', src: 'Sahih Muslim' },
    { q: 'Take advantage of five before five: your youth before old age, your health before sickness.', by: 'Prophet Muhammad ﷺ', src: 'Al-Hakim' },
    { q: 'Discipline equals freedom.', by: 'Jocko Willink', src: 'Discipline Equals Freedom' },
    { q: 'You should never see exercise as a debt you have to repay.', by: 'Dr Peter Attia', src: 'Outlive' },
    { q: 'Anchor a new habit to a routine you already have.', by: 'BJ Fogg', src: 'Tiny Habits' },
    { q: 'Allah does not burden a soul beyond that it can bear.', by: "Qur'an 2:286", src: 'Al-Baqarah' },
    { q: 'Sleep is the single most effective thing we can do to reset our brain and body health each day.', by: 'Matthew Walker', src: 'Why We Sleep' },
    { q: 'The best of deeds are those done consistently, even if small.', by: 'Prophet Muhammad ﷺ', src: 'Bukhari & Muslim' },
    { q: 'Muscle is the organ of longevity.', by: 'Attia / Lyon', src: 'Outlive' },
    { q: 'Own the morning: light, movement, and delay caffeine 90 minutes.', by: 'Dr Andrew Huberman', src: 'Huberman Lab' },
    { q: 'Protein and resistance training are the twin pillars of body recomposition.', by: 'Dr Layne Norton', src: 'Nutritional Sciences' },
    { q: 'Motivation is overvalued. Environment often matters more.', by: 'James Clear', src: 'Atomic Habits' },
    { q: 'You must do the things you think you cannot do.', by: 'Discipline over comfort', src: 'Daily reminder' }
  ];
  function hash(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);}
  NS.Quotes = {
    ALL,
    ofDay(d = new Date()) { return ALL[hash(d.toISOString().slice(0, 10)) % ALL.length]; },
    random() { return ALL[Math.floor(Math.random() * ALL.length)]; }
  };
})(window.LifeOS = window.LifeOS || {});
