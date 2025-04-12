// Function to check allergens from a text input
function checkAllergensFromText() {
    const textInput = document.getElementById("text-input").value; // Assuming you have a text input field with id "text-input"

    const payload = {
        text: textInput
    };

    fetch('http://127.0.0.1:8000/check_text/', {  // Replace with your actual backend URL if deployed
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.safe) {
            alert('No allergens detected!');
        } else {
            alert('Allergens found: ' + data.allergens.join(', '));
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Function to handle image upload and perform OCR for allergens
function handleImageUpload(event) {
    const imageFile = event.target.files[0];  // Get the image file

    const formData = new FormData();
    formData.append('image', imageFile);

    fetch('http://127.0.0.1:8000/scan_ocr/', {  // Replace with your actual backend URL if deployed
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'safe') {
            alert('No allergens detected in image');
        } else {
            alert('Allergens found in image: ' + data.allergens.join(', ') + '\nExtracted text: ' + data.extracted_text);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Function to handle speech-to-text upload and allergen check
function handleAudioUpload(event) {
    const audioFile = event.target.files[0];  // Get the audio file

    const formData = new FormData();
    formData.append('audio', audioFile);

    fetch('http://127.0.0.1:8000/check_speech/', {  // Replace with your actual backend URL if deployed
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.safe) {
            alert('No allergens detected in speech');
        } else {
            alert('Allergens found in speech: ' + data.allergens.join(', ') + '\nInput: ' + data.input);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Function to check medicine name via the external API
function checkMedicine() {
    const medicineName = document.getElementById("medicine-input").value;  // Assuming you have a text input for the medicine name

    const payload = {
        medicine_name: medicineName
    };

    fetch('http://127.0.0.1:8000/check_medicine/', {  // Replace with your actual backend URL if deployed
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'found') {
            alert('Medicine found: ' + JSON.stringify(data.medicine_info));  // This can be formatted as needed
        } else {
            alert('Medicine not found');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Event listeners to trigger functions when the user interacts with the page
document.getElementById("check-text-btn").addEventListener("click", checkAllergensFromText);  // Button for text check
document.getElementById("image-input").addEventListener("change", handleImageUpload);  // File input for image
document.getElementById("audio-input").addEventListener("change", handleAudioUpload);  // File input for audio
document.getElementById("check-medicine-btn").addEventListener("click", checkMedicine);  // Button for medicine check
