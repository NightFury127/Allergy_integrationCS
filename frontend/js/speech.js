// File: allergy-buster/frontend/js/speech.js

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const resultDiv = document.getElementById('result');

if (!SpeechRecognition) {
    alert("Speech Recognition is not supported in this browser.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const audioButton = document.getElementById('check-audio');

    audioButton.addEventListener('click', () => {
        resultDiv.innerHTML = "Listening... Please speak.";
        recognition.start();
    });

    recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        resultDiv.innerHTML = "Audio Text Detected:\n\n" + spokenText;
        handleAllergyCheck(spokenText);
    };

    recognition.onerror = (event) => {
        resultDiv.innerHTML = "Error: " + event.error;
    };
}
