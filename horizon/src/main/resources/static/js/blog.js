const blogCanvas = document.getElementById('stars-canvas');
const blogCtx = blogCanvas.getContext('2d');
let blogStars = [];
let allPosts = [];
const currentUser = requireAuth('blog.html');

function resize() {
  blogCanvas.width = window.innerWidth;
  blogCanvas.height = window.innerHeight;
}

function initStars() {
  blogStars = Array.from({ length: 160 }, () => ({
    x: Math.random() * blogCanvas.width,
    y: Math.random() * blogCanvas.height,
    r: Math.random() * 1.2 + 0.2,
    o: Math.random() * 0.6 + 0.1,
    s: Math.random() * 0.3 + 0.05,
    d: Math.random() > 0.5 ? 1 : -1
  }));
}

function drawStars() {
  blogCtx.clearRect(0, 0, blogCanvas.width, blogCanvas.height);
  blogStars.forEach(star => {
    star.o += star.s * 0.01 * star.d;
    if (star.o >= 0.7 || star.o <= 0.05) {
      star.d *= -1;
    }
    blogCtx.beginPath();
    blogCtx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    blogCtx.fillStyle = `rgba(232,237,245,${star.o})`;
    blogCtx.fill();
  });
  requestAnimationFrame(drawStars);
}

function decorateBlogNav() {
  const cta = document.querySelector('.nav-cta');
  if (currentUser && cta) {
    cta.textContent = currentUser.displayName;
    cta.href = 'dashboard.html';
  }
}

function createPostRow(post, index) {
  return `
    <a class="post-row" data-category="${post.category?.name || ''}" href="blog_slug.html?slug=${encodeURIComponent(post.slug)}" style="text-decoration:none;color:inherit;">
      <div class="post-row-num">${String(index + 1).padStart(2, '0')}</div>
      <div class="post-row-thumb thumb-${String.fromCharCode(97 + (index % 8))}"></div>
      <div class="post-row-content">
        <div class="post-row-title">${post.title}</div>
        <div class="post-row-meta">${post.author?.displayName || 'Horizon'} | ${post.readTimeMinutes || 1} min read | ${formatDate(post.publishedAt || post.createdAt)}</div>
      </div>
      <div class="post-row-right">
        <span class="post-row-tag">${post.category?.name || 'Story'}</span>
        <div class="post-row-stats"><span>Likes ${post.likeCount || 0}</span><span>Views ${post.viewCount || 0}</span></div>
      </div>
    </a>
  `;
}

function renderPosts(posts) {
  const postsList = document.getElementById('postsList');
  const countDisplay = document.getElementById('countDisplay');
  const badge = document.querySelector('.post-count-badge');

  if (!posts.length) {
    postsList.innerHTML = `
      <div class="post-row">
        <div class="post-row-num">--</div>
        <div class="post-row-thumb thumb-a"></div>
        <div class="post-row-content">
          <div class="post-row-title">No stories match the current filters</div>
          <div class="post-row-meta">Try a different category, search, or sorting option.</div>
        </div>
        <div class="post-row-right">
          <span class="post-row-tag">Empty</span>
        </div>
      </div>
    `;
    countDisplay.textContent = '0';
    if (badge) {
      badge.textContent = '0';
    }
    return;
  }

  postsList.innerHTML = posts.map((post, index) => createPostRow(post, index)).join('');
  countDisplay.textContent = String(posts.length);
  if (badge) {
    badge.textContent = String(posts.length);
  }
}

function renderFeatured(post) {
  const featured = document.getElementById('featuredPost');
  if (!featured || !post) {
    return;
  }

  featured.innerHTML = `
    <span class="featured-label">Featured</span>
    <span class="post-tag">${post.category?.name || 'Story'}</span>
    <h2>${post.title}</h2>
    <p>${post.subtitle || post.body.replace(/<[^>]+>/g, '').slice(0, 180) + '...'}</p>
    <div class="post-meta">
      <div class="avatar">${initialsFromName(post.author?.displayName)}</div>
      <span>${post.author?.displayName || 'Horizon'}</span>
      <div class="dot"></div>
      <span>${post.readTimeMinutes || 1} min read</span>
      <div class="dot"></div>
      <span>${formatDate(post.publishedAt || post.createdAt)}</span>
      <div class="dot"></div>
      <span>${post.viewCount || 0} reads</span>
    </div>
    <a class="read-more" href="blog_slug.html?slug=${encodeURIComponent(post.slug)}" style="text-decoration:none;color:inherit;">Read Story -></a>
  `;
}

function renderTrending(posts) {
  const list = document.getElementById('trendingList');
  if (!list) {
    return;
  }

  list.innerHTML = posts.slice(0, 4).map((post, index) => `
    <a class="trending-item" href="blog_slug.html?slug=${encodeURIComponent(post.slug)}" style="text-decoration:none;color:inherit;">
      <span class="trending-num">${String(index + 1).padStart(2, '0')}</span>
      <div class="trending-text">
        <h4>${post.title}</h4>
        <span>${post.viewCount || 0} reads</span>
      </div>
    </a>
  `).join('');
}

function renderTagCloud(posts) {
  const cloud = document.getElementById('tagCloud');
  if (!cloud) {
    return;
  }

  const tags = [...new Set(posts.flatMap(post => post.tags || []))].slice(0, 10);
  cloud.innerHTML = tags.length ? tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '<span class="tag">No tags yet</span>';
}

function applyFilters() {
  const activePill = document.querySelector('.pill.active');
  const searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();
  const sort = document.getElementById('sortSelect').value;
  const category = activePill?.dataset.filter || 'all';

  let filtered = [...allPosts];

  if (category !== 'all') {
    filtered = filtered.filter(post => post.category?.name === category);
  }

  if (searchQuery) {
    filtered = filtered.filter(post =>
      post.title.toLowerCase().includes(searchQuery) ||
      (post.subtitle || '').toLowerCase().includes(searchQuery)
    );
  }

  if (sort === 'Most Read' || sort === 'Trending') {
    filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  } else {
    filtered.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
  }

  renderPosts(filtered);
}

async function loadBlog() {
  try {
    const [postsPage, featuredPost, trendingPosts] = await Promise.all([
      apiFetch('/posts?page=0&size=20&sort=latest'),
      apiFetch('/posts/featured'),
      apiFetch('/posts/trending')
    ]);

    allPosts = postsPage.content || [];
    renderPosts(allPosts);
    renderFeatured(featuredPost);
    renderTrending(trendingPosts || []);
    renderTagCloud(allPosts);
  } catch (error) {
    const postsList = document.getElementById('postsList');
    const featured = document.getElementById('featuredPost');
    const trending = document.getElementById('trendingList');
    if (featured) {
      featured.innerHTML = `
        <span class="featured-label">Error</span>
        <span class="post-tag">Unavailable</span>
        <h2>Unable to load stories</h2>
        <p>${error.message || 'Please refresh the page.'}</p>
      `;
    }
    if (postsList) {
      postsList.innerHTML = `
        <div class="post-row">
          <div class="post-row-num">!!</div>
          <div class="post-row-thumb thumb-a"></div>
          <div class="post-row-content">
            <div class="post-row-title">Story feed unavailable</div>
            <div class="post-row-meta">${error.message || 'Please try again later.'}</div>
          </div>
          <div class="post-row-right">
            <span class="post-row-tag">Error</span>
          </div>
        </div>
      `;
    }
    if (trending) {
      trending.innerHTML = `
        <div class="trending-item">
          <span class="trending-num">!!</span>
          <div class="trending-text">
            <h4>Trending stories unavailable</h4>
            <span>${error.message || 'Please refresh the page.'}</span>
          </div>
        </div>
      `;
    }
  }
}

if (currentUser) {
  resize();
  initStars();
  drawStars();
  decorateBlogNav();
  loadBlog();
  window.addEventListener('resize', () => {
    resize();
    initStars();
  });

  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(item => item.classList.remove('active'));
      pill.classList.add('active');
      applyFilters();
    });
  });

  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('sortSelect').addEventListener('change', applyFilters);
}
