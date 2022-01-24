const EC = require('elliptic').ec;
const SHA256 = require('crypto-js/sha256');

const ec = new EC('secp256k1');

const verifySignature = (key, signObj) => {
  const msgHash = SHA256(signObj.message).toString();

  return key.verify(msgHash, signObj.signature);
}

module.exports = { verifySignature }
