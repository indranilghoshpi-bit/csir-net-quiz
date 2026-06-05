let questions = [];

let current = 0;

let score = 0;

let username = "";

let timeLeft = 1800;

let timerId;

async function loadQuestions(){

    try{

        const response =
        await fetch("questions.json");

        questions =
        await response.json();

        shuffle(questions);

    }

    catch(error){

        alert(
        "Cannot load questions.json"
        );

    }
}

function login(){

    username =
    document.getElementById(
    "username"
    ).value.trim();

    if(username===""){

        alert(
        "Enter your name"
        );

        return;
    }

    document.getElementById(
    "loginPage"
    ).hidden = true;

    document.getElementById(
    "quizPage"
    ).hidden = false;

    document.getElementById(
    "user"
    ).innerText =
    username;

    startQuiz();
}

async function startQuiz(){

    await loadQuestions();

    startTimer();

    showQuestion();
}

function showQuestion(){

    let q = questions[current];

    document.getElementById(
    "question"
    ).innerText =
    `${current+1}. ${q.question}`;

    let html = "";

    if(q.type==="MCQ"){

        q.options.forEach(
        (option,index)=>{

            html += `
            <label class="option">
            <input type="radio"
            name="answer"
            value="${index}">
            ${option}
            </label>`;
        });

    }

    else{

        q.options.forEach(
        (option,index)=>{

            html += `
            <label class="option">
            <input type="checkbox"
            value="${index}">
            ${option}
            </label>`;
        });

    }

    document.getElementById(
    "options"
    ).innerHTML = html;
}

function nextQuestion(){

    evaluate();

    current++;

    if(current >= questions.length){

        finishQuiz();

        return;
    }

let percent =
((current)/questions.length)*100;

document.getElementById(
"progressBar"
).style.width =
percent + "%";
}

function evaluate(){

    let q =
    questions[current];

    let selected=[];

    if(q.type==="MCQ"){

        let choice =
        document.querySelector(
        "input[name='answer']:checked"
        );

        if(choice){

            selected.push(
            parseInt(choice.value)
            );
        }
    }

    else{

        document
        .querySelectorAll(
        "#options input:checked"
        )
        .forEach(item=>{

            selected.push(
            parseInt(item.value)
            );

        });
    }

    if(selected.length===0){

        return;
    }

    selected.sort();

    let answer =
    [...q.answer];

    answer.sort();

    if(
      JSON.stringify(selected)
      ===
      JSON.stringify(answer)
    ){

        score += 4;
    }

    else{

        score -= 1;
    }
}

function finishQuiz(){

    clearInterval(timerId);

    localStorage.setItem(
    username,
    score
    );

    let board="";

    for(
        let i=0;
        i<localStorage.length;
        i++
    ){

        let key =
        localStorage.key(i);

        let value =
        localStorage.getItem(key);

        if(!isNaN(value)){

            board +=
            `<p>${key}: ${value}</p>`;
        }
    }

    document.body.innerHTML =
    `
    <h1>Quiz Finished</h1>

    <h2>Score: ${score}</h2>

    <h3>Leaderboard</h3>

    ${board}
    `;
}

function startTimer(){

    timerId =
    setInterval(()=>{

        timeLeft--;

        let min =
        Math.floor(
        timeLeft/60
        );

        let sec =
        timeLeft%60;

        document
        .getElementById(
        "timer"
        ).innerText =
        `${min}:${sec
        .toString()
        .padStart(2,'0')}`;

        if(timeLeft<=0){

            finishQuiz();
        }

    },1000);
}

function shuffle(arr){

    for(
        let i=
        arr.length-1;
        i>0;
        i--
    ){

        let j=
        Math.floor(
        Math.random()*(i+1)
        );

        [arr[i],arr[j]]
        =
        [arr[j],arr[i]];
    }
}

function toggleDark(){

    document.body
    .classList
    .toggle("dark");
}
