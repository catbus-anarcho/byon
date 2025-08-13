// scripts.js – basic interactivity for anarcho•catbus

// Maintain an in-memory list of proposals
const proposals = [
  {
    id: 1,
    name: 'Catbus Graffiti',
    description: 'A colourful set of ordinals featuring catbus doodles in neon.',
    votes: 12
  },
  {
    id: 2,
    name: 'Nap Revolution Icons',
    description: 'An illustrated collection of cats in various nap positions to celebrate rest as revolt.',
    votes: 7
  },
  {
    id: 3,
    name: 'Memeconomics Charts',
    description: 'Tongue‑in‑cheek diagrams and charts about valuing memes over money.',
    votes: 5
  }
];

// Helper to render proposals list
function renderProposals() {
  const list = document.getElementById('proposalList');
  if (!list) return;
  list.innerHTML = '';
  proposals.forEach((proposal) => {
    const item = document.createElement('div');
    item.classList.add('proposal-item');
    item.innerHTML = `
      <div class="proposal-info">
        <h4>${proposal.name}</h4>
        <p>${proposal.description}</p>
      </div>
      <div class="proposal-actions">
        <button onclick="upvote(${proposal.id})">⬆️ ${proposal.votes}</button>
      </div>
    `;
    list.appendChild(item);
  });
}

// Upvote a proposal by id
function upvote(id) {
  const proposal = proposals.find((p) => p.id === id);
  if (proposal) {
    proposal.votes += 1;
    renderProposals();
  }
}

// Connect wallet simulation
function connectWallet() {
  const statusEl = document.getElementById('walletStatus');
  const button = document.getElementById('connectBtn');
  if (!statusEl || !button) return;
  // Simulate connection delay
  statusEl.textContent = 'Connecting…';
  button.disabled = true;
  setTimeout(() => {
    statusEl.textContent = 'Connected (mock) – membership verified!';
    button.textContent = 'Connected';
    button.disabled = true;
  }, 1000);
}

// Submit a new proposal
function submitCollection() {
  const nameInput = document.getElementById('collectionName');
  const descInput = document.getElementById('collectionDescription');
  const statusEl = document.getElementById('submitStatus');
  if (!nameInput || !descInput || !statusEl) return;
  const name = nameInput.value.trim();
  const description = descInput.value.trim();
  if (!name || !description) {
    statusEl.textContent = 'Please provide a name and description.';
    return;
  }
  // Add to proposals array with initial vote count 0
  const newId = proposals.length ? proposals[proposals.length - 1].id + 1 : 1;
  proposals.push({ id: newId, name, description, votes: 0 });
  // Clear form fields
  nameInput.value = '';
  descInput.value = '';
  statusEl.textContent = 'Your proposal has been submitted for voting!';
  renderProposals();
}

// Initialise event listeners on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Render proposals on pages that include the proposals section
  renderProposals();
  const connectBtn = document.getElementById('connectBtn');
  if (connectBtn) {
    connectBtn.addEventListener('click', connectWallet);
  }
});