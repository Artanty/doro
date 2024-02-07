import {
    addClient,
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

import {ScheduleConfig} from "../models/ScheduleConfig";
import {saveDefaultScheduleConfig} from "../dbActions/saveDefaultScheduleConfig";
import {getLatestScheduleConfig} from "../dbActions/getLatestScheduleConfig";
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
            // response.send({ status: 'err' });
        }
    }
    // @Get("/")
    // public async handleEvents(): Promise<any> {
    //     return {
    //         message: "hello",
    //     };
    // }
}

export function eventsHandler(request: e.Request, response: e.Response) {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };

    response.writeHead(200, headers);
    const clientId = Date.now();
    response.write(`id: ${getNextEventId.next().value}\n\n`)
    // response.write(`data: ${JSON.stringify({clientId: String(clientId), state: getState()})}\n\n`)
    response.write(`data: ${JSON.stringify({ clientId: String(clientId), nextAction: ['getScheduleConfig','getSchedule','getScheduleEvents']})}\n\n`)

    const newClient = {
        id: clientId,
        response
    };
    // getOrCreateScheduleConfig().then((res: any) => {
    //     console.log(res)
    //     response.write(`id: ${getNextEventId.next().value}\n\n`)
    //     response.write(`data: ${JSON.stringify(res)}\n\n`)
    // })

    addClient(newClient);

    request.on('close', () => {
        removeClient(clientId)
    });
}
