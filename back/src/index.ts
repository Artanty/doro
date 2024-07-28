import express, {
    Request,
    Response,
    Application,
    NextFunction
} from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { ValidateError } from 'tsoa'
import {dd, makeRangeIterator} from "./utils";
import {Database} from './core/dbConnect'
import {getModels} from "./models/_getModels";
import router, { collectRoutes } from "./routes";
import ClientController from "./controllers/clientController";

import DbConnectionController from './controllers/dbConnection';
import { log } from './utils/Logger';
import { CORE_BADGE } from './core/constants';


const app: Application = express();
  
Database.getInstance({models: getModels()})
DbConnectionController.getDbConnection()

export const getNextEventId = makeRangeIterator()

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

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

app.use(router);

collectRoutes(app)
app.use(bodyParser.urlencoded({extended: false}));

const PORT = process.env.PORT || 3000;

let clients: any[] = [];
let state = { sessionId: 0 }
let timerId: any
let counter = 0

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
    log(`Node.js started at http://localhost:${PORT}`, { badge: CORE_BADGE })
})

export function getState () {
    return state
}
export function addClient (newClient: any) {
    clients.push(newClient);
}

export function removeClient (clientId: any) {
    clients = clients.filter(client => client.id !== clientId);
    ClientController.stopScheduleEventIfNoClients()
}

let isBusy = false

export function setBusy(val: boolean) {
    isBusy = val
}
export function getBusy () {
    return isBusy
}

export function getClients () {
    return clients
}