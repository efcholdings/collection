const fs = require('fs');

const envContent = fs.readFileSync('.env.production', 'utf8');
console.log('File length:', envContent.length);
console.log('First 5 characters char codes:');
for (let i = 0; i < Math.min(5, envContent.length); i++) {
  console.log(i, envContent[i], envContent.charCodeAt(i));
}

const match = envContent.match(/BLOB_READ_WRITE_TOKEN="(.*)"/);
if (match) {
    const val = match[1];
    console.log("Token length:", val.length);
    for (let i = 0; i < Math.min(10, val.length); i++) {
        console.log(i, val[i], val.charCodeAt(i));
    }
}
