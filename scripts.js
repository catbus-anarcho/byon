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

/**
 * Connect to the user's Xverse wallet via the open‑source Sats Connect API.
 *
 * When the library is available (either via a global `satsConnect` object or
 * `SatsConnect`), this function will request the user to connect and then
 * display the connected ordinals address. If the library fails to load or the
 * user rejects the request, a message will be displayed instead. See the
 * official Xverse documentation for more details on the `wallet_connect`
 * method【8147329001946†L100-L118】【8147329001946†L158-L181】.
 */
async function connectXverse() {
  const statusEl = document.getElementById('walletStatus');
  const button = document.getElementById('connectBtn');
  if (!statusEl || !button) return;
  statusEl.textContent = 'Connecting…';
  button.disabled = true;
  try {
    let requestFunc;
    // Determine which namespace the request function lives under.
    if (window.satsConnect && typeof window.satsConnect.request === 'function') {
      requestFunc = window.satsConnect.request;
    } else if (window.SatsConnect && typeof window.SatsConnect.request === 'function') {
      requestFunc = window.SatsConnect.request;
    } else {
      // Dynamically import the module as a fallback. This import uses the UMD
      // build from jsDelivr. In a production build you may bundle the package
      // locally.
      const module = await import('https://cdn.jsdelivr.net/npm/@sats-connect/core@latest/dist/index.umd.js');
      requestFunc = module.request;
    }
    // Request ordinals and payment addresses. The message appears in the
    // connection prompt, and the network is set to mainnet by default【8147329001946†L100-L118】.
    const response = await requestFunc('wallet_connect', {
      addresses: ['ordinals', 'payment'],
      message: 'Connect to anarcho‑catbus to launch your runes!',
      network: 'Mainnet',
    });
    if (response && response.status === 'success') {
      const ordinalsItem = response.result.addresses.find(
        (addr) => addr.purpose === 'ordinals'
      );
      const paymentItem = response.result.addresses.find(
        (addr) => addr.purpose === 'payment'
      );
      const ordAddr = ordinalsItem ? ordinalsItem.address : '(no ordinals address)';
      statusEl.textContent = `Connected to Xverse – ordinals: ${ordAddr}`;
      button.textContent = 'Connected';
      // Store addresses on the global object for later use (e.g. minting or voting)
      window.connectedAddresses = {
        ordinals: ordinalsItem,
        payment: paymentItem,
      };
    } else {
      statusEl.textContent = 'Connection rejected or failed. Please try again.';
      button.disabled = false;
    }
  } catch (err) {
    // Display any error message returned from the wallet
    statusEl.textContent = err && err.error && err.error.message
      ? err.error.message
      : 'Error connecting to wallet';
    button.disabled = false;
  }
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
    // When the BYON page is loaded, clicking the connect button will invoke
    // the Xverse wallet connection flow.
    connectBtn.addEventListener('click', () => {
      // Avoid duplicate connections on subsequent clicks
      if (!connectBtn.disabled) {
        connectXverse();
      }
    });
  }

  // Toggle mint/etch form fields based on action selection
  const runeActionSelect = document.getElementById('runeAction');
  const mintFields = document.getElementById('mintFields');
  const etchFields = document.getElementById('etchFields');
  if (runeActionSelect && mintFields && etchFields) {
    // Initialize visibility on page load
    mintFields.style.display = runeActionSelect.value === 'mint' ? 'block' : 'none';
    etchFields.style.display = runeActionSelect.value === 'etch' ? 'block' : 'none';
    runeActionSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      mintFields.style.display = val === 'mint' ? 'block' : 'none';
      etchFields.style.display = val === 'etch' ? 'block' : 'none';
    });
  }
});

/**
 * Handle a Runes mint or etch order submission. Reads form inputs
 * from the mint/etch section and calls the appropriate Sats Connect
 * method (`runes_mint` or `runes_etch`). See the Sats Connect docs for
 * parameter details【267343010589726†L96-L169】【460235423960652†L96-L146】.
 */
async function handleRuneOrder() {
  const statusEl = document.getElementById('mintEtchStatus');
  if (!statusEl) return;
  statusEl.textContent = 'Processing…';
  // Ensure wallet is connected
  if (!window.connectedAddresses || !window.connectedAddresses.ordinals || !window.connectedAddresses.payment) {
    statusEl.textContent = 'Please connect your wallet first.';
    return;
  }
  try {
    let requestFunc;
    // Determine which namespace the request function lives under
    if (window.satsConnect && typeof window.satsConnect.request === 'function') {
      requestFunc = window.satsConnect.request;
    } else if (window.SatsConnect && typeof window.SatsConnect.request === 'function') {
      requestFunc = window.SatsConnect.request;
    } else {
      const module = await import('https://cdn.jsdelivr.net/npm/@sats-connect/core@latest/dist/index.umd.js');
      requestFunc = module.request;
    }
    const action = document.getElementById('runeAction').value;
    const runeName = document.getElementById('runeName').value.trim();
    if (!runeName) {
      statusEl.textContent = 'Please provide a rune name.';
      return;
    }
    if (action === 'mint') {
      // Gather mint parameters
      const repeats = parseInt(document.getElementById('runeRepeats').value) || 1;
      const feeRate = parseInt(document.getElementById('runeFeeRate').value) || 1;
      const ordAddr = window.connectedAddresses.ordinals.address;
      const payAddr = window.connectedAddresses.payment.address;
      const response = await requestFunc('runes_mint', {
        destinationAddress: ordAddr,
        feeRate: +feeRate,
        repeats: +repeats,
        runeName: runeName,
        refundAddress: payAddr,
        network: 'Mainnet',
      });
      if (response && response.status === 'success') {
        statusEl.textContent = `Mint order created. Funding transaction id: ${response.result.fundTransactionId}`;
      } else {
        statusEl.textContent = response && response.error && response.error.message ? response.error.message : 'Mint failed.';
      }
    } else {
      // Gather etch parameters
      const divisibility = parseInt(document.getElementById('runeDivisibility').value) || 0;
      const symbol = document.getElementById('runeSymbol').value || '¤';
      const premine = document.getElementById('runePremine').value || '0';
      const isMintable = document.getElementById('runeIsMintable').value === 'true';
      const amount = document.getElementById('runeAmount').value;
      const cap = document.getElementById('runeCap').value;
      // Build terms only if amount or cap provided
      const terms = {};
      if (amount) terms.amount = amount;
      if (cap) terms.cap = cap;
      const params = {
        runeName: runeName,
        divisibility: divisibility,
        symbol: symbol,
        premine: premine,
        isMintable: isMintable,
        network: 'Mainnet',
      };
      if (Object.keys(terms).length) {
        params.terms = terms;
      }
      const response = await requestFunc('runes_etch', params);
      if (response && response.status === 'success') {
        statusEl.textContent = `Etch order created. Transaction id: ${response.result.fundTransactionId || response.result.orderId || 'n/a'}`;
      } else {
        statusEl.textContent = response && response.error && response.error.message ? response.error.message : 'Etch failed.';
      }
    }
  } catch (err) {
    statusEl.textContent = err && err.error && err.error.message ? err.error.message : 'Unexpected error.';
  }
}