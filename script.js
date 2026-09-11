/* =========================================================
   PROGRAMACION — toda la interactividad de la pagina.
   El contenido (textos, fotos, musica, links, comentarios,
   colores por defecto) vive en index.html y styles.css.
   ========================================================= */

function pad(num, len){ return String(num).padStart(len, "0"); }

function randomHex(){
  return Math.floor(Math.random()*16777215).toString(16).padStart(6,"0");
}

/* =========================================================
   LIGHTBOX
   ========================================================= */
function openLightbox(url){
  const overlay = document.getElementById("lightboxOverlay");
  document.getElementById("lightboxImg").src = url;
  overlay.classList.add("active");
}
function closeLightbox(){
  document.getElementById("lightboxOverlay").classList.remove("active");
}
function setupLightbox(){
  document.getElementById("galleryGrid").addEventListener("click", (e) => {
    const img = e.target.closest(".gallery-thumb-wrap img");
    if(!img) return;
    openLightbox(img.src);
  });
  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightboxOverlay").addEventListener("click", (e) => {
    if(e.target.id === "lightboxOverlay") closeLightbox();
  });
}

/* =========================================================
   ENTRADAS DE COMENTARIOS (guestbook / foto del dia)
   se guardan en localStorage para que sobrevivan al recargar
   ========================================================= */
const PAGE_KEY = location.pathname;
const GUESTBOOK_STORAGE_KEY = "retroGuestbookEntries:" + PAGE_KEY;
const POD_COMMENTS_STORAGE_KEY = "retroPodComments:" + PAGE_KEY;
const GUESTBOOK_DELETED_SEEDS_KEY = "retroDeletedSeeds:guestbook:" + PAGE_KEY;
const POD_DELETED_SEEDS_KEY = "retroDeletedSeeds:podComments:" + PAGE_KEY;

function loadStoredEntries(key){
  try{
    return JSON.parse(localStorage.getItem(key)) || [];
  }catch(e){
    return [];
  }
}
function saveStoredEntries(key, entries){
  localStorage.setItem(key, JSON.stringify(entries));
}

function createEntry(name, message){
  return {
    id: "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name,
    message,
    avatarUrl: `https://placehold.co/40x40/${randomHex()}/ffffff?text=${encodeURIComponent(name[0].toUpperCase())}`,
    date: new Date().toLocaleDateString("es-MX")
  };
}

function entryHTML(entry){
  return `
    <div class="gb-entry" data-id="${entry.id}">
      <img src="${entry.avatarUrl}" class="gb-avatar" width="40" height="40" alt="${entry.name}">
      <div class="gb-content">
        <span class="gb-username">${entry.name}</span><span class="gb-date">${entry.date}</span>
        <div class="gb-msg">${entry.message}</div>
      </div>
      <button class="gb-delete-btn" title="borrar comentario">✕</button>
    </div>
  `;
}

function hideDeletedSeeds(listId, seedDeletedKey){
  const list = document.getElementById(listId);
  loadStoredEntries(seedDeletedKey).forEach(id => {
    const el = list.querySelector(`[data-id="${id}"]`);
    if(el) el.remove();
  });
}

function setupCommentDeletion(listId, storedKey, seedDeletedKey, countElId){
  document.getElementById(listId).addEventListener("click", (e) => {
    const btn = e.target.closest(".gb-delete-btn");
    if(!btn) return;
    const entryEl = btn.closest(".gb-entry");
    const id = entryEl.dataset.id;
    entryEl.remove();

    if(id && id.indexOf("seed-") === 0){
      const deleted = loadStoredEntries(seedDeletedKey);
      deleted.push(id);
      saveStoredEntries(seedDeletedKey, deleted);
    } else {
      saveStoredEntries(storedKey, loadStoredEntries(storedKey).filter(entry => entry.id !== id));
    }

    if(countElId){
      const countEl = document.getElementById(countElId);
      countEl.textContent = pad(Math.max(0, parseInt(countEl.textContent, 10) - 1), 5);
    }
  });
}

function restoreStoredEntries(key, listId){
  const list = document.getElementById(listId);
  const entries = loadStoredEntries(key);
  entries.forEach(entry => {
    list.insertAdjacentHTML("afterbegin", entryHTML(entry));
  });
  return entries;
}

function setupGuestbookForm(){
  document.getElementById("gbSubmitBtn").addEventListener("click", () => {
    const nameInput = document.getElementById("gbNameInput");
    const msgInput = document.getElementById("gbMsgInput");
    const name = nameInput.value.trim();
    const msg = msgInput.value.trim();
    if(!name || !msg) return;
    const entry = createEntry(name, msg);
    document.getElementById("guestbookList").insertAdjacentHTML("afterbegin", entryHTML(entry));
    const stored = loadStoredEntries(GUESTBOOK_STORAGE_KEY);
    stored.push(entry);
    saveStoredEntries(GUESTBOOK_STORAGE_KEY, stored);
    nameInput.value = "";
    msgInput.value = "";
  });
}

function setupPodCommentForm(){
  document.getElementById("podCommentSubmitBtn").addEventListener("click", () => {
    const nameInput = document.getElementById("podCommentNameInput");
    const msgInput = document.getElementById("podCommentMsgInput");
    const name = nameInput.value.trim();
    const msg = msgInput.value.trim();
    if(!name || !msg) return;
    const entry = createEntry(name, msg);
    document.getElementById("podCommentsList").insertAdjacentHTML("afterbegin", entryHTML(entry));
    const stored = loadStoredEntries(POD_COMMENTS_STORAGE_KEY);
    stored.push(entry);
    saveStoredEntries(POD_COMMENTS_STORAGE_KEY, stored);
    const countEl = document.getElementById("podComments");
    countEl.textContent = pad(parseInt(countEl.textContent, 10) + 1, 5);
    nameInput.value = "";
    msgInput.value = "";
  });
}

/* =========================================================
   CONTADOR DE VISITAS
   ========================================================= */
function incrementProfileViews(){
  const el = document.getElementById("profileViews");
  el.textContent = pad(parseInt(el.textContent, 10) + 1, 6);
}

/* =========================================================
   MUSIC PLAYER (audio real)
   ========================================================= */
function setupMusicPlayer(){
  const btn = document.getElementById("musicPlayBtn");
  const progress = document.getElementById("musicProgress");
  const progressOuter = document.getElementById("musicProgressOuter");
  const audio = document.getElementById("musicAudio");
  const volumeBtn = document.getElementById("musicVolumeBtn");
  const volumeSlider = document.getElementById("musicVolumeSlider");

  btn.addEventListener("click", () => {
    if(audio.paused){
      audio.play();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => { btn.textContent = "❚❚"; });
  audio.addEventListener("pause", () => { btn.textContent = "▶"; });
  audio.addEventListener("ended", () => { btn.textContent = "▶"; });

  audio.addEventListener("timeupdate", () => {
    if(!audio.duration) return;
    progress.style.width = (audio.currentTime / audio.duration * 100) + "%";
  });

  progressOuter.addEventListener("click", (e) => {
    if(!audio.duration) return;
    const rect = progressOuter.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  });

  volumeBtn.addEventListener("click", () => {
    volumeSlider.classList.toggle("active");
  });

  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value / 100;
    audio.muted = false;
    volumeBtn.textContent = volumeSlider.value == 0 ? "🔇" : "🔊";
  });
}

/* =========================================================
   THEME ENGINE — aplica un objeto theme como variables CSS
   ========================================================= */
function applyTheme(theme){
  const root = document.documentElement.style;
  root.setProperty("--primary-color", theme.primaryColor);
  root.setProperty("--secondary-color", theme.secondaryColor);
  root.setProperty("--background-color", theme.backgroundColor);
  root.setProperty("--text-color", theme.textColor);
  root.setProperty("--border-color", theme.borderColor);
  root.setProperty("--link-color", theme.linkColor);
  root.setProperty("--panel-background", theme.panelBackground);
  root.setProperty("--header-background", theme.headerBackground);
  root.setProperty("--profile-width", theme.profileWidth + "px");
  root.setProperty("--border-width", theme.borderWidth + "px");
  root.setProperty("--border-radius", theme.borderRadius + "px");
  root.setProperty("--glossy-opacity", theme.glossy ? "0.35" : "0");

  let bgImage = "none";
  if(theme.bgType === "gradient"){
    bgImage = `linear-gradient(135deg, ${theme.primaryColor}, ${theme.backgroundColor}, ${theme.secondaryColor})`;
  } else if(theme.bgType === "pattern"){
    bgImage = `repeating-linear-gradient(45deg, ${theme.primaryColor} 0px, ${theme.primaryColor} 10px, ${theme.backgroundColor} 10px, ${theme.backgroundColor} 20px)`;
  } else if(theme.bgType === "image" && theme.bgImageUrl){
    bgImage = `url("${theme.bgImageUrl}")`;
  }
  root.setProperty("--outer-bg-image", bgImage);

  document.getElementById("marqueeWrap").classList.toggle("hidden", !theme.marquee);
  document.getElementById("glitterLayer").classList.toggle("active", !!theme.glitter);
  document.querySelectorAll(".stars-row, .hearts-sep, .stars-decor").forEach(el => {
    el.style.display = theme.decorations ? "" : "none";
  });

  if(theme.glitter){ startGlitter(); } else { stopGlitter(); }
}

/* =========================================================
   GLITTER EFFECT
   ========================================================= */
let glitterInterval = null;
function startGlitter(){
  if(glitterInterval) return;
  const layer = document.getElementById("glitterLayer");
  const symbols = ["★","✦","✧","♥","☆"];
  glitterInterval = setInterval(() => {
    const star = document.createElement("span");
    star.className = "glitter-star";
    star.textContent = symbols[Math.floor(Math.random()*symbols.length)];
    star.style.left = Math.random()*100 + "vw";
    star.style.animationDuration = (3 + Math.random()*3) + "s";
    star.style.fontSize = (10 + Math.random()*10) + "px";
    layer.appendChild(star);
    setTimeout(() => star.remove(), 6000);
  }, 250);
}
function stopGlitter(){
  clearInterval(glitterInterval);
  glitterInterval = null;
  document.getElementById("glitterLayer").innerHTML = "";
}

/* =========================================================
   TEMA INICIAL — se lee de las variables CSS (:root) y de
   los controles del panel, en vez de duplicar valores aqui
   ========================================================= */
function getInitialTheme(){
  const cs = getComputedStyle(document.documentElement);
  const num = (value, fallback) => {
    const n = parseInt(value);
    return Number.isNaN(n) ? fallback : n;
  };
  return {
    primaryColor: cs.getPropertyValue("--primary-color").trim(),
    secondaryColor: cs.getPropertyValue("--secondary-color").trim(),
    backgroundColor: cs.getPropertyValue("--background-color").trim(),
    textColor: cs.getPropertyValue("--text-color").trim(),
    borderColor: cs.getPropertyValue("--border-color").trim(),
    linkColor: cs.getPropertyValue("--link-color").trim(),
    panelBackground: cs.getPropertyValue("--panel-background").trim(),
    headerBackground: cs.getPropertyValue("--header-background").trim(),
    profileWidth: num(cs.getPropertyValue("--profile-width"), 780),
    borderWidth: num(cs.getPropertyValue("--border-width"), 2),
    borderRadius: num(cs.getPropertyValue("--border-radius"), 2),
    bgType: document.getElementById("cpBgType").value,
    bgImageUrl: document.getElementById("cpBgImageUrl").value,
    glitter: document.getElementById("cpGlitter").checked,
    marquee: document.getElementById("cpMarquee").checked,
    glossy: document.getElementById("cpGlossy").checked,
    decorations: document.getElementById("cpDecor").checked
  };
}

/* =========================================================
   CUSTOMIZE PANEL — UI + localStorage
   ========================================================= */
const STORAGE_KEY = "retroProfileTheme:" + PAGE_KEY;

function setupCustomizePanel(theme){
  const panel = document.getElementById("customizePanel");
  document.getElementById("customizeBtn").addEventListener("click", () => panel.classList.add("open"));
  document.getElementById("cpCloseBtn").addEventListener("click", () => panel.classList.remove("open"));

  const inputs = {
    primaryColor: document.getElementById("cpPrimary"),
    secondaryColor: document.getElementById("cpSecondary"),
    backgroundColor: document.getElementById("cpBg"),
    headerBackground: document.getElementById("cpHeader"),
    panelBackground: document.getElementById("cpPanelBg"),
    textColor: document.getElementById("cpText"),
    linkColor: document.getElementById("cpLink"),
    borderColor: document.getElementById("cpBorder"),
    profileWidth: document.getElementById("cpWidth"),
    borderWidth: document.getElementById("cpBorderWidth"),
    borderRadius: document.getElementById("cpRadius"),
    bgType: document.getElementById("cpBgType"),
    bgImageUrl: document.getElementById("cpBgImageUrl"),
    glitter: document.getElementById("cpGlitter"),
    marquee: document.getElementById("cpMarquee"),
    glossy: document.getElementById("cpGlossy"),
    decorations: document.getElementById("cpDecor")
  };

  function syncInputsFromTheme(){
    inputs.primaryColor.value = theme.primaryColor;
    inputs.secondaryColor.value = theme.secondaryColor;
    inputs.backgroundColor.value = theme.backgroundColor;
    inputs.headerBackground.value = theme.headerBackground;
    inputs.panelBackground.value = theme.panelBackground;
    inputs.textColor.value = theme.textColor;
    inputs.linkColor.value = theme.linkColor;
    inputs.borderColor.value = theme.borderColor;
    inputs.profileWidth.value = theme.profileWidth;
    inputs.borderWidth.value = theme.borderWidth;
    inputs.borderRadius.value = theme.borderRadius;
    inputs.bgType.value = theme.bgType;
    inputs.bgImageUrl.value = theme.bgImageUrl;
    inputs.glitter.checked = theme.glitter;
    inputs.marquee.checked = theme.marquee;
    inputs.glossy.checked = theme.glossy;
    inputs.decorations.checked = theme.decorations;
    document.getElementById("cpBgImageWrap").style.display =
      theme.bgType === "image" ? "flex" : "none";
  }

  function updateAndSave(){
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }

  Object.entries(inputs).forEach(([key, el]) => {
    el.addEventListener("input", () => {
      if(el.type === "checkbox"){
        theme[key] = el.checked;
      } else if(el.type === "range"){
        theme[key] = Number(el.value);
      } else {
        theme[key] = el.value;
      }
      if(key === "bgType"){
        document.getElementById("cpBgImageWrap").style.display =
          el.value === "image" ? "flex" : "none";
      }
      updateAndSave();
    });
  });

  document.querySelectorAll(".cp-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      Object.assign(theme, {
        primaryColor: btn.dataset.primary,
        secondaryColor: btn.dataset.secondary,
        backgroundColor: btn.dataset.bg,
        borderColor: btn.dataset.border,
        headerBackground: btn.dataset.header,
        linkColor: btn.dataset.link
      });
      syncInputsFromTheme();
      updateAndSave();
    });
  });

  document.getElementById("cpResetBtn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  syncInputsFromTheme();
}

function loadSavedTheme(theme){
  const saved = localStorage.getItem(STORAGE_KEY);
  if(saved){
    try{
      Object.assign(theme, JSON.parse(saved));
    }catch(e){ /* ignore corrupted data */ }
  }
}

/* =========================================================
   EDITAR CONTENIDO — cambia textos/fotos de esta página y
   los guarda en localStorage para que persistan al recargar
   ========================================================= */
const CONTENT_STORAGE_KEY = "retroProfileContent:" + PAGE_KEY;

function loadSavedContent(){
  try{
    return JSON.parse(localStorage.getItem(CONTENT_STORAGE_KEY)) || {};
  }catch(e){
    return {};
  }
}
function saveContent(content){
  localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content));
}

function applyContent(c){
  if(c.username) document.getElementById("usernameTxt").textContent = c.username;
  if(c.realname) document.getElementById("realnameTxt").textContent = c.realname;
  if(c.profileTitle) document.getElementById("profileTitle").textContent = c.profileTitle;
  if(c.subtitle) document.getElementById("profileSubtitle").textContent = c.subtitle;
  if(c.age) document.getElementById("infoAge").textContent = c.age;
  if(c.city) document.getElementById("infoCity").textContent = c.city;
  if(c.pronouns) document.getElementById("infoPronouns").textContent = c.pronouns;
  if(c.status) document.getElementById("infoStatus").textContent = c.status;
  if(c.profilePicUrl) document.getElementById("profilePic").src = c.profilePicUrl;
  if(c.podImageUrl) document.getElementById("podImg").src = c.podImageUrl;
  if(c.podTitle) document.getElementById("podTitle").textContent = c.podTitle;
  if(c.podCaption) document.getElementById("podCaption").textContent = c.podCaption;
  if(c.musicCoverUrl) document.getElementById("musicCover").src = c.musicCoverUrl;
  if(c.musicSong) document.getElementById("musicSong").textContent = c.musicSong;
  if(c.musicArtist) document.getElementById("musicArtist").textContent = c.musicArtist;
  if(c.musicAudioUrl) document.getElementById("musicAudio").src = c.musicAudioUrl;

  if(c.mood){
    const moodEl = document.getElementById("infoMood");
    const img = moodEl.querySelector("img");
    moodEl.innerHTML = escapeHtml(c.mood) + " " + (img ? img.outerHTML : "");
  }

  if(c.aboutMe){
    document.getElementById("aboutMeBody").innerHTML =
      escapeHtml(c.aboutMe).replace(/\n/g, "<br>") +
      `<br><br><span class="hearts-sep">♥ ♥ ♥ ♥ ♥ ♥ ♥ ♥ ♥ ♥</span>`;
  }

  if(c.interests){
    document.querySelector("#interestsBody ul").innerHTML = c.interests
      .split("\n").map(s => s.trim()).filter(Boolean)
      .map(line => `<li>${escapeHtml(line)}</li>`).join("");
  }

  if(c.links){
    document.getElementById("linksList").innerHTML = c.links
      .split("\n").map(s => s.trim()).filter(Boolean)
      .map(line => {
        const [label, url] = line.split("|").map(s => s.trim());
        if(!label || !url) return "";
        return `<li><a href="${escapeHtml(url)}">${escapeHtml(label)}</a></li>`;
      }).filter(Boolean).join("");
  }
}

function fillContentInputs(){
  const set = (id, text) => { document.getElementById(id).value = (text || "").trim(); };
  set("ctUsername", document.getElementById("usernameTxt").textContent);
  set("ctRealname", document.getElementById("realnameTxt").textContent);
  set("ctProfileTitle", document.getElementById("profileTitle").textContent);
  set("ctSubtitle", document.getElementById("profileSubtitle").textContent);
  set("ctAge", document.getElementById("infoAge").textContent);
  set("ctCity", document.getElementById("infoCity").textContent);
  set("ctPronouns", document.getElementById("infoPronouns").textContent);
  set("ctStatus", document.getElementById("infoStatus").textContent);
  set("ctMood", document.getElementById("infoMood").childNodes[0] ? document.getElementById("infoMood").childNodes[0].textContent : "");
  set("ctAboutMe", document.getElementById("aboutMeBody").childNodes[0] ? document.getElementById("aboutMeBody").childNodes[0].textContent : "");
  set("ctInterests", Array.from(document.querySelectorAll("#interestsBody li")).map(li => li.textContent).join("\n"));
  set("ctPodTitle", document.getElementById("podTitle").textContent);
  set("ctPodCaption", document.getElementById("podCaption").textContent);
  set("ctMusicSong", document.getElementById("musicSong").textContent);
  set("ctMusicArtist", document.getElementById("musicArtist").textContent);
  set("ctLinks", Array.from(document.querySelectorAll("#linksList a")).map(a => `${a.textContent} | ${a.getAttribute("href")}`).join("\n"));
}

function setupContentPanel(){
  const overlay = document.getElementById("contentOverlay");
  const statusEl = document.getElementById("contentStatus");

  document.getElementById("contentEditBtn").addEventListener("click", () => {
    fillContentInputs();
    overlay.classList.add("open");
  });
  document.getElementById("contentCloseBtn").addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", (e) => {
    if(e.target === overlay) overlay.classList.remove("open");
  });

  document.getElementById("ctSaveBtn").addEventListener("click", async () => {
    statusEl.textContent = "guardando...";
    const val = (id) => document.getElementById(id).value.trim();
    const content = loadSavedContent();

    ["Username","Realname","ProfileTitle","Subtitle","Age","City","Pronouns","Status","Mood","AboutMe","Interests","PodTitle","PodCaption","MusicSong","MusicArtist","Links"]
      .forEach(field => {
        const v = val("ct" + field);
        if(v) content[field.charAt(0).toLowerCase() + field.slice(1)] = v;
      });

    const profilePicFile = document.getElementById("ctProfilePic").files[0];
    if(profilePicFile) content.profilePicUrl = await fileToDataURL(profilePicFile);
    const podImageFile = document.getElementById("ctPodImage").files[0];
    if(podImageFile) content.podImageUrl = await fileToDataURL(podImageFile);
    const musicCoverFile = document.getElementById("ctMusicCover").files[0];
    if(musicCoverFile) content.musicCoverUrl = await fileToDataURL(musicCoverFile);
    const musicFile = document.getElementById("ctMusicFile").files[0];
    if(musicFile) content.musicAudioUrl = await fileToDataURL(musicFile);

    saveContent(content);
    applyContent(content);
    statusEl.textContent = "¡guardado! ♥";
  });

  document.getElementById("ctResetBtn").addEventListener("click", () => {
    localStorage.removeItem(CONTENT_STORAGE_KEY);
    location.reload();
  });
}

/* =========================================================
   CREADOR DE PÁGINAS — genera un HTML propio para descargar,
   sin tocar el contenido de esta página
   ========================================================= */
function escapeHtml(str){
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fileToDataURL(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function fileToDataURLOrDefault(input, fallbackUrl){
  const file = input.files && input.files[0];
  if(!file) return fallbackUrl;
  return await fileToDataURL(file);
}

function getCurrentStylesheetText(){
  for(const sheet of document.styleSheets){
    try{
      if(sheet.href && sheet.href.indexOf("styles.css") !== -1){
        return Array.from(sheet.cssRules).map(r => r.cssText).join("\n");
      }
    }catch(e){ /* hoja de estilos inaccesible, seguir buscando */ }
  }
  return "";
}

const RUNTIME_FUNCTION_NAMES = [
  "pad", "randomHex",
  "openLightbox", "closeLightbox", "setupLightbox",
  "loadStoredEntries", "saveStoredEntries", "createEntry", "entryHTML", "restoreStoredEntries",
  "hideDeletedSeeds", "setupCommentDeletion",
  "setupGuestbookForm", "setupPodCommentForm",
  "incrementProfileViews",
  "setupMusicPlayer",
  "applyTheme",
  "startGlitter", "stopGlitter",
  "getInitialTheme",
  "setupCustomizePanel", "loadSavedTheme"
];

function buildRuntimeScript(){
  const fnSource = RUNTIME_FUNCTION_NAMES.map(name => window[name].toString()).join("\n\n");
  return `
let glitterInterval = null;
const PAGE_KEY = location.pathname;
const GUESTBOOK_STORAGE_KEY = "retroGuestbookEntries:" + PAGE_KEY;
const POD_COMMENTS_STORAGE_KEY = "retroPodComments:" + PAGE_KEY;
const GUESTBOOK_DELETED_SEEDS_KEY = "retroDeletedSeeds:guestbook:" + PAGE_KEY;
const POD_DELETED_SEEDS_KEY = "retroDeletedSeeds:podComments:" + PAGE_KEY;
const STORAGE_KEY = "retroProfileTheme:" + PAGE_KEY;

${fnSource}

document.addEventListener("DOMContentLoaded", () => {
  const theme = getInitialTheme();
  loadSavedTheme(theme);
  applyTheme(theme);
  setupCustomizePanel(theme);

  hideDeletedSeeds("guestbookList", GUESTBOOK_DELETED_SEEDS_KEY);
  hideDeletedSeeds("podCommentsList", POD_DELETED_SEEDS_KEY);

  restoreStoredEntries(GUESTBOOK_STORAGE_KEY, "guestbookList");
  const restoredPodComments = restoreStoredEntries(POD_COMMENTS_STORAGE_KEY, "podCommentsList");
  if(restoredPodComments.length){
    const countEl = document.getElementById("podComments");
    countEl.textContent = pad(parseInt(countEl.textContent, 10) + restoredPodComments.length, 5);
  }

  setupCommentDeletion("guestbookList", GUESTBOOK_STORAGE_KEY, GUESTBOOK_DELETED_SEEDS_KEY);
  setupCommentDeletion("podCommentsList", POD_COMMENTS_STORAGE_KEY, POD_DELETED_SEEDS_KEY, "podComments");

  setupGuestbookForm();
  setupPodCommentForm();
  setupMusicPlayer();
  setupLightbox();

  incrementProfileViews();
});
`;
}

function buildGeneratedPageHTML(d){
  const interestsHTML = d.interests
    .split("\n").map(s => s.trim()).filter(Boolean)
    .map(line => `<li>${escapeHtml(line)}</li>`).join("\n              ");

  const galleryHTML = d.galleryImages.map(url => `
            <div class="gallery-thumb-wrap"><img src="${url}" alt="foto" loading="lazy"></div>`).join("");

  const linksHTML = d.links
    .split("\n").map(s => s.trim()).filter(Boolean)
    .map(line => {
      const [label, url] = line.split("|").map(s => s.trim());
      if(!label || !url) return "";
      return `<li><a href="${escapeHtml(url)}">${escapeHtml(label)}</a></li>`;
    }).filter(Boolean).join("\n              ");

  const aboutMeHTML = escapeHtml(d.aboutMe).replace(/\n/g, "<br>");
  const today = new Date().toLocaleDateString("es-MX");
  const cssText = getCurrentStylesheetText();
  const styleTag = cssText ? `<style>\n${cssText}\n</style>` : `<link rel="stylesheet" href="styles.css">`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>♡ ${escapeHtml(d.profileTitle)} ♡ | ${escapeHtml(d.siteTitle)}</title>
${styleTag}
</head>
<body>

<div class="marquee-wrap" id="marqueeWrap">
  <div class="marquee-track" id="marqueeTrack">
    <span>★ bienvenido a mi pagina ★ agregame ★ deja un comentario en mi guestbook ★ ONLINE NOW ★ bienvenido a mi pagina ★ agregame ★ deja un comentario en mi guestbook ★ ONLINE NOW ★</span>
  </div>
</div>

<div class="page-outer">
  <div class="container" id="mainContainer">

    <header class="top-header">
      <div class="header-left">
        <span class="site-title" id="siteTitleTxt">${escapeHtml(d.siteTitle)}</span>
      </div>
      <nav class="top-nav" id="topNav">
        <a href="#home">Home</a><span class="sep">|</span>
        <a href="#about">About</a><span class="sep">|</span>
        <a href="#gallery">Gallery</a><span class="sep">|</span>
        <a href="#guestbook">Guestbook</a><span class="sep">|</span>
        <a href="#contact">Contact</a>
      </nav>
    </header>

    <div class="hero-title-box" id="home">
      <h1 class="profile-title" id="profileTitle">${escapeHtml(d.profileTitle)}</h1>
      <p class="profile-subtitle" id="profileSubtitle">${escapeHtml(d.subtitle)}</p>
      <div class="stars-row">★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★</div>
    </div>

    <button id="customizeBtn" class="customize-btn">✎ CUSTOMIZE</button>

    <div class="main-grid">
      <aside class="col col-left">

        <div class="module" id="about">
          <div class="module-header">▸ MY INFO</div>
          <div class="module-body profile-card">
            <img src="${d.profilePicUrl}" alt="foto de perfil" class="profile-pic" id="profilePic">
            <div class="username" id="usernameTxt">${escapeHtml(d.username)}</div>
            <div class="realname" id="realnameTxt">${escapeHtml(d.realname)}</div>
            <table class="info-table">
              <tr><td>Edad:</td><td id="infoAge">${escapeHtml(d.age)}</td></tr>
              <tr><td>Ciudad:</td><td id="infoCity">${escapeHtml(d.city)}</td></tr>
              <tr><td>Pronombres:</td><td id="infoPronouns">${escapeHtml(d.pronouns)}</td></tr>
              <tr><td>Estado:</td><td><span class="badge-online" id="infoStatus">${escapeHtml(d.status)}</span></td></tr>
              <tr><td>Últ. conexión:</td><td id="infoLastLogin">${today}</td></tr>
              <tr><td>Mood:</td><td id="infoMood">${escapeHtml(d.mood)}</td></tr>
            </table>
          </div>
        </div>

        <div class="module">
          <div class="module-header">▸ INTERESTS</div>
          <div class="module-body" id="interestsBody">
            <ul class="dotted-list">
              ${interestsHTML}
            </ul>
          </div>
        </div>

        <div class="module">
          <div class="module-header">▸ COUNTERS</div>
          <div class="module-body counters-body">
            <div class="counter-line">PROFILE VIEWS: <span class="counter-num" id="profileViews">000000</span></div>
            <div class="counter-line">LIKES: <span class="counter-num" id="likesCount">0000</span></div>
            <div class="counter-line">FRIENDS: <span class="counter-num" id="friendsCount">0000</span></div>
          </div>
        </div>

      </aside>

      <main class="col col-center">

        <div class="module photo-of-day-module">
          <div class="module-header">▸ FOTO DEL DIA ★</div>
          <div class="module-body photo-of-day-body">
            <div class="pod-frame">
              <img src="${d.podImageUrl}" alt="foto del dia" class="pod-img" id="podImg">
              <div class="pod-date" id="podDate">${today}</div>
            </div>
            <h3 class="pod-title" id="podTitle">${escapeHtml(d.podTitle)}</h3>
            <p class="pod-caption" id="podCaption">${escapeHtml(d.podCaption)}</p>
            <div class="pod-stats">
              <span>👁 views: <b id="podViews">00000</b></span>
              <span>♥ likes: <b id="podLikes">00000</b></span>
              <span>💬 comments: <b id="podComments">00000</b></span>
            </div>
          </div>
        </div>

        <div class="module" id="podCommentsModule">
          <div class="module-header">▸ COMENTARIOS DE LA FOTO ★</div>
          <div class="module-body">
            <div class="pod-comments-list" id="podCommentsList"></div>
            <div class="pod-comment-form">
              <div class="gb-form-title">✎ comenta esta foto:</div>
              <input type="text" id="podCommentNameInput" class="gb-input" placeholder="tu nombre...">
              <textarea id="podCommentMsgInput" class="gb-textarea" rows="2" placeholder="que te parecio la foto?"></textarea>
              <button id="podCommentSubmitBtn" class="gb-submit-btn">Comentar ♥</button>
            </div>
          </div>
        </div>

        <div class="module">
          <div class="module-header">▸ ABOUT ME</div>
          <div class="module-body about-me-body" id="aboutMeBody">
            ${aboutMeHTML}<br><br>
            <span class="hearts-sep">♥ ♥ ♥ ♥ ♥ ♥ ♥ ♥ ♥ ♥</span>
          </div>
        </div>

        <div class="module" id="gallery">
          <div class="module-header">▸ GALLERY</div>
          <div class="module-body gallery-grid" id="galleryGrid">${galleryHTML}
          </div>
        </div>

        <div class="module" id="guestbook">
          <div class="module-header">▸ GUESTBOOK</div>
          <div class="module-body">
            <div class="guestbook-list" id="guestbookList">
              <div class="gb-entry" data-id="seed-gb-1">
                <img src="https://placehold.co/40x40/ff00cc/ffffff?text=%E2%99%A5" class="gb-avatar" width="40" height="40" alt="MyRetroPage">
                <div class="gb-content">
                  <span class="gb-username">MyRetroPage</span><span class="gb-date">${today}</span>
                  <div class="gb-msg">¡bienvenidO a tu pagina! este es tu primer comentario de ejemplo, puedes borrarlo ♥</div>
                </div>
                <button class="gb-delete-btn" title="borrar comentario">✕</button>
              </div>
            </div>
            <div class="guestbook-form">
              <div class="gb-form-title">✎ deja tu comentario:</div>
              <input type="text" id="gbNameInput" class="gb-input" placeholder="tu nombre...">
              <textarea id="gbMsgInput" class="gb-textarea" rows="3" placeholder="escribe algo lindo :)"></textarea>
              <button id="gbSubmitBtn" class="gb-submit-btn">Enviar ♥</button>
            </div>
          </div>
        </div>

      </main>

      <aside class="col col-right">

        <div class="module" id="friends">
          <div class="module-header">▸ TOP FRIENDS</div>
          <div class="module-body top-friends-grid" id="topFriendsGrid"></div>
        </div>

        <div class="module">
          <div class="module-header">▸ NOW PLAYING ♪</div>
          <div class="module-body music-player">
            <img src="${d.musicCoverUrl}" alt="cover" class="music-cover" id="musicCover">
            <div class="music-info">
              <div class="music-song" id="musicSong">${escapeHtml(d.musicSong)}</div>
              <div class="music-artist" id="musicArtist">${escapeHtml(d.musicArtist)}</div>
              <div class="music-controls">
                <button id="musicPlayBtn" class="music-btn">▶</button>
                <div class="music-progress-outer" id="musicProgressOuter"><div class="music-progress-inner" id="musicProgress"></div></div>
                <button id="musicVolumeBtn" class="music-btn music-volume-btn">🔊</button>
                <input type="range" id="musicVolumeSlider" class="music-volume-slider" min="0" max="100" value="100">
              </div>
            </div>
            <audio id="musicAudio" preload="metadata" src="${d.musicAudioUrl}"></audio>
          </div>
        </div>

        <div class="module" id="contact">
          <div class="module-header">▸ LINKS</div>
          <div class="module-body">
            <ul class="links-list" id="linksList">
              ${linksHTML}
            </ul>
          </div>
        </div>

      </aside>

    </div>

    <footer class="site-footer">
      <div class="footer-hearts">♥ ♥ ♥ ★ ♥ ♥ ♥</div>
      <p>hecho con mucho ♥ y demasiado glitter</p>
    </footer>

  </div>
</div>

<div class="lightbox-overlay" id="lightboxOverlay">
  <div class="lightbox-box">
    <img src="" alt="" id="lightboxImg">
    <button id="lightboxClose" class="lightbox-close">✕ cerrar</button>
  </div>
</div>

<div class="customize-panel" id="customizePanel">
  <div class="cp-header">
    <span>⚙ PERSONALIZAR PÁGINA</span>
    <button id="cpCloseBtn" class="cp-close">✕</button>
  </div>
  <div class="cp-body">

    <div class="cp-section">
      <div class="cp-section-title">Presets rápidos</div>
      <div class="cp-preset-row">
        <button class="cp-preset" data-primary="#ff00cc" data-secondary="#00ccff" data-bg="#c400a0" data-border="#990066" data-header="#ff66cc" data-link="#0033ff">Rosa Metro</button>
        <button class="cp-preset" data-primary="#0066ff" data-secondary="#00ffff" data-bg="#001a66" data-border="#003399" data-header="#3399ff" data-link="#00ccff">Azul Eléctrico</button>
        <button class="cp-preset" data-primary="#ff0000" data-secondary="#ffffff" data-bg="#000000" data-border="#333333" data-header="#1a1a1a" data-link="#ff3333">Negro/Rojo</button>
        <button class="cp-preset" data-primary="#9900ff" data-secondary="#ff66ff" data-bg="#33004d" data-border="#660099" data-header="#b366ff" data-link="#cc00ff">Morado</button>
      </div>
    </div>

    <div class="cp-section">
      <div class="cp-section-title">Colores</div>
      <label>Color primario <input type="color" id="cpPrimary"></label>
      <label>Color secundario <input type="color" id="cpSecondary"></label>
      <label>Fondo exterior <input type="color" id="cpBg"></label>
      <label>Fondo del header/footer <input type="color" id="cpHeader"></label>
      <label>Fondo de los contenedores <input type="color" id="cpPanelBg"></label>
      <label>Color de texto <input type="color" id="cpText"></label>
      <label>Color de links <input type="color" id="cpLink"></label>
      <label>Color de bordes <input type="color" id="cpBorder"></label>
    </div>

    <div class="cp-section">
      <div class="cp-section-title">Estructura</div>
      <label>Ancho del perfil
        <input type="range" id="cpWidth" min="700" max="1100" step="10">
      </label>
      <label>Grosor de bordes
        <input type="range" id="cpBorderWidth" min="1" max="4" step="1">
      </label>
      <label>Radio de bordes
        <input type="range" id="cpRadius" min="0" max="16" step="1">
      </label>
    </div>

    <div class="cp-section">
      <div class="cp-section-title">Fondo exterior</div>
      <label>Tipo de fondo
        <select id="cpBgType">
          <option value="solid">Color sólido</option>
          <option value="gradient">Degradado</option>
          <option value="pattern">Patrón</option>
          <option value="image">Imagen (URL)</option>
        </select>
      </label>
      <label id="cpBgImageWrap" style="display:none">URL de imagen
        <input type="text" id="cpBgImageUrl" placeholder="https://...">
      </label>
    </div>

    <div class="cp-section">
      <div class="cp-section-title">Efectos</div>
      <label class="cp-checkbox"><input type="checkbox" id="cpGlitter"> Activar glitter/estrellas</label>
      <label class="cp-checkbox"><input type="checkbox" id="cpMarquee" checked> Mostrar marquee</label>
      <label class="cp-checkbox"><input type="checkbox" id="cpGlossy" checked> Efecto glossy en módulos</label>
      <label class="cp-checkbox"><input type="checkbox" id="cpDecor" checked> Mostrar decoraciones (★♥)</label>
    </div>

    <div class="cp-section">
      <button id="cpResetBtn" class="cp-reset-btn">↺ Restablecer todo</button>
    </div>

  </div>
</div>
<div class="glitter-layer" id="glitterLayer"></div>

<script>
${buildRuntimeScript()}
</script>
</body>
</html>
`;
}

function setupCreatorPanel(){
  const overlay = document.getElementById("creatorOverlay");
  const statusEl = document.getElementById("creatorStatus");

  document.getElementById("creatorBtn").addEventListener("click", () => overlay.classList.add("open"));
  document.getElementById("creatorCloseBtn").addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", (e) => {
    if(e.target === overlay) overlay.classList.remove("open");
  });

  document.getElementById("crGenerateBtn").addEventListener("click", async () => {
    statusEl.textContent = "generando...";

    const val = (id, fallback) => {
      const v = document.getElementById(id).value.trim();
      return v || fallback;
    };

    const galleryFiles = Array.from(document.getElementById("crGallery").files || []);
    const galleryImages = await Promise.all(galleryFiles.map(fileToDataURL));

    const data = {
      siteTitle: val("crSiteTitle", "MyRetroPage.net"),
      username: val("crUsername", "★ Tu_Usuario ★"),
      realname: val("crRealname", "Tu nombre"),
      profileTitle: val("crProfileTitle", "Lo0 meejoOr de mii ♡"),
      subtitle: val("crSubtitle", "✿ bienvenidO a mi espacio ✿"),
      age: val("crAge", "?"),
      city: val("crCity", "?"),
      pronouns: val("crPronouns", "?"),
      status: val("crStatus", "ONLINE NOW!"),
      mood: val("crMood", "feliz :)"),
      aboutMe: val("crAboutMe", "holaa!! bienvenidO a mi perfil ♥ este espacio es mio."),
      interests: val("crInterests", "♪ música: mi genero favorito\n🎬 pelis: mis favoritas\n📸 hobbies: mis hobbies"),
      podTitle: val("crPodTitle", "mi foto del dia"),
      podCaption: val("crPodCaption", "esta es mi foto del dia ✿"),
      musicSong: val("crMusicSong", "Mi cancion favorita"),
      musicArtist: val("crMusicArtist", "Artista"),
      links: val("crLinks", "Mi red social | https://instagram.com"),
      galleryImages,
      profilePicUrl: await fileToDataURLOrDefault(document.getElementById("crProfilePic"), "https://placehold.co/120x120/ff66cc/ffffff?text=PIC"),
      podImageUrl: await fileToDataURLOrDefault(document.getElementById("crPodImage"), "https://placehold.co/500x400/000000/ff00cc?text=FOTO+DEL+DIA"),
      musicCoverUrl: await fileToDataURLOrDefault(document.getElementById("crMusicCover"), "https://placehold.co/70x70/8800ff/ffffff?text=%E2%99%AA"),
      musicAudioUrl: await fileToDataURLOrDefault(document.getElementById("crMusicFile"), "")
    };

    const html = buildGeneratedPageHTML(data);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mi-pagina.html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    statusEl.textContent = "¡listo! revisa tus descargas ♥";
  });
}

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const theme = getInitialTheme();
  loadSavedTheme(theme);
  applyTheme(theme);
  setupCustomizePanel(theme);

  applyContent(loadSavedContent());
  setupContentPanel();

  hideDeletedSeeds("guestbookList", GUESTBOOK_DELETED_SEEDS_KEY);
  hideDeletedSeeds("podCommentsList", POD_DELETED_SEEDS_KEY);

  restoreStoredEntries(GUESTBOOK_STORAGE_KEY, "guestbookList");
  const restoredPodComments = restoreStoredEntries(POD_COMMENTS_STORAGE_KEY, "podCommentsList");
  if(restoredPodComments.length){
    const countEl = document.getElementById("podComments");
    countEl.textContent = pad(parseInt(countEl.textContent, 10) + restoredPodComments.length, 5);
  }

  setupCommentDeletion("guestbookList", GUESTBOOK_STORAGE_KEY, GUESTBOOK_DELETED_SEEDS_KEY);
  setupCommentDeletion("podCommentsList", POD_COMMENTS_STORAGE_KEY, POD_DELETED_SEEDS_KEY, "podComments");

  setupGuestbookForm();
  setupPodCommentForm();
  setupMusicPlayer();
  setupLightbox();
  setupCreatorPanel();

  incrementProfileViews();
});