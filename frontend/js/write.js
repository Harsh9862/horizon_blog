const canvas = document.getElementById('stars-canvas');
const ctx = canvas.getContext('2d');
let stars = [];
let coverDataURL = '';
let tags = [];
let categories = [];
let editingPostId = null;
let editingPostSlug = null;
let hasUnsavedChanges = false;
const currentUser = requireAuth('write.html');

const coverZone = document.getElementById('coverZone');
const coverPlaceholder = document.getElementById('coverPlaceholder');
const coverImg = document.getElementById('coverImg');
const coverRemove = document.getElementById('coverRemove');
const coverInput = document.getElementById('coverInput');
const tagsInput = document.getElementById('tagsInput');
const tagsList = document.getElementById('tagsList');
const bodyEditor = document.getElementById('bodyEditor');
const titleField = document.getElementById('titleField');
const subtitleField = document.getElementById('subtitleField');
const wordCountEl = document.getElementById('wordCount');
const draftStatus = document.getElementById('draftStatus');
const publishModal = document.getElementById('publishModal');
const publishBtn = document.getElementById('publishBtn');
const saveDraftBtn = document.getElementById('saveDraftBtn');
const cancelPublish = document.getElementById('cancelPublish');
const confirmPublish = document.getElementById('confirmPublish');
const categorySelect = document.getElementById('categorySelect');
const modalCategorySelect = document.getElementById('modalCategory');

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

function getEditingPostId() {
  return new URLSearchParams(window.location.search).get('id');
}

function setDraftStatus(text, state = 'saved') {
  draftStatus.textContent = text;
  draftStatus.className = `draft-status ${state}`;
}

function markUnsaved() {
  hasUnsavedChanges = true;
  setDraftStatus('Unsaved changes', 'saving');
}

function updateWordCount() {
  const text = bodyEditor.innerText.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  wordCountEl.textContent = `${words} words | ~${minutes} min read`;
}

function updateToolbarState() {
  const simpleCommands = ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'];
  document.querySelectorAll('.tool-btn').forEach(button => {
    const cmd = button.dataset.cmd;
    if (simpleCommands.includes(cmd)) {
      button.classList.toggle('active', document.queryCommandState(cmd));
    }
  });
}

function updateModalPreview() {
  const title = titleField.innerText.trim() || 'Untitled';
  const subtitle = subtitleField.innerText.trim() || 'No subtitle';
  const words = bodyEditor.innerText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  const selectedCategory = categories.find(category => category.slug === categorySelect.value);
  const categoryName = selectedCategory?.name || 'Draft';

  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalSubtitle').textContent = subtitle;
  document.getElementById('modalMeta').textContent = `~${minutes} min read | ${categoryName}`;

  const previewImage = document.getElementById('modalPreviewImg');
  if (coverDataURL) {
    previewImage.style.backgroundImage = `url(${coverDataURL})`;
  } else {
    previewImage.style.backgroundImage = 'none';
  }

  if (categorySelect.value) {
    modalCategorySelect.value = categorySelect.value;
  }
}

function renderTags() {
  tagsList.innerHTML = tags.map((tag, index) =>
    `<span class="tag-chip">${tag}<button class="tag-chip-remove" data-idx="${index}" type="button">x</button></span>`
  ).join('');

  tagsList.querySelectorAll('.tag-chip-remove').forEach(button => {
    button.addEventListener('click', () => {
      tags.splice(Number(button.dataset.idx), 1);
      renderTags();
      markUnsaved();
    });
  });
}

function addTag(tagText) {
  if (!tagText || tags.includes(tagText) || tags.length >= 5) {
    return;
  }
  tags.push(tagText);
  renderTags();
  markUnsaved();
}

function populateEditor(post) {
  editingPostId = post.id;
  editingPostSlug = post.slug;
  titleField.innerText = post.title || '';
  subtitleField.innerText = post.subtitle || '';
  bodyEditor.innerHTML = post.body || '';
  categorySelect.value = post.category?.slug || '';
  modalCategorySelect.value = post.category?.slug || '';
  tags = [...(post.tags || [])];
  renderTags();

  if (post.coverImageUrl) {
    coverDataURL = post.coverImageUrl;
    coverImg.style.backgroundImage = `url(${coverDataURL})`;
    coverImg.style.display = 'block';
    coverPlaceholder.style.display = 'none';
    coverRemove.style.display = 'block';
    coverZone.classList.add('has-image');
  }

  const visibility = String(post.visibility || 'PUBLIC').toLowerCase();
  const visibilityInput = document.querySelector(`input[name="visibility"][value="${visibility}"]`);
  if (visibilityInput) {
    visibilityInput.checked = true;
  }

  document.title = `Editing ${post.title} - Horizon Blog`;
  saveDraftBtn.textContent = post.status === 'DRAFT' ? 'Update Draft' : 'Save Changes';
  setDraftStatus(post.status === 'DRAFT' ? 'Draft loaded' : 'Post loaded', 'saved');
  updateWordCount();
}

async function loadCategories() {
  categories = await apiFetch('/categories');
  const options = categories.map(category =>
    `<option value="${category.slug}">${category.name}</option>`
  ).join('');
  categorySelect.innerHTML = '<option value="" disabled selected>Select a category...</option>' + options;
  modalCategorySelect.innerHTML = '<option value="" disabled selected>Select...</option>' + options;
}

async function loadExistingPostIfNeeded() {
  const postId = getEditingPostId();
  if (!postId) {
    setDraftStatus('Ready to write', 'saved');
    return;
  }

  setDraftStatus('Loading draft...', 'saving');
  const post = await apiFetch(`/posts/id/${encodeURIComponent(postId)}`);
  populateEditor(post);
  hasUnsavedChanges = false;
}

function buildPayload(statusOverride) {
  const title = titleField.innerText.trim();
  const subtitle = subtitleField.innerText.trim();
  const body = bodyEditor.innerHTML.trim();
  const categorySlug = modalCategorySelect.value || categorySelect.value;
  const visibility = document.querySelector('input[name="visibility"]:checked')?.value?.toUpperCase() || 'PUBLIC';
  const status = statusOverride || 'DRAFT';

  if (!title || !body || !categorySlug) {
    throw new Error('Please add a title, category, and body before saving.');
  }

  return {
    title,
    subtitle,
    body,
    coverImageUrl: coverDataURL || null,
    categorySlug,
    tags,
    status,
    visibility
  };
}

async function persistPost(statusOverride) {
  const payload = buildPayload(statusOverride);
  const isUpdate = Boolean(editingPostId);
  const response = await apiFetch(isUpdate ? `/posts/${editingPostId}` : '/posts', {
    method: isUpdate ? 'PUT' : 'POST',
    body: JSON.stringify(payload)
  });

  editingPostId = response.id;
  editingPostSlug = response.slug;
  hasUnsavedChanges = false;
  saveDraftBtn.textContent = response.status === 'DRAFT' ? 'Update Draft' : 'Save Changes';
  window.history.replaceState({}, '', `write.html?id=${encodeURIComponent(response.id)}`);
  return response;
}

async function handleSaveDraft() {
  const original = saveDraftBtn.textContent;
  saveDraftBtn.disabled = true;
  setDraftStatus('Saving draft...', 'saving');
  try {
    const response = await persistPost('DRAFT');
    setDraftStatus(response.status === 'DRAFT' ? 'Draft saved' : 'Saved', 'saved');
  } catch (error) {
    setDraftStatus(error.message || 'Unable to save draft.', 'error');
    alert(error.message || 'Unable to save draft.');
  } finally {
    saveDraftBtn.disabled = false;
    saveDraftBtn.textContent = original.includes('Update') || editingPostId ? 'Update Draft' : original;
  }
}

async function handlePublish() {
  const original = confirmPublish.textContent;
  confirmPublish.disabled = true;
  confirmPublish.textContent = 'Publishing...';
  try {
    const response = await persistPost('PUBLISHED');
    setDraftStatus('Published', 'saved');
    window.location.href = `blog_slug.html?slug=${encodeURIComponent(response.slug || editingPostSlug)}`;
  } catch (error) {
    setDraftStatus(error.message || 'Unable to publish post.', 'error');
    alert(error.message || 'Unable to publish post.');
    confirmPublish.disabled = false;
    confirmPublish.textContent = original;
  }
}

function bindEditorInteractions() {
  coverPlaceholder.addEventListener('click', () => coverInput.click());

  coverInput.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = loadEvent => {
      coverDataURL = loadEvent.target.result;
      coverImg.style.backgroundImage = `url(${coverDataURL})`;
      coverImg.style.display = 'block';
      coverPlaceholder.style.display = 'none';
      coverRemove.style.display = 'block';
      coverZone.classList.add('has-image');
      updateModalPreview();
      markUnsaved();
    };
    reader.readAsDataURL(file);
  });

  coverRemove.addEventListener('click', event => {
    event.stopPropagation();
    coverDataURL = '';
    coverImg.style.display = 'none';
    coverImg.style.backgroundImage = 'none';
    coverPlaceholder.style.display = 'flex';
    coverRemove.style.display = 'none';
    coverZone.classList.remove('has-image');
    coverInput.value = '';
    updateModalPreview();
    markUnsaved();
  });

  tagsInput.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ',') && tagsInput.value.trim()) {
      event.preventDefault();
      addTag(tagsInput.value.trim().replace(/,/g, ''));
      tagsInput.value = '';
    }

    if (event.key === 'Backspace' && !tagsInput.value && tags.length) {
      event.preventDefault();
      tags.splice(tags.length - 1, 1);
      renderTags();
      markUnsaved();
    }
  });

  document.querySelectorAll('.tool-btn').forEach(button => {
    button.addEventListener('click', () => {
      const cmd = button.dataset.cmd;
      bodyEditor.focus();

      if (cmd === 'h2') {
        document.execCommand('formatBlock', false, '<h2>');
      } else if (cmd === 'h3') {
        document.execCommand('formatBlock', false, '<h3>');
      } else if (cmd === 'blockquote') {
        document.execCommand('formatBlock', false, '<blockquote>');
      } else if (cmd === 'createLink') {
        const url = prompt('Enter URL:');
        if (url) {
          document.execCommand('createLink', false, url);
        }
      } else {
        document.execCommand(cmd, false, null);
      }

      updateToolbarState();
      markUnsaved();
    });
  });

  bodyEditor.addEventListener('input', () => {
    updateWordCount();
    markUnsaved();
  });
  bodyEditor.addEventListener('keyup', updateToolbarState);
  bodyEditor.addEventListener('mouseup', updateToolbarState);
  titleField.addEventListener('input', markUnsaved);
  subtitleField.addEventListener('input', markUnsaved);
  categorySelect.addEventListener('change', () => {
    updateModalPreview();
    markUnsaved();
  });

  saveDraftBtn.addEventListener('click', handleSaveDraft);

  publishBtn.addEventListener('click', () => {
    updateModalPreview();
    publishModal.style.display = 'flex';
  });

  cancelPublish.addEventListener('click', () => {
    publishModal.style.display = 'none';
  });

  publishModal.addEventListener('click', event => {
    if (event.target === publishModal) {
      publishModal.style.display = 'none';
    }
  });

  confirmPublish.addEventListener('click', handlePublish);

  document.getElementById('previewBtn').addEventListener('click', () => {
    const previewWindow = window.open('', '_blank');
    const title = titleField.innerText.trim() || 'Preview';
    const body = bodyEditor.innerHTML.trim() || '<p>No content yet.</p>';

    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet"/>
          <style>
            body { background:#030712; color:#e8edf5; font-family:'DM Sans',sans-serif; max-width:680px; margin:80px auto; padding:0 24px; }
            h1 { font-family:'Cormorant Garamond',serif; font-size:3rem; font-weight:300; margin-bottom:24px; }
            h2 { font-family:'Cormorant Garamond',serif; font-size:1.9rem; font-weight:400; margin:32px 0 16px; }
            p  { font-size:1rem; line-height:1.85; margin-bottom:20px; color:rgba(232,237,245,0.82); }
            blockquote { border-left:3px solid #4fffb0; padding:16px 20px; background:rgba(255,255,255,0.05); margin:24px 0; font-style:italic; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${body}
        </body>
      </html>
    `);
    previewWindow.document.close();
  });

  window.addEventListener('beforeunload', event => {
    if (!hasUnsavedChanges) {
      return;
    }
    event.preventDefault();
    event.returnValue = '';
  });
}

async function initializeEditor() {
  try {
    setDraftStatus('Loading editor...', 'saving');
    await loadCategories();
    await loadExistingPostIfNeeded();
    updateWordCount();
    updateModalPreview();
  } catch (error) {
    setDraftStatus(error.message || 'Unable to load editor.', 'error');
    alert(error.message || 'Unable to load editor.');
  }
}

if (currentUser) {
  resize();
  initStars();
  drawStars();
  bindEditorInteractions();
  initializeEditor();
  window.addEventListener('resize', () => {
    resize();
    initStars();
  });
}
