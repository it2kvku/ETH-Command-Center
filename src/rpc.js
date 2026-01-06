/**
 * RPC Client for Ethereum JSON-RPC API
 * Handles all API calls to the Ethereum endpoint
 */

// Read RPC URL from environment variable (set in .env file)
const RPC_ENDPOINT = import.meta.env.VITE_RPC_URL;

if (!RPC_ENDPOINT) {
    console.error('❌ VITE_RPC_URL not set! Please create .env file with your RPC URL.');
}

let requestId = 1;

/**
 * Make a single RPC call
 * @param {string} method - The JSON-RPC method name
 * @param {array} params - The parameters array
 * @returns {Promise<{result: any, latency: number}>}
 */
export async function rpcCall(method, params = []) {
    const startTime = performance.now();

    const response = await fetch(RPC_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method,
            params,
            id: requestId++
        })
    });

    const latency = Math.round(performance.now() - startTime);
    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message || 'RPC Error');
    }

    return { result: data.result, latency };
}

/**
 * Make multiple RPC calls in a batch
 * @param {Array<{method: string, params: array}>} calls
 * @returns {Promise<Array>}
 */
export async function batchCall(calls) {
    const startTime = performance.now();

    const batch = calls.map(call => ({
        jsonrpc: '2.0',
        method: call.method,
        params: call.params || [],
        id: requestId++
    }));

    const response = await fetch(RPC_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch)
    });

    const latency = Math.round(performance.now() - startTime);
    const data = await response.json();

    return { results: data, latency };
}

/**
 * Check if a method is supported by the endpoint
 * @param {string} method
 * @returns {Promise<boolean>}
 */
export async function isMethodSupported(method) {
    try {
        await rpcCall(method, []);
        return true;
    } catch (e) {
        // Some methods need params, so check if it's a "method not found" error
        if (e.message.includes('not found') || e.message.includes('not supported') || e.message.includes('does not exist')) {
            return false;
        }
        // If it's a different error (like missing params), the method exists
        return true;
    }
}

/**
 * Scan endpoint for supported methods
 * @returns {Promise<Object>}
 */
export async function scanCapabilities() {
    const methods = [
        // Web3
        'web3_clientVersion',
        'web3_sha3',
        // Net
        'net_version',
        'net_listening',
        'net_peerCount',
        // Eth - Basic
        'eth_chainId',
        'eth_blockNumber',
        'eth_gasPrice',
        'eth_accounts',
        // Eth - Blocks
        'eth_getBlockByNumber',
        'eth_getBlockByHash',
        'eth_getBlockTransactionCountByNumber',
        'eth_getBlockTransactionCountByHash',
        // Eth - Accounts
        'eth_getBalance',
        'eth_getTransactionCount',
        'eth_getCode',
        'eth_getStorageAt',
        // Eth - Transactions
        'eth_getTransactionByHash',
        'eth_getTransactionReceipt',
        'eth_call',
        'eth_estimateGas',
        'eth_sendRawTransaction',
        // Eth - Logs
        'eth_getLogs',
        'eth_newFilter',
        'eth_newBlockFilter',
        'eth_newPendingTransactionFilter',
        'eth_getFilterChanges',
        'eth_getFilterLogs',
        'eth_uninstallFilter',
        // Eth - EIP-1559
        'eth_feeHistory',
        'eth_maxPriorityFeePerGas'
    ];

    const capabilities = {};

    for (const method of methods) {
        capabilities[method] = await isMethodSupported(method);
    }

    return capabilities;
}

export { RPC_ENDPOINT };
