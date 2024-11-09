const axios = require('axios');
require('dotenv').config();

const LLAMA3_API_URL = 'http://0.0.0.0:11434/api/embed';
console.log('API URL:', LLAMA3_API_URL);

const testPayload = {
  model: 'all-minilm',  // Make sure this matches what the server expects
  input: ['Why is the sky blue?', 'Why is the grass green?'],  // Send input array, not prompt
};

axios.post(LLAMA3_API_URL, testPayload, {
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'curl/7.68.0',
    'Accept': '*/*',
    'Connection': 'keep-alive',
}}).then(response => {
    console.log('API Response:', response.data);
  })
  .catch(error => {
    if (error.response) {
      console.error('Error Response:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  });
