const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const myArgs = process.argv.includes("--demo") ? process.env.DEMO_CONFIG.split(" ") : process.argv.slice(2);

const genKeyPair = () => { return ec.genKeyPair() };
const genAccountFromPrivateKey = (privateKey) => { return ec.keyFromPrivate(privateKey) };

// Defaults
let genAccounts = genAccountFromPrivateKey;

// Set input parameter values
let i = 0;
while (i < myArgs.length) {
  switch (myArgs[i]) {
    case '--participants':
    case '--P':
      genAccounts = (myArgs[i + 1].toLowerCase() === 'explicit') ? genAccountFromPrivateKey : genKeyPair;
      break;
  }
  i += 2;
}

module.exports = { genAccountFromPrivateKey, genAccounts };
