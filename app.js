/* =====================================================
   CSIR-NET MOCK TEST PORTAL
   APP.JS PART 1
===================================================== */

let testData = null;

let currentSectionIndex = 0;
let currentQuestionIndex = 0;

let sections = [];
let allQuestions = [];

/*
Answer Structure

answers = {
    questionId : value
}

single -> number
multiple -> array
nat -> string
*/

let answers = {};

/* =====================================================
   START APPLICATION
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadExam();

});

/* =====================================================
   READ URL
===================================================== */

function getTestFile() {

    const params = new URLSearchParams(window.location.search);

    return params.get("test");

}

/* =====================================================
   LOAD JSON FILE
===================================================== */

async function loadExam() {

    const testFile = getTestFile();

    if (!testFile) {

        alert("No Test Selected");
        return;

    }

    try {

        const response = await fetch(testFile);

        testData = await response.json();

        document.title = testData.test_name;

        sections = testData.sections;

   buildQuestionList();

initializeQuestionStatus();

createPalette();

createSectionTabs();

initializeButtons();

restoreExamState();

initializeTimer();

initializeAutoSave();

initializeShortcuts();

initializeSubmitButton();

enterFullscreen();

monitorFullscreen();

renderQuestion();
    }
    catch(error) {

        console.error(error);

        alert("Failed to load test file");

    }

}

/* =====================================================
   FLATTEN QUESTIONS
===================================================== */

function buildQuestionList() {

    allQuestions = [];

    sections.forEach((section, sectionIndex) => {

        section.questions.forEach((question, qIndex) => {

            allQuestions.push({
                sectionIndex,
                qIndex,
                question
            });

        });

    });

}

/* =====================================================
   CREATE SECTION TABS
===================================================== */

function createSectionTabs() {

    const container =
        document.getElementById("sectionTabs");

    container.innerHTML = "";

    sections.forEach((section, index) => {

        const btn =
            document.createElement("button");

        btn.className =
            "section-tab";

        if(index === currentSectionIndex)
            btn.classList.add("active");

        btn.textContent =
            section.name;

        btn.onclick = () => {

            currentSectionIndex = index;

            currentQuestionIndex = 0;

            createSectionTabs();

            renderQuestion();

        };

        container.appendChild(btn);

    });

}

/* =====================================================
   CURRENT QUESTION
===================================================== */

function getCurrentQuestion() {

    return sections[currentSectionIndex]
            .questions[currentQuestionIndex];

}

/* =====================================================
   RENDER QUESTION
===================================================== */

function renderQuestion() {

    const question =
        getCurrentQuestion();

    const qNo =
        currentQuestionIndex + 1;

    document.getElementById(
        "questionNumber"
    ).innerText =
        `Question ${qNo}`;

    document.getElementById(
        "questionText"
    ).innerHTML =
        question.text;

    renderOptions(question);

    rerenderMathJax();

}

/* =====================================================
   RENDER OPTIONS
===================================================== */

function renderOptions(question) {

    const container =
        document.getElementById(
            "optionsContainer"
        );

    container.innerHTML = "";

    const savedAnswer =
        answers[question.id];

    /* -------------------------
       SINGLE CORRECT
    -------------------------- */

    if(question.type === "single") {

        question.options.forEach(
            (option, index) => {

                const wrapper =
                    document.createElement("div");

                wrapper.className =
                    "option";

                wrapper.innerHTML = `
                    <input
                        type="radio"
                        name="option"
                        value="${index}"
                        ${
                            savedAnswer == index
                            ? "checked"
                            : ""
                        }
                    >

                    <label>
                        ${option}
                    </label>
                `;

                container.appendChild(wrapper);

            });

    }

    /* -------------------------
       MULTIPLE CORRECT
    -------------------------- */

    else if(question.type === "multiple") {

        question.options.forEach(
            (option, index) => {

                const checked =
                    Array.isArray(savedAnswer)
                    &&
                    savedAnswer.includes(index);

                const wrapper =
                    document.createElement("div");

                wrapper.className =
                    "option";

                wrapper.innerHTML = `
                    <input
                        type="checkbox"
                        value="${index}"
                        ${
                            checked
                            ? "checked"
                            : ""
                        }
                    >

                    <label>
                        ${option}
                    </label>
                `;

                container.appendChild(wrapper);

            });

    }

    /* -------------------------
       NAT
    -------------------------- */

    else if(question.type === "nat") {

        const input =
            document.createElement("input");

        input.type = "number";

        input.className =
            "nat-input";

        input.placeholder =
            "Enter Numerical Answer";

        input.value =
            savedAnswer || "";

        container.appendChild(input);

    }

}

/* =====================================================
   SAVE CURRENT ANSWER
===================================================== */

function saveCurrentAnswer() {

    const question =
        getCurrentQuestion();

    const container =
        document.getElementById(
            "optionsContainer"
        );

    /* -------------------------
       SINGLE
    -------------------------- */

    if(question.type === "single") {

        const selected =
            container.querySelector(
                "input[type='radio']:checked"
            );

        answers[question.id] =
            selected
            ? Number(selected.value)
            : null;

    }

    /* -------------------------
       MULTIPLE
    -------------------------- */

    else if(question.type === "multiple") {

        const selected =
            Array.from(
                container.querySelectorAll(
                    "input[type='checkbox']:checked"
                )
            ).map(
                box => Number(box.value)
            );

        answers[question.id] =
            selected;

    }

    /* -------------------------
       NAT
    -------------------------- */

    else if(question.type === "nat") {

        const value =
            container.querySelector(
                ".nat-input"
            );

        answers[question.id] =
            value.value;

    }

    console.log(
        "Answers",
        answers
    );

}

/* =====================================================
   MATHJAX REFRESH
===================================================== */

function rerenderMathJax() {

    if(
        window.MathJax &&
        window.MathJax.typesetPromise
    ) {

        MathJax.typesetPromise();

    }

}
/* =====================================================
   APP.JS PART 2
   QUESTION NAVIGATION + PALETTE
===================================================== */

/*

Status Values

notVisited
notAnswered
answered
markedForReview
answeredAndMarked

*/

let questionStatus = {};

/* =====================================================
   INITIALIZE STATUS
===================================================== */

function initializeQuestionStatus() {

    sections.forEach(section => {

        section.questions.forEach(question => {

            questionStatus[question.id] =
                "notVisited";

        });

    });

}

/* =====================================================
   UPDATE LOAD EXAM
===================================================== */

/*
Inside loadExam()

AFTER:

buildQuestionList();

ADD:

initializeQuestionStatus();

createPalette();

*/

function createPalette() {

    const palette =
        document.getElementById(
            "paletteGrid"
        );

    palette.innerHTML = "";

    allQuestions.forEach(
        (item, index) => {

            const btn =
                document.createElement(
                    "button"
                );

            btn.className =
                "palette-btn";

            const status =
                questionStatus[
                    item.question.id
                ];

            btn.classList.add(status);

            btn.textContent =
                index + 1;

            btn.onclick = () => {

                jumpToQuestion(index);

            };

            palette.appendChild(btn);

        });

}

/* =====================================================
   REFRESH PALETTE
===================================================== */

function refreshPalette() {

    createPalette();

}

/* =====================================================
   QUESTION INDEX HELPERS
===================================================== */

function getGlobalIndex() {

    let count = 0;

    for(let s=0;s<currentSectionIndex;s++) {

        count +=
            sections[s]
            .questions.length;

    }

    count += currentQuestionIndex;

    return count;

}

/* =====================================================
   JUMP TO QUESTION
===================================================== */

function jumpToQuestion(globalIndex) {

    let running = 0;

    for(let s=0;s<sections.length;s++) {

        const len =
            sections[s]
            .questions.length;

        if(globalIndex < running + len) {

            currentSectionIndex = s;

            currentQuestionIndex =
                globalIndex - running;

            createSectionTabs();

            renderQuestion();

            return;

        }

        running += len;

    }

}

/* =====================================================
   ANSWER CHECK
===================================================== */

function hasAnswer(question) {

    const answer =
        answers[question.id];

    if(question.type === "single") {

        return answer !== null &&
               answer !== undefined;

    }

    if(question.type === "multiple") {

        return Array.isArray(answer)
            &&
            answer.length > 0;

    }

    if(question.type === "nat") {

        return answer !== null
            &&
            answer !== undefined
            &&
            answer !== "";

    }

    return false;

}

/* =====================================================
   STATUS UPDATE
===================================================== */

function updateQuestionStatus(
    question,
    action
) {

    const answered =
        hasAnswer(question);

    if(action === "save") {

        questionStatus[question.id] =
            answered
            ? "answered"
            : "notAnswered";

    }

    else if(action === "review") {

        questionStatus[question.id] =
            answered
            ? "answeredAndMarked"
            : "markedForReview";

    }

    refreshPalette();

}

/* =====================================================
   MARK VISITED
===================================================== */

const originalRenderQuestion =
    renderQuestion;

renderQuestion = function() {

    const question =
        getCurrentQuestion();

    if(
        questionStatus[
            question.id
        ] === "notVisited"
    ) {

        questionStatus[
            question.id
        ] = "notAnswered";

    }

    originalRenderQuestion();

    refreshPalette();

};

/* =====================================================
   NEXT QUESTION
===================================================== */

function nextQuestion() {

    const currentSection =
        sections[
            currentSectionIndex
        ];

    if(
        currentQuestionIndex <
        currentSection.questions.length - 1
    ) {

        currentQuestionIndex++;

    }
    else {

        if(
            currentSectionIndex <
            sections.length - 1
        ) {

            currentSectionIndex++;

            currentQuestionIndex = 0;

        }

    }

    createSectionTabs();

    renderQuestion();

}

/* =====================================================
   PREVIOUS QUESTION
===================================================== */

function previousQuestion() {

    if(currentQuestionIndex > 0) {

        currentQuestionIndex--;

    }
    else {

        if(currentSectionIndex > 0) {

            currentSectionIndex--;

            currentQuestionIndex =
                sections[
                    currentSectionIndex
                ].questions.length - 1;

        }

    }

    createSectionTabs();

    renderQuestion();

}

/* =====================================================
   SAVE & NEXT
===================================================== */

function saveAndNext() {

    const question =
        getCurrentQuestion();

    saveCurrentAnswer();

    updateQuestionStatus(
        question,
        "save"
    );

    nextQuestion();

}

/* =====================================================
   MARK REVIEW
===================================================== */

function markReviewAndNext() {

    const question =
        getCurrentQuestion();

    saveCurrentAnswer();

    updateQuestionStatus(
        question,
        "review"
    );

    nextQuestion();

}

/* =====================================================
   CLEAR RESPONSE
===================================================== */

function clearResponse() {

    const question =
        getCurrentQuestion();

    delete answers[
        question.id
    ];

    questionStatus[
        question.id
    ] = "notAnswered";

    renderQuestion();

    refreshPalette();

}

/* =====================================================
   BUTTON EVENTS
===================================================== */

function initializeButtons() {

    document
        .getElementById(
            "saveNextBtn"
        )
        .addEventListener(
            "click",
            saveAndNext
        );

    document
        .getElementById(
            "reviewBtn"
        )
        .addEventListener(
            "click",
            markReviewAndNext
        );

    document
        .getElementById(
            "clearBtn"
        )
        .addEventListener(
            "click",
            clearResponse
        );

    document
        .getElementById(
            "previousBtn"
        )
        .addEventListener(
            "click",
            previousQuestion
        );

}

/* =====================================================
   UPDATE LOAD EXAM
===================================================== */

/*

Inside loadExam()

after:

createPalette();

ADD:

initializeButtons();

*/

/* =====================================================
   QUESTION COUNT DISPLAY
===================================================== */

function updateQuestionHeading() {

    const globalNo =
        getGlobalIndex() + 1;

    document
        .getElementById(
            "questionNumber"
        )
        .innerText =
        `Question ${globalNo}`;

}

/* =====================================================
   OVERRIDE RENDER
===================================================== */

const oldRenderQuestion =
    renderQuestion;

renderQuestion = function() {

    oldRenderQuestion();

    updateQuestionHeading();

};

/* =====================================================
   APP.JS PART 3
   TIMER + AUTOSAVE + FULLSCREEN
===================================================== */

let remainingTime = 0;
let timerInterval = null;

const STORAGE_KEY =
    "csir_net_exam_state";

/* =====================================================
   TIMER INITIALIZATION
===================================================== */

function initializeTimer() {

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );

    if(saved) {

        const state =
            JSON.parse(saved);

        if(state.remainingTime) {

            remainingTime =
                state.remainingTime;

        }

    }

    if(remainingTime <= 0) {

        remainingTime =
            testData.duration_minutes
            * 60;

    }

    startTimer();

}

/* =====================================================
   START TIMER
===================================================== */

function startTimer() {

    updateTimerDisplay();

    timerInterval =
        setInterval(() => {

            remainingTime--;

            updateTimerDisplay();

            if(remainingTime <= 0) {

                clearInterval(
                    timerInterval
                );

                alert(
                    "Time Over! Test Submitted."
                );

                submitExam();

            }

        }, 1000);

}

/* =====================================================
   TIMER DISPLAY
===================================================== */

function updateTimerDisplay() {

    const hours =
        Math.floor(
            remainingTime / 3600
        );

    const minutes =
        Math.floor(
            (remainingTime % 3600)
            / 60
        );

    const seconds =
        remainingTime % 60;

    const formatted =
        String(hours)
        .padStart(2,'0')
        + ":" +
        String(minutes)
        .padStart(2,'0')
        + ":" +
        String(seconds)
        .padStart(2,'0');

    document
        .getElementById(
            "timer"
        )
        .innerText =
        formatted;

}

/* =====================================================
   SAVE STATE
===================================================== */

function saveExamState() {

    const state = {

        answers,

        questionStatus,

        currentSectionIndex,

        currentQuestionIndex,

        remainingTime

    };

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
    );

}

/* =====================================================
   RESTORE STATE
===================================================== */

function restoreExamState() {

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );

    if(!saved) return;

    try {

        const state =
            JSON.parse(saved);

        answers =
            state.answers || {};

        questionStatus =
            state.questionStatus || {};

        currentSectionIndex =
            state.currentSectionIndex || 0;

        currentQuestionIndex =
            state.currentQuestionIndex || 0;

        remainingTime =
            state.remainingTime || 0;

    }
    catch(error) {

        console.error(
            "Restore Error",
            error
        );

    }

}

/* =====================================================
   AUTOSAVE
===================================================== */

function initializeAutoSave() {

    setInterval(() => {

        saveExamState();

    }, 5000);

}

/* =====================================================
   FULLSCREEN MODE
===================================================== */

async function enterFullscreen() {

    try {

        if(
            document.documentElement
            .requestFullscreen
        ) {

            await document
            .documentElement
            .requestFullscreen();

        }

    }
    catch(error) {

        console.log(
            "Fullscreen blocked"
        );

    }

}

/* =====================================================
   FULLSCREEN WARNING
===================================================== */

function monitorFullscreen() {

    document.addEventListener(
        "fullscreenchange",
        () => {

            if(
                !document.fullscreenElement
            ) {

                alert(
                    "Warning: You exited fullscreen mode."
                );

            }

        }
    );

}

/* =====================================================
   KEYBOARD SHORTCUTS
===================================================== */

function initializeShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            const key =
                event.key.toLowerCase();

            switch(key) {

                case "n":

                    saveAndNext();

                    break;

                case "m":

                    markReviewAndNext();

                    break;

                case "p":

                    previousQuestion();

                    break;

                case "c":

                    clearResponse();

                    break;

                case "s":

                    if(
                        confirm(
                            "Submit Test?"
                        )
                    ) {

                        submitExam();

                    }

                    break;

            }

        }
    );

}

/* =====================================================
   BEFORE UNLOAD SAVE
===================================================== */

window.addEventListener(
    "beforeunload",
    () => {

        saveExamState();

    }
);

/* =====================================================
   UPDATE LOADEXAM
===================================================== */

/*

Inside loadExam()

AFTER

initializeButtons();

ADD

restoreExamState();

initializeTimer();

initializeAutoSave();

initializeShortcuts();

enterFullscreen();

monitorFullscreen();

*/

/* =====================================================
   EXAM SUBMIT BUTTON
===================================================== */

function initializeSubmitButton() {

    document
        .getElementById(
            "submitExam"
        )
        .addEventListener(
            "click",
            () => {

                const ok =
                    confirm(
                        "Are you sure you want to submit?"
                    );

                if(ok) {

                    submitExam();

                }

            }
        );

}

/* =====================================================
   UPDATE LOADEXAM
===================================================== */

/*

ALSO ADD

initializeSubmitButton();

*/

/* =====================================================
   PLACEHOLDER
===================================================== */

function submitExam() {

    alert(
        "Part 4 will generate result page."
    );

}

/* =====================================================
   APP.JS PART 4
   RESULTS + SCORING + REVIEW MODE
===================================================== */

function submitExam() {

    saveCurrentAnswer();

    clearInterval(timerInterval);

    saveExamState();

    generateResults();

}

/* =====================================================
   SCORE QUESTION
===================================================== */

function evaluateQuestion(question) {

    const userAnswer =
        answers[question.id];

    let correct = false;

    if(question.type === "single") {

        correct =
            Number(userAnswer) ===
            Number(question.correct_answer);

    }

    else if(question.type === "multiple") {

        if(Array.isArray(userAnswer)) {

            const a =
                [...userAnswer].sort().join(",");

            const b =
                [...question.correct_answer]
                .sort()
                .join(",");

            correct = a === b;
        }

    }

    else if(question.type === "nat") {

        correct =
            String(userAnswer).trim() ===
            String(question.correct_answer).trim();

    }

    let score = 0;

    if(correct) {

        score =
            question.positive_marks;

    }
    else if(
        userAnswer !== undefined &&
        userAnswer !== null &&
        userAnswer !== "" &&
        !(Array.isArray(userAnswer) &&
          userAnswer.length === 0)
    ) {

        score =
            -(question.negative_marks || 0);

    }

    return {
        correct,
        score
    };

}

/* =====================================================
   GENERATE RESULTS
===================================================== */

function generateResults() {

    let totalScore = 0;
    let totalMarks = 0;

    let correctCount = 0;
    let incorrectCount = 0;
    let unattempted = 0;

    const sectionStats = [];

    sections.forEach(section => {

        let sectionScore = 0;
        let sectionTotal = 0;

        section.questions.forEach(question => {

            totalMarks +=
                question.positive_marks;

            sectionTotal +=
                question.positive_marks;

            const result =
                evaluateQuestion(question);

            totalScore += result.score;
            sectionScore += result.score;

            const answer =
                answers[question.id];

            const attempted =
                answer !== undefined &&
                answer !== null &&
                answer !== "" &&
                !(Array.isArray(answer) &&
                  answer.length === 0);

            if(!attempted) {

                unattempted++;

            }
            else if(result.correct) {

                correctCount++;

            }
            else {

                incorrectCount++;

            }

        });

        sectionStats.push({
            name: section.name,
            score: sectionScore,
            total: sectionTotal
        });

    });

    const attempted =
        correctCount + incorrectCount;

    const percentage =
        ((totalScore / totalMarks) * 100)
        .toFixed(2);

    const accuracy =
        attempted === 0
        ? 0
        : (
            correctCount /
            attempted *
            100
          ).toFixed(2);

    showResults({
        totalScore,
        totalMarks,
        percentage,
        accuracy,
        correctCount,
        incorrectCount,
        unattempted,
        attempted,
        sectionStats
    });

}

/* =====================================================
   SHOW RESULTS
===================================================== */

function showResults(data) {

    document.querySelector(
        ".exam-container"
    ).style.display = "none";

    document.querySelector(
        ".exam-header"
    ).style.display = "none";

    document.getElementById(
        "resultContainer"
    ).style.display = "block";

    document.getElementById(
        "finalScore"
    ).innerText =
        `${data.totalScore} / ${data.totalMarks}`;

    document.getElementById(
        "summaryData"
    ).innerHTML = `
        <p><strong>Percentage:</strong>
        ${data.percentage}%</p>

        <p><strong>Accuracy:</strong>
        ${data.accuracy}%</p>
    `;

    document.getElementById(
        "statistics"
    ).innerHTML = `

        <div class="stat-box">
            Correct<br>
            <strong>${data.correctCount}</strong>
        </div>

        <div class="stat-box">
            Incorrect<br>
            <strong>${data.incorrectCount}</strong>
        </div>

        <div class="stat-box">
            Attempted<br>
            <strong>${data.attempted}</strong>
        </div>

        <div class="stat-box">
            Unattempted<br>
            <strong>${data.unattempted}</strong>
        </div>

    `;

    renderSectionStats(
        data.sectionStats
    );

    renderAnalytics(data);

    renderReviewMode();

    localStorage.removeItem(
        STORAGE_KEY
    );

}

/* =====================================================
   SECTION STATS
===================================================== */

function renderSectionStats(stats) {

    const container =
        document.getElementById(
            "sectionPerformance"
        );

    container.innerHTML = "";

    stats.forEach(section => {

        container.innerHTML += `
            <div class="stat-box">
                <strong>
                    ${section.name}
                </strong><br>

                ${section.score}
                /
                ${section.total}
            </div>
        `;

    });

}

/* =====================================================
   ANALYTICS
===================================================== */

function renderAnalytics(data) {

    const container =
        document.getElementById(
            "analyticsContainer"
        );

    const attemptPercent =
        (
            data.attempted /
            (data.attempted +
             data.unattempted)
            * 100
        ).toFixed(1);

    container.innerHTML = `

        <h3>
            Attempt Rate
        </h3>

        <div class="bar-chart">

            <div
                class="bar-fill"
                style="
                width:${attemptPercent}%"
            >
            </div>

        </div>

        <p>
            ${attemptPercent}%
            Questions Attempted
        </p>

    `;

}

/* =====================================================
   REVIEW MODE
===================================================== */

function renderReviewMode() {

    const container =
        document.getElementById(
            "reviewContainer"
        );

    container.innerHTML = "";

    sections.forEach(section => {

        section.questions.forEach(
            question => {

                const userAnswer =
                    answers[question.id];

                const result =
                    evaluateQuestion(
                        question
                    );

                const div =
                    document.createElement(
                        "div"
                    );

                div.className =
                    "review-question";

                div.innerHTML = `

                    <h4>
                        Question
                        ${question.id}
                    </h4>

                    <p>
                        ${question.text}
                    </p>

                    <br>

                    <p class="user-answer">

                        Your Answer:
                        ${JSON.stringify(
                            userAnswer
                        )}

                    </p>

                    <p class="correct-answer">

                        Correct Answer:
                        ${JSON.stringify(
                            question.correct_answer
                        )}

                    </p>

                    <p class="${
                        result.correct
                        ? "correct-answer"
                        : "wrong-answer"
                    }">

                        ${
                            result.correct
                            ? "Correct"
                            : "Incorrect"
                        }

                    </p>

                    <div class="explanation">

                        Explanation:
                        Add solution here.

                    </div>

                `;

                container.appendChild(
                    div
                );

            }
        );
// Re-render MathJax in review page
    if (window.MathJax) {
        MathJax.typesetPromise();
    });

}
