const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const SHA256 = require('crypto-js/sha256');
const assert = require('chai').assert;
dotenv.config({ path: '../.env' });

const { genAccounts } = require('./generate.js');
const { getSignature } = require('./sign');
const { verifySignature } = require('./verify');

const port = process.env.SERVER_PORT;
const numAccounts = process.env.NUM_ACCOUNTS;
const keyMap = setKeyMap();
const params = parseParameters(keyMap);
const balances = setBalanceMap();

console.log(params.activeAccount);


function parseParameters(_keyMap) {
  const myArgs = process.argv.includes("--demo") ? process.env.DEMO_CONFIG.split(" ") : process.argv.slice(2);
  let activeAccount = [];
  let participants = 'random';

  let i = 0;
  while (i < myArgs.length) {

    switch (myArgs[i]) {
      case '--account':
      case '--A':
        // Get index of key in keyMap
        myArgs[i + 1] = Array.from(myArgs[i + 1].replace(/^\[| |\]$/g, '').split(','));

        myArgs[i + 1].map((_account) => {
          let thisAccount = 0;

          [..._keyMap].map(([ii, _key]) => {
            thisAccount = (_key.getPrivate().toString(16) === _account) ? ii : thisAccount
          })

          activeAccount.push(thisAccount);
        });
        break;
      case '--participants':
      case '--P':
        // Get participant type ('explicit' or 'random')
        activeAccount = activeAccount ? activeAccount : 0;
        participants = myArgs[i + 1];
        break;
    }
    i += 2;
  }

  return { activeAccount, participants };
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
  const _publicKey = (_key >= 0 && keyMap.has(_key)) ? getPublicKey(keyMap.get(_key)) : "NA";
  const _balance = (_key >= 0 && balances.has(_key)) ? balances.get(_key) : "NA";

  res.send({ balance: _balance, address: _publicKey });
});

app.post('/send', (req, res) => {
  const { sender, amount, recipient } = req.body;
  const _sender = parseInt(sender);
  const _recipient = parseInt(recipient);
  const _amount = parseInt(amount.replace(/,/g, ''));

  try {
    // Requirements
    assert.oneOf(_sender, params.activeAccount, "You are not authorized");
    assert.hasAnyKeys(keyMap, _sender, "Sender is not a valid participant");
    assert.isNumber(_amount, "'SEND AMOUNT' must be a number");
    assert.hasAnyKeys(keyMap, _recipient, "Recipient is not a valid participant");
    assert.notStrictEqual(_sender, _recipient, "You cannot send to yourself");
    assert.isAtMost(_amount, balances.get(_sender), "Insufficient funds");
    assert.isAtLeast(_amount, 1, "You must send at least 1");
  }
  catch (err) {
    res.send({ address: "0x000..000", message: err.message.toString() });
    return
  }

  const _key = keyMap.get(_recipient);
  const _address = getPublicKey(_key);

  res.send({ address: `0x${_address}`, message: "Sign to confirm transaction." });
})

app.post('/sign', (req, res) => {
  const { sender, recipient, amount } = req.body;
  const _sender = parseInt(sender);
  const _recipient = parseInt(recipient);
  const _amount = parseInt(amount.replace(/,/g, ''));

  try {
    // Sign message/transaction
    const _signature = getSignature(keyMap.get(_sender));
    assert.isTrue(verifySignature(keyMap.get(_sender), _signature), "Transaction not signed by user");

    let _balanceSender = balances.get(_sender);
    let _balanceRecipient = balances.get(_recipient);

    balances.set(_sender, _balanceSender - _amount);
    balances.set(_recipient, (_balanceRecipient || 0) + +_amount);
  }
  catch (err) {
    res.send({ balance: balances.get(_sender), message: err.message.toString() });
    return
  }

  res.send({ balance: balances.get(_sender), message: "Success!" });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
