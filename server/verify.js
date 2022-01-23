const EC = require('elliptic').ec;
const SHA256 = require('crypto-js/sha256');

const ec = new EC('secp256k1');

// TODO: fill in the public key points
const publicKey = {
  x: "5a3a9cf094cc0dc15c30b30d85033e05bdd963a4a7ef853b2145bc1bfb7e4613",
  y: "b53651dbf17a981fb45afc744046da742f85d1f7407280fb07ecacdb61271ec8"
}

const key = ec.keyFromPublic(publicKey, 'hex');

// TODO: change this message to whatever was signed
const msg = "I am still on Team A. Team A for life.";
const msgHash = SHA256(msg).toString();

// TODO: fill in the signature components
const signature = {
  r: "4f059d9b40115d72a4d217a46ca25d79f95256ea475425298ff51b179ecd379b",
  s: "673d69e3f9abb5d4be1ab3e7b4cf4253c66b4516aa3b81282999dcd9e2f305ec"
};

console.log(key.verify(msgHash, signature));
