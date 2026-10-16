// ==========================================
// AUTH & SESSION HELPERS
// ==========================================

function checkAuthStatus() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  const navActions = document.getElementById('nav-actions');

  if (navActions && isLoggedIn && userData.fullName) {
    navActions.innerHTML = `
      <button id="theme-toggle" class="theme-toggle-btn" type="button" aria-label="Toggle Dark/Light Mode" title="Toggle Dark/Light Mode">🌙</button>
      <span style="font-weight: 600; color: white; font-size: 0.9rem; align-self: center;">👋 ${userData.fullName} (${userData.branch || 'Student'})</span>
      <a href="query.html" class="btn btn-primary" id="ask-btn">+ Ask Question</a>
      <button onclick="logout()" class="btn btn-secondary" style="cursor: pointer;">Logout</button>
    `;
    setupThemeToggle();
  }
}

function logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userData');
  window.location.reload();
}

function requireAuth() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  if (!isLoggedIn) {
    alert("Please log in or register to perform this action!");
    setTimeout(() => {
      window.location.replace('success.html');
    }, 800);
    return false;
  }
  return true;
}

// --- HELPER FUNCTIONS FOR INLINE ERRORS ---
function showErrorMessage(formElement, message) {
  let errorBox = document.getElementById('auth-error-box');
  if (!errorBox) {
    errorBox = document.createElement('div');
    errorBox.id = 'auth-error-box';
    errorBox.className = 'auth-error-banner';
    formElement.prepend(errorBox);
  }
  errorBox.innerText = message;
}

function removeErrorMessage() {
  const errorBox = document.getElementById('auth-error-box');
  if (errorBox) errorBox.remove();
}

// ==========================================
// ID CARD MODAL FUNCTIONS
// ==========================================

const BACKEND_URL = 'http://localhost:5000';

function openIdModal(imgUrl, userName) {
  const modal = document.getElementById('id-modal');
  const modalImg = document.getElementById('modal-id-img');
  const modalTitle = document.getElementById('modal-user-name');

  if (modal && modalImg) {
    if (modalTitle) {
      modalTitle.textContent = `${userName || 'Student'}'s ID Verification`;
    }

    if (imgUrl && imgUrl.trim() !== '') {
      const normalizedPath = imgUrl.replace(/\\/g, '/').replace(/^\/+/, '');
      modalImg.src = imgUrl.startsWith('http') 
        ? imgUrl 
        : `${BACKEND_URL}/${normalizedPath}`;
    } else {
      modalImg.src = `${BACKEND_URL}/uploads/id_cards/default_id.jpg`;
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}

function closeIdModal() {
  const modal = document.getElementById('id-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.add('hidden');
  }
}

// Close modal if user clicks on the dark backdrop outside the modal content
window.addEventListener('click', (event) => {
  const modal = document.getElementById('id-modal');
  if (event.target === modal) {
    closeIdModal();
  }
});


// ==========================================
// FETCH & RENDER QUESTIONS (FEED)
// ==========================================

async function fetchAndRenderQuestions() {
  const container = document.getElementById('questions-container') || document.getElementById('feed-container');
  if (!container) return; // Exit if not on feed page

  try {
    const response = await fetch(`${BACKEND_URL}/api/questions`);
    if (!response.ok) throw new Error("Failed to fetch questions from API");

    const questions = await response.json();

    if (!questions.length) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">No questions posted yet. Be the first to ask!</p>`;
      return;
    }

container.innerHTML = questions.map(q => {
      const currentStoredUser = JSON.parse(localStorage.getItem('userData')) || {};
      const currentUserId = currentStoredUser._id || currentStoredUser.id || currentStoredUser.email || '';

      // 1. Map through answers for this specific question
      const answersHTML = (q.answers || []).map(ans => {
        const idPath = ans.authorIdCard || ans.idCardUrl || '';
        const voteCount = ans.votes || 0;
        const hasUpvoted = currentUserId && Array.isArray(ans.upvotedBy) && ans.upvotedBy.includes(String(currentUserId));
        
        const fileLink = ans.fileUrl 
          ? `<div style="margin-top: 0.5rem;"><a href="${BACKEND_URL}/${ans.fileUrl}" target="_blank" class="btn-pdf-note" style="font-size: 0.85rem; color: #2563eb; text-decoration: underline; font-weight: 500;">📄 View/Download Attached Notes (PDF)</a></div>` 
          : '';

        return `
          <div class="answer-card" data-branch="${ans.authorBranch || 'IT'}" data-answer-id="${ans._id}">
            <div class="user-meta">
              <span class="author-name">${ans.authorName}</span> - 
              <span class="badge badge-year">${ans.authorBranch || 'General'} ${ans.authorStatus || 'Student'}</span>
              ${idPath ? `
                <button class="btn-id" onclick="openIdModal('${idPath}', '${ans.authorName}')">
                  🪪 View ID
                </button>
              ` : ''}
            </div>
            <p class="answer-text">${ans.answerText}</p>
            ${fileLink}
            <div class="answer-footer">
              <span class="timestamp">${ans.createdAt ? new Date(ans.createdAt).toLocaleDateString() : 'Recently'}</span>
              <button class="btn-upvote ${hasUpvoted ? 'voted' : ''}" onclick="upvoteAnswer('${q._id}', '${ans._id}', this)" title="${hasUpvoted ? 'Already marked helpful' : 'Upvote this helpful answer'}">
                <span class="vote-icon">▲</span> Helpful (<span class="vote-count">${voteCount}</span>)
              </button>
            </div>
          </div>
        `;
      }).join('');

      // 2. Return the outer question card HTML
      return `
        <article class="card" data-question-id="${q._id}" data-branch="${(q.branch || 'General').toUpperCase()}" data-subject="${(q.subject || 'General').toLowerCase()}" style="margin-bottom: 1.5rem;">
          <div class="card-header" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span class="tag">#${q.subject || 'General'}</span>
            <span class="branch-badge">Target Branch: ${q.branch || 'General'}</span>
          </div>
          <h2 class="question-title" style="margin: 0.3rem 0; font-size: 1.25rem;">${q.title}</h2>
          <p class="question-desc" style="color: var(--text-muted); margin-bottom: 0.8rem; white-space: pre-wrap; word-wrap: break-word;">${q.description}</p>
          <p class="author" style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">Asked by <strong>${q.authorName || 'Anonymous'}</strong></p>

          <div class="answers-container">
            <h4 class="answers-title">Answers (${(q.answers || []).length})</h4>
            <button class="btn btn-secondary btn-reply" onclick="toggleAnswerForm(this)">+ Write an Answer</button>

            <!-- Container where the form will be injected -->
            <div class="answer-form-wrapper" style="margin-top: 0.5rem;"></div>

            <div class="answers-list" style="margin-top: 1rem;">
              ${answersHTML}
            </div>
          </div>
        </article>
      `;
    }).join(''); // <-- Closes questions.map()

  } catch (error) {
    console.error("Error loading questions:", error);
    container.innerHTML = `<p style="text-align: center; color: red;">Error connecting to database. Is your backend running on port 5000?</p>`;
  }
}

// ==========================================
// INLINE ANSWER FORM LOGIC
// ==========================================

function toggleAnswerForm(buttonElement) {
  if (!requireAuth()) return;

  const card = buttonElement.closest('.card');
  const formWrapper = card.querySelector('.answer-form-wrapper');

  if (formWrapper.innerHTML !== '') {
    formWrapper.innerHTML = '';
    return;
  }

  formWrapper.innerHTML = `
    <div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
      <textarea class="answer-input" placeholder="Write your verified solution here..." rows="3" style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid #ccc;"></textarea>
      
      <!-- 👇 NEW: Note File Upload Input -->
      <label style="font-size: 0.85rem; color: #555; font-weight: 500;">Attach Notes / PDF (Optional):</label>
      <input type="file" class="answer-file-input" accept=".pdf,.doc,.docx" style="font-size: 0.85rem;" />

      <button class="btn btn-primary" onclick="submitAnswer(this)" style="align-self: flex-end; font-size: 0.85rem;">Submit Answer</button>
    </div>
  `;
}

async function submitAnswer(submitButton) {
  if (!requireAuth()) return;

  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  const card = submitButton.closest('.card');
  const questionId = card.getAttribute('data-question-id');
  const answerInput = card.querySelector('.answer-input');
  const fileInput = card.querySelector('.answer-file-input');
  const answerText = answerInput.value.trim();

  if (!answerText && (!fileInput.files || fileInput.files.length === 0)) {
    alert("Please write an answer or attach a note file.");
    return;
  }

  // Use FormData to handle both text and file uploads
  const formData = new FormData();
  formData.append('authorName', userData.fullName || 'Student');
  formData.append('authorBranch', userData.branch || 'IT');
  formData.append('authorStatus', userData.status || 'Student');
  formData.append('authorIdCard', userData.idCardUrl || '');
  formData.append('answerText', answerText);

  if (fileInput.files[0]) {
    formData.append('noteFile', fileInput.files[0]); // Matches backend multer field
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/questions/${questionId}/answers`, {
      method: 'POST',
      body: formData // ⚠️ Do NOT set 'Content-Type' header; browser sets multipart/form-data automatically
    });

    if (response.ok) {
      alert("✅ Answer & Notes posted successfully!");
      fetchAndRenderQuestions();
    } else {
      alert("Failed to submit answer.");
    }
  } catch (err) {
    console.error("Error posting answer:", err);
    alert("Server error. Check your backend console.");
  }
}

// ==========================================
// FORM SUBMISSION HANDLERS (ASK, LOGIN, REGISTER)
// ==========================================

// --- ASK QUESTION FORM SUBMISSION (query.html) ---
const askQuestionForm = document.getElementById('post-question-form') || document.getElementById('ask-question-form');

if (askQuestionForm) {
  askQuestionForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!requireAuth()) return;

    const userData = JSON.parse(localStorage.getItem('userData')) || {};

    const titleInput = document.getElementById('question-title') || document.getElementById('title');
    const branchInput = document.getElementById('target-branch') || document.getElementById('question-branch');
    const subjectInput = document.getElementById('question-subject') || document.getElementById('subject');
    const descInput = document.getElementById('question-details') || document.getElementById('question-desc');

    const title = titleInput ? titleInput.value.trim() : '';
    const description = descInput ? descInput.value.trim() : '';
    const branch = branchInput ? branchInput.value : (userData.branch || 'IT');
    const subject = subjectInput ? subjectInput.value : 'General';

    if (!title || !description) {
      alert("Please fill in both the title and details.");
      return;
    }

    const payload = {
      title,
      description,
      branch,
      subject,
      authorName: userData.fullName || 'Anonymous'
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("✅ Question posted successfully!");
        askQuestionForm.reset();
        window.location.href = 'index.html'; // Return to feed
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to post question.");
      }
    } catch (error) {
      console.error("Error posting question:", error);
      alert(`Could not connect to backend server on ${BACKEND_URL}`);
    }
  });
}

// --- LOGIN FORM SUBMISSION ---
const loginForm = document.getElementById('login-form') || document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email')?.value || document.getElementById('email')?.value;
    const password = document.getElementById('login-password')?.value || document.getElementById('password')?.value;
    
    removeErrorMessage();

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'success.html?action=logged_in';
      } else {
        showErrorMessage(loginForm, data.message || 'Invalid email or password.');
      }
    } catch (error) {
      showErrorMessage(loginForm, 'Server offline or network error. Ensure Node server is running.');
    }
  });
}

// --- REGISTER FORM SUBMISSION ---
const registerForm = document.getElementById('register-form') || document.getElementById('registerForm');

if (registerForm) {
  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    removeErrorMessage();
    const formData = new FormData(registerForm);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user) {
          localStorage.setItem('registeredUser', JSON.stringify(data.user));
        }
        window.location.href = 'success.html?action=registered';
      } else {
        showErrorMessage(registerForm, data.message || 'Error during registration.');
      }
    } catch (error) {
      showErrorMessage(registerForm, 'Server offline or network error.');
    }
  });
}

// ==========================================
// UPVOTING & HELPFUL SCORE LOGIC
// ==========================================

async function upvoteAnswer(questionId, answerId, buttonElement) {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  const userId = userData._id || userData.id || userData.email;

  if (!isLoggedIn || !userId) {
    alert("Please log in to upvote answers!");
    window.location.href = 'login.html';
    return;
  }

  if (buttonElement.classList.contains('voted')) {
    alert("You have already marked this answer as helpful. Limit is 1 upvote per answer.");
    return;
  }

  // Prevent multiple fast clicks
  buttonElement.disabled = true;

  try {
    const response = await fetch(`${BACKEND_URL}/api/questions/${questionId}/answers/${answerId}/vote`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.alreadyUpvoted) {
        buttonElement.classList.add('voted');
        buttonElement.setAttribute('title', 'Already marked helpful');
      }
      alert(data.message || "Failed to register upvote.");
      return;
    }

    const countSpan = buttonElement.querySelector('.vote-count');
    if (countSpan) {
      countSpan.textContent = data.votes;
    } else {
      buttonElement.innerHTML = `<span class="vote-icon">▲</span> Helpful (<span class="vote-count">${data.votes}</span>)`;
    }

    buttonElement.classList.add('voted');
    buttonElement.setAttribute('title', 'Already marked helpful');
  } catch (error) {
    console.error("Upvote failed:", error);
    alert("Could not register upvote. Please verify backend connection.");
  } finally {
    buttonElement.disabled = false;
  }
}

// ==========================================
// THEME TOGGLE (DARK / LIGHT MODE)
// ==========================================

function initTheme() {
  const savedTheme = localStorage.getItem('eduq_theme') || 'light';
  applyTheme(savedTheme);
  setupThemeToggle();
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme');
  }
  updateThemeToggleIcons(theme);
}

function updateThemeToggleIcons(theme) {
  const toggles = document.querySelectorAll('.theme-toggle-btn');
  toggles.forEach(toggle => {
    toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    toggle.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  });
}

function setupThemeToggle() {
  const toggles = document.querySelectorAll('.theme-toggle-btn');
  toggles.forEach(btn => {
    // Prevent attaching multiple duplicate listeners
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('eduq_theme', nextTheme);
      applyTheme(nextTheme);
    });
  });
}

// ==========================================
// INITIALIZATION ON PAGE LOAD
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkAuthStatus();
  fetchAndRenderQuestions();
  setupCombinedFilters();
});

// ==========================================
// ADVANCED COMBINED FILTERING (BRANCH + SUBJECT + SEARCH)
// ==========================================

function applyCombinedFilters() {
  const searchInput = document.getElementById('search-input');
  const branchSelect = document.getElementById('branch-filter');
  const subjectSelect = document.getElementById('subject-filter');

  const query = (searchInput?.value || '').toLowerCase().trim();
  const selectedBranch = (branchSelect?.value || 'ALL').toUpperCase();
  const selectedSubject = (subjectSelect?.value || 'ALL').toLowerCase();

  const cards = document.querySelectorAll('#questions-container .card, .feed-container .card');

  cards.forEach(card => {
    const cardText = card.innerText.toLowerCase();
    const cardBranch = (card.getAttribute('data-branch') || '').toUpperCase();
    const cardSubject = (card.getAttribute('data-subject') || '').toLowerCase();

    // Check search term
    const matchesSearch = query === '' || cardText.includes(query);

    // Check branch filter
    const matchesBranch = (selectedBranch === 'ALL') || 
                          (cardBranch === selectedBranch) || 
                          cardText.includes(selectedBranch.toLowerCase());

    // Check subject filter
    const matchesSubject = (selectedSubject === 'all') || 
                           (cardSubject === selectedSubject) || 
                           cardText.includes(selectedSubject);

    if (matchesSearch && matchesBranch && matchesSubject) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function setupCombinedFilters() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const branchSelect = document.getElementById('branch-filter');
  const subjectSelect = document.getElementById('subject-filter');
  const resetBtn = document.getElementById('btn-reset-filters');

  if (searchInput) {
    searchInput.addEventListener('input', applyCombinedFilters);
  }
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      applyCombinedFilters();
    });
  }
  if (branchSelect) {
    branchSelect.addEventListener('change', applyCombinedFilters);
  }
  if (subjectSelect) {
    subjectSelect.addEventListener('change', applyCombinedFilters);
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (branchSelect) branchSelect.value = 'ALL';
      if (subjectSelect) subjectSelect.value = 'ALL';
      applyCombinedFilters();
    });
  }
}

// --- QUICK FILTER: MY ASKED DOUBTS ---
function filterMyDoubts() {
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  const currentUserName = userData.fullName || '';
  const cards = document.querySelectorAll('.card');

  cards.forEach(card => {
    const authorText = card.querySelector('.author')?.innerText || card.innerText;
    if (authorText.includes(currentUserName) && currentUserName !== '') {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// --- QUICK FILTER: BROWSE SHARED PDF NOTES ---
function filterPdfNotes() {
  const cards = document.querySelectorAll('.card');

  cards.forEach(card => {
    const hasPdf = card.querySelector('a[href*=".pdf"]') || card.innerText.toLowerCase().includes('.pdf');
    if (hasPdf) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Attach event listeners to Quick Filter links
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.sidebar a, .quick-filters a, .widget a');

  links.forEach(link => {
    if (link.innerText.includes('My Asked Doubts')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        filterMyDoubts();
      });
    }
    if (link.innerText.includes('Browse Shared PDF Notes')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        filterPdfNotes();
      });
    }
  });
});