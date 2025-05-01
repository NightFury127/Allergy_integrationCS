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

// Import API configuration
import { API_CONFIG, apiRequest } from './config.js';

// Authentication
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.AUTH + 'login/', 'POST', formData);
        localStorage.setItem('auth_token', response.token);
        window.location.href = '/dashboard.html';
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please check your credentials.');
    }
});

// Medications Integration
document.getElementById('add-medication-btn').addEventListener('click', async () => {
    const modal = document.getElementById('add-med-modal');
    modal.style.display = 'block';

    const form = document.getElementById('medication-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            name: document.getElementById('med-name').value,
            dosage: document.getElementById('med-dosage').value,
            frequency: document.getElementById('med-frequency').value
        };

        try {
            await apiRequest(API_CONFIG.ENDPOINTS.MEDICATIONS, 'POST', formData);
            modal.style.display = 'none';
            alert('Medication added successfully!');
            // Refresh medication list
            loadMedications();
        } catch (error) {
            console.error('Failed to add medication:', error);
            alert('Failed to add medication. Please try again.');
        }
    });
});

// Load medications
async function loadMedications() {
    try {
        const medications = await apiRequest(API_CONFIG.ENDPOINTS.MEDICATIONS);
        const container = document.getElementById('medications-list');
        container.innerHTML = medications.map(med => `
            <div class="medication-item">
                <h3>${med.name}</h3>
                <p>Dosage: ${med.dosage}</p>
                <p>Frequency: ${med.frequency}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load medications:', error);
    }
}

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

// Test connection
async function testConnection() {
    try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.TEST, 'GET');
        console.log('Backend connection successful:', response);
        return true;
    } catch (error) {
        console.error('Backend connection failed:', error);
        return false;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Test backend connection
    const isConnected = await testConnection();
    if (!isConnected) {
        alert('Warning: Could not connect to backend server. Some features may not work.');
    }

    checkAuth();
    if (window.location.pathname.includes('dashboard')) {
        loadMedications();
    }
});