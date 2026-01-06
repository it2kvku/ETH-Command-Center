/**
 * Tab A - Node & Network
 * Check endpoint status, network info, and node health
 */

import { rpcCall } from '../rpc.js';
import { hexToNumber, getNetworkName } from '../utils.js';

let lastLatency = 0;

/**
 * Initialize Tab A
 */
export async function initNodeNetwork() {
    await refreshNodeInfo();
    setupSha3Demo();
}

/**
 * Refresh all node information
 */
export async function refreshNodeInfo() {
    try {
        // Get client version
        const { result: clientVersion, latency } = await rpcCall('web3_clientVersion');
        lastLatency = latency;

        document.getElementById('client-version').textContent = clientVersion || 'Unknown';
        document.getElementById('node-latency').textContent = `${latency}ms`;
        document.getElementById('node-status').textContent = '🟢 Connected';
        document.getElementById('node-status').classList.add('text-success');

        // Update header status
        document.getElementById('connection-dot').classList.add('connected');
        document.getElementById('connection-status').textContent = 'Connected';
        document.getElementById('latency').textContent = `${latency}ms`;

    } catch (e) {
        document.getElementById('node-status').textContent = '🔴 Error';
        document.getElementById('node-status').classList.add('text-danger');
        document.getElementById('connection-dot').classList.add('error');
        document.getElementById('connection-status').textContent = 'Disconnected';
    }

    // Get network info
    try {
        const [netVersion, netListening, chainId] = await Promise.all([
            rpcCall('net_version'),
            rpcCall('net_listening'),
            rpcCall('eth_chainId')
        ]);

        document.getElementById('network-id').textContent = netVersion.result || '--';
        document.getElementById('chain-id').textContent =
            `${hexToNumber(chainId.result)} (${getNetworkName(chainId.result)})`;
        document.getElementById('node-listening').textContent =
            netListening.result ? '✅ Yes' : '❌ No';

    } catch (e) {
        console.error('Error fetching network info:', e);
    }

    // Get peer count
    try {
        const { result: peerCount } = await rpcCall('net_peerCount');
        document.getElementById('peer-count').textContent =
            peerCount ? hexToNumber(peerCount).toString() : 'N/A';
    } catch (e) {
        document.getElementById('peer-count').textContent = 'N/A';
    }
}

/**
 * Setup SHA3 demo
 */
function setupSha3Demo() {
    const sha3Btn = document.getElementById('sha3-btn');
    const sha3Input = document.getElementById('sha3-input');
    const sha3Result = document.getElementById('sha3-result');

    sha3Btn.addEventListener('click', async () => {
        const input = sha3Input.value.trim();
        if (!input) {
            sha3Result.textContent = 'Please enter some text';
            sha3Result.classList.add('error');
            return;
        }

        try {
            sha3Btn.disabled = true;
            sha3Btn.textContent = 'Hashing...';

            // Convert text to hex
            const hexInput = '0x' + Array.from(new TextEncoder().encode(input))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            const { result } = await rpcCall('web3_sha3', [hexInput]);

            sha3Result.textContent = result;
            sha3Result.classList.remove('error');
            sha3Result.classList.add('success');
        } catch (e) {
            sha3Result.textContent = `Error: ${e.message}`;
            sha3Result.classList.add('error');
            sha3Result.classList.remove('success');
        } finally {
            sha3Btn.disabled = false;
            sha3Btn.textContent = 'Hash with Keccak-256';
        }
    });
}

export function getLastLatency() {
    return lastLatency;
}
