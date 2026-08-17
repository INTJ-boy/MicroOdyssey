/* ============================================================
   MICROBIAL ODYSSEY -- knowledge quiz
   Every question and every answer option is pulled directly from
   the real, sourced datasets. Nothing here is invented: wrong
   answers are just other real names/years from the same archive.
   ============================================================ */

let QUIZ_POOL = [];
let QUIZ_ROUND = [];
let QUIZ_IDX = 0;
let QUIZ_SCORE = 0;
let QUIZ_ANSWERED = false;

function shuffle(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function sample(arr, n){ return shuffle(arr).slice(0, n); }

async function buildQuizPool(){
  if(QUIZ_POOL.length) return QUIZ_POOL;
  await Promise.all([loadSpecies(), loadScientists(), loadDiscoveries()]);
  const t = I18N[getLang()];

  const allScientistNames = SCIENTISTS.map(s => s.name);
  const allYears = DISCOVERIES.map(d => d.year).concat(SPECIES.map(s => s.year));

  const discoveryQs = DISCOVERIES.map(d => {
    const loc = localizedDiscovery(d);
    const correct = d.people.split(";")[0].trim();
    const distractors = sample(allScientistNames.filter(n => !d.people.includes(n)), 3);
    return {
      kind: "discovery",
      prompt: t.quiz_q_discovery,
      subject: loc.title,
      correct, options: shuffle([correct, ...distractors]),
      fact: loc.summary
    };
  });

  const speciesQs = SPECIES.map(s => {
    const loc = localizedSpecies(s);
    const correct = s.discoverer.split(";")[0].trim();
    const distractors = sample(allScientistNames.filter(n => !s.discoverer.includes(n)), 3);
    return {
      kind: "species",
      prompt: t.quiz_q_species,
      subject: s.name,
      correct, options: shuffle([correct, ...distractors]),
      fact: loc.significance
    };
  });

  const yearQs = DISCOVERIES.map(d => {
    const loc = localizedDiscovery(d);
    const correct = String(d.year);
    const distractors = sample(allYears.filter(y => Math.abs(y - d.year) > 2).map(String), 3);
    return {
      kind: "year",
      prompt: t.quiz_q_year,
      subject: loc.title,
      correct, options: shuffle([...new Set([correct, ...distractors])]).slice(0,4),
      fact: loc.summary
    };
  });

  QUIZ_POOL = [...discoveryQs, ...speciesQs, ...yearQs];
  return QUIZ_POOL;
}

function renderQuestion(){
  const t = I18N[getLang()];
  const q = QUIZ_ROUND[QUIZ_IDX];
  QUIZ_ANSWERED = false;
  document.getElementById("quiz-progress").textContent = `${t.quiz_question_of} ${QUIZ_IDX + 1} / ${QUIZ_ROUND.length}`;
  document.getElementById("quiz-score").textContent = `${t.quiz_score}: ${QUIZ_SCORE}`;
  document.getElementById("quiz-prompt").textContent = q.prompt;
  document.getElementById("quiz-subject").textContent = q.subject;
  const opts = document.getElementById("quiz-options");
  opts.innerHTML = "";
  document.getElementById("quiz-feedback").innerHTML = "";
  document.getElementById("quiz-next").classList.add("hide");
  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quiz-opt";
    btn.textContent = opt;
    btn.addEventListener("click", () => selectAnswer(opt, btn));
    opts.appendChild(btn);
  });
}

function selectAnswer(opt, btn){
  if(QUIZ_ANSWERED) return;
  QUIZ_ANSWERED = true;
  const t = I18N[getLang()];
  const q = QUIZ_ROUND[QUIZ_IDX];
  const correct = opt === q.correct;
  if(correct) QUIZ_SCORE++;
  document.querySelectorAll(".quiz-opt").forEach(b => {
    b.disabled = true;
    if(b.textContent === q.correct) b.classList.add("correct");
    else if(b === btn) b.classList.add("wrong");
  });
  document.getElementById("quiz-feedback").innerHTML = `
    <div class="quiz-fb ${correct ? 'ok' : 'no'}">${correct ? t.quiz_correct : t.quiz_incorrect}</div>
    <div class="quiz-fact">${q.fact}</div>
  `;
  document.getElementById("quiz-score").textContent = `${t.quiz_score}: ${QUIZ_SCORE}`;
  const nextBtn = document.getElementById("quiz-next");
  nextBtn.classList.remove("hide");
  nextBtn.textContent = (QUIZ_IDX < QUIZ_ROUND.length - 1) ? t.quiz_next : t.quiz_finish;
}

function nextQuestion(){
  QUIZ_IDX++;
  if(QUIZ_IDX >= QUIZ_ROUND.length){
    showResults();
  }else{
    renderQuestion();
  }
}

function showResults(){
  const t = I18N[getLang()];
  document.getElementById("quiz-card").innerHTML = `
    <div class="quiz-result">
      <div class="eyebrow">${t.quiz_result_title}</div>
      <div class="quiz-big-score">${QUIZ_SCORE} / ${QUIZ_ROUND.length}</div>
      <button class="btn" id="quiz-restart">${t.quiz_play_again}</button>
    </div>
  `;
  document.getElementById("quiz-restart").addEventListener("click", startQuiz);
}

async function startQuiz(){
  const t = I18N[getLang()];
  await buildQuizPool();
  QUIZ_ROUND = sample(QUIZ_POOL, Math.min(10, QUIZ_POOL.length));
  QUIZ_IDX = 0;
  QUIZ_SCORE = 0;
  document.getElementById("quiz-card").innerHTML = `
    <div class="quiz-head">
      <span id="quiz-progress"></span>
      <span id="quiz-score"></span>
    </div>
    <div class="quiz-prompt" id="quiz-prompt"></div>
    <div class="quiz-subject" id="quiz-subject"></div>
    <div class="quiz-options" id="quiz-options"></div>
    <div id="quiz-feedback"></div>
    <button class="btn" id="quiz-next">${t.quiz_next}</button>
  `;
  document.getElementById("quiz-next").addEventListener("click", nextQuestion);
  renderQuestion();
}

function initQuizPage(){
  const startBtn = document.getElementById("quiz-start-btn");
  if(startBtn) startBtn.addEventListener("click", startQuiz);
  window.onLangChange = () => {
    const startScreen = document.getElementById("quiz-start-btn");
    if(startScreen){
      const t = I18N[getLang()];
      startScreen.textContent = t.quiz_start;
    }
  };
}
