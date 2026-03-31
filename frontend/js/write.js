/* ══════════════════════════════════════
   write.js — Horizon Blog · Post Editor
══════════════════════════════════════ */

/* ─── STARFIELD ─── */
const canvas = document.getElementById('stars-canvas');
const ctx    = canvas.getContext('2d');
let stars    = [];

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
function initStars() {
  stars = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: Math.random() * 1.2 + 0.2, o: Math.random() * 0.6 + 0.1,
    s: Math.random() * 0.3 + 0.05, d: Math.random() > 0.5 ? 1 : -1,
  }));
}
function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(s => {
    s.o += s.s * 0.01 * s.d;
    if (s.o >= 0.7 || s.o <= 0.05) s.d *= -1;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(232,237,245,${s.o})`; ctx.fill();
  });
  requestAnimationFrame(drawStars);
}
resize(); initStars(); drawStars();
window.addEventListener('resize', () => { resize(); initStars(); });

/* ─── COVER IMAGE ─── */
const coverZone       = document.getElementById('coverZone');
const coverPlaceholder = document.getElementById('coverPlaceholder');
const coverImg        = document.getElementById('coverImg');
const coverRemove     = document.getElementById('coverRemove');
const coverInput      = document.getElementById('coverInput');
let   coverDataURL    = '';

coverPlaceholder.addEventListener('click', () => coverInput.click());

coverInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    coverDataURL = ev.target.result;
    coverImg.style.backgroundImage = `url(${coverDataURL})`;
    coverImg.style.display = 'block';
    coverPlaceholder.style.display = 'none';
    coverRemove.style.display = 'block';
    coverZone.classList.add('has-image');
    updateModalPreview();
  };
  reader.readAsDataURL(file);
});

coverRemove.addEventListener('click', e => {
  e.stopPropagation();
  coverDataURL = '';
  coverImg.style.display = 'none';
  coverPlaceholder.style.display = 'flex';
  coverRemove.style.display = 'none';
  coverZone.classList.remove('has-image');
  coverInput.value = '';
  updateModalPreview();
});

/* ─── TAGS INPUT ─── */
const tagsInput = document.getElementById('tagsInput');
const tagsList  = document.getElementById('tagsList');
let   tags      = [];

tagsInput.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ',') && tagsInput.value.trim()) {
    e.preventDefault();
    addTag(tagsInput.value.trim().replace(/,/g, ''));
    tagsInput.value = '';
  }
  if (e.key === 'Backspace' && !tagsInput.value && tags.length) {
    removeTag(tags.length - 1);
  }
});

function addTag(text) {
  if (tags.includes(text) || tags.length >= 5) return;
  tags.push(text);
  renderTags();
}
function removeTag(idx) {
  tags.splice(idx, 1);
  renderTags();
}
function renderTags() {
  tagsList.innerHTML = tags.map((t, i) =>
    `<span class="tag-chip">${t}<button class="tag-chip-remove" data-idx="${i}">×</button></span>`
  ).join('');
  tagsList.querySelectorAll('.tag-chip-remove').forEach(btn =>
    btn.addEventListener('click', () => removeTag(+btn.dataset.idx))
  );
}

/* ─── TOOLBAR ─── */
const bodyEditor = document.getElementById('bodyEditor');

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const cmd = btn.dataset.cmd;
    bodyEditor.focus();

    if (cmd === 'h2') {
      document.execCommand('formatBlock', false, '<h2>');
    } else if (cmd === 'h3') {
      document.execCommand('formatBlock', false, '<h3>');
    } else if (cmd === 'blockquote') {
      document.execCommand('formatBlock', false, '<blockquote>');
    } else if (cmd === 'createLink') {
      const url = prompt('Enter URL:');
      if (url) document.execCommand('createLink', false, url);
    } else {
      document.execCommand(cmd, false, null);
    }
    updateToolbarState();
  });
});

function updateToolbarState() {
  document.querySelectorAll('.tool-btn').forEach(btn => {
    const cmd = btn.dataset.cmd;
    const simple = ['bold','italic','underline','strikeThrough','insertUnorderedList','insertOrderedList'];
    if (simple.includes(cmd)) {
      btn.classList.toggle('active', document.queryCommandState(cmd));
    }
  });
}
bodyEditor.addEventListener('keyup', updateToolbarState);
bodyEditor.addEventListener('mouseup', updateToolbarState);

/* ─── WORD COUNT ─── */
const wordCountEl = document.getElementById('wordCount');
function updateWordCount() {
  const text = bodyEditor.innerText.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const mins  = Math.max(1, Math.ceil(words / 200));
  wordCountEl.textContent = `${words} word${words !== 1 ? 's' : ''} · ~${mins} min read`;
}
bodyEditor.addEventListener('input', updateWordCount);

/* ─── AUTO SAVE ─── */
const draftStatus = document.getElementById('draftStatus');
let saveTimer;

function triggerAutoSave() {
  clearTimeout(saveTimer);
  draftStatus.textContent = 'Saving…';
  draftStatus.className = 'draft-status saving';
  saveTimer = setTimeout(() => {
    draftStatus.textContent = 'Draft saved';
    draftStatus.className = 'draft-status saved';
    setTimeout(() => { draftStatus.className = 'draft-status'; }, 2000);
  }, 1200);
}

document.getElementById('titleField').addEventListener('input', triggerAutoSave);
document.getElementById('subtitleField').addEventListener('input', triggerAutoSave);
bodyEditor.addEventListener('input', () => { updateWordCount(); triggerAutoSave(); });

/* ─── PUBLISH MODAL ─── */
const publishModal  = document.getElementById('publishModal');
const publishBtn    = document.getElementById('publishBtn');
const cancelPublish = document.getElementById('cancelPublish');
const confirmPublish = document.getElementById('confirmPublish');

function updateModalPreview() {
  const title    = document.getElementById('titleField').innerText.trim() || 'Untitled';
  const subtitle = document.getElementById('subtitleField').innerText.trim() || 'No subtitle';
  const words    = bodyEditor.innerText.trim().split(/\s+/).filter(Boolean).length;
  const mins     = Math.max(1, Math.ceil(words / 200));
  const cat      = document.getElementById('categorySelect').value || 'Draft';

  document.getElementById('modalTitle').textContent    = title;
  document.getElementById('modalSubtitle').textContent = subtitle;
  document.getElementById('modalMeta').textContent     = `~${mins} min read · ${cat}`;

  const previewImg = document.getElementById('modalPreviewImg');
  if (coverDataURL) previewImg.style.backgroundImage = `url(${coverDataURL})`;

  const modalCat = document.getElementById('modalCategory');
  if (document.getElementById('categorySelect').value) {
    modalCat.value = document.getElementById('categorySelect').value;
  }
}

publishBtn.addEventListener('click', () => {
  updateModalPreview();
  publishModal.style.display = 'flex';
});
cancelPublish.addEventListener('click', () => { publishModal.style.display = 'none'; });
publishModal.addEventListener('click', e => { if (e.target === publishModal) publishModal.style.display = 'none'; });

confirmPublish.addEventListener('click', () => {
  confirmPublish.textContent = 'Publishing…';
  confirmPublish.disabled = true;
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1400);
});

/* ─── PREVIEW ─── */
document.getElementById('previewBtn').addEventListener('click', () => {
  // Opens a simple preview in a new tab (stub)
  const win = window.open('', '_blank');
  const title = document.getElementById('titleField').innerText || 'Preview';
  const body  = bodyEditor.innerHTML;
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet"/>
    <style>
      body { background:#030712; color:#e8edf5; font-family:'DM Sans',sans-serif; max-width:680px; margin:80px auto; padding:0 24px; }
      h1 { font-family:'Cormorant Garamond',serif; font-size:3rem; font-weight:300; margin-bottom:24px; }
      h2 { font-family:'Cormorant Garamond',serif; font-size:1.9rem; font-weight:400; margin:32px 0 16px; }
      p  { font-size:1rem; line-height:1.85; margin-bottom:20px; color:rgba(232,237,245,0.82); }
      blockquote { border-left:3px solid #4fffb0; padding:16px 20px; background:rgba(255,255,255,0.05); margin:24px 0; font-style:italic; }
    </style></head><body>
    <h1>${title}</h1>${body}
    </body></html>
  `);
  win.document.close();
});