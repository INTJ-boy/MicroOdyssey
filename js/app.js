let SPECIES = [];
let SPECIES_I18N = null;

async function loadSpecies(){
  try{
    const res = await fetch("data/species.json");
    SPECIES = await res.json();
  }catch(e){
    console.error("Could not load species data", e);
    SPECIES = [];
  }
  try{
    const res2 = await fetch("data/species_i18n.json");
    SPECIES_I18N = await res2.json();
  }catch(e){
    SPECIES_I18N = null;
  }
  return SPECIES;
}

function localizedSpecies(s){
  const lang = getLang();
  if(lang === "en" || !SPECIES_I18N) return { domain: s.domain, significance: s.significance };
  const domainMap = SPECIES_I18N.domains[s.domain];
  const row = SPECIES_I18N.species.find(x => x.id === s.id);
  return {
    domain: domainMap ? domainMap[lang] : s.domain,
    significance: row ? row[lang] : s.significance
  };
}

function confClass(c){
  if(c === "disputed") return "disputed";
  return "";
}
function confLabel(c, t){
  if(c === "well-documented") return t.note_well;
  if(c === "reasonably-documented") return t.note_reasonable;
  return t.note_disputed;
}

function specimenCard(s, t){
  const loc = localizedSpecies(s);
  const div = document.createElement("div");
  div.className = "specimen";
  div.tabIndex = 0;
  div.setAttribute("role","button");
  div.setAttribute("aria-label", s.name);
  div.innerHTML = `
    <div class="tag-no">No. ${String(s.id).padStart(3,"0")}</div>
    <h3>${s.name}</h3>
    <div class="domain">${loc.domain} · ${s.group}</div>
    <div class="meta">${s.location} · ${s.year}</div>
    <span class="conf ${confClass(s.confidence)}">${confLabel(s.confidence, t)}</span>
  `;
  div.addEventListener("click", ()=>openModal(s, t));
  div.addEventListener("keypress", e=>{ if(e.key==="Enter") openModal(s, t); });
  addCompareCheckbox(div, "species", s.id, s.name);
  return div;
}

function openModal(s, t){
  if(window.trackVisit) window.trackVisit("species", s.id);
  const loc = localizedSpecies(s);
  const backdrop = document.getElementById("modal-backdrop");
  const card = document.getElementById("modal-card");
  card.innerHTML = `
    <button class="close" aria-label="${t.close}" onclick="closeModal()">✕</button>
    <div class="tag-no">No. ${String(s.id).padStart(3,"0")} · ${loc.domain}</div>
    <h3>${s.name}</h3>
    <dl>
      <dt>${t.lbl_group}</dt><dd>${s.group}</dd>
      <dt>${t.lbl_discoverer}</dt><dd>${s.discoverer}</dd>
      <dt>${t.lbl_year}</dt><dd>${s.year}</dd>
      <dt>${t.lbl_location}</dt><dd>${s.location}</dd>
    </dl>
    <div class="sig">${loc.significance}</div>
    <span class="conf ${confClass(s.confidence)}" style="margin-top:14px;">${confLabel(s.confidence, t)}</span>
    <button class="btn ghost" id="cite-btn" style="margin-top:16px; width:100%;">${t.btn_cite || "Copy citation"}</button>
  `;
  wireCiteButton(card, s, "species");
  backdrop.classList.add("open");
}
function closeModal(){
  document.getElementById("modal-backdrop").classList.remove("open");
}

function staggerIn(container){
  const items = container.children;
  for(let i=0; i<items.length; i++){
    items[i].classList.add("card-in");
    items[i].style.animationDelay = Math.min(i*35, 500) + "ms";
  }
}

function renderGrid(list, t){
  const grid = document.getElementById("specimen-grid");
  const count = document.getElementById("results-count");
  grid.innerHTML = "";
  list.forEach(s => grid.appendChild(specimenCard(s, t)));
  count.textContent = `${list.length} ${t.results}`;
  staggerIn(grid);
}

function populateDomainFilter(){
  const sel = document.getElementById("domain-filter");
  const domains = [...new Set(SPECIES.map(s=>s.domain))].sort();
  domains.forEach(d=>{
    const opt = document.createElement("option");
    opt.value = d; opt.textContent = d;
    sel.appendChild(opt);
  });
}

function applyFilters(){
  const t = I18N[getLang()];
  const q = document.getElementById("search-box").value.trim().toLowerCase();
  const dom = document.getElementById("domain-filter").value;
  const confSel = document.getElementById("confidence-filter");
  const conf = confSel ? confSel.value : "all";
  const filtered = SPECIES.filter(s=>{
    const matchesQ = !q || s.name.toLowerCase().includes(q) || s.discoverer.toLowerCase().includes(q);
    const matchesDom = dom === "all" || s.domain === dom;
    const matchesConf = conf === "all" || s.confidence === conf;
    return matchesQ && matchesDom && matchesConf;
  });
  renderGrid(filtered, t);
}

function prefillSearchFromQuery(){
  const q = new URLSearchParams(window.location.search).get("q");
  if(q){
    const box = document.getElementById("search-box");
    if(box) box.value = q;
  }
}

async function initSpeciesPage(){
  await loadSpecies();
  populateDomainFilter();
  prefillSearchFromQuery();
  applyFilters();
  document.getElementById("search-box").addEventListener("input", applyFilters);
  document.getElementById("domain-filter").addEventListener("change", applyFilters);
  document.getElementById("modal-backdrop").addEventListener("click", e=>{
    if(e.target.id === "modal-backdrop") closeModal();
  });
  document.addEventListener("keydown", e=>{ if(e.key === "Escape") closeModal(); });
  window.onLangChange = applyFilters;
}

/* ---------- Scientists ---------- */
let SCIENTISTS = [];
let SCIENTISTS_I18N = null;
async function loadScientists(){
  try{ const res = await fetch("data/scientists.json"); SCIENTISTS = await res.json(); }
  catch(e){ console.error(e); SCIENTISTS = []; }
  try{ const res2 = await fetch("data/scientists_i18n.json"); SCIENTISTS_I18N = await res2.json(); }
  catch(e){ SCIENTISTS_I18N = null; }
  return SCIENTISTS;
}
function localizedScientist(p){
  const lang = getLang();
  if(lang === "en" || !SCIENTISTS_I18N) return { field: p.field, significance: p.significance };
  const row = SCIENTISTS_I18N.find(x => x.id === p.id);
  return {
    field: row ? row["field_"+lang] : p.field,
    significance: row ? row[lang] : p.significance
  };
}
function scientistCard(p, t){
  const loc = localizedScientist(p);
  const div = document.createElement("div");
  div.className = "specimen";
  div.innerHTML = `
    <div class="tag-no">No. ${String(p.id).padStart(3,"0")}</div>
    <h3>${p.name}</h3>
    <div class="domain">${loc.field}</div>
    <div class="meta">${p.nationality} · ${p.lifespan}</div>
    <span class="conf ${confClass(p.confidence)}">${confLabel(p.confidence, t)}</span>
  `;
  div.tabIndex = 0;
  div.addEventListener("click", ()=>openScientistModal(p, t));
  addCompareCheckbox(div, "scientist", p.id, p.name);
  return div;
}
function openScientistModal(p, t){
  if(window.trackVisit) window.trackVisit("scientist", p.id);
  const loc = localizedScientist(p);
  const backdrop = document.getElementById("modal-backdrop");
  const card = document.getElementById("modal-card");
  card.innerHTML = `
    <button class="close" aria-label="${t.close}" onclick="closeModal()">✕</button>
    <div class="tag-no">No. ${String(p.id).padStart(3,"0")} · ${loc.field}</div>
    <h3>${p.name}</h3>
    <dl>
      <dt>Nationality</dt><dd>${p.nationality}</dd>
      <dt>Lifespan</dt><dd>${p.lifespan}</dd>
    </dl>
    <div class="sig">${loc.significance}</div>
    <span class="conf ${confClass(p.confidence)}" style="margin-top:14px;">${confLabel(p.confidence, t)}</span>
    <button class="btn ghost" id="cite-btn" style="margin-top:16px; width:100%;">${t.btn_cite || "Copy citation"}</button>
  `;
  wireCiteButton(card, p, "scientist");
  backdrop.classList.add("open");
}
async function initScientistsPage(){
  const t = I18N[getLang()];
  await loadScientists();
  const grid = document.getElementById("specimen-grid");
  const count = document.getElementById("results-count");
  prefillSearchFromQuery();
  function render(){
    const q = document.getElementById("search-box").value.trim().toLowerCase();
    const confSel = document.getElementById("confidence-filter");
    const conf = confSel ? confSel.value : "all";
    const filtered = SCIENTISTS.filter(p => {
      const matchesQ = !q || p.name.toLowerCase().includes(q) || p.field.toLowerCase().includes(q);
      const matchesConf = conf === "all" || p.confidence === conf;
      return matchesQ && matchesConf;
    });
    grid.innerHTML = "";
    filtered.forEach(p => grid.appendChild(scientistCard(p, I18N[getLang()])));
    count.textContent = `${filtered.length} ${I18N[getLang()].results}`;
    staggerIn(grid);
  }
  render();
  document.getElementById("search-box").addEventListener("input", render);
  const confSel = document.getElementById("confidence-filter");
  if(confSel) confSel.addEventListener("change", render);
  document.getElementById("modal-backdrop").addEventListener("click", e=>{ if(e.target.id==="modal-backdrop") closeModal(); });
  document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeModal(); });
  window.onLangChange = render;
}

/* ---------- Discoveries ---------- */
let DISCOVERIES = [];
let DISCOVERIES_I18N = null;
async function loadDiscoveries(){
  try{ const res = await fetch("data/discoveries.json"); DISCOVERIES = await res.json(); }
  catch(e){ console.error(e); DISCOVERIES = []; }
  try{ const res2 = await fetch("data/discoveries_i18n.json"); DISCOVERIES_I18N = await res2.json(); }
  catch(e){ DISCOVERIES_I18N = null; }
  return DISCOVERIES;
}
function localizedDiscovery(d){
  const lang = getLang();
  if(lang === "en" || !DISCOVERIES_I18N) return { title: d.title, summary: d.summary };
  const row = DISCOVERIES_I18N.find(x => x.id === d.id);
  return {
    title: row ? row["title_"+lang] : d.title,
    summary: row ? row[lang] : d.summary
  };
}
function discoveryCard(d, t){
  const loc = localizedDiscovery(d);
  const div = document.createElement("div");
  div.className = "specimen";
  div.innerHTML = `
    <div class="tag-no">No. ${String(d.id).padStart(3,"0")}</div>
    <h3>${loc.title}</h3>
    <div class="domain">${d.year}</div>
    <div class="meta">${d.location}</div>
    <span class="conf ${confClass(d.confidence)}">${confLabel(d.confidence, t)}</span>
  `;
  div.tabIndex = 0;
  div.addEventListener("click", ()=>openDiscoveryModal(d, t));
  return div;
}
function openDiscoveryModal(d, t){
  if(window.trackVisit) window.trackVisit("discovery", d.id);
  const loc = localizedDiscovery(d);
  const backdrop = document.getElementById("modal-backdrop");
  const card = document.getElementById("modal-card");
  card.innerHTML = `
    <button class="close" aria-label="${t.close}" onclick="closeModal()">✕</button>
    <div class="tag-no">No. ${String(d.id).padStart(3,"0")} · ${d.year}</div>
    <h3>${loc.title}</h3>
    <dl>
      <dt>${t.lbl_location}</dt><dd>${d.location}</dd>
      <dt>People</dt><dd>${d.people}</dd>
    </dl>
    <div class="sig">${loc.summary}</div>
    <span class="conf ${confClass(d.confidence)}" style="margin-top:14px;">${confLabel(d.confidence, t)}</span>
    <button class="btn ghost" id="cite-btn" style="margin-top:16px; width:100%;">${t.btn_cite || "Copy citation"}</button>
  `;
  wireCiteButton(card, d, "discovery");
  backdrop.classList.add("open");
}
async function initDiscoveriesPage(){
  await loadDiscoveries();
  const grid = document.getElementById("specimen-grid");
  const count = document.getElementById("results-count");
  prefillSearchFromQuery();
  function render(){
    const q = document.getElementById("search-box").value.trim().toLowerCase();
    const confSel = document.getElementById("confidence-filter");
    const conf = confSel ? confSel.value : "all";
    const decadeSel = document.getElementById("decade-filter");
    const decade = decadeSel ? decadeSel.value : "all";
    const filtered = DISCOVERIES.filter(d => {
      const matchesQ = !q || d.title.toLowerCase().includes(q) || d.people.toLowerCase().includes(q);
      const matchesConf = conf === "all" || d.confidence === conf;
      const matchesDecade = decade === "all" || Math.floor(d.year/10)*10 === parseInt(decade);
      return matchesQ && matchesConf && matchesDecade;
    }).sort((a,b)=>a.year-b.year);
    grid.innerHTML = "";
    filtered.forEach(d => grid.appendChild(discoveryCard(d, I18N[getLang()])));
    count.textContent = `${filtered.length} ${I18N[getLang()].results}`;
    staggerIn(grid);
  }
  const decadeSel = document.getElementById("decade-filter");
  if(decadeSel){
    const decades = [...new Set(DISCOVERIES.map(d => Math.floor(d.year/10)*10))].sort((a,b)=>a-b);
    decades.forEach(dec=>{
      const opt = document.createElement("option");
      opt.value = dec; opt.textContent = dec + "s";
      decadeSel.appendChild(opt);
    });
    decadeSel.addEventListener("change", render);
  }
  render();
  document.getElementById("search-box").addEventListener("input", render);
  const confSel = document.getElementById("confidence-filter");
  if(confSel) confSel.addEventListener("change", render);
  document.getElementById("modal-backdrop").addEventListener("click", e=>{ if(e.target.id==="modal-backdrop") closeModal(); });
  document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeModal(); });
  window.onLangChange = render;
}

/* ---------- Glossary ---------- */
let GLOSSARY = [];
let GLOSSARY_I18N = null;
async function loadGlossary(){
  try{ const res = await fetch("data/glossary.json"); GLOSSARY = await res.json(); }
  catch(e){ console.error(e); GLOSSARY = []; }
  try{ const res2 = await fetch("data/glossary_i18n.json"); GLOSSARY_I18N = await res2.json(); }
  catch(e){ GLOSSARY_I18N = null; }
  return GLOSSARY;
}
function localizedGlossary(g, idx){
  const lang = getLang();
  if(lang === "en" || !GLOSSARY_I18N || !GLOSSARY_I18N[idx]) return { term: g.term, definition: g.definition };
  const row = GLOSSARY_I18N[idx];
  return {
    term: row["term_"+lang] || g.term,
    definition: row[lang] || g.definition
  };
}
async function initGlossaryPage(){
  await loadGlossary();
  const list = document.getElementById("glossary-list");
  const count = document.getElementById("results-count");
  prefillSearchFromQuery();
  function render(){
    const q = document.getElementById("search-box").value.trim().toLowerCase();
    const filtered = GLOSSARY
      .map((g, idx)=>({ g, idx, loc: localizedGlossary(g, idx) }))
      .filter(({g, loc}) => !q || g.term.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q) || loc.term.toLowerCase().includes(q));
    list.innerHTML = "";
    filtered.forEach(({loc})=>{
      const div = document.createElement("dl");
      div.className = "g-item";
      div.innerHTML = `<dt>${loc.term}</dt><dd>${loc.definition}</dd>`;
      list.appendChild(div);
    });
    count.textContent = `${filtered.length} ${I18N[getLang()].results}`;
    staggerIn(list);
  }
  render();
  document.getElementById("search-box").addEventListener("input", render);
  window.onLangChange = render;
}

/* ---------- Locations ---------- */
let LOCATIONS = [];
let LOCATIONS_I18N = null;
async function loadLocations(){
  try{ const res = await fetch("data/locations.json"); LOCATIONS = await res.json(); }
  catch(e){ console.error(e); LOCATIONS = []; }
  try{ const res2 = await fetch("data/locations_i18n.json"); LOCATIONS_I18N = await res2.json(); }
  catch(e){ LOCATIONS_I18N = null; }
  return LOCATIONS;
}
function localizedLocation(l){
  const lang = getLang();
  if(lang === "en" || !LOCATIONS_I18N) return { country: l.country, significance: l.significance };
  const countryMap = LOCATIONS_I18N.countries[l.country];
  const row = LOCATIONS_I18N.locations.find(x => x.id === l.id);
  return {
    country: countryMap ? countryMap[lang] : l.country,
    significance: row ? row[lang] : l.significance
  };
}
function locationCard(l, t){
  const loc = localizedLocation(l);
  const div = document.createElement("div");
  div.className = "specimen";
  div.innerHTML = `
    <div class="tag-no">No. ${String(l.id).padStart(3,"0")}</div>
    <h3>${l.name}</h3>
    <div class="domain">${loc.country}</div>
    <div class="meta">${l.associatedWith} · ${l.year}</div>
    <span class="conf ${confClass(l.confidence)}">${confLabel(l.confidence, t)}</span>
  `;
  div.tabIndex = 0;
  div.addEventListener("click", ()=>openLocationModal(l, t));
  return div;
}
function openLocationModal(l, t){
  if(window.trackVisit) window.trackVisit("location", l.id);
  const loc = localizedLocation(l);
  const backdrop = document.getElementById("modal-backdrop");
  const card = document.getElementById("modal-card");
  card.innerHTML = `
    <button class="close" aria-label="${t.close}" onclick="closeModal()">✕</button>
    <div class="tag-no">No. ${String(l.id).padStart(3,"0")} · ${loc.country}</div>
    <h3>${l.name}</h3>
    <dl>
      <dt>Associated with</dt><dd>${l.associatedWith}</dd>
      <dt>${t.lbl_year}</dt><dd>${l.year}</dd>
    </dl>
    <div class="sig">${loc.significance}</div>
    <span class="conf ${confClass(l.confidence)}" style="margin-top:14px;">${confLabel(l.confidence, t)}</span>
    <button class="btn ghost" id="cite-btn" style="margin-top:16px; width:100%;">${t.btn_cite || "Copy citation"}</button>
    ${l.lat !== undefined ? `<a class="btn ghost" href="map.html" style="margin-top:10px; width:100%; display:block; text-align:center; box-sizing:border-box;">${t.btn_view_map || "View on map"}</a>` : ""}
  `;
  wireCiteButton(card, l, "location");
  backdrop.classList.add("open");
}
async function initLocationsPage(){
  await loadLocations();
  const grid = document.getElementById("specimen-grid");
  const count = document.getElementById("results-count");
  prefillSearchFromQuery();
  function render(){
    const q = document.getElementById("search-box").value.trim().toLowerCase();
    const confSel = document.getElementById("confidence-filter");
    const conf = confSel ? confSel.value : "all";
    const filtered = LOCATIONS.filter(l => {
      const matchesQ = !q || l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q) || l.associatedWith.toLowerCase().includes(q);
      const matchesConf = conf === "all" || l.confidence === conf;
      return matchesQ && matchesConf;
    });
    grid.innerHTML = "";
    filtered.forEach(l => grid.appendChild(locationCard(l, I18N[getLang()])));
    count.textContent = `${filtered.length} ${I18N[getLang()].results}`;
    staggerIn(grid);
  }
  render();
  document.getElementById("search-box").addEventListener("input", render);
  const confSel = document.getElementById("confidence-filter");
  if(confSel) confSel.addEventListener("change", render);
  document.getElementById("modal-backdrop").addEventListener("click", e=>{ if(e.target.id==="modal-backdrop") closeModal(); });
  document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeModal(); });
  window.onLangChange = render;
}

async function initHomeStats(){
  await loadSpecies();
  const domains = new Set(SPECIES.map(s=>s.domain)).size;
  const years = SPECIES.length ? (2026 - Math.min(...SPECIES.map(s=>s.year))) : 0;
  const elSpecies = document.getElementById("stat-species");
  const elDomains = document.getElementById("stat-domains");
  const elYears = document.getElementById("stat-years");
  if(elSpecies) elSpecies.textContent = SPECIES.length + "+";
  if(elDomains) elDomains.textContent = domains;
  if(elYears) elYears.textContent = years + "+";
}

/* ---------- "By the numbers" live data visualization ---------- */
function buildChart(containerId, rows, maxVal){
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = "";
  rows.forEach(([label, count]) => {
    const pct = Math.round((count / maxVal) * 100);
    const row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML = `
      <div class="chart-label">${label}</div>
      <div class="chart-track"><div class="chart-fill" data-pct="${pct}"></div></div>
      <div class="chart-num">${count}</div>
    `;
    container.appendChild(row);
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const fill = entry.target.querySelector(".chart-fill");
        fill.style.width = fill.dataset.pct + "%";
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  container.querySelectorAll(".chart-row").forEach(row => observer.observe(row));
}

async function initHomeCharts(){
  await Promise.all([loadSpecies(), loadDiscoveries()]);
  const lang = getLang();

  const domainCounts = {};
  SPECIES.forEach(s => { domainCounts[s.domain] = (domainCounts[s.domain] || 0) + 1; });
  const domainRows = Object.entries(domainCounts)
    .sort((a,b) => b[1]-a[1])
    .map(([domain, count]) => {
      const label = (lang !== "en" && SPECIES_I18N && SPECIES_I18N.domains[domain]) ? SPECIES_I18N.domains[domain][lang] : domain;
      return [label, count];
    });
  const maxDomain = Math.max(...domainRows.map(r => r[1]));
  buildChart("chart-domains", domainRows, maxDomain);

  const decadeCounts = {};
  DISCOVERIES.forEach(d => {
    const decade = Math.floor(d.year / 10) * 10;
    const label = `${decade}s`;
    decadeCounts[label] = (decadeCounts[label] || 0) + 1;
  });
  const decadeRows = Object.entries(decadeCounts).sort((a,b) => parseInt(a[0]) - parseInt(b[0]));
  const maxDecade = Math.max(...decadeRows.map(r => r[1]));
  buildChart("chart-decades", decadeRows, maxDecade);
}


/* ============================================================
   Landmark Experiments
   ============================================================ */
let EXPERIMENTS = [];
let EXPERIMENTS_I18N = null;
async function loadExperiments(){
  try{ const res = await fetch("data/experiments.json"); EXPERIMENTS = await res.json(); }
  catch(e){ console.error(e); EXPERIMENTS = []; }
  try{ const res2 = await fetch("data/experiments_i18n.json"); EXPERIMENTS_I18N = await res2.json(); }
  catch(e){ EXPERIMENTS_I18N = null; }
  return EXPERIMENTS;
}
function localizedExperiment(ex){
  const lang = getLang();
  if(lang === "en" || !EXPERIMENTS_I18N) return { title: ex.title, question: ex.question, method: ex.method, result: ex.result, significance: ex.significance };
  const row = EXPERIMENTS_I18N.find(x => x.id === ex.id);
  if(!row) return { title: ex.title, question: ex.question, method: ex.method, result: ex.result, significance: ex.significance };
  return {
    title: row["title_"+lang], question: row["question_"+lang], method: row["method_"+lang],
    result: row["result_"+lang], significance: row["significance_"+lang]
  };
}
function experimentCard(ex, t){
  const loc = localizedExperiment(ex);
  const div = document.createElement("div");
  div.className = "specimen";
  div.innerHTML = `
    <div class="tag-no">No. ${String(ex.id).padStart(3,"0")}</div>
    <h3>${loc.title}</h3>
    <div class="domain">${ex.scientist}</div>
    <div class="meta">${ex.location} · ${ex.year}</div>
    <span class="conf ${confClass(ex.confidence)}">${confLabel(ex.confidence, t)}</span>
  `;
  div.tabIndex = 0;
  div.addEventListener("click", ()=>openExperimentModal(ex, t));
  return div;
}
function openExperimentModal(ex, t){
  if(window.trackVisit) window.trackVisit("experiment", ex.id);
  const loc = localizedExperiment(ex);
  const backdrop = document.getElementById("modal-backdrop");
  const card = document.getElementById("modal-card");
  card.innerHTML = `
    <button class="close" aria-label="${t.close}" onclick="closeModal()">✕</button>
    <div class="tag-no">No. ${String(ex.id).padStart(3,"0")} · ${ex.year}</div>
    <h3>${loc.title}</h3>
    <dl>
      <dt>${t.lbl_scientist || "Scientist"}</dt><dd>${ex.scientist}</dd>
      <dt>${t.lbl_location}</dt><dd>${ex.location}</dd>
    </dl>
    <div class="exp-block"><span class="exp-label">${t.lbl_question || "Question"}</span><p>${loc.question}</p></div>
    <div class="exp-block"><span class="exp-label">${t.lbl_method || "Method"}</span><p>${loc.method}</p></div>
    <div class="exp-block"><span class="exp-label">${t.lbl_result || "Result"}</span><p>${loc.result}</p></div>
    <div class="exp-block"><span class="exp-label">${t.lbl_significance || "Significance"}</span><p>${loc.significance}</p></div>
    <span class="conf ${confClass(ex.confidence)}" style="margin-top:14px;">${confLabel(ex.confidence, t)}</span>
    <button class="btn ghost" id="cite-btn" style="margin-top:16px; width:100%;" data-kind="experiment" data-id="${ex.id}">${t.btn_cite || "Copy citation"}</button>
  `;
  wireCiteButton(card, ex, "experiment");
  backdrop.classList.add("open");
}
async function initExperimentsPage(){
  await loadExperiments();
  const grid = document.getElementById("specimen-grid");
  const count = document.getElementById("results-count");
  prefillSearchFromQuery();
  function render(){
    const q = document.getElementById("search-box").value.trim().toLowerCase();
    const filtered = EXPERIMENTS.filter(ex => {
      const loc = localizedExperiment(ex);
      return !q || loc.title.toLowerCase().includes(q) || ex.scientist.toLowerCase().includes(q);
    });
    grid.innerHTML = "";
    filtered.forEach(ex => grid.appendChild(experimentCard(ex, I18N[getLang()])));
    count.textContent = `${filtered.length} ${I18N[getLang()].results}`;
    staggerIn(grid);
  }
  render();
  document.getElementById("search-box").addEventListener("input", render);
  document.getElementById("modal-backdrop").addEventListener("click", e=>{ if(e.target.id==="modal-backdrop") closeModal(); });
  document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeModal(); });
  window.onLangChange = render;
}

/* ============================================================
   Citation export -- self-referential archive citation (APA-style)
   ============================================================ */
function buildCitation(kind, id){
  const site = "Microbial Odyssey";
  const url = `https://microbial-odyssey.example.com/${kind === "species" ? "species" : kind + "s"}.html?q=`;
  let author = "", year = "", title = "";
  if(kind === "species"){
    const s = SPECIES.find(x => x.id === id);
    if(!s) return "";
    author = s.discoverer; year = s.year; title = s.name;
  } else if(kind === "scientist"){
    const s = SCIENTISTS.find(x => x.id === id);
    if(!s) return "";
    author = s.name; year = s.lifespan; title = s.field;
  } else if(kind === "discovery"){
    const d = DISCOVERIES.find(x => x.id === id);
    if(!d) return "";
    author = d.people; year = d.year; title = d.title;
  } else if(kind === "location"){
    const l = LOCATIONS.find(x => x.id === id);
    if(!l) return "";
    author = l.associatedWith; year = l.year; title = l.name;
  } else if(kind === "experiment"){
    const ex = EXPERIMENTS.find(x => x.id === id);
    if(!ex) return "";
    author = ex.scientist; year = ex.year; title = ex.title;
  }
  return `${author} (${year}). ${title}. In ${site}: The History of Microbiology. ${url}${encodeURIComponent(title)}`;
}
function wireCiteButton(container, obj, kind){
  const btn = container.querySelector("#cite-btn");
  if(!btn) return;
  btn.addEventListener("click", () => {
    const citation = buildCitation(kind, obj.id);
    if(navigator.clipboard && citation){
      navigator.clipboard.writeText(citation).then(() => {
        const t = I18N[getLang()];
        const original = btn.textContent;
        btn.textContent = t.btn_cited || "Copied.";
        setTimeout(() => { btn.textContent = original; }, 1600);
      }).catch(() => {});
    }
  });
}

/* ============================================================
   Comparison tool
   ============================================================ */
let COMPARE_SET = [];
function toggleCompare(kind, id, name){
  const key = `${kind}:${id}`;
  const idx = COMPARE_SET.findIndex(c => c.key === key);
  if(idx >= 0){
    COMPARE_SET.splice(idx, 1);
  }else{
    if(COMPARE_SET.length >= 2) COMPARE_SET.shift();
    COMPARE_SET.push({ key, kind, id, name });
  }
  renderCompareBar();
}
function renderCompareBar(){
  let bar = document.getElementById("compare-bar");
  if(!bar){
    bar = document.createElement("div");
    bar.id = "compare-bar";
    document.body.appendChild(bar);
  }
  const t = I18N[getLang()];
  if(COMPARE_SET.length === 0){ bar.classList.remove("show"); bar.innerHTML = ""; return; }
  bar.classList.add("show");
  bar.innerHTML = COMPARE_SET.map(c => `<span class="compare-chip">${c.name}</span>`).join("") +
    (COMPARE_SET.length === 2 ? `<button class="btn" id="compare-go">${t.btn_compare || "Compare"}</button>` : `<span class="compare-hint">${t.compare_hint || "Select one more to compare"}</span>`) +
    `<button class="icon-btn" id="compare-clear" aria-label="Clear comparison">&times;</button>`;
  const goBtn = document.getElementById("compare-go");
  if(goBtn) goBtn.addEventListener("click", showComparison);
  document.getElementById("compare-clear").addEventListener("click", () => { COMPARE_SET = []; renderCompareBar(); });
}
function fieldsFor(kind, id){
  if(kind === "species"){
    const s = SPECIES.find(x => x.id === id); if(!s) return null;
    const loc = localizedSpecies(s);
    return { title: s.name, rows: [["Domain", loc.domain], ["Group", s.group], ["Discoverer", s.discoverer], ["Year", s.year], ["Location", s.location], ["Significance", loc.significance]] };
  }
  if(kind === "scientist"){
    const s = SCIENTISTS.find(x => x.id === id); if(!s) return null;
    const loc = localizedScientist(s);
    return { title: s.name, rows: [["Field", loc.field], ["Nationality", s.nationality], ["Lifespan", s.lifespan], ["Significance", loc.significance]] };
  }
  return null;
}
function showComparison(){
  if(COMPARE_SET.length !== 2) return;
  const a = fieldsFor(COMPARE_SET[0].kind, COMPARE_SET[0].id);
  const b = fieldsFor(COMPARE_SET[1].kind, COMPARE_SET[1].id);
  if(!a || !b) return;
  const backdrop = document.getElementById("modal-backdrop");
  const card = document.getElementById("modal-card");
  const t = I18N[getLang()];
  const rowsHtml = a.rows.map((r, i) => `
    <tr><td class="cmp-label">${r[0]}</td><td>${r[1]}</td><td>${b.rows[i] ? b.rows[i][1] : ""}</td></tr>
  `).join("");
  card.innerHTML = `
    <button class="close" aria-label="${t.close}" onclick="closeModal()">✕</button>
    <h3 style="margin-bottom:14px;">${t.h_compare || "Comparison"}</h3>
    <table class="compare-table">
      <tr><td></td><td class="cmp-title">${a.title}</td><td class="cmp-title">${b.title}</td></tr>
      ${rowsHtml}
    </table>
  `;
  backdrop.classList.add("open");
}
function addCompareCheckbox(cardEl, kind, id, name){
  const cb = document.createElement("button");
  cb.className = "compare-toggle";
  cb.type = "button";
  cb.setAttribute("aria-label", "Add to comparison");
  cb.textContent = "+";
  cb.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleCompare(kind, id, name);
    cb.classList.toggle("active");
  });
  cardEl.appendChild(cb);
}

/* ============================================================
   Microbe of the Day -- deterministic pick based on today's date
   ============================================================ */
async function initMicrobeOfDay(){
  const el = document.getElementById("motd-card");
  if(!el) return;
  await loadSpecies();
  if(!SPECIES.length) return;
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const pick = SPECIES[dayOfYear % SPECIES.length];
  const loc = localizedSpecies(pick);
  const t = I18N[getLang()];
  el.innerHTML = `
    <div class="tag-no">${t.motd_label || "Microbe of the day"}</div>
    <h3>${pick.name}</h3>
    <div class="domain">${loc.domain} · ${pick.group}</div>
    <div class="meta">${pick.discoverer}, ${pick.year}</div>
    <p style="margin-top:12px; color:var(--paper-dim); font-size:0.9rem;">${loc.significance}</p>
    <a class="btn ghost" href="species.html?q=${encodeURIComponent(pick.name)}" style="margin-top:14px; display:inline-block;">${t.motd_link || "Full record"}</a>
  `;
}

/* ============================================================
   Controversies
   ============================================================ */
let CONTROVERSIES = [];
let CONTROVERSIES_I18N = null;
async function loadControversies(){
  try{ const res = await fetch("data/controversies.json"); CONTROVERSIES = await res.json(); }
  catch(e){ console.error(e); CONTROVERSIES = []; }
  try{ const res2 = await fetch("data/controversies_i18n.json"); CONTROVERSIES_I18N = await res2.json(); }
  catch(e){ CONTROVERSIES_I18N = null; }
  return CONTROVERSIES;
}
function localizedControversy(c){
  const lang = getLang();
  if(lang === "en" || !CONTROVERSIES_I18N) return { title: c.title, claimA: c.claimA, claimB: c.claimB, evidence: c.evidence, resolution: c.resolution, modern: c.modern };
  const row = CONTROVERSIES_I18N.find(x => x.id === c.id);
  if(!row) return { title: c.title, claimA: c.claimA, claimB: c.claimB, evidence: c.evidence, resolution: c.resolution, modern: c.modern };
  return {
    title: row["title_"+lang], claimA: row["claimA_"+lang], claimB: row["claimB_"+lang],
    evidence: row["evidence_"+lang], resolution: row["resolution_"+lang], modern: row["modern_"+lang]
  };
}
function controversyCard(c, t){
  const loc = localizedControversy(c);
  const div = document.createElement("div");
  div.className = "specimen";
  div.innerHTML = `
    <div class="tag-no">No. ${String(c.id).padStart(3,"0")}</div>
    <h3>${loc.title}</h3>
    <div class="domain">${c.people}</div>
    <div class="meta">${c.location} · ${c.year}</div>
    <span class="conf ${confClass(c.confidence)}">${confLabel(c.confidence, t)}</span>
  `;
  div.tabIndex = 0;
  div.addEventListener("click", ()=>openControversyModal(c, t));
  return div;
}
function openControversyModal(c, t){
  const loc = localizedControversy(c);
  const backdrop = document.getElementById("modal-backdrop");
  const card = document.getElementById("modal-card");
  card.innerHTML = `
    <button class="close" aria-label="${t.close}" onclick="closeModal()">✕</button>
    <div class="tag-no">No. ${String(c.id).padStart(3,"0")} · ${c.year}</div>
    <h3>${loc.title}</h3>
    <div class="claim-pair">
      <div class="claim"><span class="exp-label">${t.lbl_claim_a || "Claim A"}</span><p>${loc.claimA}</p></div>
      <div class="claim"><span class="exp-label">${t.lbl_claim_b || "Claim B"}</span><p>${loc.claimB}</p></div>
    </div>
    <div class="exp-block"><span class="exp-label">${t.lbl_evidence || "Evidence"}</span><p>${loc.evidence}</p></div>
    <div class="exp-block"><span class="exp-label">${t.lbl_resolution || "What changed the debate"}</span><p>${loc.resolution}</p></div>
    <div class="exp-block"><span class="exp-label">${t.lbl_modern || "Modern understanding"}</span><p>${loc.modern}</p></div>
    <span class="conf ${confClass(c.confidence)}" style="margin-top:14px;">${confLabel(c.confidence, t)}</span>
  `;
  backdrop.classList.add("open");
}

/* ============================================================
   What Scientists Got Wrong (failed hypotheses)
   ============================================================ */
let FAILED_HYPOTHESES = [];
let FAILED_HYPOTHESES_I18N = null;
async function loadFailedHypotheses(){
  try{ const res = await fetch("data/failed_hypotheses.json"); FAILED_HYPOTHESES = await res.json(); }
  catch(e){ console.error(e); FAILED_HYPOTHESES = []; }
  try{ const res2 = await fetch("data/failed_hypotheses_i18n.json"); FAILED_HYPOTHESES_I18N = await res2.json(); }
  catch(e){ FAILED_HYPOTHESES_I18N = null; }
  return FAILED_HYPOTHESES;
}
function localizedFailedHypothesis(h){
  const lang = getLang();
  if(lang === "en" || !FAILED_HYPOTHESES_I18N) return { hypothesis: h.hypothesis, whyPlausible: h.whyPlausible, contradicting: h.contradicting, whatChanged: h.whatChanged };
  const row = FAILED_HYPOTHESES_I18N.find(x => x.id === h.id);
  if(!row) return { hypothesis: h.hypothesis, whyPlausible: h.whyPlausible, contradicting: h.contradicting, whatChanged: h.whatChanged };
  return {
    hypothesis: row["hypothesis_"+lang], whyPlausible: row["whyPlausible_"+lang],
    contradicting: row["contradicting_"+lang], whatChanged: row["whatChanged_"+lang]
  };
}
function hypothesisCard(h, t){
  const loc = localizedFailedHypothesis(h);
  const div = document.createElement("div");
  div.className = "specimen";
  div.innerHTML = `
    <div class="tag-no">No. ${String(h.id).padStart(3,"0")}</div>
    <h3>${loc.hypothesis}</h3>
    <div class="domain">${h.location}</div>
    <div class="meta">${h.yearRange}</div>
    <span class="conf ${confClass(h.confidence)}">${confLabel(h.confidence, t)}</span>
  `;
  div.tabIndex = 0;
  div.addEventListener("click", ()=>openHypothesisModal(h, t));
  return div;
}
function openHypothesisModal(h, t){
  const loc = localizedFailedHypothesis(h);
  const backdrop = document.getElementById("modal-backdrop");
  const card = document.getElementById("modal-card");
  card.innerHTML = `
    <button class="close" aria-label="${t.close}" onclick="closeModal()">✕</button>
    <div class="tag-no">${h.yearRange}</div>
    <h3>${loc.hypothesis}</h3>
    <div class="exp-block"><span class="exp-label">${t.lbl_why_plausible || "Why it seemed plausible"}</span><p>${loc.whyPlausible}</p></div>
    <div class="exp-block"><span class="exp-label">${t.lbl_contradicting || "Contradicting evidence"}</span><p>${loc.contradicting}</p></div>
    <div class="exp-block"><span class="exp-label">${t.lbl_what_changed || "What changed our minds"}</span><p>${loc.whatChanged}</p></div>
    <span class="conf ${confClass(h.confidence)}" style="margin-top:14px;">${confLabel(h.confidence, t)}</span>
  `;
  backdrop.classList.add("open");
}

async function initControversiesPage(){
  await Promise.all([loadControversies(), loadFailedHypotheses()]);
  const grid1 = document.getElementById("controversies-grid");
  const grid2 = document.getElementById("hypotheses-grid");
  const count1 = document.getElementById("controversies-count");
  const count2 = document.getElementById("hypotheses-count");
  function render(){
    const t = I18N[getLang()];
    grid1.innerHTML = "";
    CONTROVERSIES.forEach(c => grid1.appendChild(controversyCard(c, t)));
    if(count1) count1.textContent = `${CONTROVERSIES.length} ${t.results}`;
    staggerIn(grid1);
    grid2.innerHTML = "";
    FAILED_HYPOTHESES.forEach(h => grid2.appendChild(hypothesisCard(h, t)));
    if(count2) count2.textContent = `${FAILED_HYPOTHESES.length} ${t.results}`;
    staggerIn(grid2);
  }
  render();
  document.getElementById("modal-backdrop").addEventListener("click", e=>{ if(e.target.id==="modal-backdrop") closeModal(); });
  document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeModal(); });
  window.onLangChange = render;
}

/* ============================================================
   Historical Laboratories
   ============================================================ */
let LABORATORIES = [];
let LABORATORIES_I18N = null;
async function loadLaboratories(){
  try{ const res = await fetch("data/laboratories.json"); LABORATORIES = await res.json(); }
  catch(e){ console.error(e); LABORATORIES = []; }
  try{ const res2 = await fetch("data/laboratories_i18n.json"); LABORATORIES_I18N = await res2.json(); }
  catch(e){ LABORATORIES_I18N = null; }
  return LABORATORIES;
}
function localizedLab(l){
  const lang = getLang();
  if(lang === "en" || !LABORATORIES_I18N) return { significance: l.significance };
  const row = LABORATORIES_I18N.find(x => x.id === l.id);
  return { significance: row ? row["significance_"+lang] : l.significance };
}
function labCard(l, t){
  const loc = localizedLab(l);
  const div = document.createElement("div");
  div.className = "specimen";
  div.innerHTML = `
    <div class="tag-no">No. ${String(l.id).padStart(3,"0")}</div>
    <h3>${l.name}</h3>
    <div class="domain">${l.location}</div>
    <div class="meta">${l.period}</div>
    <span class="conf ${confClass(l.confidence)}">${confLabel(l.confidence, t)}</span>
  `;
  div.tabIndex = 0;
  div.addEventListener("click", ()=>openLabModal(l, t));
  return div;
}
function openLabModal(l, t){
  const loc = localizedLab(l);
  const backdrop = document.getElementById("modal-backdrop");
  const card = document.getElementById("modal-card");
  card.innerHTML = `
    <button class="close" aria-label="${t.close}" onclick="closeModal()">✕</button>
    <div class="tag-no">${l.period}</div>
    <h3>${l.name}</h3>
    <dl>
      <dt>${t.lbl_location}</dt><dd>${l.location}</dd>
      <dt>${t.lbl_scientist || "Scientists"}</dt><dd>${l.scientists}</dd>
    </dl>
    <div class="sig">${loc.significance}</div>
    <span class="conf ${confClass(l.confidence)}" style="margin-top:14px;">${confLabel(l.confidence, t)}</span>
  `;
  backdrop.classList.add("open");
}

/* ============================================================
   Tools that changed microbiology
   ============================================================ */
let TOOLS = [];
let TOOLS_I18N = null;
async function loadTools(){
  try{ const res = await fetch("data/tools.json"); TOOLS = await res.json(); }
  catch(e){ console.error(e); TOOLS = []; }
  try{ const res2 = await fetch("data/tools_i18n.json"); TOOLS_I18N = await res2.json(); }
  catch(e){ TOOLS_I18N = null; }
  return TOOLS;
}
function localizedTool(x){
  const lang = getLang();
  if(lang === "en" || !TOOLS_I18N) return { name: x.name, significance: x.significance, modernDescendant: x.modernDescendant };
  const row = TOOLS_I18N.find(r => r.id === x.id);
  if(!row) return { name: x.name, significance: x.significance, modernDescendant: x.modernDescendant };
  return { name: row["name_"+lang], significance: row["significance_"+lang], modernDescendant: row["modernDescendant_"+lang] };
}
function toolCard(x, t){
  const loc = localizedTool(x);
  const div = document.createElement("div");
  div.className = "specimen";
  div.innerHTML = `
    <div class="tag-no">No. ${String(x.id).padStart(3,"0")}</div>
    <h3>${loc.name}</h3>
    <div class="domain">${x.inventor}</div>
    <div class="meta">${x.year}</div>
    <span class="conf ${confClass(x.confidence)}">${confLabel(x.confidence, t)}</span>
  `;
  div.tabIndex = 0;
  div.addEventListener("click", ()=>openToolModal(x, t));
  return div;
}
function openToolModal(x, t){
  const loc = localizedTool(x);
  const backdrop = document.getElementById("modal-backdrop");
  const card = document.getElementById("modal-card");
  card.innerHTML = `
    <button class="close" aria-label="${t.close}" onclick="closeModal()">✕</button>
    <div class="tag-no">${x.year}</div>
    <h3>${loc.name}</h3>
    <dl>
      <dt>${t.lbl_inventor || "Inventor"}</dt><dd>${x.inventor}</dd>
    </dl>
    <div class="exp-block"><span class="exp-label">${t.lbl_significance}</span><p>${loc.significance}</p></div>
    <div class="exp-block"><span class="exp-label">${t.lbl_descendant || "Modern descendant"}</span><p>${loc.modernDescendant}</p></div>
    <span class="conf ${confClass(x.confidence)}" style="margin-top:14px;">${confLabel(x.confidence, t)}</span>
  `;
  backdrop.classList.add("open");
}

async function initLabsToolsPage(){
  await Promise.all([loadLaboratories(), loadTools()]);
  const grid1 = document.getElementById("labs-grid");
  const grid2 = document.getElementById("tools-grid");
  const count1 = document.getElementById("labs-count");
  const count2 = document.getElementById("tools-count");
  function render(){
    const t = I18N[getLang()];
    grid1.innerHTML = "";
    LABORATORIES.forEach(l => grid1.appendChild(labCard(l, t)));
    if(count1) count1.textContent = `${LABORATORIES.length} ${t.results}`;
    staggerIn(grid1);
    grid2.innerHTML = "";
    TOOLS.forEach(x => grid2.appendChild(toolCard(x, t)));
    if(count2) count2.textContent = `${TOOLS.length} ${t.results}`;
    staggerIn(grid2);
  }
  render();
  document.getElementById("modal-backdrop").addEventListener("click", e=>{ if(e.target.id==="modal-backdrop") closeModal(); });
  document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeModal(); });
  window.onLangChange = render;
}
