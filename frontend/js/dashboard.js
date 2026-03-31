/* ══════════════════════════════════════
   dashboard.js — Horizon Blog · Dashboard
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

/* ─── SIDEBAR TAB NAVIGATION ─── */
const navItems  = document.querySelectorAll('.dash-nav-item[data-tab]');
const tabPanels = document.querySelectorAll('.tab-panel');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    const panel = document.getElementById('tab-' + item.dataset.tab);
    if (panel) panel.classList.add('active');
  });
});

/* ─── POSTS FILTER PILLS ─── */
const filterPills = document.querySelectorAll('.filter-pill');
const postRows    = document.querySelectorAll('#tab-posts .post-row-dash');

filterPills.forEach(pill => {
  pill.addEventListener('click', () => {
    filterPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const filter = pill.dataset.filter;
    postRows.forEach(row => {
      const show = filter === 'all' || row.dataset.status === filter;
      row.style.display = show ? 'grid' : 'none';
    });
  });
});

/* ─── DELETE ROW ─── */
document.querySelectorAll('.row-btn.danger').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const row = btn.closest('.post-row-dash');
    if (row && confirm('Remove this post?')) {
      row.style.opacity = '0';
      row.style.transform = 'translateX(20px)';
      row.style.transition = 'all 0.3s';
      setTimeout(() => row.remove(), 300);
    }
  });
});

/* ─── SETTINGS: SAVE FEEDBACK ─── */
document.querySelectorAll('#tab-settings .btn-primary').forEach(btn => {
  btn.addEventListener('click', () => {
    const orig = btn.textContent;
    btn.textContent = '✓ Saved';
    btn.style.background = 'rgba(79,255,176,0.2)';
    btn.style.color = 'var(--accent)';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.style.color = '';
    }, 2000);
  });
});

/* ─── DELETE BOOKMARK ─── */
document.querySelectorAll('#tab-bookmarks .row-btn.danger').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const row = btn.closest('.post-row-dash');
    if (row) {
      row.style.opacity = '0';
      row.style.transition = 'opacity 0.25s';
      setTimeout(() => row.remove(), 250);
    }
  });
});

/* ─── DELETE DRAFT ─── */
document.querySelectorAll('#tab-drafts .btn-ghost').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.draft-card');
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      card.style.transition = 'all 0.3s';
      setTimeout(() => card.remove(), 300);
    }
  });
});