const EC = require('elliptic').ec;
const SHA256 = require('crypto-js/sha256');

const ec = new EC('secp256k1');

// To verify, we need to send the message and hash (SHA256) it.
// Then decrypt the signature with the public key to return the received hash.
// And then compare the hashed original message with the decrypted hash.
const verifySignature = (key, signObj) => {
  const msgHash = SHA256(signObj.message).toString();

  return key.verify(msgHash, signObj.signature);
}

const verifySignatureWithoutPrivateKey = (pubPoint, signObj) => {
  const key = ec.keyFromPublic(pubPoint, 'hex');

  const msgHash = SHA256(signObj.message).toString();
  const results = key.verify(msgHash, signObj.signature);

  return results;
}

module.exports = { verifySignature, verifySignatureWithoutPrivateKey }
