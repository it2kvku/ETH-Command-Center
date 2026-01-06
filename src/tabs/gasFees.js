/**
 * Tab F - Gas & Fees
 * Current gas prices, EIP-1559 fee history, and recommendations
 */

import { rpcCall } from '../rpc.js';
import { hexToNumber, weiToGwei } from '../utils.js';

let feeChart = null;

/**
 * Initialize Tab F
 */
export async function initGasFees() {
    await refreshGasInfo();
    setupRefreshButton();
}

/**
 * Refresh all gas information
 */
export async function refreshGasInfo() {
    try {
        // Get legacy gas price
        const { result: gasPrice } = await rpcCall('eth_gasPrice');
        const gasPriceGwei = parseFloat(weiToGwei(gasPrice));

        document.getElementById('legacy-gas-price').textContent = gasPriceGwei.toFixed(2) + ' Gwei';

        // Calculate slow/normal/fast based on current gas price
        document.getElementById('gas-slow').textContent = (gasPriceGwei * 0.8).toFixed(1);
        document.getElementById('gas-normal').textContent = gasPriceGwei.toFixed(1);
        document.getElementById('gas-fast').textContent = (gasPriceGwei * 1.2).toFixed(1);

        // Get fee history (EIP-1559)
        try {
            const { result: feeHistory } = await rpcCall('eth_feeHistory', ['0x14', 'latest', [25, 50, 75]]);

            if (feeHistory && feeHistory.baseFeePerGas) {
                const baseFees = feeHistory.baseFeePerGas.map(fee => parseFloat(weiToGwei(fee)));
                const currentBaseFee = baseFees[baseFees.length - 1];

                document.getElementById('current-base-fee').textContent = currentBaseFee.toFixed(2) + ' Gwei';

                // Calculate priority fee from rewards
                if (feeHistory.reward && feeHistory.reward.length > 0) {
                    const medianRewards = feeHistory.reward.map(r => r[1] ? parseFloat(weiToGwei(r[1])) : 0);
                    const avgPriorityFee = medianRewards.reduce((a, b) => a + b, 0) / medianRewards.length;
                    document.getElementById('priority-fee').textContent = avgPriorityFee.toFixed(2) + ' Gwei';

                    // Update gas recommendations with EIP-1559 data
                    const slowFee = currentBaseFee + avgPriorityFee * 0.8;
                    const normalFee = currentBaseFee + avgPriorityFee;
                    const fastFee = currentBaseFee + avgPriorityFee * 1.5;

                    document.getElementById('gas-slow').textContent = slowFee.toFixed(1);
                    document.getElementById('gas-normal').textContent = normalFee.toFixed(1);
                    document.getElementById('gas-fast').textContent = fastFee.toFixed(1);
                }

                // Render chart
                renderFeeChart(baseFees, feeHistory.oldestBlock);
            }
        } catch (e) {
            console.log('Fee history not available, using legacy gas price');
            document.getElementById('current-base-fee').textContent = 'N/A';
            document.getElementById('priority-fee').textContent = 'N/A';
        }

        // Try to get max priority fee
        try {
            const { result: maxPriorityFee } = await rpcCall('eth_maxPriorityFeePerGas', []);
            if (maxPriorityFee) {
                document.getElementById('priority-fee').textContent = weiToGwei(maxPriorityFee) + ' Gwei';
            }
        } catch (e) {
            // Method not supported
        }

    } catch (e) {
        console.error('Error fetching gas info:', e);
        document.getElementById('gas-slow').textContent = 'Error';
        document.getElementById('gas-normal').textContent = 'Error';
        document.getElementById('gas-fast').textContent = 'Error';
    }
}

/**
 * Render fee history chart
 */
function renderFeeChart(baseFees, oldestBlockHex) {
    const ctx = document.getElementById('fee-chart');
    if (!ctx) return;

    const oldestBlock = hexToNumber(oldestBlockHex);
    const labels = baseFees.map((_, i) => oldestBlock + i);

    // Destroy existing chart
    if (feeChart) {
        feeChart.destroy();
    }

    feeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Base Fee (Gwei)',
                data: baseFees,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#f9fafb',
                    bodyColor: '#f9fafb',
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        title: (items) => `Block ${items[0].label}`,
                        label: (item) => `Base Fee: ${item.raw.toFixed(2)} Gwei`
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Block Number',
                        color: '#9ca3af'
                    },
                    ticks: {
                        color: '#6b7280',
                        maxRotation: 45,
                        callback: function (value, index) {
                            // Show fewer labels
                            return index % 4 === 0 ? this.getLabelForValue(value) : '';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Gwei',
                        color: '#9ca3af'
                    },
                    ticks: {
                        color: '#6b7280'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

/**
 * Setup refresh button
 */
function setupRefreshButton() {
    const refreshBtn = document.getElementById('refresh-gas');
    if (!refreshBtn) return;

    refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Loading...';
        await refreshGasInfo();
        refreshBtn.disabled = false;
        refreshBtn.textContent = '↻ Refresh';
    });
}
