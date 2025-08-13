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
 * Open a wallet selector modal and connect the user’s chosen wallet using
 * Sats Connect. This implementation mirrors the experience found on
 * books‑on‑bitcoin.com – a modal presents multiple providers (Xverse,
 * Magic Eden, Unisat, Phantom, etc.) and then uses the selected provider
 * to request Ordinals and payment addresses via the `wallet_connect` API.
 *
 * The flow is:
 *   1. Load the wallet selector custom element by calling `loadSelector()`
 *      from `@sats-connect/ui`. This registers a `<wallet-provider-selector>`
 *      element that can display available wallets【626107638998923†L20-L38】.
 *   2. Fetch installed wallet providers using `getProviders()` from
 *      `@sats-connect/core`. This returns an array of provider objects
 *      describing installed wallets【423106552435254†L133-L166】.
 *   3. Build a default configuration for the selector with
 *      `makeDefaultProviderConfig(providers)`. This helper ensures Xverse
 *      always appears at the top and adds install prompts for wallets that
 *      aren’t installed【635649330978860†L45-L77】.
 *   4. Call `selectWalletProvider(config)` which opens the modal and
 *      resolves with the selected provider’s id when the user picks a wallet.
 *   5. Finally call `request('wallet_connect', …)` with the chosen provider
 *      to request Ordinals and payment addresses【8147329001946†L100-L118】. The
 *      addresses are stored on `window.connectedAddresses` for later use.
 */
async function connectWallet() {
  const statusEl = document.getElementById('walletStatus');
  const button = document.getElementById('connectBtn');
  if (!statusEl || !button) return;
  statusEl.textContent = 'Connecting…';
  button.disabled = true;
  try {
    // Dynamically import the UI, core and configuration helpers. We specify
    // explicit versions to avoid breaking changes.
    const uiModule = await import('https://cdn.jsdelivr.net/npm/@sats-connect/ui@0.0.7/dist/index.min.js');
    const coreModule = await import('https://cdn.jsdelivr.net/npm/@sats-connect/core@2.8.3/dist/index.umd.js');
    const configModule = await import('https://cdn.jsdelivr.net/npm/@sats-connect/make-default-provider-config@0.0.10/dist/index.min.js');
    const { loadSelector, selectWalletProvider } = uiModule;
    const { getProviders, request } = coreModule;
    const makeDefaultProviderConfig = configModule.makeDefaultProviderConfig || configModule.default;
    // Register the wallet selector element once. If it’s already loaded it
    // does nothing【626107638998923†L20-L38】.
    loadSelector();
    // Detect installed wallet providers. Some wallets (e.g. Xverse) may be
    // installed as browser extensions; others will show an install prompt.
    const providers = await getProviders();
    // Build the configuration for the selector, ensuring Xverse is always
    // presented and other wallets are listed according to install state【635649330978860†L45-L77】.
    const selectorConfig = makeDefaultProviderConfig(providers);
    // Show the modal and wait for the user to pick a provider. If the user
    // closes the modal without choosing, a rejected promise is thrown.
    const selected = await selectWalletProvider(selectorConfig);
    const providerId = selected && selected.id;
    if (!providerId) {
      statusEl.textContent = 'No wallet selected.';
      button.disabled = false;
      return;
    }
    // Request Ordinals and payment addresses from the chosen wallet. The
    // message will be displayed in the wallet prompt and the network is
    // explicitly set to Mainnet【8147329001946†L100-L118】.
    const response = await request('wallet_connect', {
      addresses: ['ordinals', 'payment'],
      message: 'Connect to anarcho‑catbus to launch your runes!',
      network: 'Mainnet',
    }, { providerId });
    if (!response || response.status !== 'success') {
      throw new Error(response && response.error && response.error.message ? response.error.message : 'Connection failed');
    }
    const ordinalsItem = response.result.addresses.find((a) => a.purpose === 'ordinals');
    const paymentItem = response.result.addresses.find((a) => a.purpose === 'payment');
    const ordAddr = ordinalsItem ? ordinalsItem.address : '(no ordinals address)';
    statusEl.textContent = `Connected – ordinals: ${ordAddr}`;
    button.textContent = 'Connected';
    // Store addresses globally for subsequent mint/etch operations
    window.connectedAddresses = {
      ordinals: ordinalsItem,
      payment: paymentItem,
      providerId: providerId,
    };
  } catch (err) {
    // The selection modal rejects if the user closes it; handle gracefully.
    console.error(err);
    const message = (err && err.message) || (err && err.error && err.error.message) || 'Error connecting to wallet';
    statusEl.textContent = message;
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
    // When the BYON page is loaded, clicking the connect button will open
    // the wallet selector modal. Avoid duplicate connections on subsequent clicks.
    connectBtn.addEventListener('click', () => {
      if (!connectBtn.disabled) {
        connectWallet();
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