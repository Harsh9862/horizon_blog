const canvas = document.getElementById('stars-canvas');
const ctx = canvas.getContext('2d');
let stars = [];
let currentPost = null;
let currentAuthor = null;
const currentUser = requireAuth(getCurrentPageReference());
const aiStoryOutput = document.getElementById('aiStoryOutput');
const aiSummaryBtn = document.getElementById('aiSummaryBtn');
const aiRecommendBtn = document.getElementById('aiRecommendBtn');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initStars() {
  stars = Array.from({ length: 160 }, () => ({
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

function getSlugFromQuery() {
  return new URLSearchParams(window.location.search).get('slug');
}

function buildBodySections(body) {
  const plainText = String(body || '').replace(/<[^>]+>/g, '\n').trim();
  const paragraphs = plainText.split(/\n{2,}/).filter(Boolean);

  if (!paragraphs.length) {
    return [{ id: 'section-1', title: 'Story', html: '<p>This story has no content yet.</p>' }];
  }

  return paragraphs.map((paragraph, index) => ({
    id: `section-${index + 1}`,
    title: index === 0 ? 'Introduction' : `Section ${index + 1}`,
    html: index === 0 ? `<p class="lead">${paragraph}</p>` : `<p>${paragraph}</p>`
  }));
}

function renderToc(sections) {
  const tocList = document.getElementById('tocList');
  tocList.innerHTML = sections.map((section, index) => `
    <a class="toc-item ${index === 0 ? 'active' : ''}" href="#${section.id}">${section.title}</a>
  `).join('');
}

function renderBody(sections) {
  const container = document.getElementById('postBodyContent');
  container.innerHTML = sections.map(section => `
    <section id="${section.id}">
      ${section.title !== 'Introduction' ? `<h2>${section.title}</h2>` : ''}
      ${section.html}
    </section>
  `).join('');
}

function decorateNav() {
  const cta = document.querySelector('.nav-cta');
  if (currentUser && cta) {
    cta.textContent = currentUser.displayName;
    cta.href = 'dashboard.html';
  }
}

function renderPost(post) {
  currentPost = post;
  document.title = `${post.title} - Horizon Blog`;
  document.getElementById('breadcrumbCategory').textContent = post.category?.name || 'Story';
  document.getElementById('heroCategory').textContent = post.category?.name || 'Story';
  document.getElementById('postTitle').innerHTML = post.title;
  document.getElementById('postSubtitle').textContent = post.subtitle || '';
  document.getElementById('authorAvatar').textContent = initialsFromName(post.author?.displayName);
  document.getElementById('authorName').textContent = post.author?.displayName || 'Horizon';
  document.getElementById('authorMeta').textContent =
    `${formatDate(post.publishedAt || post.createdAt)} | ${post.readTimeMinutes || 1} min read | ${post.viewCount || 0} reads`;
  document.getElementById('likeCount').textContent = post.likeCount || 0;

  const heroImage = document.getElementById('heroImage');
  if (post.coverImageUrl) {
    heroImage.style.background = `linear-gradient(to top, rgba(3,7,18,0.85), rgba(3,7,18,0.2)), url('${post.coverImageUrl}') center/cover`;
  }

  const sections = buildBodySections(post.body);
  renderToc(sections);
  renderBody(sections);

  document.getElementById('postTags').innerHTML =
    (post.tags || []).map(tag => `<span class="post-tag-item">${tag}</span>`).join('');
}

function renderAuthor(profile) {
  currentAuthor = profile;
  document.getElementById('authorCardAvatar').textContent = initialsFromName(profile.displayName);
  document.getElementById('authorCardName').textContent = profile.displayName;
  document.getElementById('authorCardBio').textContent = profile.bio || 'No bio yet.';
  document.getElementById('authorCardStories').textContent = `${profile.publishedPosts || 0} stories`;
  document.getElementById('authorCardReaders').textContent = `${profile.followers || 0} followers`;
  document.getElementById('moreByTitle').textContent = `More by ${profile.displayName.split(' ')[0]}`;
}

function renderRelatedList(elementId, posts) {
  const container = document.getElementById(elementId);
  container.innerHTML = posts.map((post, index) => `
    <a class="related-item" href="blog_slug.html?slug=${encodeURIComponent(post.slug)}" style="text-decoration:none;color:inherit;">
      <div class="related-thumb thumb-${String.fromCharCode(97 + (index % 8))}"></div>
      <div class="related-text">
        <div class="related-title">${post.title}</div>
        <div class="related-meta">${post.category?.name || 'Story'} | ${post.readTimeMinutes || 1} min</div>
      </div>
    </a>
  `).join('');
}

function setAiStoryMessage(message) {
  if (aiStoryOutput) {
    aiStoryOutput.textContent = message;
  }
}

function updateProgress() {
  const article = document.getElementById('articleBody');
  const progressBar = document.getElementById('progressBar');
  const tocFill = document.getElementById('tocProgress');
  const articleTop = article.offsetTop;
  const articleHeight = article.offsetHeight;
  const scrolled = window.scrollY - articleTop;
  const percent = Math.min(Math.max((scrolled / articleHeight) * 100, 0), 100);
  progressBar.style.width = `${percent}%`;
  tocFill.style.width = `${percent}%`;
}

function bindTocEvents() {
  const navHeight = 80;
  const tocItems = document.querySelectorAll('.toc-item');
  const sections = document.querySelectorAll('.post-body section[id]');

  function updateTOC() {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - navHeight - 40) {
        current = section.id;
      }
    });
    tocItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('href') === `#${current}`);
    });
  }

  tocItems.forEach(item => {
    item.addEventListener('click', event => {
      event.preventDefault();
      const target = document.querySelector(item.getAttribute('href'));
      if (target) {
        window.scrollTo({ top: target.offsetTop - navHeight - 20, behavior: 'smooth' });
      }
    });
  });

  window.addEventListener('scroll', updateTOC, { passive: true });
}

async function syncLikeState() {
  if (!currentPost) {
    return;
  }
  try {
    const likeState = await apiFetch(`/posts/${currentPost.id}/like`);
    document.getElementById('likeBtn').classList.toggle('liked', likeState.active);
    document.getElementById('likeCount').textContent = likeState.count;
  } catch (error) {
    console.error(error);
  }
}

async function syncFollowState() {
  if (!currentAuthor) {
    return;
  }
  try {
    const followState = await apiFetch(`/users/${currentAuthor.username}/follow`);
    const followBtn = document.getElementById('followBtn');
    followBtn.textContent = followState.active ? 'Following' : 'Follow';
    followBtn.classList.toggle('following', followState.active);
  } catch (error) {
    console.error(error);
  }
}

function bindActions() {
  document.getElementById('likeBtn').addEventListener('click', async () => {
    const response = await apiFetch(`/posts/${currentPost.id}/like`, { method: 'POST' });
    document.getElementById('likeBtn').classList.toggle('liked', response.active);
    document.getElementById('likeCount').textContent = response.count;
  });

  document.getElementById('bookmarkBtn').addEventListener('click', async () => {
    const response = await apiFetch(`/posts/${currentPost.id}/bookmark`, { method: 'POST' });
    document.getElementById('bookmarkBtn').classList.toggle('bookmarked', response.active);
  });

  document.getElementById('followBtn').addEventListener('click', async () => {
    const response = await apiFetch(`/users/${currentAuthor.username}/follow`, { method: 'POST' });
    const followBtn = document.getElementById('followBtn');
    followBtn.textContent = response.active ? 'Following' : 'Follow';
    followBtn.classList.toggle('following', response.active);
    document.getElementById('authorCardReaders').textContent = `${response.count} followers`;
  });

  document.getElementById('shareBtn').addEventListener('click', () => shareCurrentPage());
  document.getElementById('copyLinkBtn').addEventListener('click', async () => {
    await navigator.clipboard.writeText(window.location.href);
    document.getElementById('copyLinkBtn').textContent = 'Copied!';
    setTimeout(() => {
      document.getElementById('copyLinkBtn').textContent = 'Copy link';
    }, 1500);
  });
  document.getElementById('shareTwitterBtn').addEventListener('click', () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(currentPost.title)}`, '_blank');
  });
  document.getElementById('shareLinkedinBtn').addEventListener('click', () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
  });
}

function shareCurrentPage() {
  if (navigator.share) {
    navigator.share({ title: currentPost?.title || document.title, url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
  }
}

async function runAiStoryAction(button, action) {
  const original = button.textContent;
  button.disabled = true;
  setAiStoryMessage('Thinking...');
  try {
    await action();
  } catch (error) {
    setAiStoryMessage(error.message || 'AI request failed.');
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

async function summarizeCurrentPost() {
  if (!currentPost) {
    setAiStoryMessage('Load a post first.');
    return;
  }

  const response = await apiFetch('/ai/summarize', {
    method: 'POST',
    body: JSON.stringify({ postId: currentPost.id })
  });

  setAiStoryMessage(response.summary || 'No summary available.');
}

async function refreshRecommendations() {
  if (!currentPost) {
    setAiStoryMessage('Load a post first.');
    return;
  }

  const response = await apiFetch('/ai/reading-recommendation', {
    method: 'POST',
    body: JSON.stringify({ postId: currentPost.id })
  });

  const slugs = Array.isArray(response.slugs) ? response.slugs : [];
  if (!slugs.length) {
    setAiStoryMessage('No recommendations were returned.');
    return;
  }

  const posts = await Promise.all(slugs.map(slug => apiFetch(`/posts/${encodeURIComponent(slug)}`)));
  renderRelatedList('relatedStoriesList', posts.filter(post => post.slug !== currentPost.slug));
  setAiStoryMessage(`Updated related stories using ${slugs.length} AI-selected recommendations.`);
}

async function loadPostPage() {
  const slug = getSlugFromQuery();
  if (!slug) {
    window.location.href = 'blog.html';
    return;
  }

  try {
    const post = await apiFetch(`/posts/${encodeURIComponent(slug)}`);
    renderPost(post);

    const [authorProfile, authorPosts, trendingPosts] = await Promise.all([
      apiFetch(`/users/${post.author.username}`),
      apiFetch(`/users/${post.author.username}/posts?page=0&size=3`),
      apiFetch('/posts/trending')
    ]);

    renderAuthor(authorProfile);
    renderRelatedList('moreByAuthorList', (authorPosts.content || []).filter(item => item.slug !== post.slug));
    renderRelatedList('relatedStoriesList', (trendingPosts || []).filter(item => item.slug !== post.slug).slice(0, 3));
    setAiStoryMessage('Summarize this story or refresh related reads with AI.');
    bindTocEvents();
    bindActions();
    aiSummaryBtn.addEventListener('click', () => runAiStoryAction(aiSummaryBtn, summarizeCurrentPost));
    aiRecommendBtn.addEventListener('click', () => runAiStoryAction(aiRecommendBtn, refreshRecommendations));
    syncLikeState();
    syncFollowState();
  } catch (error) {
    document.getElementById('postBodyContent').innerHTML = `<section><p class="lead">${error.message || 'Unable to load this story.'}</p></section>`;
  }
}

if (currentUser) {
  resize();
  initStars();
  drawStars();
  decorateNav();
  loadPostPage();
  window.addEventListener('resize', () => {
    resize();
    initStars();
  });
  window.addEventListener('scroll', updateProgress, { passive: true });
}
