const webPush = require('web-push');
const fs = require('fs');
const path = require('path');

const vapidKeys = webPush.generateVAPIDKeys();

console.log('--- Generated VAPID Keys ---');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
console.log('----------------------------');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = `NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`;

if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    console.log('Created .env.local with VAPID keys.');
} else {
    console.log('\nPlease add the following lines to your .env.local file:');
    console.log(envContent);
}
