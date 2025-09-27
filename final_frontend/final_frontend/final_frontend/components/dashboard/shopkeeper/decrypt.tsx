import { Buffer } from "buffer"; // Import Buffer for Node.js compatibility

// Decryption (RLE)
export const decryptPage = (encryptedBuffer: Buffer | ArrayBuffer): Buffer => {
  let decryptedData: Buffer;

  // Ensure encryptedBuffer is a Buffer
  if (encryptedBuffer instanceof Buffer) {
    decryptedData = Buffer.from(encryptedBuffer);
  } else {
    decryptedData = Buffer.from(new Uint8Array(encryptedBuffer)); // Convert ArrayBuffer to Buffer
  }

  // Reverse each encryption layer in the correct order
  decryptedData = shiftDecrypt(decryptedData);
  decryptedData = fibonacciUnmix(decryptedData);
  decryptedData = reverseTransformationTable(decryptedData);
  decryptedData = reversePrimeRearrange(decryptedData);

  return decryptedData;
};


// Reverse Dynamic Shifting
const shiftDecrypt = (buffer: Buffer): Buffer => {
  const shiftValue = buffer.reduce((acc, byte) => acc + byte, 0) % 256;
  return Buffer.from(buffer.map((byte) => (byte - shiftValue + 256) % 256));
};

// Reverse Fibonacci Byte Mixing
const fibonacciUnmix = (buffer: Buffer): Buffer => {
  const fibSeq = getFibonacciSequence(buffer.length).reverse();
  let restoredBuffer = Buffer.alloc(buffer.length);

  fibSeq.forEach((index, i) => {
    restoredBuffer[i] = buffer[index % buffer.length]; // Ensures index is within range
  });

  return restoredBuffer;
};

// Reverse Auto-Generated Transformation Table
const reverseTransformationTable = (buffer: Buffer): Buffer => {
  // Reverse the character replacement done during encryption
  return buffer; // Implement logic mirroring `applyTransformationTable`
};

// Reverse Prime Number-Based Rearrangement
const reversePrimeRearrange = (buffer: Buffer): Buffer => {
  const primes = getPrimes(buffer.length);
  const primeBytes = buffer.slice(-primes.length);
  const nonPrimeBytes = buffer.slice(0, -primes.length);

  let restoredBuffer = Buffer.alloc(buffer.length);
  let nonPrimeIndex = 0;

  primes.forEach((index, i) => {
    restoredBuffer[index] = primeBytes[i]; // Restore prime-indexed bytes
  });

  buffer.forEach((_, i) => {
    if (!primes.includes(i)) {
      restoredBuffer[i] = nonPrimeBytes[nonPrimeIndex++];
    }
  });

  return restoredBuffer;
};

// Helper Function: Get Fibonacci Sequence
const getFibonacciSequence = (length: number): number[] => {
  let seq = [0, 1];
  while (seq.length < length) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
  return seq.slice(0, length); // Ensure it stays within bounds
};

// Helper Function: Get Prime Number Positions
const getPrimes = (limit: number): number[] => {
  let primes: number[] = [];
  for (let i = 0; i < limit; i++) {
    if (isPrime(i)) primes.push(i);
  }
  return primes;
};

//  Prime Number Checker
const isPrime = (num: number): boolean => {
  if (num < 2) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
};

//  Export Functions for Use in Other Files
export { shiftDecrypt, fibonacciUnmix, reverseTransformationTable, reversePrimeRearrange, getFibonacciSequence, getPrimes };
