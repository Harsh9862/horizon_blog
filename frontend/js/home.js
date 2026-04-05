const canvas = document.getElementById('stars-canvas');
const ctx = canvas.getContext('2d');
let stars = [];
const currentUser = requireAuth('home.html');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initStars() {
  stars = [];
  for (let i = 0; i < 220; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      alpha: Math.random() * 0.7 + 0.1,
      speed: Math.random() * 0.003 + 0.001,
      phase: Math.random() * Math.PI * 2
    });
  }
}

function drawStars(t) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(star => {
    const alpha = star.alpha * (0.6 + 0.4 * Math.sin(t * star.speed * 1000 + star.phase));
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,220,255,${alpha})`;
    ctx.fill();
  });
}

function animate(t) {
  drawStars(t / 1000);
  requestAnimationFrame(animate);
}

function decorateNav() {
  const cta = document.querySelector('.nav-cta');
  if (currentUser && cta) {
    cta.textContent = currentUser.displayName;
    cta.href = 'dashboard.html';
  }
}

function renderFeatured(posts) {
  const grid = document.getElementById('featuredGrid');
  if (!grid) {
    return;
  }

  if (!posts.length) {
    grid.innerHTML = `
      <div class="post-card featured">
        <span class="post-tag">Empty</span>
        <h3 class="post-title">No featured stories yet</h3>
        <p class="post-excerpt">Publish a story to make this space come alive.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = posts.slice(0, 3).map((post, index) => {
    const featuredClass = index === 0 ? 'post-card featured' : 'post-card';
    const excerpt = post.subtitle || post.body.replace(/<[^>]+>/g, '').slice(0, 150) + '...';
    return `
      <a class="${featuredClass}" href="blog_slug.html?slug=${encodeURIComponent(post.slug)}">
        <span class="post-tag">${post.category?.name || 'Story'}</span>
        <h3 class="post-title">${post.title}</h3>
        <p class="post-excerpt">${excerpt}</p>
        <div class="post-meta">
          <div class="avatar">${initialsFromName(post.author?.displayName)}</div>
          <span>${post.author?.displayName || 'Horizon'}</span>
          <div class="dot"></div>
          <span>${post.readTimeMinutes || 1} min read</span>
          <div class="dot"></div>
          <span>${formatDate(post.publishedAt || post.createdAt)}</span>
        </div>
      </a>
    `;
  }).join('');
}

function renderRecent(posts) {
  const recentList = document.getElementById('recentPostsList');
  if (!recentList) {
    return;
  }

  if (!posts.length) {
    recentList.innerHTML = `
      <div class="post-row">
        <div class="post-row-num">--</div>
        <div class="post-row-content">
          <div class="post-row-title">No recent posts yet</div>
          <div class="post-row-meta">Create your first post to populate the feed.</div>
        </div>
        <span class="post-row-tag">Empty</span>
      </div>
    `;
    return;
  }

  recentList.innerHTML = posts.slice(0, 5).map((post, index) => `
    <a class="post-row" href="blog_slug.html?slug=${encodeURIComponent(post.slug)}" style="text-decoration:none;color:inherit;">
      <div class="post-row-num">${String(index + 1).padStart(2, '0')}</div>
      <div class="post-row-content">
        <div class="post-row-title">${post.title}</div>
        <div class="post-row-meta">${post.author?.displayName || 'Horizon'} | ${post.readTimeMinutes || 1} min read | ${formatDate(post.publishedAt || post.createdAt)}</div>
      </div>
      <span class="post-row-tag">${post.category?.name || 'Story'}</span>
    </a>
  `).join('');
}

function updateStats(posts) {
  const statNumbers = document.querySelectorAll('.stat-num');
  if (statNumbers.length < 4) {
    return;
  }

  const totalViews = posts.reduce((sum, post) => sum + (post.viewCount || 0), 0);
  const uniqueAuthors = new Set(posts.map(post => post.author?.username).filter(Boolean));

  statNumbers[0].textContent = `${posts.length}`;
  statNumbers[1].textContent = `${uniqueAuthors.size}`;
  statNumbers[2].textContent = `${Math.max(1, Math.round(totalViews / 1000))}K`;
  statNumbers[3].textContent = '100%';
}

async function loadHome() {
  try {
    const [postsPage, featuredPost] = await Promise.all([
      apiFetch('/posts?page=0&size=6&sort=latest'),
      apiFetch('/posts/featured')
    ]);

    const posts = postsPage.content || [];
    const featured = featuredPost ? [featuredPost, ...posts.filter(post => post.id !== featuredPost.id)] : posts;
    renderFeatured(featured);
    renderRecent(posts);
    updateStats(posts);
  } catch (error) {
    const grid = document.getElementById('featuredGrid');
    const recentList = document.getElementById('recentPostsList');
    if (grid) {
      grid.innerHTML = `
        <div class="post-card featured">
          <span class="post-tag">Error</span>
          <h3 class="post-title">Unable to load stories</h3>
          <p class="post-excerpt">${error.message || 'Please try again in a moment.'}</p>
        </div>
      `;
    }
    if (recentList) {
      recentList.innerHTML = `
        <div class="post-row">
          <div class="post-row-num">!!</div>
          <div class="post-row-content">
            <div class="post-row-title">Story feed unavailable</div>
            <div class="post-row-meta">${error.message || 'Please refresh the page.'}</div>
          </div>
          <span class="post-row-tag">Error</span>
        </div>
      `;
    }
  }
}

resizeCanvas();
if (currentUser) {
  initStars();
  animate(0);
  decorateNav();
  loadHome();

  window.addEventListener('resize', () => {
    resizeCanvas();
    initStars();
  });
}
