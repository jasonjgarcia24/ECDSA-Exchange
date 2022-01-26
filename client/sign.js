const EC = require('elliptic').ec;
const SHA256 = require('crypto-js/sha256');

const ec = new EC('secp256k1');

// TODO: fill in your hex private key
const getSignature = (privateKey, sender, amount, recipient) => {

  const key = ec.keyFromPrivate(privateKey);

  // TODO: change this message to whatever you would like to sign
  const message = salty() + { sender, amount, recipient };
  const msgHash = SHA256(message);
  const signature = key.sign(msgHash.toString());


  return {
    message,
    signature: {
      r: signature.r.toString(16),
      s: signature.s.toString(16)
    }
  };
}

const salty = (n) => {
  n = n || 16;
  var result = '';
  while (n--) {
    result += Math.floor(Math.random() * 16).toString(16).toUpperCase();
  }
  return result;
}

module.exports = { getSignature };