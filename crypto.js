'use strict';

const bip39 = require('bip39');
const bip32 = require('bip32');
const crypto = require('crypto');
const bech32 = require('bech32');
const ripemd160 = require('ripemd160');
const secp256k1 = require('secp256k1');

const DERIVE_PATH = '44\'/118\'/0\'/0/0';

// A helper that cleans all the empty fields and sorts the stuff
function removeEmptyProperties(jsonTx) {
    if (Array.isArray(jsonTx)) {
        return jsonTx.map(removeEmptyProperties)
    }

    // string or number
    if (typeof jsonTx !== `object`) {
        return jsonTx
    }

    const sorted = {};
    Object.keys(jsonTx)
        .sort()
        .forEach(key => {
            if (jsonTx[key] === undefined || jsonTx[key] === null) return;

            sorted[key] = removeEmptyProperties(jsonTx[key])
        });

    return sorted
}


// Sign some bytes with the private key
exports.sign = function (bytes, privateKey) {
    const hash = crypto.createHash('sha256')
        .update(bytes)
        .digest();

    return secp256k1.sign(hash, privateKey).signature;
};

// Generate a new mnemonic code
exports.generateMnemonic = function () {
    return bip39.generateMnemonic(256);
};

// Generate all the account info (privkey, pubkey, address) from the mnemonic code
exports.generateAccountFromMnemonic = function (mnemonic) {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const master = bip32.fromSeed(seed);
    const wallet = master.derivePath(DERIVE_PATH);

    return {
        'pubKey': wallet.publicKey,
        'privKey': wallet.privateKey,
        'address': exports.getAddressFromPublicKey(wallet.publicKey),
        'chainCode': wallet.chainCode
    };
};

// Generate all the account info (privkey, pubkey, address) from the private key
exports.generateAccountFromPrivateKey = function (privateKey, chainCode) {
    const master = bip32.fromPrivateKey(privateKey, chainCode);
    const wallet = master.neutered();

    return {
        'pubKey': wallet.publicKey,
        'privKey': wallet.privateKey,
        'address': exports.getAddressFromPublicKey(wallet.publicKey),
        'chainCode': wallet.chainCode
    };
};

// Generate a blockchain address using the public key
exports.getAddressFromPublicKey = function (pubKey) {
    const hash = crypto.createHash('sha256')
        .update(pubKey)
        .digest();

    const address = new ripemd160().update(hash).digest();
    const words = bech32.toWords(address);

    return bech32.encode('ouro', words);
};

// Generates and returns a "sign" message we should sign with the private key
exports.getSignMessage = function(accountNumber, sequence, msgs) {
    return removeEmptyProperties({
        "chain_id": "ouroboros",
        "account_number": accountNumber,
        "fee": {"gas": "95000000000", "amount": [{"amount": "1000", "denom": "ouro"}]},
        "memo": "",
        "sequence": sequence,
        "msgs": msgs,
    })
};

// Generate a send transaction
exports.generatePushableTransaction = function(accountNumber, sequence, publicKey, privateKey, sendTo, amount) {
    const fromAddress = exports.getAddressFromPublicKey(publicKey);

    // Transaction messages
    const msgs = [
        {
            "type": "cosmos-sdk/MsgSend",
            "value": {
                "from_address": fromAddress,
                "to_address": sendTo,
                "amount": [{"denom": "ouro", "amount": amount}],
            },
        }
    ];

    // Here we gets the message we're going to sign next
    const signMessage = exports.getSignMessage(accountNumber, sequence, msgs);

    const signature = exports.sign(JSON.stringify(signMessage), privateKey);

    return {
        "tx": {
            "msg": msgs,
            "fee": {
                "gas": "95000000000",
                "amount": [{"denom": "ouro", "amount": "1000"}],
            },
            "memo": "",
            "signatures": [
                {
                    "signature": signature.toString("base64"),
                    "pub_key": {"type": "tendermint/PubKeySecp256k1", "value": publicKey.toString('base64')},
                    "account_number": accountNumber,
                    "sequence": sequence,
                }
            ],
        },
        "mode": "sync",
    };
};