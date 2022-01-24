const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });
const SHA256 = require('crypto-js/sha256');
const assert = require('chai').assert;

const { genAccounts } = require('./generate.js');
const { getSignature } = require('./sign');
const { verifySignature } = require('./verify');

const myArgs = process.argv.slice(2);
const port = process.env.SERVER_PORT;
const numAccounts = process.env.NUM_ACCOUNTS;
const keyMap = setKeyMap();
const activeAccount = getActiveAccount(keyMap);
const balances = setBalanceMap();


function getActiveAccount(_keyMap) {
  let _activeAccount = null;
  let i = 0;
  while (i < myArgs.length) {
    switch (myArgs[i]) {
      case '--account':
      case '--A':
        [..._keyMap].map(([ii, _key]) => {
          _activeAccount = (_key.getPrivate().toString(16) === myArgs[i + 1]) ? ii : _activeAccount
        });
    }
    i += 2;
  }

  return _activeAccount;
}

function getPublicKey(key) {
  let _publicKey = SHA256(key.getPublic().encode('hex')).toString();

  return _publicKey.slice(_publicKey.length - 40, -1);
}

function setKeyMap() {
  let _key;
  const _keyMap = new Map();

  for (i = 0; i < numAccounts; i++) {
    _key = (genAccounts.name === 'genKeyPair') ? genAccounts() : genAccounts(process.env[`PRIVATE_KEY_${i}`]);
    _keyMap.set(i, _key);
  }

  return _keyMap;
}

function setBalanceMap() {
  const _balances = new Map;

  for (let k of keyMap.keys()) {
    _balances.set(k, parseInt(process.env.BALANCES));
  }

  return _balances;
}

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

app.get('/balance/:address', (req, res) => {
  const { address } = req.params;
  const _key = parseInt(address);
  const balance = (_key >= 0 && balances.has(_key)) ? balances.get(_key) : "NA";

  res.send({ balance });
});

app.post('/send', (req, res) => {
  const { sender, recipient, amount } = req.body;
  const _sender = parseInt(sender);
  const _recipient = parseInt(recipient);
  const _amount = parseInt(amount);

  try {
    assert.hasAnyKeys(keyMap, _sender, "Sender is not a valid participant");
    assert.hasAnyKeys(keyMap, _recipient, "Recipient is not a valid participant");
    assert.strictEqual(_sender, activeAccount, "You are not authorized");
    assert.notStrictEqual(_sender, _recipient, "You cannot send to yourself");
    assert.isAtMost(_amount, balances.get(_sender), "Insufficient funds");
    assert.notStrictEqual(_amount, 0, "You cannot send 0");


    const _signature = getSignature(keyMap.get(_sender));
    assert.isTrue(verifySignature(keyMap.get(_sender), _signature), "Transaction not signed by user");

    let _balanceSender = balances.get(_sender);
    let _balanceRecipient = balances.get(_recipient);

    balances.set(_sender, _balanceSender - amount);
    balances.set(_recipient, (_balanceRecipient || 0) + +amount);
  }
  catch (err) {
    console.log(err.message)
  }

  res.send({ balance: balances.get(_sender) });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
