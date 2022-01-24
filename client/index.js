// import "./index.scss";

if (module.hot) {
  module.hot.accept();
}

const dotenv = require('dotenv');
const { clear } = require('toastr');
dotenv.config({ path: '../.env' });
const port = process.env.SERVER_PORT;
const server = `http://localhost:${port}`;

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


inputSender.addEventListener('input', ({ target: { value } }) => {
  clearTransaction();

  if (value === "") {
    divBalance.innerHTML = 0;
    divAddress.innerHTML = '0x000..0000';
    return;
  }

  fetch(`${server}/balance/${value}`).then((response) => {
    return response.json();
  }).then(({ balance, address }) => {
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

  const body = JSON.stringify({
    sender, amount, recipient
  });

  const request = new Request(`${server}/send`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' } }).then(response => {
    return response.json();
  }).then(({ address, message }) => {
    if (address !== DEFAULT_ADDRESS) {
      btnTransfer.disabled = true;
      btnTransfer.style.cursor = "not-allowed";
      divTxRecipientAddress.innerHTML = address;

      btnReject.style.display = "inline-block";
      btnSign.style.display = "inline-block";
      divTxRecipientAddress.style.display = "block";
    }
    else {
      clearTransaction();
    }

    divTxStatus.innerHTML = message;
  });

});

btnReject.addEventListener('click', () => {
  clearTransaction();
  divTxStatus.innerHTML = "Transaction rejected by user.";
});

btnSign.addEventListener('click', () => {
  const sender = inputSender.value;
  const amount = inputAmount.value;
  const recipient = inputRecipient.value;

  const body = JSON.stringify({
    sender, amount, recipient
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
