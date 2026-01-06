/**
 * Tab C - Accounts & Storage
 * View balance, nonce, code, and storage for any address
 */

import { rpcCall } from '../rpc.js';
import { hexToNumber, weiToEth, isValidAddress, numberToHex } from '../utils.js';

let currentAddress = '';

/**
 * Initialize Tab C
 */
export function initAccounts() {
    setupAddressSearch();
    setupStorageQuery();
}

/**
 * Setup address search
 */
function setupAddressSearch() {
    const searchBtn = document.getElementById('address-search-btn');
    const addressInput = document.getElementById('address-input');

    searchBtn.addEventListener('click', async () => {
        const address = addressInput.value.trim();

        if (!address) {
            alert('Please enter an address');
            return;
        }

        if (!isValidAddress(address)) {
            alert('Invalid Ethereum address format');
            return;
        }

        currentAddress = address;
        await fetchAccountInfo(address);
    });

    // Enter key support
    addressInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBtn.click();
    });

    // Pre-fill with example address
    addressInput.placeholder = 'Enter address (e.g. 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045)';
}

/**
 * Fetch all account information
 */
async function fetchAccountInfo(address) {
    const searchBtn = document.getElementById('address-search-btn');

    try {
        searchBtn.disabled = true;
        searchBtn.textContent = 'Loading...';

        // Reset display
        document.getElementById('account-balance').textContent = 'Loading...';
        document.getElementById('account-nonce').textContent = 'Loading...';
        document.getElementById('account-type').textContent = 'Loading...';

        // Fetch balance, nonce, and code in parallel
        const [balanceRes, nonceRes, codeRes] = await Promise.all([
            rpcCall('eth_getBalance', [address, 'latest']),
            rpcCall('eth_getTransactionCount', [address, 'latest']),
            rpcCall('eth_getCode', [address, 'latest'])
        ]);

        // Display balance
        const balanceWei = balanceRes.result;
        const balanceEth = weiToEth(balanceWei);
        document.getElementById('account-balance').textContent = `${balanceEth} ETH`;
        document.getElementById('account-balance-wei').textContent =
            `${BigInt(balanceWei).toLocaleString()} wei`;

        // Display nonce
        const nonce = hexToNumber(nonceRes.result);
        document.getElementById('account-nonce').textContent = nonce.toString();

        // Display account type (EOA vs Contract)
        const code = codeRes.result;
        const isContract = code && code !== '0x' && code.length > 2;

        if (isContract) {
            document.getElementById('account-type').textContent = '📄 Contract';
            document.getElementById('account-code-size').textContent =
                `${Math.floor((code.length - 2) / 2)} bytes`;
        } else {
            document.getElementById('account-type').textContent = '👤 EOA';
            document.getElementById('account-code-size').textContent =
                'Externally Owned Account';
        }

    } catch (e) {
        console.error('Error fetching account info:', e);
        document.getElementById('account-balance').textContent = 'Error';
        document.getElementById('account-nonce').textContent = 'Error';
        document.getElementById('account-type').textContent = 'Error';
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Inspect';
    }
}

/**
 * Setup storage query
 */
function setupStorageQuery() {
    const storageBtn = document.getElementById('storage-btn');
    const storageSlotInput = document.getElementById('storage-slot');
    const storageResult = document.getElementById('storage-result');

    storageBtn.addEventListener('click', async () => {
        if (!currentAddress) {
            storageResult.textContent = 'Please search for an address first';
            storageResult.classList.add('error');
            return;
        }

        let slot = storageSlotInput.value.trim();
        if (!slot) {
            slot = '0x0';
        }

        // Ensure slot is hex
        if (!slot.startsWith('0x')) {
            slot = numberToHex(parseInt(slot));
        }

        try {
            storageBtn.disabled = true;
            storageBtn.textContent = 'Reading...';
            storageResult.classList.remove('error', 'success');

            const { result } = await rpcCall('eth_getStorageAt', [currentAddress, slot, 'latest']);

            storageResult.textContent = result;
            storageResult.classList.add('success');

        } catch (e) {
            storageResult.textContent = `Error: ${e.message}`;
            storageResult.classList.add('error');
        } finally {
            storageBtn.disabled = false;
            storageBtn.textContent = 'Read Slot';
        }
    });
}
