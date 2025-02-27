// Configuration Data
const SURVEY_CONFIG = {
    questions: [
        { question: "I enjoy meeting new people and building connections.", category: "Social" },
        { question: "I feel energized after spending time in group settings.", category: "Social" },
        { question: "I thrive in collaborative environments where I can work with others.", category: "Social" },
        { question: "I prefer hobbies that involve physical activity or being outdoors.", category: "Active" },
        { question: "I enjoy challenging myself with sports, exercise, or fitness goals.", category: "Active" },
        { question: "I feel more engaged when my hobbies involve movement and energy.", category: "Active" },
        { question: "I enjoy creating things, whether it's art, writing, or other forms of expression.", category: "Creative" },
        { question: "I often come up with unique ideas or solutions to problems.", category: "Creative" },
        { question: "I find joy in crafting, designing, or making something visually appealing.", category: "Creative" },
        { question: "I enjoy exploring complex ideas or learning about new topics.", category: "Intellectual" },
        { question: "I like solving puzzles, riddles, or analyzing data.", category: "Intellectual" },
        { question: "I feel most fulfilled when engaging in thought-provoking discussions or research.", category: "Intellectual" }
    ],
    typeMapping: {
        "Social-Active": 1, "Social-Creative": 2, "Social-Intellectual": 3,
        "Active-Social": 4, "Active-Creative": 5, "Active-Intellectual": 6,
        "Creative-Social": 7, "Creative-Active": 8, "Creative-Intellectual": 9,
        "Intellectual-Social": 10, "Intellectual-Active": 11, "Intellectual-Creative": 12
    },
    redirectMap: {
        1: "results/social-active.html", 2: "results/social-creative.html", 
        3: "results/social-intellectual.html", 4: "results/active-social.html",
        5: "results/active-creative.html", 6: "results/active-intellectual.html",
        7: "results/creative-social.html", 8: "results/creative-active.html", 
        9: "results/creative-intellectual.html", 10: "results/intellectual-social.html",
        11: "results/intellectual-active.html", 12: "https://sites.google.com/glenbrook225.org/pursueit/intellectual-creative"
    }
};

class HobbySurvey {
    constructor() {
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.scores = { Social: 0, Active: 0, Creative: 0, Intellectual: 0 };

        this.initializeDOM();
        this.bindEvents();
        this.showQuestion(this.currentQuestionIndex);
    }

    initializeDOM() {
        this.questionContainer = document.getElementById('question-container');
        this.navigation = document.getElementById('navigation');
        this.backBtn = document.getElementById('back-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.surveyForm = document.getElementById('survey-form');
        this.sheetDbForm = document.getElementById('sheetdb-form');
        this.spinner = document.getElementById('loadingSpinner');
        this.resultText = document.getElementById('result-text');
    }

    bindEvents() {
        this.navigation.addEventListener('click', this.handleNavigation.bind(this));
        this.surveyForm.addEventListener('submit', this.handleSurveySubmit.bind(this));
        this.sheetDbForm.addEventListener('submit', this.handleEmailSubmit.bind(this));
    }

    handleNavigation(e) {
        if (e.target.id === 'back-btn') {
            this.currentQuestionIndex--;
        } else if (e.target.id === 'next-btn') {
            const selectedAnswer = document.querySelector(`input[name="q${this.currentQuestionIndex}"]:checked`);
            
            if (selectedAnswer) {
                this.userAnswers[this.currentQuestionIndex] = parseInt(selectedAnswer.value);
            }

            if (!selectedAnswer && this.currentQuestionIndex !== SURVEY_CONFIG.questions.length - 1) {
                alert('Please answer the question before proceeding.');
                return;
            }

            if (this.currentQuestionIndex === SURVEY_CONFIG.questions.length - 1) {
                this.surveyForm.dispatchEvent(new Event('submit'));
                return;
            }
            this.currentQuestionIndex++;
        }
        this.showQuestion(this.currentQuestionIndex);
    }

    showQuestion(index) {
        this.questionContainer.innerHTML = '';
        const q = SURVEY_CONFIG.questions[index];
        const questionDiv = document.createElement('div');
        
        questionDiv.innerHTML = this.createQuestionHTML(index, q);
        this.questionContainer.appendChild(questionDiv);

        this.updateNavigationButtons(index);
    }

    createQuestionHTML(index, question) {
        return `
            <p class="question">${index + 1}. ${question.question}</p>
            <div class="d-flex align-items-center likert">
                <label>Strongly Disagree</label>
                <div class="d-flex gap-2">
                    ${[1, 2, 3, 4, 5].map(num => `
                        <div class='select'>
                            <span>${num}</span>
                            <input class="form-check-input" type="radio" 
                                   name="q${index}" 
                                   value="${num}" 
                                   ${num === 1 ? 'required' : ''} 
                                   ${this.userAnswers[index] === num ? 'checked' : ''}>
                        </div>
                    `).join('')}
                </div>
                <label>Strongly Agree</label>
            </div>
        `;
    }

    updateNavigationButtons(index) {
        this.backBtn.disabled = index === 0;
        this.backBtn.style.display = 'block';
        this.nextBtn.textContent = index === SURVEY_CONFIG.questions.length - 1 ? 'Submit' : 'Next';
    }

    handleSurveySubmit(e) {
        e.preventDefault();
        this.calculateScores();
        this.displayResults();
    }

    calculateScores() {
        Object.keys(this.scores).forEach(category => this.scores[category] = 0);

        SURVEY_CONFIG.questions.forEach((q, index) => {
            if (this.userAnswers[index] !== undefined) {
                this.scores[q.category] += this.userAnswers[index];
            }
        });
    }

    displayResults() {
        const sortedCategories = Object.entries(this.scores).sort((a, b) => b[1] - a[1]);
        const [primary, secondary] = sortedCategories;

        const userType = this.determineUserType(primary[0], secondary[0]);

        this.resultText.innerHTML = `Your primary hobby predisposition is <span>${primary[0]}</span>, followed by <span>${secondary[0]}</span>.`;
        
        const resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
        resultsModal.show();

        localStorage.setItem('hobbySurveyResults', JSON.stringify({ 
            primary, 
            secondary, 
            type: userType 
        }));

        this.navigation.style.display = 'none';
    }

    determineUserType(primary, secondary) {
        const combinedKey = `${primary}-${secondary}`;
        const reversedKey = `${secondary}-${primary}`;

        return SURVEY_CONFIG.typeMapping[combinedKey] || 
               SURVEY_CONFIG.typeMapping[reversedKey] || 
               "Unknown";
    }

    submitToSheetDB(formData) {
        return fetch(this.sheetDbForm.action, {
            method: "POST",
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Submission successful:', data);
            const storedResults = JSON.parse(localStorage.getItem('hobbySurveyResults'));
            const typeValue = storedResults ? storedResults.type : 'Unknown';

            const redirectUrl = SURVEY_CONFIG.redirectMap[typeValue];
            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                alert('No matching results found.');
            }
        })
        .catch(error => {
            console.error('Error submitting the form:', error.message);
            this.spinner.classList.add('d-none');
            alert('There was an error submitting your form. Please try again.');
        });
    }

    handleEmailSubmit(e) {
        e.preventDefault();
        this.spinner.classList.remove('d-none');

        const storedResults = JSON.parse(localStorage.getItem('hobbySurveyResults'));
        const typeValue = storedResults ? storedResults.type : 'Unknown';

        const formData = new FormData(this.sheetDbForm);
        formData.append('data[type]', typeValue);

        this.submitToSheetDB(formData);
    }

    handleSheetDBResponse(response) {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }

    handleSheetDBSuccess(data) {
        console.log('Submission successful:', data);
        const storedResults = JSON.parse(localStorage.getItem('hobbySurveyResults'));
        const typeValue = storedResults ? storedResults.type : 'Unknown';

        const redirectUrl = SURVEY_CONFIG.redirectMap[typeValue];
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            alert('No matching results found.');
        }
    }

    handleSheetDBError(error) {
        console.error('Error submitting the form:', error.message);
        this.spinner.classList.add('d-none');
        alert('There was an error submitting your form. Please try again.');
    }
}

// Initialize the survey when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new HobbySurvey();
});