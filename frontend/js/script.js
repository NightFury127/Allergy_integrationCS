// Check Allergies (Text)
function checkAllergies() {
    const textInput = document.getElementById("text-input").value;

    fetch("/api/check-text/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: textInput })
    })
    .then(response => response.json())
    .then(data => {
        let result = document.getElementById("text-result");
        if (data.allergens && data.allergens.length > 0) {
            result.innerHTML = `Allergens found: ${data.allergens.join(", ")}`;
        } else {
            result.innerHTML = "No allergens detected!";
        }
    })
    .catch(error => console.error('Error:', error));
}

// Scan Image (OCR)
function scanImage() {
    const imageInput = document.getElementById("image-upload").files[0];
    const formData = new FormData();
    formData.append('image', imageInput);

    fetch("/api/scan-ocr/", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        let result = document.getElementById("image-result");
        if (data.allergens && data.allergens.length > 0) {
            result.innerHTML = `Allergens found: ${data.allergens.join(", ")}. Extracted Text: ${data.extracted_text}`;
        } else {
            result.innerHTML = `No allergens detected. Extracted Text: ${data.extracted_text}`;
        }
    })
    .catch(error => console.error('Error:', error));
}

// Check Speech (Speech-to-Text)
function checkSpeech() {
    const audioInput = document.getElementById("audio-upload").files[0];
    const formData = new FormData();
    formData.append('audio', audioInput);

    fetch("/api/check-speech/", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        let result = document.getElementById("audio-result");
        if (data.allergens && data.allergens.length > 0) {
            result.innerHTML = `Allergens found: ${data.allergens.join(", ")}. Transcribed Text: ${data.transcribed_text}`;
        } else {
            result.innerHTML = `No allergens detected. Transcribed Text: ${data.transcribed_text}`;
        }
    })
    .catch(error => console.error('Error:', error));
}

// Chat with Gemini
function chatWithGemini() {
    const chatInput = document.getElementById("chat-input").value;

    fetch("/api/gemini-chat/", { // Adjusted endpoint for backend API
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: chatInput })
    })
    .then(response => response.json())
    .then(data => {
        let result = document.getElementById("chat-result");
        if (data.reply) {
            result.innerHTML = `Gemini's reply: ${data.reply}`;
        } else {
            result.innerHTML = "Gemini couldn't respond. Please try again.";
        }
    })
    .catch(error => console.error('Error:', error));
}
