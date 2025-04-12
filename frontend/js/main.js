// main.js for AllergyBuster

console.log("AllergyBuster Main JS Loaded");

// DOM Elements
const textInput = document.getElementById('text-input');
const imageInput = document.getElementById('image-input');
const audioButton = document.getElementById('check-audio');
const resultDiv = document.getElementById('result');
const geminiInput = document.getElementById('gemini-input');
const geminiReplyDiv = document.getElementById('gemini-reply');
const medicationsList = document.getElementById('medications-list');
const findDoctorsBtn = document.getElementById('find-doctors-btn');
const nearbyResults = document.getElementById('nearby-results');
const locationInput = document.getElementById('location-input');

// Initial allergens (to be replaced with backend data)
let allergens = ["milk", "peanut", "egg", "wheat", "soy", "fish", "shellfish", "tree nuts", "gluten"];

// Fetch allergens from backend on load
async function fetchAllergens() {
    try {
        const response = await fetch('http://localhost:8000/api/check-allergies/', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.allergens) allergens = data.allergens;
    } catch (error) {
        console.error('Failed to fetch allergens:', error);
    }
}
fetchAllergens();

// Text Allergy Check
document.getElementById('check-text').addEventListener('click', async () => {
    const userText = textInput.value.trim();
    if (!userText) {
        showResult('Please enter some text.', 'error');
        return;
    }
    await checkAllergens(userText, 'text');
});

// Image Allergy Check (Real OCR via API)
document.getElementById('check-image').addEventListener('change', async () => {
    const file = imageInput.files[0];
    if (!file) {
        showResult('Please select an image file.', 'error');
        return;
    }
    const formData = new FormData();
    formData.append('image', file);
    showResult('Processing image...', 'loading');
    try {
        const response = await fetch('http://localhost:8000/api/scan-ocr/', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        showResult(`Extracted: ${data.extracted_text}\n\nAllergens: ${data.allergens.join(', ') || 'None'}`, data.status === 'danger' ? 'warning' : 'safe');
    } catch (error) {
        showResult(`Error: ${error.message}`, 'error');
    }
});

// Speech Recognition and Allergy Check
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    showResult('Speech Recognition is not supported in this browser.', 'error');
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    audioButton.addEventListener('click', () => {
        showResult('Listening... Please speak.', 'loading');
        recognition.start();
    });

    recognition.onresult = async (event) => {
        const spokenText = event.results[0][0].transcript;
        showResult(`Audio Text Detected: ${spokenText}`, 'safe');
        await checkAllergens(spokenText, 'speech');
    };

    recognition.onerror = (event) => {
        showResult(`Error: ${event.error}`, 'error');
    };

    recognition.onend = () => {
        showResult('Speech recognition ended.', 'safe');
    };
}

// Generic Allergy Check Function
async function checkAllergens(text, source) {
    showResult('Checking allergens...', 'loading');
    try {
        const response = await fetch('http://localhost:8000/api/check-text/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        showResult(`Input (${source}): ${text}\n\nAllergens: ${data.allergens.join(', ') || 'None'}`, data.status === 'danger' ? 'warning' : 'safe');
    } catch (error) {
        showResult(`Error: ${error.message}`, 'error');
    }
}

// Result Display Function
function showResult(message, status) {
    resultDiv.innerHTML = '';
    const div = document.createElement('div');
    div.style.whiteSpace = 'pre-wrap';
    div.style.marginTop = '20px';
    if (status === 'loading') {
        div.innerHTML = '<div class="loader"></div>';
    } else if (status === 'error') {
        div.innerHTML = `<div class="allergy-match"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
    } else if (status === 'warning') {
        div.innerHTML = `<div class="allergy-match"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
    } else {
        div.innerHTML = `<div class="no-allergies"><i class="fas fa-check-circle"></i> ${message}</div>`;
    }
    resultDiv.appendChild(div);
}

// Gemini Chat
async function sendMessageToGemini(message) {
    showResult('Sending to Gemini...', 'loading', geminiReplyDiv);
    try {
        const response = await fetch('http://localhost:8000/api/chat/gemini/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data.reply;
    } catch (error) {
        console.error('Gemini API error:', error);
        return `Error: ${error.message}`;
    }
}

document.getElementById('send-to-gemini').addEventListener('click', async () => {
    const message = geminiInput.value.trim();
    if (!message) {
        showResult('Please enter a message.', 'error', geminiReplyDiv);
        return;
    }
    const reply = await sendMessageToGemini(message);
    showResult(`Gemini says: ${reply}`, reply.includes('Error') ? 'error' : 'safe', geminiReplyDiv);
});

// Medications (Basic Integration)
document.getElementById('add-medication-btn').addEventListener('click', () => {
    document.getElementById('add-med-modal').style.display = 'block';
});

document.getElementById('medication-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const medData = {
        name: document.getElementById('med-name').value,
        type: document.getElementById('med-type').value,
        dosage: document.getElementById('med-dosage').value,
        schedule: document.getElementById('med-schedule').value,
        start: document.getElementById('med-start').value,
        notes: document.getElementById('med-notes').value
    };
    try {
        const response = await fetch('http://localhost:8000/api/check-medicine/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(medData)
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        const medDiv = document.createElement('div');
        medDiv.className = 'medication-entry';
        medDiv.innerHTML = `
            <h3>${medData.name} (${medData.type})</h3>
            <p>Dosage: ${medData.dosage}</p>
            <p>Schedule: ${medData.schedule}</p>
            <p>Start Date: ${medData.start || 'N/A'}</p>
            <p>Notes: ${medData.notes || 'None'}</p>
            <button class="btn btn-outline btn-sm">Edit</button>
            <button class="btn btn-outline btn-sm">Delete</button>
        `;
        medicationsList.appendChild(medDiv);
        document.getElementById('add-med-modal').style.display = 'none';
        document.getElementById('medication-form').reset();
    } catch (error) {
        showResult(`Error adding medication: ${error.message}`, 'error');
    }
});

// Telehealth (Google Maps Integration)
findDoctorsBtn.addEventListener('click', async () => {
    const location = locationInput.value || '0,0'; // Default to (0,0) if empty
    nearbyResults.innerHTML = '<div class="loader"></div>';
    nearbyResults.style.display = 'block';
    try {
        const response = await fetch('http://localhost:8000/api/find-doctors/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location, radius: 5000 })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        nearbyResults.innerHTML = `
            <h3><i class="fas fa-map-pin"></i> Allergy Specialists Near You</h3>
            ${data.doctors.map(doc => `<div>${doc.name} - ${doc.address}</div>`).join('')}
        `;
    } catch (error) {
        nearbyResults.innerHTML = `<div class="allergy-match"><i class="fas fa-exclamation-triangle"></i> Error: ${error.message}</div>`;
    }
});

// Authentication Check (Basic)
function checkAuth() {
    if (!localStorage.getItem('isLoggedIn')) {
        alert('Please log in to access protected features.');
        document.getElementById('login-modal').style.display = 'block';
    }
}
document.querySelectorAll('.auth-required').forEach(el => el.addEventListener('click', checkAuth));

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});