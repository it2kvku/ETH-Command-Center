/**
 * Tab B - Chain State & Blocks
 * Browse blocks and view transaction counts
 */

import { rpcCall } from '../rpc.js';
import { hexToNumber, formatNumber, formatTimestamp, timeAgo, shortenHash } from '../utils.js';

/**
 * Initialize Tab B
 */
export async function initChainBlocks() {
    await refreshLatestBlock();
    setupBlockSearch();
    setupRefreshButton();
}

/**
 * Refresh latest block information
 */
export async function refreshLatestBlock() {
    try {
        // Get latest block number
        const { result: blockNumHex } = await rpcCall('eth_blockNumber');
        const blockNum = hexToNumber(blockNumHex);

        document.getElementById('latest-block-number').textContent = formatNumber(blockNum);

        // Get full block details
        const { result: block } = await rpcCall('eth_getBlockByNumber', [blockNumHex, false]);

        if (block) {
            document.getElementById('latest-block-txs').textContent =
                block.transactions ? block.transactions.length : 0;
            document.getElementById('latest-block-gas').textContent =
                formatNumber(hexToNumber(block.gasUsed));
            document.getElementById('latest-block-time').textContent =
                timeAgo(block.timestamp);
        }

    } catch (e) {
        console.error('Error fetching latest block:', e);
        document.getElementById('latest-block-number').textContent = 'Error';
    }
}

/**
 * Setup block search functionality
 */
function setupBlockSearch() {
    const searchBtn = document.getElementById('block-search-btn');
    const searchInput = document.getElementById('block-search');
    const detailsDiv = document.getElementById('block-details');

    searchBtn.addEventListener('click', async () => {
        const input = searchInput.value.trim();
        if (!input) {
            detailsDiv.innerHTML = '<p class="placeholder-text">Please enter a block number or hash</p>';
            return;
        }

        try {
            searchBtn.disabled = true;
            searchBtn.textContent = 'Loading...';
            detailsDiv.innerHTML = '<div class="loading"></div>';

            let block;

            if (input.startsWith('0x') && input.length === 66) {
                // Block hash
                const { result } = await rpcCall('eth_getBlockByHash', [input, true]);
                block = result;
            } else {
                // Block number
                const blockNumHex = input.startsWith('0x') ? input : '0x' + parseInt(input).toString(16);
                const { result } = await rpcCall('eth_getBlockByNumber', [blockNumHex, true]);
                block = result;
            }

            if (block) {
                renderBlockDetails(block, detailsDiv);
            } else {
                detailsDiv.innerHTML = '<p class="placeholder-text text-danger">Block not found</p>';
            }

        } catch (e) {
            detailsDiv.innerHTML = `<p class="placeholder-text text-danger">Error: ${e.message}</p>`;
        } finally {
            searchBtn.disabled = false;
            searchBtn.textContent = 'Search';
        }
    });

    // Enter key support
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBtn.click();
    });
}

/**
 * Render block details
 */
function renderBlockDetails(block, container) {
    const txCount = block.transactions ? block.transactions.length : 0;

    let html = `
    <div class="detail-row">
      <span class="detail-label">Block Number</span>
      <span class="detail-value">${formatNumber(hexToNumber(block.number))}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Timestamp</span>
      <span class="detail-value">${formatTimestamp(block.timestamp)} (${timeAgo(block.timestamp)})</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Hash</span>
      <span class="detail-value hash">${block.hash}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Parent Hash</span>
      <span class="detail-value hash">${shortenHash(block.parentHash, 16)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Miner/Validator</span>
      <span class="detail-value hash">${block.miner}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Transactions</span>
      <span class="detail-value">${txCount}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Gas Used</span>
      <span class="detail-value">${formatNumber(hexToNumber(block.gasUsed))} / ${formatNumber(hexToNumber(block.gasLimit))}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Base Fee</span>
      <span class="detail-value">${block.baseFeePerGas ? (hexToNumber(block.baseFeePerGas) / 1e9).toFixed(2) + ' Gwei' : 'N/A'}</span>
    </div>
  `;

    // Show transactions if available
    if (txCount > 0 && typeof block.transactions[0] === 'object') {
        html += `
      <div style="margin-top: 1rem;">
        <strong>Transactions (${txCount})</strong>
        <div style="max-height: 200px; overflow-y: auto; margin-top: 0.5rem;">
    `;

        block.transactions.slice(0, 20).forEach((tx, i) => {
            html += `
        <div class="detail-row">
          <span class="detail-label">#${i}</span>
          <span class="detail-value hash" style="font-size: 0.7rem;">${shortenHash(tx.hash, 12)}</span>
        </div>
      `;
        });

        if (txCount > 20) {
            html += `<p style="color: var(--text-tertiary); font-size: 0.75rem;">... and ${txCount - 20} more</p>`;
        }

        html += '</div></div>';
    }

    container.innerHTML = html;
}

/**
 * Setup refresh button
 */
function setupRefreshButton() {
    const refreshBtn = document.getElementById('refresh-block');
    refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Loading...';
        await refreshLatestBlock();
        refreshBtn.disabled = false;
        refreshBtn.textContent = '↻ Refresh';
    });
}
