const api = require('./api');
const crypto = require('./crypto');

const SEPARATOR = '########';

async function apiMethods() {
    // Getting balance of the address (float)
    const balance = await api.getBalance('ouro1x4dpwcaya9n7efcn2svf3de8n9rpw58gsux9pn');

    console.log(SEPARATOR);
    console.log(`ouro1x4dpwcaya9n7efcn2svf3de8n9rpw58gsux9pn balance is ${balance} OURO`)

    // Getting the latest block mined
    const currentBlock = await api.getLatestBlock();

    console.log(SEPARATOR);
    console.log(`Latest approved block number is ${currentBlock}`);

    const transactionDetails = await api.getTransactionDetails('0E845BDF470856D840FFA7050BFC0EF7EBE3AA800D864EC530BD0B18D8311AFE');

    console.log(SEPARATOR);
    console.log('Here are the transaction details of 0E845BDF470856D840FFA7050BFC0EF7EBE3AA800D864EC530BD0B18D8311AFE:')
    console.log(JSON.stringify(transactionDetails));

    const first100Transactions = await api.getTransactionsFromAddress('ouro1x4dpwcaya9n7efcn2svf3de8n9rpw58gsux9pn');

    console.log(SEPARATOR);
    console.log('Here are first 100 transaction the ouro1x4dpwcaya9n7efcn2svf3de8n9rpw58gsux9pn has sent:');
    console.log(JSON.stringify(first100Transactions));
}

async function cryptoMethods() {
    // Or you can use some standard mnemonic
    const generatedMnemonic = "noise cruise alpha shy critic trend near sword family receive lunch eternal boss subject hunt eye okay aerobic invest immense drastic endorse know rain";
    //const generatedMnemonic = await crypto.generateMnemonic();

    console.log(`Here is your generated mnemonic: ${generatedMnemonic}`);

    const accountData = crypto.generateAccountFromMnemonic(generatedMnemonic);

    console.log(`Here is your account data:`);
    console.log(`Address: ${accountData.address}`);
    console.log(`PubKey: ${accountData.pubKey.toString('base64')}`);
    console.log(`PrivKey: ${accountData.privKey.toString('base64')}`);

    // Then we store the private key and chain code somewhere (in DB) as base64 strings
    const privateKey = accountData.privKey.toString('base64');
    const chainCode = accountData.chainCode.toString('base64');

    // If we need to get the account data from the private key, we have to convert them back to buffer and call the method
    const accountDataFromPrivateKey = crypto.generateAccountFromPrivateKey(
        Buffer.from(privateKey, 'base64'),
        Buffer.from(chainCode, 'base64')
    );


    console.log(`Here is your account data from the private key:`);
    console.log(`Address: ${accountDataFromPrivateKey.address}`);
    console.log(`PubKey: ${accountDataFromPrivateKey.pubKey.toString('base64')}`);
    console.log(`PrivKey: ${accountDataFromPrivateKey.privKey.toString('base64')}`);


    // Generate a send transaction and push it to the blockchain
    // Be sure that your account had at least 1 transaction - otherwise, accountNumber will be 0
    const accountInfo = await api.getAccountInfo(accountData.address);
    const accountNumber = accountInfo.value.account_number;
    const sequence = accountInfo.value.sequence;

    console.log(`Account Number: ${accountNumber}, Sequence: ${sequence}`);

    if (accountNumber === "0") {
        throw `You should send some coins to ${accountData.address} before making a transaction`;
    }

    const pushableTx = await crypto.generatePushableTransaction(
        accountNumber,
        sequence,
        accountData.pubKey,
        accountData.privKey,
        'ouro1x4dpwcaya9n7efcn2svf3de8n9rpw58gsux9pn',
        '1000' // 0.001 OURO
    );

    // Send that tx to our blockchain
    const response = await api.broadcastTx(pushableTx);

    console.log(`TX sending response: ${JSON.stringify(response)}`);
    console.log(`TX hash: ${response.txhash}`);
}

//apiMethods();
cryptoMethods();