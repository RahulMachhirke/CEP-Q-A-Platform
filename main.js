// Function to handle opening student ID card verification modal
function openIdModal(imgUrl, userName) {
  const modal = document.getElementById('id-modal');
  const modalImg = document.getElementById('modal-id-img');
  const modalTitle = document.getElementById('modal-user-name');

  modalTitle.innerText = `${userName}'s ID Card`;
  modalImg.src = imgUrl;
  modal.style.display = 'flex';
}

function closeIdModal() {
  document.getElementById('id-modal').style.display = 'none';
}

// Checkbox Filter Logic: Sort Answers by Branch & Seniority (Graduated -> 4th Year -> 1st Year)
document.getElementById('branch-filter-check').addEventListener('change', function(e) {
  const isChecked = e.target.checked;
  const answerContainers = document.querySelectorAll('.answers-container');

  answerContainers.forEach(container => {
    const cards = Array.from(container.querySelectorAll('.answer-card'));

    if (isChecked) {
      // Sort cards descending by data-rank (Rank 5 = Graduated, Rank 4 = 4th Year, etc.)
      cards.sort((a, b) => {
        const rankA = parseInt(a.getAttribute('data-rank')) || 0;
        const rankB = parseInt(b.getAttribute('data-rank')) || 0;
        return rankB - rankA;
      });

      // Re-append sorted cards into container
      cards.forEach(card => container.appendChild(card));
    }
  });
});

function openAnswerPrompt(buttonElement) {
  const answerText = prompt("Type your solution/answer here:");
  
  if (answerText && answerText.trim() !== "") {
    const card = buttonElement.closest('.card');
    const answersContainer = card.querySelector('.answers-container');

    // Create a new answer card element
    const newAnswer = document.createElement('div');
    newAnswer.className = 'answer-card';
    newAnswer.setAttribute('data-branch', 'IT');
    newAnswer.setAttribute('data-rank', '4'); // Defaulting to 4th Year for testing

    newAnswer.innerHTML = `
      <div class="user-meta">
        <span class="author-name">You</span>
        <span class="badge badge-year">IT • 4th Year</span>
      </div>
      <p class="answer-text">${answerText}</p>
      <span class="timestamp">Answered just now</span>
    `;

    answersContainer.appendChild(newAnswer);
  }
}

// Attach event listeners to existing "+ Write an Answer" buttons
document.querySelectorAll('.btn-reply').forEach(btn => {
  btn.addEventListener('click', function() {
    openAnswerPrompt(this);
  });
});

// ==========================================
// INLINE ANSWER FORM LOGIC
// ==========================================

// Function to toggle the answer text box open/closed
function toggleAnswerForm(buttonElement) {
  const card = buttonElement.closest('.card');
  const formWrapper = card.querySelector('.answer-form-wrapper');

  // If form is already open, close it on click
  if (formWrapper.innerHTML !== '') {
    formWrapper.innerHTML = '';
    return;
  }

  // Inject the interactive answer form HTML
  formWrapper.innerHTML = `
    <div class="inline-answer-box" style="margin-top: 1rem; padding: 1rem; background: #ffffff; border: 1px solid var(--border); border-radius: 6px;">
      <textarea class="answer-input" rows="3" placeholder="Write your detailed solution here..." style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px; outline: none; margin-bottom: 0.5rem;"></textarea>
      
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
        <label style="font-size: 0.8rem; color: var(--text-muted); cursor: pointer;">
          📎 Attach Notes (PDF/Image): 
          <input type="file" class="answer-file" accept=".pdf,.png,.jpg" style="font-size: 0.75rem;">
        </label>
        
        <button class="btn btn-primary" onclick="submitAnswer(this)" style="font-size: 0.8rem;">Submit Answer</button>
      </div>
    </div>
  `;
}

// Function to append the answer to the card dynamically
function submitAnswer(submitButton) {
  const card = submitButton.closest('.card');
  const answersContainer = card.querySelector('.answers-container');
  const answerInput = card.querySelector('.answer-input');
  const fileInput = card.querySelector('.answer-file');

  const answerText = answerInput.value.trim();

  if (!answerText) {
    alert("Please write an answer before submitting.");
    return;
  }

  // Handle optional file attachment text
  let fileLinkHTML = '';
  if (fileInput.files && fileInput.files[0]) {
    const fileName = fileInput.files[0].name;
    fileLinkHTML = `<a href="#" class="link-file">📎 Attached: ${fileName}</a>`;
  }

  // Create answer element
  const newAnswerCard = document.createElement('div');
  newAnswerCard.className = 'answer-card';
  newAnswerCard.setAttribute('data-branch', 'IT');
  newAnswerCard.setAttribute('data-rank', '4');

  newAnswerCard.innerHTML = `
    <div class="user-meta">
      <span class="author-name">You (Current User)</span>
      <span class="badge badge-year">IT • 4th Year</span>
      <button class="btn-id" onclick="openIdModal('/uploads/id_cards/default_id.jpg', 'You')">🪪 View</button>
    </div>
    <p class="answer-text">${answerText}</p>
    ${fileLinkHTML}
    <span class="timestamp">Answered just now</span>
  `;

  // Append new answer inside the container
  answersContainer.appendChild(newAnswerCard);

  // Clear and close the form
  card.querySelector('.answer-form-wrapper').innerHTML = '';
}