// import "./index.scss";

if (module.hot) {
  module.hot.accept();
}

const dotenv = require('dotenv');
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
const btnConfirm = document.getElementById("confirm");
const divTxRecipientAddress = document.getElementById("recipient-address");
const divTxStatus = document.getElementById("tx-status");

inputSender.addEventListener('input', ({ target: { value } }) => {
  inputAmount.value = "";
  inputRecipient.value = "";

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

inputRecipient.addEventListener('input', ({ target: { value } }) => {
  divTxStatus.innerHTML = "Transaction status...";

  divTxRecipientAddress.innerHTML = "0x000...000";

  btnReject.style.display = "none";
  btnConfirm.style.display = "none";
  divTxRecipientAddress.style.display = "none";
});

btnTransfer.addEventListener('click', () => {
  const recipient = document.getElementById("recipient").value;

  const body = JSON.stringify({
    recipient
  });

  const request = new Request(`${server}/confirm`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' } }).then(response => {
    return response.json();
  }).then(({ address }) => {
    divTxRecipientAddress.innerHTML = address;
    divTxStatus.innerHTML = "Sign to confirm transaction.";

    btnReject.style.display = "inline-block";
    btnConfirm.style.display = "inline-block";
    divTxRecipientAddress.style.display = "block";
  });

});

btnReject.addEventListener('click', () => {
  divTxStatus.innerHTML = "Transaction rejected by user."

  btnReject.style.display = "none";
  btnConfirm.style.display = "none";
  divTxRecipientAddress.style.display = "none";
});

btnConfirm.addEventListener('click', () => {
  const sender = inputSender.value;
  const amount = inputAmount.value;
  const recipient = inputRecipient.value;

  const body = JSON.stringify({
    sender, amount, recipient
  });

  const request = new Request(`${server}/send`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' } }).then(response => {
    return response.json();
  }).then(({ balance, message }) => {
    divBalance.innerHTML = balance;
    divTxStatus.innerHTML = message;

    btnReject.style.display = "none";
    btnConfirm.style.display = "none";
    divTxRecipientAddress.style.display = "none";
  });
});