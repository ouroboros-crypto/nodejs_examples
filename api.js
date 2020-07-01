'use strict';

const fetch = require('node-fetch');

// Get all the account info by the address
exports.getAccountInfo = function (address) {
    return fetch(`https://rest.ouroboros-crypto.com/auth/accounts/${address}`)
        .then(res => res.json()).then(data => data.result);
};

// Get the balance of the account by its address using getAccountInfo
exports.getBalance = function (address) {
    return exports.getAccountInfo(address)
        .then(data => {
            if (data.error) {
                throw data.error;
            }

            const coins = data.value.coins;

            if (coins.length > 0) {
                return coins[0]['amount'] / 1000000;
            }

            return 0;
        });
};

// Get the latest "mined" block
exports.getLatestBlock = function () {
    return fetch('https://rest.ouroboros-crypto.com/blocks/latest')
        .then(res => res.json())
        .then(data => {
            return parseInt(data.block.header.height);
        })
};

// Get all the transaction details by its hash
exports.getTransactionDetails = function (hash) {
    return fetch(`https://rest.ouroboros-crypto.com/txs/${hash}`)
        .then(res => res.json())
};

// Get all the transactions were sent by the sender
exports.getTransactionsFromAddress = function (sender) {
    return fetch(`https://rest.ouroboros-crypto.com/txs?message.sender=${sender}&limit=100`)
        .then(res => res.json())
};

// Broadcast the TX object and return the response
exports.broadcastTx = function (tx) {
    return fetch('https://rest.ouroboros-crypto.com/txs', {
        method: "post",
        headers: {
            "Content-type": "application/json",
            "Accept": "application/json",
            "Accept-Charset": "utf-8"
        },
        body: JSON.stringify(tx)
    }).then(res => res.json());
};