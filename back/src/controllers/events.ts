import {
    addClient,
    getClients,
    getNextEventId,
    getState,
    removeClient,
} from "../index";

import {
    Example,
    Get,
    Response,
    Route,
    SuccessResponse
} from "tsoa";
import * as e from "express";

import { getActiveScheduleConfig } from "../dbActions/getActiveScheduleConfig";
import { dd } from "../utils";
import { log, logError } from "../utils/Logger";

export interface IEventState {
    "sessionId": number,
    "sessionLength"?: number,
    "sessionRestLength"?: number,
    "sessionName"?: string
    "action"?: string
}
export interface IEventClient {
    clientId: string
    state: IEventState
}

export interface IEventTimersConfigData {
    "sessionId": number
    "sessionLength": number
    "sessionRestLength": number
    "sessionName": string
}
export interface IEventTimersConfig {
    action: string,
    data: IEventTimersConfigData[]
}
export interface IEventTick {
    action: string,
    timePassed: number,
    sessionId: number,
    loops: number,
    allRestTime: number,
    allWorkTime: number
}
export interface IEventAction {
    action: string,
}

@Route("events")
export default class EventsController {
    constructor(
        private readonly request: e.Request,
        private readonly response: e.Response
    ) {}

    public async handleEvents(): Promise<any> {
        try {
            eventsHandler(this.request, this.response)
        } catch (err) {
            logError(err)
            throw new Error(JSON.stringify(err))
            // response.send({ status: 'err' });
            
        }
    }

    private async checkUserToken(): Promise<any> {
        // const token = req.query.token;

    
    }
}

export async function eventsHandler(request: e.Request, response: e.Response) {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
    };
    const scheduleConfig = await getActiveScheduleConfig()
    
    dd('отправляем клиенту, который подключился последний активный конфиг, id: ' + scheduleConfig.id)
    console.log(getClients())
    log(getClients())
    response.writeHead(200, headers);
    const clientId = Date.now();
    response.write(`id: ${getNextEventId.next().value}\n\n`)
    response.write(`data: ${JSON.stringify({ 
        clientId: String(clientId), 
        hash: scheduleConfig.hash + '__' + scheduleConfig.scheduleHash + '__' + scheduleConfig.scheduleEventsHash 
    })}\n\n`)

    const newClient = {
        id: clientId,
        response
    };

    addClient(newClient);

    request.on('close', () => {
        removeClient(clientId)
    });
}
