import crypto from "crypto";
import { io } from "socket.io-client";
import EventEmitter from "events";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  timeout: 5000,
});

const eventEmitter = new EventEmitter();
const secondEmitter = new EventEmitter();

let encryptedFiles: Buffer[] = [];
let encryptedBuffer: Buffer;
let customerPublicKey: string;
let confirmationOpen = false;
let shop_Id: string;

const ecdh = crypto.createECDH("secp256k1");
ecdh.generateKeys();
customerPublicKey = ecdh.getPublicKey().toString("base64");

//  RLE
const encryptPage = (data: Buffer): Buffer => {
  let modifiedData: Buffer = Buffer.from(data);

  modifiedData = primeRearrange(modifiedData);
  modifiedData = applyTransformationTable(modifiedData);
  modifiedData = fibonacciMix(modifiedData);
  modifiedData = shiftEncrypt(modifiedData);

  return modifiedData;
};



// Prime Number-Based Rearrangement
const primeRearrange = (buffer: Buffer): Buffer => {
  const primes: number[] = getPrimes(buffer.length);
  const primeBytes = primes.map((index) => buffer[index]);
  const nonPrimeBytes = buffer.filter((_, index) => !primes.includes(index));

  return Buffer.concat([Buffer.from(nonPrimeBytes), Buffer.from(primeBytes)]);
};

// Auto-Generated Transformation Table
const applyTransformationTable = (buffer: Buffer): Buffer => {
  const freqMap: { [key: number]: number } = {};
  buffer.forEach((byte) => (freqMap[byte] = (freqMap[byte] || 0) + 1));

  const sortedBytes = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
  const transformationTable: { [key: number]: number } = {};

  sortedBytes.forEach(([byte], index) => {
    transformationTable[parseInt(byte)] = (byte.charCodeAt(0) + index) % 256;
  });

  return Buffer.from(buffer.map((byte) => transformationTable[byte] || byte));
};

// Fibonacci Sequence Byte Mixing
const fibonacciMix = (buffer: Buffer): Buffer => {
  const fibSeq = getFibonacciSequence(buffer.length);
  return Buffer.from(fibSeq.map((index) => buffer[index % buffer.length]));
};

// Step 4: Dynamic Shifting Encryption
const shiftEncrypt = (buffer: Buffer): Buffer => {
  const shiftValue = buffer.reduce((acc, byte) => acc + byte, 0) % 256;
  return Buffer.from(buffer.map((byte) => (byte + shiftValue) % 256));
};

// Helper Functions
const getPrimes = (n: number): number[] => {
  const primes: number[] = [];
  const isPrime = (num: number) => {
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return num > 1;
  };

  for (let i = 0; i < n; i++) {
    if (isPrime(i)) primes.push(i);
  }
  return primes;
};

const getFibonacciSequence = (n: number): number[] => {
  const fib = [0, 1];
  while (fib.length < n) {
    fib.push(fib[fib.length - 1] + fib[fib.length - 2]);
  }
  return fib;
};

//Socket Events
socket.on("shopKeeperKey", (data) => {
  console.log("Customer socket hit");
  const sharedSecret = ecdh.computeSecret(Buffer.from(data.publicKey, "base64"));
  shop_Id = data.shopId;

  // Encrypt AES key using shared secret
  const cipher = crypto.createCipheriv("aes-256-gcm", sharedSecret.subarray(0, 32), Buffer.alloc(16, 0));
  let encryptedData = cipher.update(Buffer.from("AES_KEY_PLACEHOLDER"));
  encryptedData = Buffer.concat([encryptedData, cipher.final()]);

  const authTag = cipher.getAuthTag();
  encryptedBuffer = Buffer.concat([encryptedData, authTag]);

  confirmationOpen = true;
  eventEmitter.emit("confirmEncryption");
});

const handleUpload = async (selectedFiles: File[]) => {
  if (!selectedFiles.length) {
    console.error("No files selected");
    return;
  }

  try {
    const fileBuffers = await Promise.all(selectedFiles.map((file) => file.arrayBuffer().then(Buffer.from)));

    encryptedFiles = fileBuffers.map(encryptPage);

    console.log("Encrypted Documents:", encryptedFiles);

    socket.emit("customer_encrypted_key", {
      customerPublicKey,
      encryptedData: encryptedBuffer.toString("base64"),
      shop_Id,
    });
  } catch (err) {
    console.error("File encryption failed:", err);
  }
};
