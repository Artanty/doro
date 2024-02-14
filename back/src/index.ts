import express, {
    Express,
    Request,
    Response,
    Application,
    NextFunction
} from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'

import Router from "./routes";
import swaggerUi from "swagger-ui-express";
import {ITimerConfig} from "./controllers/timersConfig";
import { ValidateError } from 'tsoa'
import {makeRangeIterator} from "./utils";
// import { Schedule } from './models/Schedule';

import {
    checkDbConnection,
    Database,
    // sequelize,
} from './core/dbConnect'

import { Sequelize, Op, Model, DataTypes } from '@sequelize/core';
import {mergeObjects} from "./utils/mergeObjects";
import {getModels} from "./models/_getModels";
import StatusController from "./controllers/status";
import router from "./routes";
import TestController from "./controllers/test";
import ScheduleConfigController from "./controllers/scheduleConfigController";
import ScheduleEventController from "./controllers/scheduleEvent";
import ScheduleController from "./controllers/schedule";
import {activateScheduleConfig} from "./dbActions/activateScheduleConfig";
import { VariableWatcher } from './utils/variableWather';
import ClientController from "./controllers/clientController";

// import {rr} from "./dbActions/saveState";
const app: Application  = express();
// connection;

Database.getInstance({models: getModels()})

checkDbConnection().then( async (sequelizeInstance: any) => {
    console.log(Database.getInstance().models)
    // console.log(sequelizeInstance instanceof Sequelize)
    // setTimeout(() => {
    //     createScheduleConfigTable(sequelizeInstance)
    // }, 1000)
    // rr()
    // await Schedule.sync({ force: true });
    // console.log('The table for the User model was just (re)created!');
})


// console.log('new')



export const getNextEventId = makeRangeIterator()

app.get("/ping", async (_req, res) => {
    res.send({
        message: "hello",
    });
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
        swaggerOptions: {
            url: "/swagger.json",
        },
        customJs: "/swagger.js",
        customCssUrl: "/swagger.css"
    })
);
// app.use(function notFoundHandler(_req, res: Response) {
//     res.status(404).send({
//         message: "Not Found",
//     });
// });
app.use(function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
): Response | void {
    if (err instanceof ValidateError) {
        console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
        return res.status(422).json({
            message: "Validation Failed",
            details: err?.fields,
        });
    }
    if (err instanceof Error) {
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }

    next();
});

app.use(Router);
app.use(bodyParser.urlencoded({extended: false}));

const PORT = 3000;

let clients: any[] = [];
let facts = [];
let state = { sessionId: 0 }
let timerId: any
let counter = 0
let timersConfig: any[] = []
let loops = 1
let allWorkTime= 0
let allRestTime = 0
let isPaused = false




export function getCounter() {
    return counter
}
export function setCounter(count: number) {
    counter = count
}
export function getTimerId() {
    return timerId
}

export function setTimerId (newTimerId: any) {
    timerId = newTimerId
}
app.listen(PORT, () => {
    console.log(`Events service listening at http://localhost:${PORT}`)
})



export function getState () {
    return state
}
export function addClient (newClient: any) {
    clients.push(newClient);
}

export function removeClient (clientId: any) {
    // console.log(`${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
    ClientController.stopScheduleEventIfNoClients()
}


// app.get('/events', eventsHandler);

/**
 * {
 *     "sessionId": 1,
 *     "sessionLength": 25,
 *     "sessionRestLength": 5,
 *     "sessionName": "work"
 * }
 */
function getTimerConfig (sessionId: number) {
    return timersConfig.find(e => e.sessionId === sessionId)
}
function getTimerLength (sessionId: number) {
    return minutesToSeconds(getTimerConfig(sessionId)?.sessionLength)
}
function getRestLength (sessionId: number) {
    return minutesToSeconds(getTimerConfig(sessionId)?.sessionRestLength)
}
function getIsPaused () {
    return isPaused
}

export async function setState(request: Request, response: Response) {
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
                    client.response.write(`id: ${getNextEventId.next().value}\n\n`)
                    client.response.write(`data: ${JSON.stringify(data)}\n\n`)
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
            client.response.write(`id: ${getNextEventId.next().value}\n\n`)
            client.response.write(`data: ${JSON.stringify(data)}\n\n`)
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
            client.response.write(`id: ${getNextEventId.next().value}\n\n`)
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
                client.response.write(`id: ${getNextEventId.next().value}\n\n`)
                client.response.write(`data: ${JSON.stringify(data)}\n\n`)
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
                    client.response.write(`id: ${getNextEventId.next().value}\n\n`)
                    client.response.write(`data: ${JSON.stringify(data)}\n\n`)
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

// app.post('/action', setState);

function interruptToRest () {
    console.log('triggered')
    clearInterval(timerId)
    timerId = null
    counter = 0
    const data = {
        sessionId: state.sessionId,
        action: 'interruptToRest',

    }
    clients.forEach(client => {
        client.response.write(`id: ${getNextEventId.next().value}\n\n`)
        client.response.write(`data: ${JSON.stringify(data)}\n\n`)
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
        client.response.write(`id: ${getNextEventId.next().value}\n\n`)
        client.response.write(`data: ${JSON.stringify(data)}\n\n`)
    })
}

app.get('/facts', (request, response) => response.json({facts: facts.length}));
function shareTimersConfig (request: Request, response: Response) {
    const config = initTimersConfig()
    clients.forEach(client => {
        client.response.write(`id: ${getNextEventId.next().value}\n\n`)
        client.response.write(`data: ${JSON.stringify({ action: 'timersConfig', data: config})}\n\n`)

    })
    return response.json({ status: 'ok' })
}

// app.post('/getTimersConfig', shareTimersConfig);
app.post('/getTimersConfig', () => {});

app.post("/getScheduleConfig", async (_req, res) => {
    const controller = new ScheduleConfigController()
    const response = await controller.getScheduleConfig();
    return res.send(response);
});
app.post("/getSchedule", async (_req, res) => {
    const controller = new ScheduleController()
    const response = await controller.getSchedule(_req.body.id);
    return res.send(response);
});
app.post("/getScheduleEvents", async (_req, res) => {
    const controller = new ScheduleEventController()
    const response = await controller.getScheduleEventByScheduleId(_req.body.id);
    return res.send(response);
});



export function getClients () {
    return clients
}

export function setTimersConfig (request: Request, response: Response) {
    timersConfig = request.body
    clients.forEach(client => {
        client.response.write(`id: ${getNextEventId.next().value}\n\n`)
        client.response.write(`data: ${JSON.stringify({ action: 'timersConfig', data: timersConfig})}\n\n`)
    })
    return response.json({ status: 'ok' })
}
// app.post('/setTimersConfig', setTimersConfig);
export function setTimersConfig2 (timersConfig: ITimerConfig[]) {
    // getOrCreateScheduleConfig().then((res: any) => {
    //     console.log(res)
    // })
    clients.forEach(client => {
        client.response.write(`id: timersConfig\n\n`)
        client.response.write(`data: ${JSON.stringify({ action: 'timersConfig', data: timersConfig})}\n\n`)

    })
}
function initTimersConfig () {
    let config =
        {
            sessionId: 1,
            sessionLength: 25,
            sessionRestLength: 5,
            sessionName: 'work'
        }
    timersConfig = [config]
    return [config]
}

function minutesToSeconds (minutes: number) {
    return minutes * 60
}

app.get("/test", async (_req, res) => {
    const testCase = _req.query.case ?? '1'
    const controller = new TestController(testCase);
    const response = await controller.handle();
    return res.send(response);
});

app.post('/scheduleConfig/:action',async (req, res) => {
    const action = req.params.action;
    const controller = new ScheduleConfigController()
    let response = null

    if (action === 'activate') {
        response = await controller.activateScheduleConfig(req.body.scheduleConfigId)
    }
    if (action === 'playEvent') {
        response = await controller.playScheduleEvent(req.body.scheduleConfigId, req.body.scheduleEventId, req.body.scheduleId)
    }
    if (action === 'pauseEvent') {
        response = await controller.pauseScheduleEvent(req.body.scheduleConfigId, req.body.scheduleEventId, req.body.scheduleId)
    }
    if (action === 'resumeEvent') {
        response = await controller.resumeScheduleEvent(req.body.scheduleConfigId, req.body.scheduleEventId, req.body.scheduleId)
    }
    if (action === 'stopEvent') {
        response = await controller.stopScheduleEvent(req.body.scheduleConfigId, req.body.scheduleEventId, req.body.scheduleId)
    }
    if (action === 'changePlayingEvent') {
        response = await controller.changePlayingEvent(req.body.scheduleConfigId, req.body.scheduleEventId, req.body.scheduleId)
    }
    return res.send(response);
})

app.post('/scheduleEvent/:action',async (req, res) => {
    const action = req.params.action;
    const controller = new ScheduleEventController()
    let response = null

    if (action === 'create') {
        response = await controller.createScheduleEvent(req.body)
    }

    return res.send(response);
})




