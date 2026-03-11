const fs = require('fs');

async function testUpload() {
  const dummyFileContent = Buffer.from('dummy image content');
  
  try {
    const response = await fetch('https://gallery-pilot.vercel.app/api/upload?filename=test.jpg', {
      method: 'POST',
      body: dummyFileContent,
    });
    
    console.log('Status:', response.status);
    const json = await response.json();
    console.log('Response JSON:', json);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testUpload();
