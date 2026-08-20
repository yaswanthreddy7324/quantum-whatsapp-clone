const mongoose = require('mongoose');
require('dotenv').config();

let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quantum-chat';
// Fix hostname when running from host machine (powershell)
if (MONGODB_URI.includes('mongodb://mongodb:')) {
    MONGODB_URI = MONGODB_URI.replace('mongodb://mongodb:', 'mongodb://127.0.0.1:');
}
const targetNumber = process.argv[2] ? parseInt(process.argv[2]) : 15;

function trialDivision(n) {
    let factors = [];
    let d = 2;
    while (n > 1) {
        while (n % d === 0) {
            factors.push(d);
            n /= d;
        }
        d++;
        if (d * d > n) {
            if (n > 1) factors.push(n);
            break;
        }
    }
    return factors;
}

// compute factors, though we will display the requested output format
const factors = trialDivision(targetNumber);

console.log("========================================");
console.log("  QUANTUM CRACKING ATTEMPT INITIATED  ");
console.log("========================================");
console.log(`Connecting to realtime database at ${MONGODB_URI}...`);

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 2000 })
    .then(async () => {
        console.log("Retrieving most recent encrypted messages from realtime database...");

        // Define simple schema for querying directly bypassing the dummy models
        const tempSchema = new mongoose.Schema({}, { strict: false });
        const Message = mongoose.models.Message || mongoose.model('Message', tempSchema, 'messages');

        const latestMessage = await Message.findOne().sort({ timestamp: -1 });

        console.log("\n--- Realtime Database Record ---");
        let cipherToCrack = "553246736447566b58312b78595a2e2e2e";
        if (latestMessage) {
            console.log(`ID: ${latestMessage._id}`);
            console.log(`Sender: ${latestMessage.senderUsername || "Unknown"}`);
            console.log(`encryptedMessage: ${latestMessage.encryptedMessage}`);
            console.log(`quantumKeyId: ${latestMessage.quantumKeyId}`);
            cipherToCrack = latestMessage.encryptedMessage;
        } else {
            console.log("No messages found in the database. Waiting for traffic...");
            console.log("ID: N/A");
            console.log("Sender: N/A");
            console.log("encryptedMessage: NO_DATA");
            console.log("quantumKeyId: NO_KEY");
        }
        console.log("--------------------------------\n");

        continueCracking(cipherToCrack);
    })
    .catch(err => {
        console.log("⚠️ Database connection failed. Ensure MongoDB is running.");
        console.error(err.message);
        process.exit(1);
    });

function continueCracking(ciphertext) {
    let displayCipher = ciphertext;
    if (displayCipher && displayCipher.length > 50) {
        displayCipher = displayCipher.substring(0, 50) + "...";
    }

    console.log("Intercepting encrypted message from database...");
    console.log(`Ciphertext: ${displayCipher}`);
    console.log("Applying known stolen key via Trial Division factors...");
    console.log("Attempting to decrypt message...");
    console.log("\nDecryption Result:");
    console.log(">>> THIS IS ENCRIPTED MESSAGES DO NOT OPENED <<<");
    console.log("\nCracking attempt finished.");
    process.exit(0);
}
