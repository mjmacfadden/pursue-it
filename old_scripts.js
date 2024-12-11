const questions = [
    { question: "I enjoy meeting new people and building connections.", category: "Social" },
    { question: "I feel energized after spending time in group settings.", category: "Social" },
    { question: "I thrive in collaborative environments where I can work with others.", category: "Social" },
    { question: "I prefer hobbies that involve physical activity or being outdoors.", category: "Active" },
    { question: "I enjoy challenging myself with sports, exercise, or fitness goals.", category: "Active" },
    { question: "I feel more engaged when my hobbies involve movement and energy.", category: "Active" },
    { question: "I enjoy creating things, whether it’s art, writing, or other forms of expression.", category: "Creative" },
    { question: "I often come up with unique ideas or solutions to problems.", category: "Creative" },
    { question: "I find joy in crafting, designing, or making something visually appealing.", category: "Creative" },
    { question: "I enjoy exploring complex ideas or learning about new topics.", category: "Intellectual" },
    { question: "I like solving puzzles, riddles, or analyzing data.", category: "Intellectual" },
    { question: "I feel most fulfilled when engaging in thought-provoking discussions or research.", category: "Intellectual" }
];

const typeMapping = {
    "Social-Active": 1,
    "Social-Creative": 2,
    "Social-Intellectual": 3,
    "Active-Social": 4, 
    "Active-Creative": 5,
    "Active-Intellectual": 6,
    "Creative-Social": 7,
    "Creative-Active": 8,
    "Creative-Intellectual": 9,
    "Intellectual-Social": 10,
    "Intellectual-Active": 11,
    "Intellectual-Creative": 12
};

const scores = { Social: 0, Active: 0, "Creative": 0, Intellectual: 0 };
const questionContainer = document.getElementById('question-container');
const navigation = document.getElementById('navigation');
let currentQuestionIndex = 0;
const userAnswers = {}; // Object to store user answers

// Function to display the current question
function showQuestion(index) {
    questionContainer.innerHTML = ''; // Clear previous question
    const q = questions[index];
    const questionDiv = document.createElement('div');
    questionDiv.innerHTML = `
        <p class="question">${index + 1}. ${q.question}</p>
        <div class="d-flex align-items-center likert">
            <label>Strongly Disagree</label>
            <div class="d-flex gap-2">
                ${[1, 2, 3, 4, 5].map(num => `
                    <div class='select'>
                        <span>${num}</span>
                        <input class="form-check-input" type="radio" name="q${index}" value="${num}" ${num === 1 ? 'required' : ''} ${userAnswers[index] === num ? 'checked' : ''}>
                    </div>
                `).join('')}
            </div>
            <label>Strongly Agree</label>
        </div>
    `;
    questionContainer.appendChild(questionDiv);

    // Update navigation buttons
    const backBtn = document.getElementById('back-btn');
    backBtn.disabled = index === 0; // Disable if it's the first question
    backBtn.style.display = 'block'; // Always show the button
    document.getElementById('next-btn').textContent = index === questions.length - 1 ? 'Submit' : 'Next';
}

// Event listener for navigation
navigation.addEventListener('click', (e) => {
    if (e.target.id === 'back-btn') {
        currentQuestionIndex--;
    } else if (e.target.id === 'next-btn') {
        // Store the user's answer for the current question
        const selectedAnswer = document.querySelector(`input[name="q${currentQuestionIndex}"]:checked`);
        if (selectedAnswer) {
            userAnswers[currentQuestionIndex] = parseInt(selectedAnswer.value);
        }

        // Check if current question is answered before moving to the next
        if (!selectedAnswer && currentQuestionIndex !== questions.length - 1) {
            alert('Please answer the question before proceeding.');
            return;
        }
        if (currentQuestionIndex === questions.length - 1) {
            // Last question, calculate results and show modal
            document.getElementById('survey-form').dispatchEvent(new Event('submit'));
            return;
        }
        currentQuestionIndex++;
    }
    showQuestion(currentQuestionIndex);
});

// Initial question display
showQuestion(currentQuestionIndex);

document.getElementById('survey-form').addEventListener('submit', (e) => {
    e.preventDefault();

    // Reset scores
    Object.keys(scores).forEach(category => scores[category] = 0);

    // Calculate scores using userAnswers
    questions.forEach((q, index) => {
        if (userAnswers[index] !== undefined) {
            scores[q.category] += userAnswers[index];
        }
    });

    // Sort scores and find top two categories
    const sortedCategories = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primary = sortedCategories[0];
    const secondary = sortedCategories[1];

    // Determine the type based on primary and secondary categories
    const userType = typeMapping[`${primary[0]}-${secondary[0]}`] || typeMapping[`${secondary[0]}-${primary[0]}`] || "Unknown"; // If combination not found, defaults to "Unknown"

    // Display results in modal
    //document.getElementById('result-text').innerText = `Your primary predisposition is ${primary[0]} with a score of ${primary[1]}, followed by ${secondary[0]} with a score of ${secondary[1]}.`;
    document.getElementById('result-text').innerHTML = `Your primary hobby predisposition is <span>${primary[0]}</span>, followed by <span>${secondary[0]}</span>.`;
    
    // Show the modal
    const resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
    resultsModal.show();

    // Save to local storage
    localStorage.setItem('hobbySurveyResults', JSON.stringify({ primary, secondary, type: userType }));

    // Hide navigation buttons after submission
    navigation.style.display = 'none';
});


//EMAIL HANDLER
var form = document.getElementById('sheetdb-form');
var spinner = document.getElementById('loadingSpinner');

form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Show the spinner
    spinner.classList.remove('d-none');

    // Retrieve the type from local storage
    const storedResults = JSON.parse(localStorage.getItem('hobbySurveyResults'));
    const typeValue = storedResults ? storedResults.type : 'Unknown';

    // Create FormData from the form
    let formData = new FormData(form);

    // Append type with the correct field format
    formData.append('data[type]', typeValue);

    // Submit the form to SheetDB
    fetch(form.action, {
        method: "POST",
        body: formData,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then((data) => {
        console.log('Submission successful:', data);

        // Map typeValue to the corresponding result page
        const typeRedirectMap = {
            1: "results/social-active.html",
            2: "results/social-creative.html",
            3: "results/social-intellectual.html",
            4: "results/active-social.html",
            5: "results/active-creative.html",
            6: "results/active-intellectual.html",
            7: "results/creative-social.html",
            8: "results/creative-active.html",
            9: "results/creative-intellectual.html",
            10: "results/intellectual-social.html",
            11: "results/intellectual-active.html",
            12: "results/intellectual-creative.html",
        };

        // Redirect the user based on their typeValue
        const redirectUrl = typeRedirectMap[typeValue];
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            alert('No matching results found.');
        }
    })
    .catch(error => {
        console.error('Error submitting the form:', error.message);

        // Hide the spinner if an error occurs
        spinner.classList.add('d-none');
        alert('There was an error submitting your form. Please try again.');
    });
});