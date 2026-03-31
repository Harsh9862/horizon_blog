/* ══════════════════════════════════════
   blog.js — Horizon Blog · Explore Page
══════════════════════════════════════ */

/* ─── STARFIELD ─── */
const canvas = document.getElementById('stars-canvas');
const ctx    = canvas.getContext('2d');
let stars    = [];

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initStars() {
  stars = Array.from({ length: 160 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2 + 0.2,
    o: Math.random() * 0.6 + 0.1,
    s: Math.random() * 0.3 + 0.05,
    d: Math.random() > 0.5 ? 1 : -1,
  }));
}

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(s => {
    s.o += s.s * 0.01 * s.d;
    if (s.o >= 0.7 || s.o <= 0.05) s.d *= -1;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(232,237,245,${s.o})`;
    ctx.fill();
  });
  requestAnimationFrame(drawStars);
}

resize();
initStars();
drawStars();
window.addEventListener('resize', () => { resize(); initStars(); });

/* ─── FILTER PILLS ─── */
const pills   = document.querySelectorAll('.pill');
const rows    = document.querySelectorAll('#postsList .post-row');
const countEl = document.getElementById('countDisplay');

function renumber() {
  let n = 0;
  rows.forEach(r => {
    if (r.style.display !== 'none') {
      r.querySelector('.post-row-num').textContent = String(++n).padStart(2, '0');
    }
  });
  countEl.textContent = n;
}

pills.forEach(pill => {
  pill.addEventListener('click', () => {
    pills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const f = pill.dataset.filter;
    rows.forEach(r => {
      r.style.display = (f === 'all' || r.dataset.category === f) ? 'flex' : 'none';
    });
    renumber();
  });
});

/* ─── LIVE SEARCH ─── */
document.getElementById('searchInput').addEventListener('input', function () {
  const q = this.value.toLowerCase();
  pills.forEach(p => p.classList.remove('active'));
  document.querySelector('.pill[data-filter="all"]').classList.add('active');
  rows.forEach(r => {
    const match = r.querySelector('.post-row-title').textContent.toLowerCase().includes(q);
    r.style.display = match ? 'flex' : 'none';
  });
  renumber();
});

/* ─── PAGINATION ─── */
document.querySelectorAll('.page-btn:not(.arrow)').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});