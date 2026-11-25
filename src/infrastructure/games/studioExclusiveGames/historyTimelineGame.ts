import type { StudioExclusiveGameBlueprint } from '../../../core/domain/games';

export const HISTORY_TIMELINE_BLUEPRINT: StudioExclusiveGameBlueprint = {
  code: 'history-timeline-challenge',
  title: 'خط زمان تاریخ و اندیشه',
  slug: 'history-timeline-challenge',
  version: '1.0.0',
  educationalGoal:
    'شناخت ترتیب تاریخی دستاوردهای علمی، فرهنگی و تمدنی ایران و جهان و درک پیوستگی اندیشه‌ی انسانی در گذر سده‌ها',
  targetAgeKeys: ['teen', 'youth', 'adult'],
  targetAgeLabel: 'نوجوان، جوان و بزرگسال (۱۲ سال به بالا)',
  scoringRules:
    '۵ دوره‌ی مرتب‌سازی سه‌تایی از قدیمی‌ترین به جدیدترین رویداد؛ چینش کاملاً دقیق ۲۰۰ امتیاز و جایگذاری درست یک کارت ۷۵ امتیاز دارد (حداکثر ۱۰۰۰ امتیاز).',
  maxScore: 1000,
  endMessage:
    'درک توالی تاریخ نشان می‌دهد هیچ پیشرفت علمی یا تمدنی ناگهانی نبوده است؛ اندیشه‌ی امروز بر دوش کوشش و تجربه‌ی نسل‌های گذشته ایستاده است.',
  description:
    'در ۵ دوره‌ی چالشی، رویدادهای مهم تاریخ علم و تمدن ایران و جهان را از قدیمی‌ترین به جدیدترین بر محور زمان بچینید.',
  topicSlugHint: 'تاریخ',
};

export function getHistoryTimelineFiles(): Array<{
  path: string;
  content: string;
}> {
  const manifestJson = JSON.stringify(
    {
      code: HISTORY_TIMELINE_BLUEPRINT.code,
      title: HISTORY_TIMELINE_BLUEPRINT.title,
      version: HISTORY_TIMELINE_BLUEPRINT.version,
      author: 'Meraj Andisheh Studio',
      targetAgeKeys: HISTORY_TIMELINE_BLUEPRINT.targetAgeKeys,
      maxScore: HISTORY_TIMELINE_BLUEPRINT.maxScore,
      sandbox: 'allow-scripts',
      postMessageType: 'MERAJ_GAME_SCORE',
    },
    null,
    2,
  );

  const indexHtml = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>خط زمان تاریخ و اندیشه | استودیو معراج اندیشه</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="shell">
    <header class="hud">
      <div class="brand-wrap">
        <span class="studio-badge">تولید اختصاصی معراج اندیشه</span>
        <strong class="game-title">خط زمان تاریخ و اندیشه</strong>
      </div>
      <div class="hud-stats">
        <span id="hud-round" class="pill">دور ۱ از ۵</span>
        <span id="hud-score" class="pill accent">امتیاز: ۰ / ۱۰۰۰</span>
        <button id="sound-btn" type="button" class="btn-ghost">صدا: روشن</button>
      </div>
    </header>

    <section id="screen-intro" class="card">
      <h1>سفر در محور زمان علم و تمدن</h1>
      <p>در هر مرحله سه رویداد علمی یا فرهنگی مهم را می‌بینید. آن‌ها را به ترتیب زمانی از <strong>قدیمی‌ترین (نخست)</strong> تا <strong>جدیدترین (سوم)</strong> روی خط زمان بچینید.</p>
      <ul class="rules-list">
        <li>۵ مرحله‌ی تخصصی تاریخ علم، تمدن ایران و اندیشه</li>
        <li>چینش کاملاً درست: ۲۰۰ امتیاز · یک جایگاه درست: ۷۵ امتیاز (سقف ۱۰۰۰ امتیاز)</li>
        <li>با کلیک روی کارت‌ها، آن‌ها را وارد جایگاه‌های ۱ تا ۳ خط زمان کنید</li>
      </ul>
      <div class="actions-end">
        <button id="start-btn" type="button" class="btn-primary">شروع چالش خط زمان</button>
      </div>
    </section>

    <section id="screen-round" class="card hidden">
      <div class="round-head">
        <span id="round-theme" class="tag"></span>
        <span class="hint-text">به ترتیب از قدیمی‌ترین (۱) به جدیدترین (۳) انتخاب کنید</span>
      </div>

      <div class="slots-grid" aria-label="جایگاه‌های خط زمان">
        <div class="slot-box" data-slot="0">
          <div class="slot-num">۱ · قدیمی‌ترین</div>
          <div id="slot-text-0" class="slot-value empty">در انتظار انتخاب...</div>
        </div>
        <div class="slot-box" data-slot="1">
          <div class="slot-num">۲ · میانی</div>
          <div id="slot-text-1" class="slot-value empty">در انتظار انتخاب...</div>
        </div>
        <div class="slot-box" data-slot="2">
          <div class="slot-num">۳ · جدیدترین</div>
          <div id="slot-text-2" class="slot-value empty">در انتظار انتخاب...</div>
        </div>
      </div>

      <div id="cards-pool" class="cards-pool"></div>

      <div id="round-feedback" class="feedback hidden" aria-live="polite">
        <div id="feedback-heading" class="verdict-title"></div>
        <ul id="feedback-timeline" class="timeline-reveal"></ul>
      </div>

      <div class="controls-bar">
        <button id="reset-pick-btn" type="button" class="btn-ghost">پاک کردن چینش فعلی</button>
        <div class="right-btns">
          <button id="submit-round-btn" type="button" class="btn-primary" disabled>ثبت ترتیب زمانی</button>
          <button id="next-round-btn" type="button" class="btn-primary hidden">مرحله‌ی بعدی</button>
        </div>
      </div>
    </section>

    <section id="screen-result" class="card hidden">
      <span class="studio-badge">کارنامه‌ی خط زمان</span>
      <h2 id="result-title">مورخ پژوهنده</h2>
      <p id="result-summary" class="result-summary"></p>
      <div class="actions-end">
        <button id="restart-btn" type="button" class="btn-primary">آغاز مجدد چالش</button>
      </div>
    </section>
  </main>
  <script src="game.js"></script>
</body>
</html>`;

  const styleCss = `* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  font-family: Vazirmatn, Tahoma, 'DejaVu Sans', sans-serif;
  background: #14111D;
  color: #F8FAFC;
  direction: rtl;
}
body {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
}
.shell {
  width: 100%;
  max-width: 760px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.hidden { display: none !important; }
.hud {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  background: #1F1A2E;
  border: 1px solid #3B3154;
  border-radius: 14px;
  padding: 12px 16px;
}
.brand-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.studio-badge {
  display: inline-block;
  width: fit-content;
  font-size: 11px;
  font-weight: 700;
  color: #C4B5FD;
  background: rgba(139, 92, 246, 0.16);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 999px;
  padding: 2px 10px;
}
.game-title { font-size: 16px; color: #F8FAFC; }
.hud-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.pill {
  background: #14111D;
  border: 1px solid #3B3154;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
}
.pill.accent { border-color: #8B5CF6; color: #DDD6FE; }
.card {
  background: #1F1A2E;
  border: 1px solid #3B3154;
  border-radius: 16px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
h1, h2 { margin: 0; line-height: 1.5; }
p { margin: 0; line-height: 1.8; color: #CBD5E1; font-size: 14px; }
.rules-list {
  margin: 0;
  padding-right: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #E2E8F0;
}
.round-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.tag {
  font-size: 12px;
  font-weight: 700;
  color: #34D399;
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 8px;
  padding: 4px 10px;
}
.hint-text { font-size: 12px; color: #A5B4FC; }
.slots-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
@media (max-width: 600px) {
  .slots-grid { grid-template-columns: 1fr; }
}
.slot-box {
  background: #14111D;
  border: 1px dashed #4C3F6E;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 78px;
}
.slot-num { font-size: 11px; font-weight: 700; color: #A78BFA; }
.slot-value { font-size: 13px; font-weight: 600; color: #F8FAFC; line-height: 1.5; }
.slot-value.empty { color: #64748B; font-weight: 400; }
.cards-pool {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.event-btn {
  text-align: right;
  padding: 13px 16px;
  border-radius: 12px;
  border: 1px solid #4C3F6E;
  background: #14111D;
  color: #F8FAFC;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.event-btn:hover:not(:disabled) {
  border-color: #A78BFA;
  background: #27203B;
}
.event-btn.picked {
  border-color: #8B5CF6;
  background: #2E1065;
}
.event-btn:disabled { cursor: default; opacity: 0.9; }
.event-title { font-size: 14px; font-weight: 600; }
.event-order-badge {
  font-size: 12px;
  font-weight: 700;
  color: #DDD6FE;
  background: #4C1D95;
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
}
.feedback {
  border-radius: 12px;
  padding: 14px;
  border: 1px solid #4C3F6E;
  background: #14111D;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.feedback.perfect { border-color: #10B981; background: rgba(6, 78, 59, 0.35); }
.feedback.partial { border-color: #F59E0B; background: rgba(120, 53, 15, 0.35); }
.verdict-title { font-size: 14px; font-weight: 700; }
.timeline-reveal {
  margin: 0;
  padding-right: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #E2E8F0;
  line-height: 1.7;
}
.controls-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.right-btns { display: flex; gap: 8px; }
.actions-end { display: flex; justify-content: flex-end; }
.btn-primary {
  min-height: 44px;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background: #8B5CF6;
  color: #FFFFFF;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.btn-primary:hover:not(:disabled) { background: #7C3AED; }
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-ghost {
  min-height: 36px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #4C3F6E;
  background: transparent;
  color: #E2E8F0;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}
.btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }
.result-summary { font-size: 16px; font-weight: 700; color: #DDD6FE; }`;

  const gameJs = `(function () {
  var ROUNDS = [
    {
      theme: 'بنیان‌های علوم در دوران شکوفایی تمدن اسلامی',
      events: [
        { id: 'khwarizmi', title: 'تدوین کتاب جبر و مقابله توسط خوارزمی', yearLabel: 'حدود ۲۱۰ هجری قمری (سده ۹ میلادی)', sortOrder: 1 },
        { id: 'biruni', title: 'محاسبه‌ی شعاع زمین در نندنه توسط ابوریحان بیرونی', yearLabel: 'حدود ۴۱۰ هجری قمری (سده ۱۱ میلادی)', sortOrder: 2 },
        { id: 'tusi', title: 'تأسیس رصدخانه‌ی مراغه به سرپرستی خواجه نصیرالدین طوسی', yearLabel: '۶۵۷ هجری قمری (۱۲۵۹ میلادی)', sortOrder: 3 }
      ],
      displaySequence: [1, 2, 0]
    },
    {
      theme: 'نورشناسی، پزشکی و ریاضیات',
      events: [
        { id: 'ibn-haytham', title: 'تألیف کتاب المناظر در نورشناسی تجربی (ابن هیثم)', yearLabel: 'اوایل سده ۱۱ میلادی (۴۱۱ ق)', sortOrder: 1 },
        { id: 'ibn-sina', title: 'تکمیل کتاب قانون در طب توسط بوعلی سینا', yearLabel: 'حدود ۴۱۵ هجری قمری (۱۰۲۵ میلادی)', sortOrder: 2 },
        { id: 'kashani', title: 'محاسبه‌ی عدد پی با ۱۶ رقم اعشار توسط جمشید کاشانی', yearLabel: '۸۲۷ هجری قمری (۱۴۲۴ میلادی)', sortOrder: 3 }
      ],
      displaySequence: [2, 0, 1]
    },
    {
      theme: 'ادبیات و حکمت در ایران',
      events: [
        { id: 'shahnameh', title: 'سرایش شاهنامه‌ی حکیم ابوالقاسم فردوسی', yearLabel: 'پایان سده ۴ هجری (حوالی ۴۰۰ قمری)', sortOrder: 1 },
        { id: 'golestan', title: 'نگارش گلستان سعدی شیرازی', yearLabel: '۶۵۶ هجری قمری', sortOrder: 2 },
        { id: 'hafez', title: 'سرایش دیوان حافظ شیرازی', yearLabel: 'سده ۸ هجری قمری', sortOrder: 3 }
      ],
      displaySequence: [1, 2, 0]
    },
    {
      theme: 'تحولات ارتباطات و صنعت مدرن',
      events: [
        { id: 'printing', title: 'گسترش چاپ سربی متحرک در اروپا و جهان', yearLabel: 'میانه سده ۱۵ میلادی (۱۴۵۰)', sortOrder: 1 },
        { id: 'telegraph', title: 'راه‌اندازی نخستین خطوط تلگراف برقی در ایران و جهان', yearLabel: 'میانه سده ۱۹ میلادی (۱۲۳۷ خورشیدی)', sortOrder: 2 },
        { id: 'web', title: 'معرفی وب جهانی (World Wide Web)', yearLabel: '۱۳۶۸ خورشیدی (۱۹۸۹ میلادی)', sortOrder: 3 }
      ],
      displaySequence: [2, 0, 1]
    },
    {
      theme: 'تاریخ معاصر ایران و دانش بومی',
      events: [
        { id: 'darolfonoon', title: 'گشایش مدرسه‌ی دارالفنون در تهران', yearLabel: '۱۲۳۰ خورشیدی (۱۸۵۱ میلادی)', sortOrder: 1 },
        { id: 'nationalization', title: 'ملی شدن صنعت نفت ایران', yearLabel: '۲۹ اسفند ۱۳۲۹ خورشیدی', sortOrder: 2 },
        { id: 'omid', title: 'پرتاب ماهواره‌ی بومی امید به مدار زمین', yearLabel: 'بهمن ۱۳۸۷ خورشیدی', sortOrder: 3 }
      ],
      displaySequence: [1, 0, 2]
    }
  ];

  var MAX_SCORE = 1000;
  var faMap = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  function toFa(v) {
    return String(v).replace(/[0-9]/g, function (d) { return faMap[Number(d)]; });
  }

  var state = {
    roundIndex: 0,
    score: 0,
    picks: [],
    submitted: false,
    sound: true
  };

  var screenIntro = document.getElementById('screen-intro');
  var screenRound = document.getElementById('screen-round');
  var screenResult = document.getElementById('screen-result');
  var hudRound = document.getElementById('hud-round');
  var hudScore = document.getElementById('hud-score');
  var soundBtn = document.getElementById('sound-btn');

  var roundTheme = document.getElementById('round-theme');
  var cardsPool = document.getElementById('cards-pool');
  var roundFeedback = document.getElementById('round-feedback');
  var feedbackHeading = document.getElementById('feedback-heading');
  var feedbackTimeline = document.getElementById('feedback-timeline');
  var resetPickBtn = document.getElementById('reset-pick-btn');
  var submitRoundBtn = document.getElementById('submit-round-btn');
  var nextRoundBtn = document.getElementById('next-round-btn');
  var resultSummary = document.getElementById('result-summary');
  var resultTitle = document.getElementById('result-title');

  var slotTextEls = [
    document.getElementById('slot-text-0'),
    document.getElementById('slot-text-1'),
    document.getElementById('slot-text-2')
  ];

  function chime(freq, sec) {
    if (!state.sound) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + sec);
    } catch (_) {}
  }

  function updateHud() {
    var step = Math.min(state.roundIndex + 1, ROUNDS.length);
    hudRound.textContent = 'دور ' + toFa(step) + ' از ' + toFa(ROUNDS.length);
    hudScore.textContent = 'امتیاز: ' + toFa(state.score) + ' / ' + toFa(MAX_SCORE);
  }

  function syncSlotsAndButtons() {
    var round = ROUNDS[state.roundIndex];
    for (var s = 0; s < 3; s += 1) {
      var pickedId = state.picks[s];
      if (!pickedId) {
        slotTextEls[s].textContent = 'در انتظار انتخاب...';
        slotTextEls[s].className = 'slot-value empty';
      } else {
        var found = round.events.find(function (ev) { return ev.id === pickedId; });
        slotTextEls[s].textContent = found ? found.title : '';
        slotTextEls[s].className = 'slot-value';
      }
    }

    var poolButtons = cardsPool.querySelectorAll('button');
    poolButtons.forEach(function (btn) {
      var id = btn.getAttribute('data-id');
      var orderPos = state.picks.indexOf(id);
      var badge = btn.querySelector('.event-order-badge');
      if (orderPos !== -1) {
        btn.classList.add('picked');
        badge.textContent = 'جایگاه ' + toFa(orderPos + 1);
      } else {
        btn.classList.remove('picked');
        badge.textContent = 'انتخاب برای محور زمان';
      }
      btn.disabled = state.submitted;
    });

    submitRoundBtn.disabled = state.submitted || state.picks.length !== 3;
    resetPickBtn.disabled = state.submitted || state.picks.length === 0;
  }

  function togglePick(eventId) {
    if (state.submitted) return;
    var existingIdx = state.picks.indexOf(eventId);
    if (existingIdx !== -1) {
      state.picks.splice(existingIdx, 1);
    } else if (state.picks.length < 3) {
      state.picks.push(eventId);
    }
    syncSlotsAndButtons();
  }

  function renderRound() {
    var round = ROUNDS[state.roundIndex];
    state.picks = [];
    state.submitted = false;
    updateHud();

    roundTheme.textContent = round.theme;
    roundFeedback.className = 'feedback hidden';
    feedbackTimeline.innerHTML = '';
    submitRoundBtn.classList.remove('hidden');
    resetPickBtn.classList.remove('hidden');
    nextRoundBtn.classList.add('hidden');

    cardsPool.innerHTML = '';
    round.displaySequence.forEach(function (evIdx) {
      var ev = round.events[evIdx];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'event-btn';
      btn.setAttribute('data-id', ev.id);

      var titleSpan = document.createElement('span');
      titleSpan.className = 'event-title';
      titleSpan.textContent = ev.title;

      var badgeSpan = document.createElement('span');
      badgeSpan.className = 'event-order-badge';
      badgeSpan.textContent = 'انتخاب برای محور زمان';

      btn.appendChild(titleSpan);
      btn.appendChild(badgeSpan);
      btn.addEventListener('click', function () { togglePick(ev.id); });
      cardsPool.appendChild(btn);
    });

    syncSlotsAndButtons();
  }

  function submitRound() {
    if (state.submitted || state.picks.length !== 3) return;
    state.submitted = true;
    var round = ROUNDS[state.roundIndex];

    var exactMatches = 0;
    for (var i = 0; i < 3; i += 1) {
      var ev = round.events.find(function (e) { return e.id === state.picks[i]; });
      if (ev && ev.sortOrder === i + 1) {
        exactMatches += 1;
      }
    }

    var earned = 0;
    if (exactMatches === 3) {
      earned = 200;
      roundFeedback.className = 'feedback perfect';
      feedbackHeading.textContent = 'چینش کاملاً دقیق! (+۲۰۰ امتیاز)';
      chime(680, 0.14);
    } else if (exactMatches === 1) {
      earned = 75;
      roundFeedback.className = 'feedback partial';
      feedbackHeading.textContent = 'یکی از جایگاه‌ها دقیق بود! (+۷۵ امتیاز)';
      chime(440, 0.14);
    } else {
      roundFeedback.className = 'feedback partial';
      feedbackHeading.textContent = 'توالی دقیق تاریخی این مرحله به شکل زیر است:';
      chime(230, 0.18);
    }

    state.score += earned;
    updateHud();

    feedbackTimeline.innerHTML = '';
    round.events.slice().sort(function (a, b) { return a.sortOrder - b.sortOrder; }).forEach(function (ev, idx) {
      var li = document.createElement('li');
      li.textContent = toFa(idx + 1) + '. ' + ev.title + ' — (' + ev.yearLabel + ')';
      feedbackTimeline.appendChild(li);
    });

    syncSlotsAndButtons();
    submitRoundBtn.classList.add('hidden');
    resetPickBtn.classList.add('hidden');
    nextRoundBtn.textContent = state.roundIndex + 1 >= ROUNDS.length ? 'پایان و ثبت امتیاز نهایی' : 'مرحله‌ی بعدی';
    nextRoundBtn.classList.remove('hidden');
  }

  function finish() {
    screenRound.classList.add('hidden');
    screenResult.classList.remove('hidden');

    if (state.score >= 850) {
      resultTitle.textContent = 'استادخط زمان و تاریخ علم';
    } else if (state.score >= 550) {
      resultTitle.textContent = 'پژوهشگر تاریخ اندیشه';
    } else {
      resultTitle.textContent = 'رهجوی تاریخ تمدن';
    }

    resultSummary.textContent =
      'شما ' + toFa(ROUNDS.length) + ' مرحله‌ی محور زمان را به پایان رساندید و امتیاز ' +
      toFa(state.score) + ' از ' + toFa(MAX_SCORE) + ' را ثبت کردید.';

    chime(880, 0.2);
    try {
      window.parent.postMessage({
        type: 'MERAJ_GAME_SCORE',
        score: state.score,
        maxScore: MAX_SCORE,
        completed: true
      }, '*');
    } catch (_) {}
  }

  function start() {
    state.roundIndex = 0;
    state.score = 0;
    screenIntro.classList.add('hidden');
    screenResult.classList.add('hidden');
    screenRound.classList.remove('hidden');
    renderRound();
  }

  document.getElementById('start-btn').addEventListener('click', start);
  document.getElementById('restart-btn').addEventListener('click', start);
  resetPickBtn.addEventListener('click', function () {
    if (state.submitted) return;
    state.picks = [];
    syncSlotsAndButtons();
  });
  submitRoundBtn.addEventListener('click', submitRound);
  nextRoundBtn.addEventListener('click', function () {
    if (state.roundIndex + 1 < ROUNDS.length) {
      state.roundIndex += 1;
      renderRound();
    } else {
      finish();
    }
  });
  soundBtn.addEventListener('click', function () {
    state.sound = !state.sound;
    soundBtn.textContent = state.sound ? 'صدا: روشن' : 'صدا: خاموش';
  });
  updateHud();
})();`;

  return [
    { path: 'index.html', content: indexHtml },
    { path: 'style.css', content: styleCss },
    { path: 'game.js', content: gameJs },
    { path: 'manifest.json', content: manifestJson },
  ];
}
