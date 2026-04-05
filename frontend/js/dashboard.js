const canvas = document.getElementById('stars-canvas');
const ctx = canvas.getContext('2d');
let stars = [];
let currentPosts = [];
let currentDrafts = [];
let currentBookmarks = [];
const currentUser = requireAuth('dashboard.html');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initStars() {
  stars = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2 + 0.2,
    o: Math.random() * 0.6 + 0.1,
    s: Math.random() * 0.3 + 0.05,
    d: Math.random() > 0.5 ? 1 : -1
  }));
}

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(star => {
    star.o += star.s * 0.01 * star.d;
    if (star.o >= 0.7 || star.o <= 0.05) {
      star.d *= -1;
    }
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(232,237,245,${star.o})`;
    ctx.fill();
  });
  requestAnimationFrame(drawStars);
}

function activateTabs() {
  const navItems = document.querySelectorAll('.dash-nav-item[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-panel');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(nav => nav.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));
      item.classList.add('active');
      const panel = document.getElementById(`tab-${item.dataset.tab}`);
      if (panel) {
        panel.classList.add('active');
      }
    });
  });
}

function decorateNav() {
  const cta = document.querySelector('.nav-cta');
  if (currentUser && cta) {
    cta.textContent = currentUser.displayName;
    cta.href = 'write.html';
  }
}

function renderProfile(profile, stats) {
  document.getElementById('profileAvatar').textContent = initialsFromName(profile.displayName);
  document.getElementById('profileName').textContent = profile.displayName;
  document.getElementById('profileHandle').textContent =
    `@${profile.username} | Member since ${new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  document.getElementById('profileBio').textContent = profile.bio || 'No bio yet.';
  document.getElementById('storiesStat').textContent = profile.publishedPosts || 0;
  document.getElementById('readersStat').textContent = profile.followers || 0;
  document.getElementById('likesStat').textContent = stats.totalLikes || 0;
  document.getElementById('viewsStat').textContent = stats.totalViews || 0;
  document.getElementById('settingsDisplayName').value = profile.displayName || '';
  document.getElementById('settingsUsername').value = `@${profile.username}`;
  document.getElementById('settingsBio').value = profile.bio || '';
}

function renderPosts(posts) {
  const container = document.getElementById('dashboardPostsList');
  container.innerHTML = posts.map((post, index) => `
    <div class="post-row-dash" data-status="${post.status.toLowerCase()}">
      <div class="post-row-info">
        <div class="post-row-thumb thumb-${String.fromCharCode(97 + (index % 8))}"></div>
        <div>
          <div class="post-row-title">${post.title}</div>
          <div class="post-row-cat">${post.category?.name || 'Story'}</div>
        </div>
      </div>
      <span class="status-badge ${post.status.toLowerCase()}">${post.status}</span>
      <span class="post-stat">${post.viewCount || 0}</span>
      <span class="post-stat">${post.likeCount || 0}</span>
      <span class="post-date">${formatDate(post.publishedAt || post.updatedAt || post.createdAt)}</span>
      <div class="post-row-actions">
        <a class="row-btn" href="write.html?id=${encodeURIComponent(post.id)}" title="Edit">Edit</a>
        <a class="row-btn" href="blog_slug.html?slug=${encodeURIComponent(post.slug)}" title="View">View</a>
        <button class="row-btn danger" data-delete-post="${post.id}" title="Delete">Delete</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-delete-post]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Delete this post?')) {
        return;
      }
      try {
        await apiFetch(`/posts/${button.dataset.deletePost}`, { method: 'DELETE' });
        await reloadDashboardLists();
      } catch (error) {
        alert(error.message || 'Unable to delete post.');
      }
    });
  });
}

function renderDrafts(drafts) {
  const container = document.getElementById('draftsGrid');
  document.getElementById('draftCountBadge').textContent = drafts.length;
  container.innerHTML = drafts.map((post, index) => `
    <div class="draft-card">
      <div class="draft-thumb thumb-${String.fromCharCode(97 + (index % 8))}"></div>
      <div class="draft-body">
        <div class="draft-title">${post.title}</div>
        <div class="draft-excerpt">${(post.subtitle || post.body || '').replace(/<[^>]+>/g, '').slice(0, 120)}...</div>
        <div class="draft-meta">${post.category?.name || 'Story'} | Last edited ${formatDate(post.updatedAt || post.createdAt)}</div>
      </div>
      <div class="draft-actions">
        <a href="write.html?id=${encodeURIComponent(post.id)}" class="btn-primary" style="font-size:0.72rem;padding:7px 16px">Continue</a>
        <button class="btn-ghost" data-delete-draft="${post.id}" style="font-size:0.72rem;padding:7px 14px">Delete</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-delete-draft]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Delete this draft?')) {
        return;
      }
      try {
        await apiFetch(`/posts/${button.dataset.deleteDraft}`, { method: 'DELETE' });
        await reloadDashboardLists();
      } catch (error) {
        alert(error.message || 'Unable to delete draft.');
      }
    });
  });
}

function renderBookmarks(bookmarks) {
  const container = document.getElementById('bookmarksList');
  container.innerHTML = bookmarks.map((post, index) => `
    <div class="post-row-dash">
      <div class="post-row-info">
        <div class="post-row-thumb thumb-${String.fromCharCode(97 + (index % 8))}"></div>
        <div><div class="post-row-title">${post.title}</div></div>
      </div>
      <span class="post-date">${post.author?.displayName || 'Horizon'}</span>
      <span class="status-badge published">${post.category?.name || 'Story'}</span>
      <span class="post-date">${formatDate(post.publishedAt || post.createdAt)}</span>
      <div class="post-row-actions">
        <a class="row-btn" href="blog_slug.html?slug=${encodeURIComponent(post.slug)}">View</a>
        <button class="row-btn danger" data-remove-bookmark="${post.id}">Remove</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-remove-bookmark]').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        await apiFetch(`/posts/${button.dataset.removeBookmark}/bookmark`, { method: 'POST' });
        await reloadDashboardLists();
      } catch (error) {
        alert(error.message || 'Unable to remove bookmark.');
      }
    });
  });
}

function renderAnalytics(stats, analytics) {
  document.getElementById('analyticsViews').textContent = stats.totalViews || 0;
  document.getElementById('analyticsLikes').textContent = stats.totalLikes || 0;
  document.getElementById('analyticsFollowers').textContent = stats.totalFollowers || 0;
  document.getElementById('analyticsReadTime').textContent = `${stats.avgReadTime || 0}m`;

  const chart = document.getElementById('viewsChart');
  const maxViews = Math.max(1, ...(analytics.viewsPerDay || []).map(item => item.views || 0));
  chart.innerHTML = (analytics.viewsPerDay || []).map(item => `
    <div class="bar-group"><div class="bar" style="--h:${Math.max(10, (item.views / maxViews) * 100)}%"></div><span>${item.day}</span></div>
  `).join('');

  const topPosts = document.getElementById('topPostsList');
  topPosts.innerHTML = (analytics.topPosts || []).map((post, index) => `
    <a class="top-post-row" href="blog_slug.html?slug=${encodeURIComponent(post.slug)}" style="text-decoration:none;color:inherit;">
      <span class="top-num">${String(index + 1).padStart(2, '0')}</span>
      <span class="top-title">${post.title}</span>
      <span class="top-views">${post.views} views</span>
    </a>
  `).join('');
}

function bindPostFilter() {
  const pills = document.querySelectorAll('.filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(item => item.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.dataset.filter;
      const filtered = filter === 'all'
        ? currentPosts
        : currentPosts.filter(post => post.status.toLowerCase() === filter);
      renderPosts(filtered);
    });
  });
}

function bindSettingsActions() {
  const saveButton = document.getElementById('settingsSaveBtn');
  saveButton.addEventListener('click', async () => {
    const original = saveButton.textContent;
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    try {
      const updatedProfile = await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          displayName: document.getElementById('settingsDisplayName').value.trim(),
          bio: document.getElementById('settingsBio').value.trim()
        })
      });

      localStorage.setItem('horizon.auth.user', JSON.stringify({
        ...getCurrentUser(),
        username: updatedProfile.username,
        displayName: updatedProfile.displayName,
        email: updatedProfile.email
      }));

      document.getElementById('profileName').textContent = updatedProfile.displayName;
      document.getElementById('profileBio').textContent = updatedProfile.bio || 'No bio yet.';
      saveButton.textContent = 'Saved';
      setTimeout(() => {
        saveButton.textContent = original;
        saveButton.disabled = false;
      }, 1200);
    } catch (error) {
      alert(error.message || 'Unable to save profile.');
      saveButton.textContent = original;
      saveButton.disabled = false;
    }
  });

  const logoutButton = document.getElementById('logoutBtn');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      logoutButton.disabled = true;
      logoutButton.textContent = 'Signing out...';
      await logoutUser();
    });
  }
}

async function reloadDashboardLists() {
  const [postsPage, drafts, bookmarks] = await Promise.all([
    apiFetch('/dashboard/posts?status=all&page=0&size=20'),
    apiFetch('/dashboard/drafts'),
    apiFetch('/bookmarks')
  ]);

  currentPosts = postsPage.content || [];
  currentDrafts = drafts || [];
  currentBookmarks = bookmarks || [];

  const activeFilter = document.querySelector('.filter-pill.active')?.dataset.filter || 'all';
  const filteredPosts = activeFilter === 'all'
    ? currentPosts
    : currentPosts.filter(post => post.status.toLowerCase() === activeFilter);

  renderPosts(filteredPosts);
  renderDrafts(currentDrafts);
  renderBookmarks(currentBookmarks);
}

async function loadDashboard() {
  try {
    const user = await apiFetch('/auth/me');
    const [stats, postsPage, analytics, drafts, bookmarks] = await Promise.all([
      apiFetch('/dashboard/stats'),
      apiFetch('/dashboard/posts?status=all&page=0&size=20'),
      apiFetch('/dashboard/analytics'),
      apiFetch('/dashboard/drafts'),
      apiFetch('/bookmarks')
    ]);

    currentPosts = postsPage.content || [];
    currentDrafts = drafts || [];
    currentBookmarks = bookmarks || [];

    renderProfile(user, stats);
    renderPosts(currentPosts);
    renderDrafts(currentDrafts);
    renderBookmarks(currentBookmarks);
    renderAnalytics(stats, analytics);
    bindPostFilter();
    bindSettingsActions();
  } catch (error) {
    alert(error.message || 'Unable to load dashboard.');
  }
}

if (currentUser) {
  resize();
  initStars();
  drawStars();
  decorateNav();
  activateTabs();
  loadDashboard();
  window.addEventListener('resize', () => {
    resize();
    initStars();
  });
}
