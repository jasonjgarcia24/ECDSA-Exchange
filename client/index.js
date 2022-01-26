if (module.hot) {
  module.hot.accept();
}

const dotenv = require('dotenv');
const SHA256 = require('crypto-js/sha256');
const { clear } = require('toastr');
const assert = require('chai').assert;
dotenv.config({ path: '../.env' });

const { genAccounts } = require('./generate.js');
const { getSignature } = require('./sign');

const inputSender = document.getElementById("exchange-address");
const divAddress = document.getElementById("address");
const divBalance = document.getElementById("balance");
const inputAmount = document.getElementById("send-amount");
const inputRecipient = document.getElementById("recipient");
const btnTransfer = document.getElementById("transfer-amount");

const btnReject = document.getElementById("reject");
const btnSign = document.getElementById("sign");
const divTxRecipientAddress = document.getElementById("recipient-address");
const divTxStatus = document.getElementById("tx-status");

const DEFAULT_ADDRESS = "0x000..000";
const numAccounts = parseInt(process.env.NUM_ACCOUNTS);
const port = process.env.SERVER_PORT;
const server = `http://localhost:${port}`;

const keyMap = new Map();


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

function setKeyMap() {
  let _key;

  for (i = 0; i < numAccounts; i++) {
    _key = (genAccounts.name === 'genKeyPair') ? genAccounts() : genAccounts(process.env[`PRIVATE_KEY_${i}`]);
    keyMap.set(i, _key);
  }
}

const setAccounts = () => {
  const addresses = [];

  [...keyMap].map(([_, _key]) => {
    addresses.push(getPublicKey(_key));
  });

  const body = JSON.stringify({
    addresses
  });

  const request = new Request(`${server}/balancemap`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' } });
}

function getPublicKey(key) {
  let _publicKey = SHA256(key.getPublic().encode('hex')).toString();

  return _publicKey.slice(_publicKey.length - 40, -1);
}

const getBalances = async (_keyMap) => {
  const addresses = [];

  [..._keyMap].map(([_, _key]) => {
    addresses.push(getPublicKey(_key));
  });

  const body = JSON.stringify({
    addresses
  });

  const request = new Request(`${server}/accountbalance`, { method: 'POST', body });

  const response = await fetch(request, { headers: { 'Content-Type': 'application/json' } });
  const { balances } = await response.json();
  return balances;
};

const params = parseParameters(keyMap);
setKeyMap();
setAccounts();
getBalances(keyMap)


inputSender.addEventListener('input', ({ target: { value } }) => {
  clearTransaction();

  if (value === "" || [...keyMap].length < parseInt(value)) {
    divBalance.innerHTML = 0;
    divAddress.innerHTML = '0x000..0000';
    return;
  }

  const address = getPublicKey(keyMap.get(parseInt(value)));

  fetch(`${server}/balance/${address}`).then((response) => {
    return response.json();
  }).then(({ balance }) => {
    divBalance.innerHTML = balance;
    divAddress.innerHTML = `0x${address}`;
  });
});

inputAmount.addEventListener('input', () => {
  clearTransaction();
});

inputRecipient.addEventListener('input', () => {
  clearTransaction();
});

btnTransfer.addEventListener('click', () => {
  const sender = inputSender.value;
  const amount = inputAmount.value;
  const recipient = inputRecipient.value;

  try {
    assert.isAtMost(parseInt(recipient), numAccounts, "Recipient is not a valid participant");

    const _recipientPubKey = getPublicKey(keyMap.get(parseInt(recipient)));

    const body = JSON.stringify({
      sender, amount, recipient
    });

    const request = new Request(`${server}/send`, { method: 'POST', body });

    fetch(request, { headers: { 'Content-Type': 'application/json' } }).then(response => {
      return response.json();
    }).then(({ message }) => {
      if (_recipientPubKey !== DEFAULT_ADDRESS) {
        btnTransfer.disabled = true;
        btnTransfer.style.cursor = "not-allowed";
        divTxRecipientAddress.innerHTML = `0x${_recipientPubKey}`;

        btnReject.style.display = "inline-block";
        btnSign.style.display = "inline-block";
        divTxRecipientAddress.style.display = "block";
      }
      else {
        clearTransaction();
      }

      divTxStatus.innerHTML = message;
    });
  }
  catch (err) {
    divTxStatus.innerHTML = err.message.toString();
  }
});

btnReject.addEventListener('click', () => {
  clearTransaction();
  divTxStatus.innerHTML = "Transaction rejected by user.";
});

btnSign.addEventListener('click', () => {
  const senderPubPoint = keyMap.get(parseInt(inputSender.value)).getPublic();
  const sender = getPublicKey(keyMap.get(parseInt(inputSender.value)));
  const amount = inputAmount.value;
  const recipient = getPublicKey(keyMap.get(parseInt(inputRecipient.value)));

  const _amount = amount.replace(/,/g, '');
  const _senderPrivKey = keyMap.get(parseInt(inputSender.value)).getPrivate();

  // Sign message/transaction
  const signature = getSignature(_senderPrivKey, sender, _amount, recipient);
  const body = JSON.stringify({
    senderPubPoint, sender, amount, recipient, signature
  });

  const request = new Request(`${server}/sign`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' } }).then(response => {
    return response.json();
  }).then(({ balance, message }) => {
    clearTransaction();
    divBalance.innerHTML = balance;
    divTxStatus.innerHTML = message;
  });
});

const clearTransaction = () => {
  btnTransfer.disabled = false;
  btnTransfer.style.cursor = "pointer";
  divTxStatus.innerHTML = "Transaction status...";

  divTxRecipientAddress.innerHTML = "0x000...000";

  btnReject.style.display = "none";
  btnSign.style.display = "none";
  divTxRecipientAddress.style.display = "none";
};
