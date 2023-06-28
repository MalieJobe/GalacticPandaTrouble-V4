let chatHistory = [];

document.getElementById('sendMessage').addEventListener('click', sendMessage);
document.getElementById('userMessage').addEventListener('keypress', function (e) { if (e.key === 'Enter') sendMessage(); });
document.getElementById('clearHistory').addEventListener('click', clearChat);

function sendMessage(){
    const userMessage = document.getElementById('userMessage').value;

    if(userMessage === ''){
        alert('Please enter a message!');
        return;
    }

    addToChat(userMessage, 'user');

    document.getElementById('loader').hidden = false;
    
    fetch('/apiEndpoint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"messages": chatHistory})
    }).then(response => response.json())
    .then(data => {
        addToChat(data.choices[0].message.content, 'bot');
    }).catch((error) => {
        alert(`Error: ${error}`);
    })
}


function addToChat(message, sender){
    chatHistory.push({role: sender, content: message});
    const chatDiv = document.getElementById('chatHistory');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = sender;
    messageDiv.textContent = message;
    chatDiv.appendChild(messageDiv);
    document.getElementById('userMessage').value = '';

    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    document.getElementById('loader').hidden = true;
}

function clearChat(){
    localStorage.removeItem('chatHistory');
    chatHistory = [];
    document.getElementById('chatHistory').innerHTML = '';
}

window.onload = function() {
    const savedChatHistory = localStorage.getItem('chatHistory');
    if (savedChatHistory){
        chatHistory = JSON.parse(savedChatHistory);
        chatHistory.forEach(chat => addToChat(chat.content, chat.role))
    }
};