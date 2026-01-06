/**
 * Tab D - Transactions
 * Lookup transactions, view receipts, and simulate calls
 */

import { rpcCall } from '../rpc.js';
import { hexToNumber, weiToEth, weiToGwei, formatNumber, formatTimestamp, shortenHash, isValidTxHash } from '../utils.js';

/**
 * Initialize Tab D
 */
export function initTransactions() {
    setupTxSearch();
    setupSimulate();
    setupEstimateGas();
}

/**
 * Setup transaction search
 */
function setupTxSearch() {
    const searchBtn = document.getElementById('tx-search-btn');
    const hashInput = document.getElementById('tx-hash-input');
    const detailsDiv = document.getElementById('tx-details');

    searchBtn.addEventListener('click', async () => {
        const hash = hashInput.value.trim();

        if (!hash) {
            detailsDiv.innerHTML = '<p class="placeholder-text">Please enter a transaction hash</p>';
            return;
        }

        if (!isValidTxHash(hash)) {
            detailsDiv.innerHTML = '<p class="placeholder-text text-danger">Invalid transaction hash format</p>';
            return;
        }

        try {
            searchBtn.disabled = true;
            searchBtn.textContent = 'Loading...';
            detailsDiv.innerHTML = '<div class="loading"></div>';

            // Fetch tx and receipt in parallel
            const [txRes, receiptRes] = await Promise.all([
                rpcCall('eth_getTransactionByHash', [hash]),
                rpcCall('eth_getTransactionReceipt', [hash])
            ]);

            const tx = txRes.result;
            const receipt = receiptRes.result;

            if (tx) {
                renderTxDetails(tx, receipt, detailsDiv);
            } else {
                detailsDiv.innerHTML = '<p class="placeholder-text text-danger">Transaction not found</p>';
            }

        } catch (e) {
            detailsDiv.innerHTML = `<p class="placeholder-text text-danger">Error: ${e.message}</p>`;
        } finally {
            searchBtn.disabled = false;
            searchBtn.textContent = 'Search';
        }
    });

    // Enter key support
    hashInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBtn.click();
    });
}

/**
 * Render transaction details
 */
function renderTxDetails(tx, receipt, container) {
    const status = receipt ? (receipt.status === '0x1' ? '✅ Success' : '❌ Failed') : '⏳ Pending';
    const statusClass = receipt ? (receipt.status === '0x1' ? 'text-success' : 'text-danger') : 'text-warning';

    let html = `
    <div class="detail-row">
      <span class="detail-label">Status</span>
      <span class="detail-value ${statusClass}">${status}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Hash</span>
      <span class="detail-value hash" style="font-size: 0.7rem;">${tx.hash}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Block</span>
      <span class="detail-value">${tx.blockNumber ? formatNumber(hexToNumber(tx.blockNumber)) : 'Pending'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">From</span>
      <span class="detail-value hash">${tx.from}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">To</span>
      <span class="detail-value hash">${tx.to || 'Contract Creation'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Value</span>
      <span class="detail-value">${weiToEth(tx.value)} ETH</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Gas Price</span>
      <span class="detail-value">${weiToGwei(tx.gasPrice)} Gwei</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Gas Limit</span>
      <span class="detail-value">${formatNumber(hexToNumber(tx.gas))}</span>
    </div>
  `;

    if (receipt) {
        const gasUsed = hexToNumber(receipt.gasUsed);
        const effectiveGasPrice = receipt.effectiveGasPrice ? hexToNumber(receipt.effectiveGasPrice) : hexToNumber(tx.gasPrice);
        const txFee = BigInt(gasUsed) * BigInt(effectiveGasPrice);

        html += `
      <div class="detail-row">
        <span class="detail-label">Gas Used</span>
        <span class="detail-value">${formatNumber(gasUsed)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Transaction Fee</span>
        <span class="detail-value">${weiToEth(txFee.toString())} ETH</span>
      </div>
    `;

        // Show logs if any
        if (receipt.logs && receipt.logs.length > 0) {
            html += `
        <div style="margin-top: 1rem;">
          <strong>Logs (${receipt.logs.length})</strong>
          <div style="max-height: 150px; overflow-y: auto; margin-top: 0.5rem;">
      `;

            receipt.logs.slice(0, 5).forEach((log, i) => {
                html += `
          <div class="detail-row">
            <span class="detail-label">Log #${i}</span>
            <span class="detail-value" style="font-size: 0.7rem;">
              ${shortenHash(log.address, 8)} | Topics: ${log.topics.length}
            </span>
          </div>
        `;
            });

            if (receipt.logs.length > 5) {
                html += `<p style="color: var(--text-tertiary); font-size: 0.75rem;">... and ${receipt.logs.length - 5} more</p>`;
            }

            html += '</div></div>';
        }
    }

    // Show input data
    if (tx.input && tx.input !== '0x') {
        html += `
      <div style="margin-top: 1rem;">
        <strong>Input Data</strong>
        <div class="result-box mono" style="margin-top: 0.5rem; max-height: 100px; overflow-y: auto; font-size: 0.65rem;">
          ${tx.input}
        </div>
      </div>
    `;
    }

    container.innerHTML = html;
}

/**
 * Setup simulate call (eth_call)
 */
function setupSimulate() {
    const simulateBtn = document.getElementById('simulate-btn');
    const resultDiv = document.getElementById('call-result');

    simulateBtn.addEventListener('click', async () => {
        const to = document.getElementById('call-to').value.trim();
        const data = document.getElementById('call-data').value.trim();
        const from = document.getElementById('call-from').value.trim();
        const value = document.getElementById('call-value').value.trim();

        if (!to) {
            resultDiv.textContent = 'Please enter a "To" address';
            resultDiv.classList.add('error');
            return;
        }

        try {
            simulateBtn.disabled = true;
            simulateBtn.textContent = 'Simulating...';
            resultDiv.classList.remove('error', 'success');

            const callObj = { to };
            if (data) callObj.data = data;
            if (from) callObj.from = from;
            if (value) callObj.value = value;

            const { result } = await rpcCall('eth_call', [callObj, 'latest']);

            resultDiv.textContent = result;
            resultDiv.classList.add('success');

        } catch (e) {
            resultDiv.textContent = `Error: ${e.message}`;
            resultDiv.classList.add('error');
        } finally {
            simulateBtn.disabled = false;
            simulateBtn.textContent = 'Simulate';
        }
    });
}

/**
 * Setup estimate gas
 */
function setupEstimateGas() {
    const estimateBtn = document.getElementById('estimate-gas-btn');
    const resultDiv = document.getElementById('call-result');

    estimateBtn.addEventListener('click', async () => {
        const to = document.getElementById('call-to').value.trim();
        const data = document.getElementById('call-data').value.trim();
        const from = document.getElementById('call-from').value.trim();
        const value = document.getElementById('call-value').value.trim();

        if (!to) {
            resultDiv.textContent = 'Please enter a "To" address';
            resultDiv.classList.add('error');
            return;
        }

        try {
            estimateBtn.disabled = true;
            estimateBtn.textContent = 'Estimating...';
            resultDiv.classList.remove('error', 'success');

            const callObj = { to };
            if (data) callObj.data = data;
            if (from) callObj.from = from;
            if (value) callObj.value = value;

            const { result } = await rpcCall('eth_estimateGas', [callObj]);

            const gasEstimate = hexToNumber(result);
            resultDiv.textContent = `Estimated Gas: ${formatNumber(gasEstimate)} units`;
            resultDiv.classList.add('success');

        } catch (e) {
            resultDiv.textContent = `Error: ${e.message}`;
            resultDiv.classList.add('error');
        } finally {
            estimateBtn.disabled = false;
            estimateBtn.textContent = 'Estimate Gas';
        }
    });
}
