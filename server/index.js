const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const SHA256 = require('crypto-js/sha256');
const assert = require('chai').assert;
dotenv.config({ path: '../.env' });

const { verifySignatureWithoutPrivateKey } = require('./verify');

const port = process.env.SERVER_PORT;
const balanceMap = new Map();


const initBalanceMap = (addresses) => {
  addresses.map((address) => {
    balanceMap.set(address, parseInt(process.env.BALANCES));
  });

  // console.log("\nAccounts:");

  // [...balanceMap].map(([_pubKey, _balance], i) => {
  //   console.log(`(${i}) --- Public Key: ${_pubKey} --- Balance: ${_balance}`)
  // });

  // console.log("\n");
};

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

// Display balance of address to frontend
app.get('/balance/:address', (req, res) => {
  const { address } = req.params;
  const _balance = balanceMap.get(address);

  res.send({ balance: _balance });
});

// Initialize accounts and their balances
app.post('/balancemap', (req, _) => {
  const { addresses } = req.body;

  initBalanceMap(addresses)
});

// Return account balances
app.post('/accountbalance', (req, res) => {
  const { addresses } = req.body;
  const balances = [];

  addresses.map((address) => {
    balances.push(balanceMap.get(address))
  });

  res.send({ balances: balances });
})

// Commit a transaction for approval (still will need to sign)
app.post('/send', (req, res) => {
  const { sender, amount, recipient } = req.body;
  const _sender = parseInt(sender);
  const _recipient = parseInt(recipient);
  const _amount = parseInt(amount.replace(/,/g, ''));
  const _validAccounts = [...balanceMap.keys()]

  try {
    // Requirements
    // assert.oneOf(_sender, params.activeAccount, "You are not authorized");
    assert.oneOf(_sender, [0], "You are not authorized");
    assert.hasAnyKeys(_validAccounts, _sender, "Sender is not a valid participant");
    assert.isNumber(_amount, "'SEND AMOUNT' must be a number");
    assert.hasAnyKeys(_validAccounts, _recipient, "Recipient is not a valid participant");
    assert.notStrictEqual(_sender, _recipient, "You cannot send to yourself");
    assert.isAtMost(_amount, balanceMap.get(_validAccounts[_sender]), "Insufficient funds");
    assert.isAtLeast(_amount, 1, "You must send at least 1");
  }
  catch (err) {
    console.log(err.message.toString());
    res.send({ message: err.message.toString() });
    return
  }

  res.send({ message: "Sign to confirm transaction." });
})

// Sign a transaction and submit
app.post('/sign', (req, res) => {
  const { senderPubPoint, sender, recipient, amount, signature } = req.body;
  const _senderPublicPoint = {
    x: senderPubPoint[0].toString('hex'),
    y: senderPubPoint[1].toString('hex')
  };
  const _amount = parseInt(amount.replace(/,/g, ''));

  try {
    assert.isTrue(
      verifySignatureWithoutPrivateKey(_senderPublicPoint, signature),
      "Transaction not signed by user"
    );

    let _balanceSender = balanceMap.get(sender);
    let _balanceRecipient = balanceMap.get(recipient);

    balanceMap.set(sender, _balanceSender - _amount);
    balanceMap.set(recipient, (_balanceRecipient || 0) + +_amount);
  }
  catch (err) {
    console.log(err.message.toString());
    res.send({ balance: balanceMap.get(sender), message: err.message.toString() });
    return
  }

  res.send({ balance: balanceMap.get(sender), message: "Success!" });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
