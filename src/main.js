/**
 * ETH Command Center - Main Entry Point
 * All-in-one Ethereum Dashboard
 */

import './style.css';

// Tab Modules
import { initNodeNetwork, refreshNodeInfo } from './tabs/nodeNetwork.js';
import { initChainBlocks, refreshLatestBlock } from './tabs/chainBlocks.js';
import { initAccounts } from './tabs/accounts.js';
import { initTransactions } from './tabs/transactions.js';
import { initLogsEvents } from './tabs/logsEvents.js';
import { initGasFees, refreshGasInfo } from './tabs/gasFees.js';

// RPC
import { scanCapabilities } from './rpc.js';

/**
 * Initialize the application
 */
async function init() {
  console.log('🚀 ETH Command Center initializing...');

  // Setup tab navigation
  setupTabNavigation();

  // Initialize first tab (Node & Network)
  try {
    await initNodeNetwork();
    console.log('✅ Node & Network tab initialized');
  } catch (e) {
    console.error('Failed to initialize Node & Network:', e);
    document.getElementById('connection-dot').classList.add('error');
    document.getElementById('connection-status').textContent = 'Connection Failed';
  }

  // Pre-initialize other tabs
  initAccounts();
  initTransactions();
  initLogsEvents();

  console.log('✅ ETH Command Center ready!');
}

/**
 * Setup tab navigation
 */
function setupTabNavigation() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // Track which tabs have been initialized
  const initializedTabs = new Set(['node-network']);

  tabBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetTab = btn.dataset.tab;

      // Update active button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active panel
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === `panel-${targetTab}`) {
          panel.classList.add('active');
        }
      });

      // Initialize tab if not already done
      if (!initializedTabs.has(targetTab)) {
        try {
          switch (targetTab) {
            case 'chain-blocks':
              await initChainBlocks();
              break;
            case 'gas-fees':
              await initGasFees();
              break;
            // Other tabs are already initialized on startup
          }
          initializedTabs.add(targetTab);
        } catch (e) {
          console.error(`Failed to initialize ${targetTab}:`, e);
        }
      }
    });
  });
}

/**
 * Setup capability scanner modal
 */
function setupCapabilityScanner() {
  const modal = document.getElementById('capability-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  const capabilityList = document.getElementById('capability-list');

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Add scan button to header (optional feature)
  // Can be triggered for debugging
}

/**
 * Run RPC capability scan
 */
async function runCapabilityScan() {
  const modal = document.getElementById('capability-modal');
  const capabilityList = document.getElementById('capability-list');

  modal.classList.add('active');
  capabilityList.innerHTML = '<div class="loading"></div> Scanning methods...';

  try {
    const capabilities = await scanCapabilities();

    let html = '';
    for (const [method, supported] of Object.entries(capabilities)) {
      html += `
        <div class="capability-item ${supported ? 'supported' : 'unsupported'}">
          ${supported ? '✅' : '❌'} ${method}
        </div>
      `;
    }
    capabilityList.innerHTML = html;

  } catch (e) {
    capabilityList.innerHTML = `<p class="text-danger">Error scanning capabilities: ${e.message}</p>`;
  }
}

// Make scan function available globally for debugging
window.runCapabilityScan = runCapabilityScan;

// Auto-refresh data periodically
function setupAutoRefresh() {
  // Refresh node status every 30 seconds
  setInterval(async () => {
    try {
      await refreshNodeInfo();
    } catch (e) {
      console.warn('Auto-refresh failed:', e);
    }
  }, 30000);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  init();
  setupCapabilityScanner();
  setupAutoRefresh();
});

// Also handle if script loads after DOMContentLoaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
  setupCapabilityScanner();
  setupAutoRefresh();
}
