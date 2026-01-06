/**
 * Utility functions for ETH Command Center
 */

/**
 * Convert hex string to decimal number
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {number}
 */
export function hexToNumber(hex) {
    if (!hex) return 0;
    return parseInt(hex, 16);
}

/**
 * Convert number to hex string
 * @param {number} num
 * @returns {string}
 */
export function numberToHex(num) {
    return '0x' + num.toString(16);
}

/**
 * Convert Wei to ETH
 * @param {string} wei - Wei amount as hex or decimal string
 * @returns {string}
 */
export function weiToEth(wei) {
    if (!wei) return '0';
    const weiBigInt = typeof wei === 'string' && wei.startsWith('0x')
        ? BigInt(wei)
        : BigInt(wei);
    const ethValue = Number(weiBigInt) / 1e18;
    return ethValue.toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 8
    });
}

/**
 * Convert Wei to Gwei
 * @param {string|bigint} wei
 * @returns {string}
 */
export function weiToGwei(wei) {
    if (!wei) return '0';
    const weiBigInt = typeof wei === 'string' && wei.startsWith('0x')
        ? BigInt(wei)
        : BigInt(wei);
    const gweiValue = Number(weiBigInt) / 1e9;
    return gweiValue.toFixed(2);
}

/**
 * Format large number with commas
 * @param {number|string} num
 * @returns {string}
 */
export function formatNumber(num) {
    if (typeof num === 'string' && num.startsWith('0x')) {
        num = hexToNumber(num);
    }
    return Number(num).toLocaleString('en-US');
}

/**
 * Shorten address for display
 * @param {string} address
 * @param {number} chars
 * @returns {string}
 */
export function shortenAddress(address, chars = 6) {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Shorten hash for display
 * @param {string} hash
 * @param {number} chars
 * @returns {string}
 */
export function shortenHash(hash, chars = 8) {
    if (!hash) return '';
    return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

/**
 * Convert Unix timestamp to readable date
 * @param {string|number} timestamp - Hex or decimal timestamp
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
    if (!timestamp) return '--';
    const ts = typeof timestamp === 'string' && timestamp.startsWith('0x')
        ? hexToNumber(timestamp)
        : Number(timestamp);
    const date = new Date(ts * 1000);
    return date.toLocaleString();
}

/**
 * Format time ago
 * @param {string|number} timestamp
 * @returns {string}
 */
export function timeAgo(timestamp) {
    if (!timestamp) return '--';
    const ts = typeof timestamp === 'string' && timestamp.startsWith('0x')
        ? hexToNumber(timestamp)
        : Number(timestamp);
    const seconds = Math.floor(Date.now() / 1000 - ts);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Copy text to clipboard
 * @param {string} text
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

/**
 * Debounce function calls
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if string is valid Ethereum address
 * @param {string} address
 * @returns {boolean}
 */
export function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if string is valid transaction hash
 * @param {string} hash
 * @returns {boolean}
 */
export function isValidTxHash(hash) {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Get network name from chain ID
 * @param {string|number} chainId
 * @returns {string}
 */
export function getNetworkName(chainId) {
    const id = typeof chainId === 'string' && chainId.startsWith('0x')
        ? hexToNumber(chainId)
        : Number(chainId);

    const networks = {
        1: 'Ethereum Mainnet',
        5: 'Goerli Testnet',
        11155111: 'Sepolia Testnet',
        137: 'Polygon Mainnet',
        80001: 'Polygon Mumbai',
        42161: 'Arbitrum One',
        10: 'Optimism',
        56: 'BNB Smart Chain',
        43114: 'Avalanche C-Chain'
    };

    return networks[id] || `Chain ${id}`;
}
