const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const myArgs = process.argv.slice(2);
const SHA256 = require('crypto-js/sha256');
const { genAccountFromPrivateKey, genAccounts } = require('./generate.js');
const { getSignature } = require('./sign');

const port = process.env.SERVER_PORT;
const numAccounts = process.env.NUM_ACCOUNTS;
const keyMap = setKeyMap();
const activeAccount = getActiveAccount(keyMap);
const balances = setBalanceMap();

function getActiveAccount(keyMap) {
  let _activeAccount = null;
  let i = 0;
  while (i < myArgs.length) {
    switch (myArgs[i]) {
      case '--account':
      case '--A':
        [...keyMap].map(([_, prv], ii) => {
          _activeAccount = (prv === myArgs[i + 1]) ? ii : _activeAccount
        })
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
  let _publicKey;
  const _keyMap = new Map();

  for (i = 0; i < numAccounts; i++) {
    _key = (genAccounts.name === 'genKeyPair') ? genAccounts() : genAccounts(process.env[`PRIVATE_KEY_${i}`]);
    _publicKey = getPublicKey(_key);

    _keyMap.set(
      _publicKey,
      _key.getPrivate().toString(16)
    );
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

console.log(keyMap);
console.log('balances: ', balances);

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

app.get('/balance/:address', (req, res) => {
  const { address } = req.params;
  const _thisAccount = genAccountFromPrivateKey(process.env[`PRIVATE_KEY_${address}`]);
  console.log('_thisAccount: ', _thisAccount);

  const _thisPublicKey = getPublicKey(_thisAccount)
  console.log('_thisPublickey: ', _thisPublicKey);

  const balance = balances.get(_thisPublicKey);

  res.send({ balance });
});

app.post('/send', (req, res) => {
  const { sender, recipient, amount } = req.body;
  const _thisAccount = genAccountFromPrivateKey(process.env[`PRIVATE_KEY_${sender}`]);
  console.log(_thisAccount)

  const _thisPublicKey = getPublicKey(_thisAccount)
  console.log(_thisPublicKey)
  console.log(activeAccount)

  // if (_thisPublicKey === genAccountFromPrivateKey(activeAccount)) {
  let _balanceSender = balances.get(sender);
  let _balanceRecipient = balances.get(recipient);

  balances.set(sender, _balanceSender - amount);
  balances.set(recipient, (_balanceRecipient || 0) + +amount);

  res.send({ balance: balances.get(sender) });
  // }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
