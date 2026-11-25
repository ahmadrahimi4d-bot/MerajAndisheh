import type { StudioExclusiveGameBlueprint } from '../../../core/domain/games';

export const MEDIA_LITERACY_DETECTIVE_BLUEPRINT: StudioExclusiveGameBlueprint = {
  code: 'media-literacy-detective',
  title: 'کارآگاه خبر و شایعه',
  slug: 'media-literacy-detective',
  version: '1.0.0',
  educationalGoal:
    'پرورش تفکر نقادانه، تشخیص نشانه‌های شایعه از خبر مستند و تمرین راستی‌آزمایی پیش از بازنشر در فضای مجازی',
  targetAgeKeys: ['child', 'teen'],
  targetAgeLabel: 'کودک و نوجوان (۷ تا ۱۵ سال)',
  scoringRules:
    '۸ پرونده‌ی رسانه‌ای کوتاه؛ هر تشخیص درست ۱۰۰ امتیاز دارد و تشخیص نادرست امتیاز ندارد (حداکثر ۸۰۰ امتیاز).',
  maxScore: 800,
  endMessage:
    'آفرین کارآگاه! خبر بدون منبع، تیتر هیجانی و درخواست فوروارد فوری، نشانه‌های هشدار شایعه هستند. همیشه پیش از باور یا بازنشر، منبع رسمی را بررسی کنید.',
  description:
    'در نقش کارآگاه جوان رسانه، ۸ پیام و خبر پرحاشیه را بررسی کنید، نشانه‌های خبر معتبر را بشناسید و جلوی پخش شایعه را بگیرید.',
  topicSlugHint: 'سواد-رسانه-ای',
};

export function getMediaLiteracyDetectiveFiles(): Array<{
  path: string;
  content: string;
}> {
  const manifestJson = JSON.stringify(
    {
      code: MEDIA_LITERACY_DETECTIVE_BLUEPRINT.code,
      title: MEDIA_LITERACY_DETECTIVE_BLUEPRINT.title,
      version: MEDIA_LITERACY_DETECTIVE_BLUEPRINT.version,
      author: 'Meraj Andisheh Studio',
      targetAgeKeys: MEDIA_LITERACY_DETECTIVE_BLUEPRINT.targetAgeKeys,
      maxScore: MEDIA_LITERACY_DETECTIVE_BLUEPRINT.maxScore,
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
  <title>کارآگاه خبر و شایعه | استودیو معراج اندیشه</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="shell">
    <header class="hud">
      <div class="brand-wrap">
        <span class="studio-badge">تولید اختصاصی معراج اندیشه</span>
        <strong class="game-title">کارآگاه خبر و شایعه</strong>
      </div>
      <div class="hud-stats">
        <span id="hud-step" class="pill">پرونده ۱ از ۸</span>
        <span id="hud-score" class="pill accent">امتیاز: ۰ / ۸۰۰</span>
        <button id="sound-btn" type="button" class="btn-ghost" aria-label="تغییر وضعیت صدا">صدا: روشن</button>
      </div>
    </header>

    <section id="screen-intro" class="card">
      <h1>پرونده‌ی کارآگاه رسانه باز شد</h1>
      <p>در هر مرحله یک پیام یا تیتر خبری به دست شما می‌رسد. سرنخ‌ها را دقیق بخوانید و تشخیص دهید این پیام <strong>معتبر و قابل استناد</strong> است یا یک <strong>شایعه و نیازمند بررسی</strong>!</p>
      <ul class="rules-list">
        <li>تعداد پرونده‌ها: ۸ مورد واقعی‌نما</li>
        <li>امتیاز هر تشخیص درست: ۱۰۰ امتیاز (سقف ۸۰۰ امتیاز)</li>
        <li>پس از هر انتخاب، دلیل رسانه‌ای آن برای شما توضیح داده می‌شود</li>
      </ul>
      <div class="actions-end">
        <button id="start-btn" type="button" class="btn-primary">آغاز مأموریت کارآگاه</button>
      </div>
    </section>

    <section id="screen-case" class="card hidden">
      <div class="case-meta">
        <span id="case-channel" class="tag"></span>
        <span id="case-date" class="date-label"></span>
      </div>

      <article class="evidence-box">
        <h2 id="case-headline" class="headline"></h2>
        <p id="case-body" class="case-body"></p>
        <div id="case-clue" class="clue-line"></div>
      </article>

      <div class="decision-grid">
        <button id="btn-credible" type="button" class="choice-btn credible">
          <span class="choice-title">معتبر و قابل استناد</span>
          <span class="choice-sub">منبع مشخص، لحن دقیق و قابل راستی‌آزمایی</span>
        </button>
        <button id="btn-rumor" type="button" class="choice-btn rumor">
          <span class="choice-title">شایعه و نیازمند بررسی</span>
          <span class="choice-sub">بی‌منبع، هیجانی یا دارای نشانه‌ی جعل</span>
        </button>
      </div>

      <div id="feedback-panel" class="feedback hidden" aria-live="polite">
        <div id="feedback-verdict" class="verdict-title"></div>
        <p id="feedback-reason" class="verdict-body"></p>
      </div>

      <div class="actions-end">
        <button id="next-btn" type="button" class="btn-primary hidden">پرونده‌ی بعدی</button>
      </div>
    </section>

    <section id="screen-result" class="card hidden">
      <span class="studio-badge">گزارش نهایی مأموریت</span>
      <h2 id="result-rank">تحلیل‌گر دقیق رسانه</h2>
      <p id="result-summary" class="result-summary"></p>
      <div class="tip-box">
        <strong>قانون طلایی کارآگاه:</strong> پیش از بازنشر هر خبر، این سه پرسش را بپرسید: «منبع کیست؟ تاریخ دقیق کجاست؟ آیا منبع رسمی هم آن را تأیید کرده است؟»
      </div>
      <div class="actions-end">
        <button id="restart-btn" type="button" class="btn-primary">تکرار چالش</button>
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
  background: #0B1324;
  color: #F1F5F9;
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
  max-width: 720px;
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
  background: #13203A;
  border: 1px solid #263A5E;
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
  color: #FCD34D;
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 999px;
  padding: 2px 10px;
}
.game-title {
  font-size: 16px;
  color: #F8FAFC;
}
.hud-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.pill {
  background: #0B1324;
  border: 1px solid #2A3F66;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
}
.pill.accent {
  border-color: #D97706;
  color: #FDE68A;
}
.card {
  background: #13203A;
  border: 1px solid #263A5E;
  border-radius: 16px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
h1, h2 {
  margin: 0;
  line-height: 1.5;
}
p {
  margin: 0;
  line-height: 1.8;
  color: #CBD5E1;
  font-size: 14px;
}
.rules-list {
  margin: 0;
  padding-right: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #E2E8F0;
}
.case-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.tag {
  font-size: 12px;
  font-weight: 700;
  color: #38BDF8;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 8px;
  padding: 4px 10px;
}
.date-label {
  font-size: 12px;
  color: #94A3B8;
}
.evidence-box {
  background: #0B1324;
  border: 1px solid #2A3F66;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.headline {
  font-size: 17px;
  color: #F8FAFC;
}
.case-body {
  font-size: 14px;
  color: #E2E8F0;
}
.clue-line {
  font-size: 12px;
  color: #FCD34D;
  background: rgba(245, 158, 11, 0.08);
  border-right: 3px solid #F59E0B;
  padding: 6px 10px;
  border-radius: 6px;
}
.decision-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
@media (max-width: 540px) {
  .decision-grid { grid-template-columns: 1fr; }
}
.choice-btn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #334E7B;
  background: #0B1324;
  color: #F8FAFC;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.choice-btn:hover:not(:disabled) {
  border-color: #F59E0B;
  background: #172A4E;
}
.choice-btn:disabled {
  cursor: default;
  opacity: 0.85;
}
.choice-btn.selected-correct {
  border-color: #10B981;
  background: #064E3B;
}
.choice-btn.selected-wrong {
  border-color: #EF4444;
  background: #7F1D1D;
}
.choice-title {
  font-size: 14px;
  font-weight: 700;
}
.choice-sub {
  font-size: 12px;
  color: #94A3B8;
}
.feedback {
  border-radius: 12px;
  padding: 14px;
  border: 1px solid #334E7B;
  background: #0F172A;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.feedback.ok { border-color: #10B981; background: rgba(6, 78, 59, 0.45); }
.feedback.fail { border-color: #EF4444; background: rgba(127, 29, 29, 0.45); }
.verdict-title { font-size: 14px; font-weight: 700; }
.verdict-body { font-size: 13px; color: #F1F5F9; }
.tip-box {
  background: #0B1324;
  border: 1px solid #2A3F66;
  border-radius: 10px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.8;
  color: #E2E8F0;
}
.result-summary {
  font-size: 16px;
  font-weight: 700;
  color: #FDE68A;
}
.actions-end {
  display: flex;
  justify-content: flex-end;
}
.btn-primary {
  min-height: 44px;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background: #F59E0B;
  color: #0B1324;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.btn-primary:hover { background: #FBBF24; }
.btn-ghost {
  min-height: 34px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #334E7B;
  background: transparent;
  color: #E2E8F0;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}`;

  const gameJs = `(function () {
  var CASES = [
    {
      channel: 'پیام فورواردی ناشناس',
      dateLabel: 'بدون تاریخ مشخص',
      headline: 'فوری فوری!! تمام مدارس کشور از فردا به مدت دو هفته تعطیل شدند!!',
      body: 'یک نفر در گروه محلی نوشته مدیرکل آموزش و پرورش همین الان تصمیم گرفته ولی هنوز سایت خبری اعلام نکرده؛ سریع برای ۲۰ نفر بفرستید تا جا نمانند.',
      clue: 'نشانه‌ی قابل توجه: علامت تعجب زیاد، نبود نام منبع رسمی و اصرار بر بازنشر عجولانه.',
      isCredible: false,
      explanation: 'این پیام نشانه‌های کلاسیک شایعه را دارد: منبع و تاریخ دقیق ندارد، با لحن هیجانی ترس یا شتاب ایجاد می‌کند و اعلام تعطیلی رسمی فقط از طریق مراجع رسمی آموزش و پرورش منتشر می‌شود.'
    },
    {
      channel: 'اطلاعیه‌ی رسمی سازمان هواشناسی',
      dateLabel: 'ثبت‌شده با تاریخ و شماره‌ی اطلاعیه',
      headline: 'هشدار سطح نارنجی بارش و کاهش دما در نوار شمالی کشور',
      body: 'اداره کل پیش‌بینی هواشناسی با انتشار نقشه‌ی هوایی و زمان‌بندی دقیق اعلام کرد از عصر سه‌شنبه تا پایان چهارشنبه در استان‌های شمالی بارش پاییزی و کاهش ۶ درجه‌ای دما رخ می‌دهد.',
      clue: 'نشانه‌ی قابل توجه: نام نهاد تخصصی، زمان آغاز و پایان روشن و داده‌ی عددی مشخص.',
      isCredible: true,
      explanation: 'خبر معتبر است زیرا از مرجع تخصصی رسمی صادر شده، زمان و محدوده‌ی جغرافیایی مشخص دارد و از اغراق یا ادعای نامستند پرهیز کرده است.'
    },
    {
      channel: 'تبلیغ پنهان در شبکه‌ی اجتماعی',
      dateLabel: 'امروز صبح',
      headline: 'کشف معجزه‌آسای ماده‌ی مخفی برای گرفتن نمره‌ی ۲۰ بدون هیچ مطالعه‌ای!',
      body: 'پژوهشگران ناشناس یک کشور دور دست فرمولی پیدا کرده‌اند که تنها با گوش دادن به یک فایل صوتی ۵ دقیقه‌ای همه‌ی درس‌ها را حفظ می‌شوید.',
      clue: 'نشانه‌ی قابل توجه: وعده‌ی غیرواقعی «بدون تلاش»، هویت نامعلوم پژوهشگران و نبود مقاله‌ی علمی.',
      isCredible: false,
      explanation: 'ادعاهای معجزه‌آسا و «راه‌های میان‌بر بدون تلاش» همراه با ارجاع مبهم به «پژوهشگران ناشناس»، از رایج‌ترین ترفندهای فریب و خبر جعلی است.'
    },
    {
      channel: 'مرکز تقویم مؤسسه‌ی ژئوفیزیک',
      dateLabel: 'گزارش علمی زمان‌دار',
      headline: 'زمان دقیق ماه‌گرفتگی جزئی قابل مشاهده در ایران اعلام شد',
      body: 'بر اساس محاسبات نجومی مرکز تقویم، این ماه‌گرفتگی در ساعت ۲۱:۱۴ آغاز و در ساعت ۲۳:۴۰ پایان می‌یابد و با چشم غیرمسلح قابل مشاهده است.',
      clue: 'نشانه‌ی قابل توجه: ارجاع به نهاد علمی مشخص و ساعت دقیق قابل بررسی توسط منجمان.',
      isCredible: true,
      explanation: 'پدیده‌های نجومی با محاسبات دقیق ریاضی پیش‌بینی می‌شوند و منبع علمی معتبر با ساعت و جزئیات مشخص آن را اعلام کرده است.'
    },
    {
      channel: 'تصویر بریده‌شده بدون پیوند منبع',
      dateLabel: 'نامشخص (اسکرین‌شات قدیمی)',
      headline: 'نقل‌قول جنجالی از یک دانشمند معروف بدون ذکر نام کتاب یا مصاحبه',
      body: 'روی عکس نوشته‌ای سفید یک جمله‌ی عجیب به نقل از ابوریحان بیرونی آمده که ادعا می‌کند او آینده‌ی اینترنت را پیش‌بینی کرده بوده است!',
      clue: 'نشانه‌ی قابل توجه: نسبت دادن جمله‌های مدرن به چهره‌های تاریخی بدون ذکر نام کتاب و صفحه.',
      isCredible: false,
      explanation: 'جعل نقل‌قول برای افراد مشهور و دانشمندان بسیار رایج است. هر نقل‌قول معتبر باید نام کتاب، فصل یا سخنرانی مستند داشته باشد.'
    },
    {
      channel: 'پورتال کتابخانه‌ی ملی',
      dateLabel: 'منتشرشده در بخش اخبار رویدادها',
      headline: 'برگزاری کارگاه رایگان داستان‌نویسی نوجوانان در روز پنج‌شنبه',
      body: 'بخش کودک و نوجوان کتابخانه اعلام کرد علاقه‌مندان ۱۲ تا ۱۵ سال می‌توانند با حضور والدین یا ثبت نام در نشانی رسمی کتابخانه در این نشست شرکت کنند.',
      clue: 'نشانه‌ی قابل توجه: نشانی رسمی، رده‌ی سنی روشن و شرایط شفاف ثبت‌نام.',
      isCredible: true,
      explanation: 'اطلاعیه دارای مرجع رسمی مشخص، جزئیات زمانی و سنی دقیق و فاقد هرگونه تله‌ی کلیکی یا درخواست اطلاعات مشکوک است.'
    },
    {
      channel: 'پیام هشداری تکراری',
      dateLabel: 'ارسال مجدد بدون نام نویسنده',
      headline: 'مراقب باشید! اگر ساعت ۳ شب گوشی را روشن بگذارید امواج فضایی صفحه را می‌سوزاند!',
      body: 'یکی از دوستانم گفت دیشب توی اخبار گفته ولی لینکش را گم کرده است. برای همه‌ی اعضای خانواده بفرستید تا نسوزد.',
      clue: 'نشانه‌ی قابل توجه: نبود مبنای علمی، ادعای «توی اخبار گفته بدون لینک» و ایجاد ترس.',
      isCredible: false,
      explanation: 'ترساندن مخاطب با ادعاهای شبه‌علمی و تکیه بر «دوستم گفته در اخبار بوده» بدون ارائه لینک یا گزارش معتبر، نشانه‌ی روشن شایعه است.'
    },
    {
      channel: 'ستاد رسمی نمایشگاه کتاب',
      dateLabel: 'ساعت ۱۰:۰۰ · اطلاعیه‌ی شماره‌ی ۴',
      headline: 'ساعات بازدید بخش کودک و ناشران آموزشی تغییر کرد',
      body: 'روابط عمومی نمایشگاه اعلام کرد برای رفاه خانواده‌ها، در روزهای پنج‌شنبه و جمعه درهای نمایشگاه از ساعت ۹ صبح تا ۲۰ باز خواهد بود.',
      clue: 'نشانه‌ی قابل توجه: شماره‌ی اطلاعیه، ذکر دقیق روزها و ساعات تغییر یافته.',
      isCredible: true,
      explanation: 'خبر از کانال روابط عمومی رویداد منتشر شده و اطلاعات کاربردی با زمان مشخص و لحن خبری متعادل ارائه می‌دهد.'
    }
  ];

  var POINTS_PER_CASE = 100;
  var MAX_SCORE = 800;
  var faMap = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];

  function toFa(num) {
    return String(num).replace(/[0-9]/g, function (d) { return faMap[Number(d)]; });
  }

  var state = {
    index: 0,
    score: 0,
    correctCount: 0,
    answered: false,
    sound: true
  };

  var screenIntro = document.getElementById('screen-intro');
  var screenCase = document.getElementById('screen-case');
  var screenResult = document.getElementById('screen-result');
  var hudStep = document.getElementById('hud-step');
  var hudScore = document.getElementById('hud-score');
  var soundBtn = document.getElementById('sound-btn');

  var caseChannel = document.getElementById('case-channel');
  var caseDate = document.getElementById('case-date');
  var caseHeadline = document.getElementById('case-headline');
  var caseBody = document.getElementById('case-body');
  var caseClue = document.getElementById('case-clue');

  var btnCredible = document.getElementById('btn-credible');
  var btnRumor = document.getElementById('btn-rumor');
  var feedbackPanel = document.getElementById('feedback-panel');
  var feedbackVerdict = document.getElementById('feedback-verdict');
  var feedbackReason = document.getElementById('feedback-reason');
  var nextBtn = document.getElementById('next-btn');

  var resultRank = document.getElementById('result-rank');
  var resultSummary = document.getElementById('result-summary');

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
    var step = Math.min(state.index + 1, CASES.length);
    hudStep.textContent = 'پرونده ' + toFa(step) + ' از ' + toFa(CASES.length);
    hudScore.textContent = 'امتیاز: ' + toFa(state.score) + ' / ' + toFa(MAX_SCORE);
  }

  function loadCase() {
    var item = CASES[state.index];
    state.answered = false;
    updateHud();

    caseChannel.textContent = item.channel;
    caseDate.textContent = item.dateLabel;
    caseHeadline.textContent = item.headline;
    caseBody.textContent = item.body;
    caseClue.textContent = item.clue;

    btnCredible.disabled = false;
    btnRumor.disabled = false;
    btnCredible.className = 'choice-btn credible';
    btnRumor.className = 'choice-btn rumor';
    feedbackPanel.className = 'feedback hidden';
    nextBtn.classList.add('hidden');
  }

  function decide(pickedCredible) {
    if (state.answered) return;
    state.answered = true;

    var item = CASES[state.index];
    var isRight = pickedCredible === item.isCredible;
    btnCredible.disabled = true;
    btnRumor.disabled = true;

    var pickedBtn = pickedCredible ? btnCredible : btnRumor;
    if (isRight) {
      state.score += POINTS_PER_CASE;
      state.correctCount += 1;
      pickedBtn.classList.add('selected-correct');
      feedbackPanel.className = 'feedback ok';
      feedbackVerdict.textContent = 'تشخیص درست! (+' + toFa(POINTS_PER_CASE) + ' امتیاز)';
      chime(660, 0.14);
    } else {
      pickedBtn.classList.add('selected-wrong');
      feedbackPanel.className = 'feedback fail';
      feedbackVerdict.textContent = 'نیاز به دقت بیشتر در سرنخ‌ها!';
      chime(220, 0.18);
    }

    feedbackReason.textContent = item.explanation;
    updateHud();
    nextBtn.textContent = state.index + 1 >= CASES.length ? 'پایان و ثبت امتیاز نهایی' : 'پرونده‌ی بعدی';
    nextBtn.classList.remove('hidden');
  }

  function finish() {
    screenCase.classList.add('hidden');
    screenResult.classList.remove('hidden');

    if (state.score >= 700) {
      resultRank.textContent = 'سربازرس ممتاز سواد رسانه‌ای';
    } else if (state.score >= 500) {
      resultRank.textContent = 'کارآگاه هوشیار خبر';
    } else {
      resultRank.textContent = 'کارآموز راستی‌آزمایی';
    }

    resultSummary.textContent =
      'شما ' + toFa(state.correctCount) + ' از ' + toFa(CASES.length) +
      ' پرونده را درست تشخیص دادید و امتیاز ' + toFa(state.score) + ' از ' + toFa(MAX_SCORE) + ' را کسب کردید.';

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
    state.index = 0;
    state.score = 0;
    state.correctCount = 0;
    screenIntro.classList.add('hidden');
    screenResult.classList.add('hidden');
    screenCase.classList.remove('hidden');
    loadCase();
  }

  document.getElementById('start-btn').addEventListener('click', start);
  document.getElementById('restart-btn').addEventListener('click', start);
  btnCredible.addEventListener('click', function () { decide(true); });
  btnRumor.addEventListener('click', function () { decide(false); });
  nextBtn.addEventListener('click', function () {
    if (state.index + 1 < CASES.length) {
      state.index += 1;
      loadCase();
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
