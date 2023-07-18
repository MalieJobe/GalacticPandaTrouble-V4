// DOM elements
const INPUT = document.getElementById('input');
const OUTPUT = document.getElementById('output');
const BTN_SEND = document.getElementById('btn_send')
const BTN_STOP = document.getElementById('btn_stop')
const TOKEN_COUNT_FIELD = document.getElementById('token_count');
const TOKEN_COST_FIELD = document.getElementById('token_cost');

// CONSTANTS
const api_key = '';

// VARIABLES
let shouldStopStreaming = false;
window.message_history = [];
let token_count = 0;
let token_cost = 0;

// EVENT LISTENERS
window.addEventListener('beforeunload', () => "Are you sure you want to leave this page? Your Chat History will be lost.");

BTN_STOP.addEventListener('click', () => shouldStopStreaming = true)
BTN_SEND.addEventListener('click', generateAnswer);
INPUT.addEventListener('keydown', (e) => {
  if (e.key === "Enter" && !e.shiftKey) { 
    generateAnswer();
  }
});

// FUNCTIONS
function addMessageToDOM(user, message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.classList.add(user);
  messageElement.innerText = message;
  OUTPUT.appendChild(messageElement);
  return messageElement;
}

function addMessageToHistory(user, message) {
  message_history.push({
    "role": user,
    "content": message,
  })
}

async function generateAnswer() {
  addMessageToHistory("user", INPUT.value)
  addMessageToDOM("user", INPUT.value);
  INPUT.value = '';

  const messageElement = addMessageToDOM("assistant", "");
  await askGPT((message) => {
    messageElement.innerText += message
    updateTokenCost();
  });

  addMessageToHistory("assistant", messageElement.innerText)
}

function updateTokenCost() {
  token_count++;
  TOKEN_COUNT_FIELD.innerText = token_count;
  token_cost = token_count * 0.09 / 1000;
  TOKEN_COST_FIELD.innerText = token_cost.toFixed(6);
}


async function askGPT(onChunk) {
  const controller = new AbortController();
  const signal = controller.signal;

  shouldStopStreaming = false;

  const data = {
    model: 'gpt-4',
    stream: true,
    messages: window.message_history
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${api_key}`
    },
    body: JSON.stringify(data),
    signal
  })


  if (!response.ok) {
    //OUTPUT.value = "Error connecting to server."
    throw new Error('Error fetching data');
  }

  const reader = response.body.getReader();
  let chunk = '', lines = [];


  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunk = new TextDecoder().decode(value);
    lines = chunk.trim().split('\n');

    if (shouldStopStreaming) {
      controller.abort();
      lines = [], chunk = '';
      break;
    }

    for (const line of lines) {
      if (line.startsWith('data: ')) {

        if(line.substring(6) ==='[DONE]') continue;

        const jsonData = JSON.parse(line.substring(6));
        if(jsonData.choices[0].finish_reason === "stop") continue;

        const message = jsonData.choices[0].delta.content;
        if (!message) continue; // skips empty strings
        onChunk(message); 
      }
    }
  }
}

