/* ============================================================
   MICROBIAL ODYSSEY -- command palette & random discovery
   ============================================================ */

let CMDK_INDEX = null;

async function buildIndex(){
  if(CMDK_INDEX) return CMDK_INDEX;
  const safe = (p) => fetch(p).then(r=>r.json()).catch(()=>[]);
  const [sp, sc, di, lo, gl, ex, co, fh, lab, tl] = await Promise.all([
    safe("data/species.json"),
    safe("data/scientists.json"),
    safe("data/discoveries.json"),
    safe("data/locations.json"),
    safe("data/glossary.json"),
    safe("data/experiments.json"),
    safe("data/controversies.json"),
    safe("data/failed_hypotheses.json"),
    safe("data/laboratories.json"),
    safe("data/tools.json"),
  ]);
  CMDK_INDEX = [
    ...sp.map(x => ({ type:"Species", label:x.name, sub:`${x.domain} · ${x.year}`, page:"species.html", q:x.name })),
    ...sc.map(x => ({ type:"Scientist", label:x.name, sub:x.field, page:"scientists.html", q:x.name })),
    ...di.map(x => ({ type:"Discovery", label:x.title, sub:String(x.year), page:"discoveries.html", q:x.title })),
    ...lo.map(x => ({ type:"Location", label:x.name, sub:x.country, page:"locations.html", q:x.name })),
    ...gl.map(x => ({ type:"Term", label:x.term, sub:"Glossary", page:"glossary.html", q:x.term })),
    ...ex.map(x => ({ type:"Experiment", label:x.title, sub:`${x.scientist} · ${x.year}`, page:"experiments.html", q:x.title })),
    ...co.map(x => ({ type:"Controversy", label:x.title, sub:String(x.year), page:"controversies.html", q:x.title })),
    ...fh.map(x => ({ type:"Failed hypothesis", label:x.hypothesis.slice(0,60), sub:x.yearRange, page:"controversies.html", q:x.hypothesis.slice(0,40) })),
    ...lab.map(x => ({ type:"Laboratory", label:x.name, sub:x.location, page:"labs-tools.html", q:x.name })),
    ...tl.map(x => ({ type:"Tool", label:x.name, sub:String(x.year), page:"labs-tools.html", q:x.name })),
  ];
  return CMDK_INDEX;
}

function initCommandPalette(){
  const backdrop = document.createElement("div");
  backdrop.id = "cmdk-backdrop";
  backdrop.innerHTML = `
    <div id="cmdk-box">
      <input id="cmdk-input" type="text" placeholder="Search species, scientists, discoveries, locations, terms..." autocomplete="off">
      <div id="cmdk-results"></div>
      <div class="cmdk-hint">↑↓ navigate · Enter to open · Esc to close</div>
    </div>
  `;
  document.body.appendChild(backdrop);
  const input = backdrop.querySelector("#cmdk-input");
  const results = backdrop.querySelector("#cmdk-results");
  let items = [];
  let selIdx = -1;

  function open(){
    backdrop.classList.add("open");
    buildIndex().then(paint);
    input.value = "";
    items = [];
    paint();
    setTimeout(()=> input.focus(), 30);
  }
  function close(){
    backdrop.classList.remove("open");
  }
  function search(){
    const q = input.value.trim().toLowerCase();
    const idx = CMDK_INDEX || [];
    items = q ? idx.filter(x => x.label.toLowerCase().includes(q)).slice(0, 30) : [];
    selIdx = items.length ? 0 : -1;
    paint();
  }
  function paint(){
    if(!items.length){
      results.innerHTML = `<div class="cmdk-empty">${input.value.trim() ? "No matches in the archive." : "Start typing to search everything: species, scientists, discoveries, locations, glossary terms."}</div>`;
      return;
    }
    results.innerHTML = items.map((it, i) => `
      <div class="cmdk-item ${i===selIdx?'sel':''}" data-i="${i}">
        <span class="t">${it.label}<br><span class="sub">${it.sub}</span></span>
        <span class="k">${it.type}</span>
      </div>
    `).join("");
  }
  function go(it){
    if(!it) return;
    window.location.href = `${it.page}?q=${encodeURIComponent(it.q)}`;
  }

  input.addEventListener("input", search);
  input.addEventListener("keydown", e => {
    if(e.key === "ArrowDown"){ e.preventDefault(); if(selIdx < items.length-1){ selIdx++; paint(); } }
    else if(e.key === "ArrowUp"){ e.preventDefault(); if(selIdx > 0){ selIdx--; paint(); } }
    else if(e.key === "Enter"){ e.preventDefault(); go(items[selIdx]); }
    else if(e.key === "Escape"){ close(); }
  });
  results.addEventListener("click", e => {
    const el = e.target.closest(".cmdk-item");
    if(!el) return;
    go(items[Number(el.dataset.i)]);
  });
  backdrop.addEventListener("click", e => { if(e.target.id === "cmdk-backdrop") close(); });

  document.addEventListener("keydown", e => {
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"){ e.preventDefault(); open(); }
    else if(e.key === "Escape"){ close(); }
  });

  document.querySelectorAll(".js-open-search").forEach(btn => btn.addEventListener("click", open));
}

function initRandomDiscovery(){
  document.querySelectorAll(".js-random").forEach(btn => {
    btn.addEventListener("click", () => {
      buildIndex().then(idx => {
        if(!idx.length) return;
        const pick = idx[Math.floor(Math.random() * idx.length)];
        window.location.href = `${pick.page}?q=${encodeURIComponent(pick.q)}`;
      });
    });
  });
}

/* ---------- expanding "Explore" nav dropdown ---------- */
function initNavDropdown(){
  document.querySelectorAll(".nav-dropdown").forEach(dd => {
    const trigger = dd.querySelector(".nav-drop-trigger");
    if(!trigger) return;
    trigger.setAttribute("aria-expanded", "false");
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = !dd.classList.contains("open");
      document.querySelectorAll(".nav-dropdown.open").forEach(o => {
        o.classList.remove("open");
        o.querySelector(".nav-drop-trigger").setAttribute("aria-expanded", "false");
      });
      document.querySelectorAll(".lang-switch.open").forEach(sw => {
        sw.classList.remove("open");
        const t = sw.querySelector(".lang-trigger");
        if(t) t.setAttribute("aria-expanded", "false");
      });
      if(willOpen){
        dd.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });
  document.addEventListener("click", () => {
    document.querySelectorAll(".nav-dropdown.open").forEach(o => {
      o.classList.remove("open");
      o.querySelector(".nav-drop-trigger").setAttribute("aria-expanded", "false");
    });
  });
  document.addEventListener("keydown", e => {
    if(e.key === "Escape"){
      document.querySelectorAll(".nav-dropdown.open").forEach(o => o.classList.remove("open"));
    }
  });
}

/* ---------- Expedition Log ---------- */
const EXPEDITION_TOTAL = 263; // 95 species + 55 scientists + 31 discoveries + 40 locations + 12 experiments + 12 controversies/hypotheses + 8 laboratories + 10 tools
function getVisitedSet(){
  try{ return new Set(JSON.parse(localStorage.getItem("mo_visited") || "[]")); }
  catch(e){ return new Set(); }
}
function trackVisit(type, id){
  const set = getVisitedSet();
  set.add(type + ":" + id);
  localStorage.setItem("mo_visited", JSON.stringify([...set]));
  updateExpeditionBadge();
}
function updateExpeditionBadge(){
  document.querySelectorAll("#expedition-badge").forEach(el => {
    const count = getVisitedSet().size;
    const pct = Math.min(100, Math.round((count / EXPEDITION_TOTAL) * 100));
    const pctEl = el.querySelector(".ex-pct");
    if(pctEl) pctEl.textContent = pct + "%";
    el.setAttribute("title", `Expedition log: ${count} of ${EXPEDITION_TOTAL} entries charted`);
  });
}
window.trackVisit = trackVisit;

document.addEventListener("DOMContentLoaded", ()=>{
  initCommandPalette();
  initRandomDiscovery();
  initNavDropdown();
  updateExpeditionBadge();
});
