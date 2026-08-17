/* ============================================================
   MICROBIAL ODYSSEY -- transitions, splash, back-to-top
   ============================================================ */

function reducedMotion(){
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initPageTransitions(){
  const overlay = document.createElement("div");
  overlay.id = "mo-transition";
  const firstLoad = !sessionStorage.getItem("mo_splash_shown");

  if(firstLoad){
    overlay.classList.add("mo-splash");
    overlay.innerHTML = `
      <div class="mo-scan"></div>
      <div class="mo-brand">
        <span class="glyph">🦑</span>
        <span class="word">Microbial Odyssey</span>
        <div class="bar"><div class="bar-fill"></div></div>
      </div>
    `;
    sessionStorage.setItem("mo_splash_shown", "1");
  }else{
    overlay.innerHTML = '<div class="mo-scan"></div>';
  }
  document.body.appendChild(overlay);

  if(reducedMotion()){
    overlay.classList.add("mo-skip");
    return;
  }

  const revealDelay = firstLoad ? 900 : 0;
  setTimeout(()=>{
    requestAnimationFrame(()=>{
      overlay.classList.add("mo-reveal");
      setTimeout(()=> overlay.classList.add("mo-done"), 520);
    });
  }, revealDelay);

  document.addEventListener("click", (e)=>{
    const a = e.target.closest("a");
    if(!a) return;
    const href = a.getAttribute("href");
    if(!href || href.startsWith("http") || href.startsWith("#") || a.target === "_blank") return;
    if(!href.endsWith(".html") && !href.includes(".html?")) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    overlay.classList.remove("mo-done");
    overlay.classList.remove("mo-splash");
    overlay.innerHTML = '<div class="mo-scan"></div>';
    overlay.classList.add("mo-cover");
    setTimeout(()=>{ window.location.href = href; }, 380);
  });
}

function initSocialGlow(){
  document.querySelectorAll(".social-ico").forEach(el=>{
    el.addEventListener("mouseenter", ()=> el.classList.add("pulse"));
    el.addEventListener("animationend", ()=> el.classList.remove("pulse"));
  });
}

function initBackToTop(){
  const btn = document.createElement("button");
  btn.id = "back-to-top";
  btn.type = "button";
  btn.setAttribute("aria-label", "Back to top");
  btn.textContent = "↑";
  document.body.appendChild(btn);

  window.addEventListener("scroll", ()=>{
    btn.classList.toggle("show", window.scrollY > 420);
  }, { passive:true });

  btn.addEventListener("click", ()=>{
    window.scrollTo({ top:0, behavior: reducedMotion() ? "auto" : "smooth" });
  });
}

function initOtherSites(){
  const row = document.getElementById("other-sites-row");
  if(!row) return;
  fetch("data/other_sites.json")
    .then(r => r.json())
    .then(sites => {
      row.innerHTML = sites.map(s => {
        const isPlaceholder = !s.url || s.url === "#";
        return `<a href="${s.url}" class="${isPlaceholder ? "placeholder" : ""}" ${isPlaceholder ? "" : 'target="_blank" rel="noopener"'}>${s.name}</a>`;
      }).join("");
    })
    .catch(()=>{});
}

document.addEventListener("DOMContentLoaded", ()=>{
  initPageTransitions();
  initSocialGlow();
  initBackToTop();
  initOtherSites();
});
