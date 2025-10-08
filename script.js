// TURBO: Days and School Subjects — MTW Sample (Spanish)
(()=>{
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));

  // ----- CONFIG -----
  const CONFIG = {
    title: "Days and School Subjects — MTW Sample",
    codes: { D2: "OPEN-D2", D3: "OPEN-D3", FRIDAY: "OPEN-FRI" },
    days: {
      D1: { label: "Monday — Days & Relative Days" },
      D2: { label: "Tuesday — School Subjects A" },
      D3: { label: "Wednesday — School Subjects B" }
    },
    QUESTIONS_PER_RUN: 10,
    PENALTY_SECONDS: 30
  };

  // ----- VOICE -----
  const VOICE = {
    enabled: 'speechSynthesis' in window,
    english: null, spanish: null,
    init(){
      if(!this.enabled) return;
      const pick = () => {
        const voices = speechSynthesis.getVoices();
        this.english = voices.find(v=>/^en[-_]/i.test(v.lang)) || voices.find(v=>/en/i.test(v.lang)) || voices[0] || null;
        this.spanish = voices.find(v=>/^es[-_]/i.test(v.lang)) || voices.find(v=>/spanish/i.test(v.name)) || voices.find(v=>/es/i.test(v.lang)) || this.english;
      };
      pick();
      window.speechSynthesis.onvoiceschanged = pick;
    },
    speak(text, lang='en'){
      if(!this.enabled || !text) return;
      const u = new SpeechSynthesisUtterance(text);
      const voice = lang.startsWith('es') ? (this.spanish || this.english) : (this.english || this.spanish);
      if(voice) u.voice = voice;
      u.lang = voice?.lang || (lang.startsWith('es') ? 'es-ES' : 'en-GB');
      try { speechSynthesis.cancel(); } catch(e){}
      speechSynthesis.speak(u);
    }
  };
  VOICE.init();

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const srSupported = !!SR;
  async function ensureMicPermission(){
    try{ if (navigator.mediaDevices?.getUserMedia){ const s = await navigator.mediaDevices.getUserMedia({audio:true}); (s.getTracks()||[]).forEach(t=>t.stop()); } }catch(e){}
    return true;
  }

  // ----- PHRASES -----
  const PHRASES = {
    D1: [
      {en:"Monday", es:["lunes"]},
      {en:"Tuesday", es:["martes"]},
      {en:"Wednesday", es:["miércoles","miercoles"]},
      {en:"Thursday", es:["jueves"]},
      {en:"Friday", es:["viernes"]},
      {en:"Saturday", es:["sábado","sabado"]},
      {en:"Sunday", es:["domingo"]},
      {en:"Today", es:["hoy"]},
      {en:"Tomorrow", es:["mañana","manana"]},
      {en:"Yesterday", es:["ayer"]},
      {en:"The day before yesterday", es:["anteayer"]},
      {en:"The day after tomorrow", es:["pasado mañana","pasado manana"]}
    ],
    D2: [
      {en:"English (subject)", es:["inglés","ingles"]},
      {en:"Irish (subject)", es:["irlandés","irlandes","gaélico","gaelico","gaélico irlandés","gaelico irlandes"]},
      {en:"Maths", es:["matemáticas","matematicas","mates"]},
      {en:"Spanish", es:["español","espanol","castellano"]},
      {en:"French", es:["francés","frances"]},
      {en:"History", es:["historia"]},
      {en:"Geography", es:["geografía","geografia"]},
      {en:"P.E.", es:["educación física","educacion fisica"]},
      {en:"German", es:["alemán","aleman"]},
      {en:"Science", es:["ciencias","ciencia"]}
    ],
    D3: [
      {en:"Business", es:["negocios","empresa","estudios empresariales"]},
      {en:"Art", es:["arte","educación plástica","educacion plastica"]},
      {en:"Physics", es:["física","fisica"]},
      {en:"Biology", es:["biología","biologia"]},
      {en:"IT", es:["informática","informatica","tecnología","tecnologia","computación","computacion","tic"]},
      {en:"CSPE (Civics)", es:["educación cívica","educacion civica","ciudadanía","ciudadania","educación para la ciudadanía","educacion para la ciudadania"]},
      {en:"Religion", es:["religión","religion"]}
    ]
  };

  const TENSES = ["Present","Past","Future"];
  let currentTense = "Present";
  let currentMode = null;
  let startTime = 0, timerId = null;

  // Title
  document.title = `TURBO: ${CONFIG.title}`;
  $("h1").innerHTML = `<span class="turbo">TURBO</span>: ${CONFIG.title}`;

  setTenseButtons();
  $("#codeBtn").onclick = handleCode;
  renderModes();

  // ----- Unlock state -----
  function keyUnlocked(day){ return `turbo_mtw_unlocked_${CONFIG.title}_${day}`; }
  function isUnlocked(day){
    if (day === "D1") return true;      // Monday always open
    if (day === "HOMEWORK") return true;
    const v = localStorage.getItem(keyUnlocked(day));
    return v === "1";
  }
  function unlock(day){ localStorage.setItem(keyUnlocked(day), "1"); }

  function handleCode(){
    const code = ($("#codeInput").value || "").trim();
    const msg = $("#codeMsg");
    const map = CONFIG.codes || {};
    let matched = null;
    for (const [day, c] of Object.entries(map)) { if (c === code) { matched = day; break; } }
    if (!matched) { msg.textContent = "❌ Code not recognised"; return; }
    if (matched === "FRIDAY") {
      unlock("D2"); unlock("D3"); unlock("FRIDAY");
      msg.textContent = "✅ Friday Test (and all days) unlocked!";
    } else {
      unlock(matched);
      if (isUnlocked("D2") && isUnlocked("D3")) unlock("FRIDAY");
      msg.textContent = `✅ ${CONFIG.days[matched]?.label || matched} unlocked`;
    }
    renderModes();
    $("#codeInput").value = "";
  }

  // ----- Menu -----
  function renderModes(){
    const host = $("#mode-list"); host.innerHTML = "";
    host.appendChild(makeModeBtn("HOMEWORK", "Homework Tonight (All unlocked days)"));
    host.appendChild(makeModeBtn("D1", CONFIG.days.D1.label));
    host.appendChild(makeModeBtn("D2", CONFIG.days.D2.label));
    host.appendChild(makeModeBtn("D3", CONFIG.days.D3.label));
    host.appendChild(makeModeBtn("FRIDAY", "Friday Test (All week) — unlocks from Wednesday"));
  }
  function makeModeBtn(modeKey, label){
    const btn = document.createElement("button"); btn.className = "mode-btn"; btn.dataset.mode = modeKey;
    const locked = (modeKey==="HOMEWORK") ? false
                  : (modeKey==="D1") ? false
                  : (modeKey==="FRIDAY") ? !isUnlocked("FRIDAY") && !(isUnlocked("D2") && isUnlocked("D3"))
                  : !isUnlocked(modeKey);
    btn.disabled = locked;
    const icon = locked ? "🔒" : "🔓";
    const best = getBest(currentTense, modeKey);
    btn.textContent = `${icon} ${label}${best!=null ? " — Best: "+best.toFixed(1)+"s" : ""}`;
    btn.onclick = () => { if (!locked) startMode(modeKey); };
    return btn;
  }

  // ----- Build quiz -----
  function startMode(modeKey){
    currentMode = modeKey;
    $("#mode-list").style.display = "none";
    $("#game").style.display = "block";
    $("#results").innerHTML = "";
    $("#back-button").style.display = "none";

    const pool = buildPoolForMode(modeKey);
    shuffle(pool);
    const quiz = pool.slice(0, CONFIG.QUESTIONS_PER_RUN);

    const qwrap = $("#questions"); qwrap.innerHTML = "";

    // Voice bar
    const vbar = $("#voice-bar");
    if (VOICE.enabled) {
      vbar.style.display = "flex";
      $("#read-all").onclick = () => {
        let i = 0; const items = quiz.map(q => q.prompt);
        const next = () => { if (i >= items.length) return; VOICE.speak(items[i], 'en'); i++; setTimeout(next, 1700); };
        next();
      };
    } else vbar.style.display = "none";

    quiz.forEach((q,i) => {
      const row = document.createElement("div");
      row.className = "q";

      const promptRow = document.createElement("div"); promptRow.className = "prompt-row";
      const p = document.createElement("div"); p.className = "prompt"; p.textContent = `${i+1}. ${q.prompt}`;

      const spk = document.createElement("button"); spk.className = "icon-btn"; spk.textContent = "🔊"; spk.title = "Read this prompt";
      spk.onclick = ()=> VOICE.speak(q.prompt, 'en');

      const mic = document.createElement("button"); mic.className = "icon-btn"; mic.textContent = "🎤"; mic.title = srSupported ? "Dictate answer (Spanish)" : "Speech recognition not supported";
      const input = document.createElement("input"); input.type = "text"; input.placeholder = "Type or dictate the Spanish answer";
      if (srSupported) {
        mic.onclick = async ()=>{
          try { speechSynthesis.cancel(); } catch(e){}
          await ensureMicPermission();
          const rec = new SR(); rec.lang = "es-ES"; rec.interimResults = false; rec.maxAlternatives = 1;
          mic.disabled = true; mic.textContent = "⏺️…";
          rec.onresult = e => { const said = e.results[0][0].transcript || ""; input.value = said; };
          rec.onerror = ()=>{}; rec.onend = ()=>{ mic.disabled=false; mic.textContent="🎤"; };
          try { rec.start(); } catch(e) { mic.disabled=false; mic.textContent="🎤"; }
        };
      } else mic.disabled = true;

      promptRow.appendChild(p); promptRow.appendChild(spk); promptRow.appendChild(mic);
      row.appendChild(promptRow); row.appendChild(input); qwrap.appendChild(row);

      input.addEventListener('focus', ()=>{ const a = $("#auto-read"); if(a && a.checked) VOICE.speak(q.prompt, 'en'); });
    });

    $("#submit").onclick = () => checkAnswers(quiz);
    $("#back-button").onclick = ()=>{ $("#game").style.display = "none"; $("#mode-list").style.display = "grid"; renderModes(); };
    startTimer();
  }

  function buildPoolForMode(modeKey){
    if (modeKey === "HOMEWORK") {
      const open = ["D1","D2","D3"].filter(d => isUnlocked(d) || d==="D1");
      return poolFromDays(open);
    } else if (modeKey === "FRIDAY") {
      return poolFromDays(["D1","D2","D3"]);
    } else {
      return poolFromDays([modeKey]);
    }
  }

  function poolFromDays(dayKeys){
    const pool = [];
    dayKeys.forEach(d => {
      const list = PHRASES[d] || [];
      list.forEach(item => pool.push({ prompt: `Type the Spanish: "${item.en}"`, answerList: item.es }));
    });
    return pool;
  }

  // ----- Timer & scoring -----
  function startTimer(){
    startTime = performance.now();
    $("#timer").textContent = "Time: 0s";
    clearInterval(timerId);
    timerId = setInterval(()=>{
      const e = (performance.now() - startTime)/1000;
      $("#timer").textContent = `Time: ${e.toFixed(1)}s`;
    }, 100);
  }
  function stopTimer(){ clearInterval(timerId); }

  function checkAnswers(quiz){
    stopTimer();
    const inputs = $$("#questions .q input");
    let correct = 0; const items = [];
    inputs.forEach((inp,i)=>{
      const ok = matchesAny(norm(inp.value), quiz[i].answerList);
      inp.classList.remove("good","bad"); inp.classList.add(ok ? "good" : "bad");
      if (ok) correct++;
      const li = document.createElement("li");
      li.className = ok ? "correct" : "incorrect";
      const show = Array.isArray(quiz[i].answerList) ? quiz[i].answerList[0] : quiz[i].answerList;
      li.textContent = `${i+1}. ${quiz[i].prompt} → ${show}`;
      items.push(li);
    });
    const elapsed = (performance.now() - startTime)/1000;
    const penalty = (quiz.length - correct) * CONFIG.PENALTY_SECONDS;
    const finalTime = elapsed + penalty;

    if (currentMode) saveBest(currentTense, currentMode, finalTime);

    const summary = document.createElement("div");
    summary.className = "result-summary";
    summary.innerHTML = [
      `<div class="final-time">🏁 Final Time: ${finalTime.toFixed(1)}s</div>`,
      `<div class="line">✅ Correct: ${correct}/${quiz.length}</div>`,
      penalty>0 ? `<div class="line">⏱️ Penalty: +${penalty}s (${CONFIG.PENALTY_SECONDS}s per incorrect)</div>` : ``
    ].join("");

    const ul = document.createElement("ul"); items.forEach(li => ul.appendChild(li));
    const results = $("#results"); results.innerHTML = ""; results.appendChild(summary); results.appendChild(ul);

    if (VOICE.enabled) VOICE.speak(`You got ${correct} out of ${quiz.length}. Final time ${finalTime.toFixed(1)} seconds.`, 'en');

    $("#back-button").style.display = "inline-block";
  }

  function norm(s){
    return (s||"").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[¿?¡!"]/g,"").replace(/\s+/g," ").trim();
  }

  // ----- Best per (tense, mode) -----
  function bestKey(tense, mode){ return `turbo_mtw_best_${CONFIG.title}_${tense}_${mode}`; }
  function getBest(tense, mode){ const v = localStorage.getItem(bestKey(tense, mode)); return v ? parseFloat(v) : null; }
  function saveBest(tense, mode, score){
    const cur = getBest(tense, mode);
    const best = (cur == null || score < cur) ? score : cur;
    localStorage.setItem(bestKey(tense, mode), best.toString());
  }

  function setTenseButtons(){
    $$(".tense-button").forEach(b=>{
      b.classList.toggle("active", b.dataset.tense === currentTense);
      b.onclick = ()=>{ currentTense = b.dataset.tense; $$(".tense-button").forEach(x=>x.classList.remove("active")); b.classList.add("active"); renderModes(); };
    });
  }

  function renderModes(){
    const host = $("#mode-list"); host.innerHTML = "";
    host.appendChild(makeModeBtn("HOMEWORK", "Homework Tonight (All unlocked days)"));
    host.appendChild(makeModeBtn("D1", CONFIG.days.D1.label));
    host.appendChild(makeModeBtn("D2", CONFIG.days.D2.label));
    host.appendChild(makeModeBtn("D3", CONFIG.days.D3.label));
    host.appendChild(makeModeBtn("FRIDAY", "Friday Test (All week) — unlocks from Wednesday"));
  }

  function matchesAny(user, answers){
    const list = Array.isArray(answers) ? answers : [answers];
    return list.some(ans => norm(ans) === user);
  }

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }

})();