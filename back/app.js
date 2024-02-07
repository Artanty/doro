const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/status', (request, response) => response.json({clients: clients.length}));

const PORT = 3000;

let clients = [];
let facts = [];
let state = {}
let timerId
let counter = 0
let timersConfig = []
let loops = 1
let allWorkTime= 0
let allRestTime = 0
let isPaused = false
app.listen(PORT, () => {
    console.log(`Events service listening at http://localhost:${PORT}`)
})

function eventsHandler(request, response, next) {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);
    const clientId = Date.now();
    const data = `data: ${JSON.stringify({
        clientId: String(clientId), 
        state: state,
    })}\n\n`;
    response.write(`id: clientId\n\n`)
    response.write(`data: ${JSON.stringify({clientId: String(clientId), state: state})}\n\n`)

    const newClient = {
        id: clientId,
        response
    };

    clients.push(newClient);

    request.on('close', () => {
        console.log(`${clientId} Connection closed`);
        clients = clients.filter(client => client.id !== clientId);
    });
}

app.get('/events', eventsHandler);

/**
 * {
 *     "sessionId": 1,
 *     "sessionLength": 25,
 *     "sessionRestLength": 5,
 *     "sessionName": "work"
 * }
 */
function getTimerConfig (sessionId) {
    return timersConfig.find(e => e.sessionId === sessionId)
}
function getTimerLength (sessionId) {
    return minutesToSeconds(getTimerConfig(sessionId)?.sessionLength)
}
function getRestLength (sessionId) {
    return minutesToSeconds(getTimerConfig(sessionId)?.sessionRestLength)
}
function getIsPaused () {
    return isPaused
}

async function setState(request, response) {
    const { action, sessionId } = request.body;
    state = { ...getTimerConfig(sessionId), action: action }
    if (action === 'tick') {
        timerId = setInterval(() => {
            if (getTimerLength(sessionId) < counter) {
                interruptToRest()
            } else {
                const data = {
                    timePassed: counter,
                    sessionId: sessionId,
                    action: action,
                    loops: loops,
                    allRestTime: allRestTime,
                    allWorkTime: allWorkTime
                }
                clients.forEach(client => {
                    client.response.write(`data: ${JSON.stringify(data)}\n\n`)
                    client.response.write(`id: ${action}\n\n`)
                })
                counter += 1;
                allWorkTime += 1
            }
        }, 1000);
    }
    if (action === 'reset') {
        clearInterval(timerId)
        timerId = null
        counter = 0
        loops = 0
        const data = {
            timePassed: 0,
            timeAll: 0,
            action: action
        }
        clients.forEach(client => {
            client.response.write(`data: ${JSON.stringify(data)}\n\n`)
            client.response.write(`id: ${action}\n\n`)
        })
    }
    if (action === 'pause') {
        isPaused = true
        clearInterval(timerId)
        timerId = null
        const data = {
            action: action
        }
        /**
         * Вместо этого добавить геттер доп условия к getTimerLength
         * и если это условие есть, то на следующем тике отправлять экшн паузы
         */
        clients.forEach(client => {
            client.response.write(`data: ${JSON.stringify(data)}\n\n`)
        })
        setTimeout(() => {
            isPaused = false
        }, 1000)
    }
    if (action === 'switch') {
        clearInterval(timerId)
        timerId = null
        counter = 0
        timerId = setInterval(() => {
            // sendTickMessageToAll({ ...state, timePassed: counter})
            const data = {
                // timePassed: counter,
                // timeAll: newState.timeAll,
                // action: newState.action
            }
            clients.forEach(client => {
                client.response.write(`data: ${JSON.stringify(data)}\n\n`)
                client.response.write(`id: ${action}\n\n`)
            })
            counter += 1;
        }, 1000);
    }
    if (action === 'restTick') {
        clearInterval(timerId)
        timerId = null
        counter = 0
        timerId = setInterval(() => {
            if (getRestLength(sessionId) < counter) {
                interruptToSession()
            } else {

                const data = {
                    timePassed: counter,
                    sessionId: sessionId,
                    action: action,
                    loops: loops,
                    allRestTime: allRestTime,
                    allWorkTime: allWorkTime
                }
                clients.forEach(client => {
                    client.response.write(`data: ${JSON.stringify(data)}\n\n`)
                    client.response.write(`id: ${action}\n\n`)
                })
                counter += 1;
                allRestTime += 1
            }
        }, 1000);
    }
    if (action === 'forceInterruptToRest') {
        interruptToRest()
    }
    if (action === 'forceInterruptToWork') {
        interruptToSession()
    }
    response.json({ status: 'ok' })
}

app.post('/action', setState);

function interruptToRest () {
    console.log('triggererd')
    clearInterval(timerId)
    timerId = null
    counter = 0
    const data = {
        sessionId: state.sessionId,
        action: 'interruptToRest',

    }
    clients.forEach(client => {
        client.response.write(`data: ${JSON.stringify(data)}\n\n`)
        client.response.write(`id: ${this.name}\n\n`)
    })
}

function interruptToSession () {
    allRestTime = counter
    clearInterval(timerId)
    timerId = null
    counter = 0
    loops += 1
    const data = {
        sessionId: state.sessionId,
        action: 'interruptToSession'
    }
    clients.forEach(client => {
        client.response.write(`data: ${JSON.stringify(data)}\n\n`)
        client.response.write(`id: ${this.name}\n\n`)
    })
}

app.get('/facts', (request, response) => response.json({facts: facts.length}));
function shareTimersConfig (request,response) {
    const config = initTimersConfig()
    clients.forEach(client => {
        client.response.write(`id: timersConfig\n\n`)
        client.response.write(`data: ${JSON.stringify({ action: 'timersConfig', data: config})}\n\n`)
    })
    return response.json({ status: 'ok' })
}
app.post('/getTimersConfig', shareTimersConfig);
function setTimersConfig (request, response) {
    timersConfig = request.body
    clients.forEach(client => {
        client.response.write(`id: timersConfig\n\n`)
        client.response.write(`data: ${JSON.stringify({ action: 'timersConfig', data: timersConfig})}\n\n`)

    })
    return response.json({ status: 'ok' })
}
app.post('/setTimersConfig', setTimersConfig);



function initTimersConfig () {
    let config =
        {
            sessionId: 1,
            sessionLength: 25,
            sessionRestLength: 5,
            sessionName: 'work'
        }
    timersConfig = config
    return [config]
}

function minutesToSeconds (minutes) {
    return minutes * 60
}



