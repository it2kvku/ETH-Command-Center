/**
 * Tab E - Logs & Events
 * Query contract events and create filters
 */

import { rpcCall } from '../rpc.js';
import { hexToNumber, formatNumber, shortenHash, isValidAddress } from '../utils.js';

let activeFilterId = null;

/**
 * Initialize Tab E
 */
export function initLogsEvents() {
    setupGetLogs();
    setupFilters();
}

/**
 * Setup getLogs functionality
 */
function setupGetLogs() {
    const getLogsBtn = document.getElementById('get-logs-btn');
    const logsTable = document.getElementById('logs-table');

    getLogsBtn.addEventListener('click', async () => {
        const address = document.getElementById('logs-address').value.trim();
        const topic0 = document.getElementById('logs-topic0').value.trim();
        const fromBlock = document.getElementById('logs-from').value.trim() || 'latest';
        const toBlock = document.getElementById('logs-to').value.trim() || 'latest';

        try {
            getLogsBtn.disabled = true;
            getLogsBtn.textContent = 'Loading...';
            logsTable.innerHTML = '<div class="loading"></div>';

            const filterObj = {};

            // Handle block range
            if (fromBlock === 'latest') {
                // Get latest block and go back 100 blocks
                const { result: latestBlock } = await rpcCall('eth_blockNumber');
                const latest = hexToNumber(latestBlock);
                filterObj.fromBlock = '0x' + Math.max(0, latest - 100).toString(16);
                filterObj.toBlock = 'latest';
            } else {
                filterObj.fromBlock = fromBlock.startsWith('0x') ? fromBlock : '0x' + parseInt(fromBlock).toString(16);
                filterObj.toBlock = toBlock === 'latest' ? 'latest' : (toBlock.startsWith('0x') ? toBlock : '0x' + parseInt(toBlock).toString(16));
            }

            if (address) {
                if (!isValidAddress(address)) {
                    throw new Error('Invalid address format');
                }
                filterObj.address = address;
            }

            if (topic0) {
                filterObj.topics = [topic0];
            }

            const { result: logs } = await rpcCall('eth_getLogs', [filterObj]);

            renderLogs(logs, logsTable);

        } catch (e) {
            logsTable.innerHTML = `<p class="placeholder-text text-danger">Error: ${e.message}</p>`;
        } finally {
            getLogsBtn.disabled = false;
            getLogsBtn.textContent = 'Get Logs';
        }
    });
}

/**
 * Render logs
 */
function renderLogs(logs, container) {
    if (!logs || logs.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No logs found</p>';
        return;
    }

    let html = `<p style="margin-bottom: 0.5rem; color: var(--text-secondary);">Found ${logs.length} logs</p>`;

    logs.slice(0, 50).forEach((log, i) => {
        html += `
      <div class="log-item">
        <div>
          <span class="log-block">Block: ${formatNumber(hexToNumber(log.blockNumber))}</span>
          <span style="margin-left: 1rem;">Log #${log.logIndex ? hexToNumber(log.logIndex) : i}</span>
        </div>
        <div class="log-tx">Tx: ${shortenHash(log.transactionHash, 10)}</div>
        <div style="color: var(--accent-info);">Address: ${shortenHash(log.address, 10)}</div>
        <div class="log-topics">
          Topics: ${log.topics.length > 0 ? log.topics.map(t => shortenHash(t, 8)).join(', ') : 'None'}
        </div>
        ${log.data && log.data !== '0x' ? `<div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 0.25rem;">Data: ${shortenHash(log.data, 20)}</div>` : ''}
      </div>
    `;
    });

    if (logs.length > 50) {
        html += `<p style="color: var(--text-tertiary); padding: 0.5rem;">... and ${logs.length - 50} more logs</p>`;
    }

    container.innerHTML = html;
}

/**
 * Setup filter functionality
 */
function setupFilters() {
    const createBtn = document.getElementById('create-filter-btn');
    const pollBtn = document.getElementById('poll-filter-btn');
    const uninstallBtn = document.getElementById('uninstall-filter-btn');
    const filterType = document.getElementById('filter-type');
    const filterStatus = document.getElementById('filter-status');
    const filterResults = document.getElementById('filter-results');

    createBtn.addEventListener('click', async () => {
        const type = filterType.value;

        try {
            createBtn.disabled = true;
            createBtn.textContent = 'Creating...';

            let result;
            switch (type) {
                case 'logs':
                    const address = document.getElementById('logs-address').value.trim();
                    const topic0 = document.getElementById('logs-topic0').value.trim();
                    const filterObj = {};
                    if (address) filterObj.address = address;
                    if (topic0) filterObj.topics = [topic0];
                    result = await rpcCall('eth_newFilter', [filterObj]);
                    break;
                case 'blocks':
                    result = await rpcCall('eth_newBlockFilter', []);
                    break;
                case 'pending':
                    result = await rpcCall('eth_newPendingTransactionFilter', []);
                    break;
            }

            activeFilterId = result.result;
            filterStatus.innerHTML = `
        <span class="text-success">✅ Filter created</span><br>
        Filter ID: <code>${activeFilterId}</code>
      `;

            pollBtn.disabled = false;
            uninstallBtn.disabled = false;
            filterResults.innerHTML = '';

        } catch (e) {
            filterStatus.innerHTML = `<span class="text-danger">Error: ${e.message}</span>`;
        } finally {
            createBtn.disabled = false;
            createBtn.textContent = 'Create Filter';
        }
    });

    pollBtn.addEventListener('click', async () => {
        if (!activeFilterId) return;

        try {
            pollBtn.disabled = true;
            pollBtn.textContent = 'Polling...';

            const { result: changes } = await rpcCall('eth_getFilterChanges', [activeFilterId]);

            if (changes && changes.length > 0) {
                let html = `<p style="color: var(--text-secondary); margin-bottom: 0.5rem;">Found ${changes.length} new items</p>`;
                changes.slice(0, 20).forEach((item, i) => {
                    if (typeof item === 'string') {
                        // Block hash or tx hash
                        html += `<div class="log-item">${shortenHash(item, 16)}</div>`;
                    } else {
                        // Log object
                        html += `
              <div class="log-item">
                <span class="log-block">Block: ${formatNumber(hexToNumber(item.blockNumber))}</span>
                <span class="log-tx" style="margin-left: 0.5rem;">Tx: ${shortenHash(item.transactionHash, 8)}</span>
              </div>
            `;
                    }
                });
                filterResults.innerHTML = html;
            } else {
                filterResults.innerHTML = '<p class="placeholder-text">No new changes</p>';
            }

        } catch (e) {
            filterResults.innerHTML = `<p class="text-danger">Error: ${e.message}</p>`;
        } finally {
            pollBtn.disabled = false;
            pollBtn.textContent = 'Poll Changes';
        }
    });

    uninstallBtn.addEventListener('click', async () => {
        if (!activeFilterId) return;

        try {
            uninstallBtn.disabled = true;
            uninstallBtn.textContent = 'Removing...';

            await rpcCall('eth_uninstallFilter', [activeFilterId]);

            activeFilterId = null;
            filterStatus.textContent = 'Filter removed';
            filterResults.innerHTML = '';
            pollBtn.disabled = true;
            uninstallBtn.disabled = true;

        } catch (e) {
            filterStatus.innerHTML = `<span class="text-danger">Error: ${e.message}</span>`;
        } finally {
            uninstallBtn.disabled = false;
            uninstallBtn.textContent = 'Uninstall';
        }
    });
}
