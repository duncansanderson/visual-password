const enableWebcamButton = document.getElementById('enable-cam');
const lockStatus = document.querySelector('.status');
const constraints = { video: true, audio: false };
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const objects = [
    {
        name: 'fork',
        src: './assets/fork.png',
    },
    {
        name: 'keyboard',
        src: './assets/keyboard.png',
    },
    {
        name: 'frisbee',
        src: './assets/frisbee.png',
    },
];
let currentObject = 0;
let cameraOn = false;
let stream = null;
let isLoaded = false;

// Shuffle password array to randomise the password;
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Generate random password and add to page.
function generatePassword(objects) {
    const password = shuffle(objects);
    const container = document.getElementById('password');
    container.innerHTML = '';

    password.forEach((object) => {
        const imgDiv = document.createElement('div');

        imgDiv.classList.add('image');
        const img = document.createElement('img');
        img.src = object.src;
        img.alt = object.name;

        imgDiv.appendChild(img);
        container.appendChild(imgDiv);
    });

    return password;
}

const password = generatePassword(objects);

function drawImage(predictions, video) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.font = '12px arial';

    predictions.forEach((prediction) => {
        ctx.beginPath();
        ctx.rect(...prediction.bbox);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'green';
        ctx.fillStyle = 'white';
        ctx.stroke();
        ctx.fillText(`${prediction.class} (${prediction.score.toFixed(3)})`, prediction.bbox[0], prediction.bbox[1]);
    });
}

// Detect object in video using Tensorflow.js
function detectObjects(model, video) {
    model.detect(video).then(predictions => {
        // Show unlocked message when user completed password.
        if (currentObject === password.length) {
            lockStatus.innerHTML = 'UNLOCKED';
            lockStatus.classList.remove('status--locked');
            lockStatus.classList.add('status--unlocked');
        } else {

            const match = predictions.find(p => password[currentObject].name === p.class)
            if (match) {
                currentObject++;
                document.querySelector(`[alt=${match.class}]`).parentNode.classList.add('found');
            }
            // document.getElementById('current-predictions').innerText = JSON.stringify(predictions, null, 2);
        }

        drawImage(predictions, video);
    });

    window.requestAnimationFrame(() => detectObjects(model, video));   
}

async function getMedia(constraints) {
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (stream) {
            // const video = document.createElement('video');
            const video = document.getElementById('webcam');
            video.srcObject = stream;

            video.addEventListener('loadeddata', () => {
                window.cocoSsd.load()
                    .then(model => detectObjects(model, video));
            });
        }
    } catch (err) {
        console.error(`Stream error ${err}`);
    }
}

enableWebcamButton.addEventListener('click', () => getMedia(constraints));
