/* ══════════════════════════════════════
   post.js — Horizon Blog · Post Reader
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
resize(); initStars(); drawStars();
window.addEventListener('resize', () => { resize(); initStars(); });

/* ─── READ PROGRESS BAR ─── */
const progressBar = document.getElementById('progressBar');
const tocFill     = document.getElementById('tocProgress');
const article     = document.getElementById('articleBody');

function updateProgress() {
  const articleTop    = article.offsetTop;
  const articleHeight = article.offsetHeight;
  const scrolled      = window.scrollY - articleTop;
  const pct           = Math.min(Math.max((scrolled / articleHeight) * 100, 0), 100);
  progressBar.style.width  = pct + '%';
  if (tocFill) tocFill.style.width = pct + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });

/* ─── TOC ACTIVE SECTION TRACKING ─── */
const tocItems   = document.querySelectorAll('.toc-item');
const sections   = document.querySelectorAll('.post-body section[id]');
const navHeight  = 80;

function updateTOC() {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - navHeight - 40) {
      current = sec.id;
    }
  });
  tocItems.forEach(item => {
    item.classList.toggle('active', item.getAttribute('href') === '#' + current);
  });
}
window.addEventListener('scroll', updateTOC, { passive: true });

// Smooth scroll for TOC links
tocItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(item.getAttribute('href'));
    if (target) window.scrollTo({ top: target.offsetTop - navHeight - 20, behavior: 'smooth' });
  });
});

/* ─── LIKE BUTTON ─── */
const likeBtn   = document.getElementById('likeBtn');
const likeCount = document.getElementById('likeCount');
let liked       = false;
let count       = parseInt(likeCount.textContent);

likeBtn.addEventListener('click', () => {
  liked = !liked;
  count = liked ? count + 1 : count - 1;
  likeCount.textContent = count;
  likeBtn.classList.toggle('liked', liked);
});

/* ─── BOOKMARK BUTTON ─── */
const bookmarkBtn = document.getElementById('bookmarkBtn');
let bookmarked    = false;

bookmarkBtn.addEventListener('click', () => {
  bookmarked = !bookmarked;
  bookmarkBtn.classList.toggle('bookmarked', bookmarked);
});

/* ─── FOLLOW BUTTON ─── */
const followBtn = document.querySelector('.btn-follow');
let following   = false;

if (followBtn) {
  followBtn.addEventListener('click', () => {
    following = !following;
    followBtn.textContent = following ? 'Following' : 'Follow';
    followBtn.classList.toggle('following', following);
  });
}

/* ─── COPY LINK ─── */
const copyBtn = document.getElementById('copyLinkBtn');
if (copyBtn) {
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    copyBtn.textContent = '✓ Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = '⌗ Copy link';
      copyBtn.classList.remove('copied');
    }, 2000);
  });
}

/* ─── SHARE BUTTON (nav) ─── */
const shareBtn = document.getElementById('shareBtn');
if (shareBtn) {
  shareBtn.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({ title: document.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  });
}