import {
    Get,
    Post,
    Route
} from "tsoa";
import {
    getClients,
    getCounter,
    getNextEventId,
    getTimerId,
    setCounter,
    setState,
    setTimerId
} from "../index";
import * as e from "express";
import {
    Request,
    Response
} from "express";
import {ScheduleConfig} from "../models/ScheduleConfig";
import {ScheduleEvent} from "../models/ScheduleEvent";
import {differenceInSeconds} from "date-fns";
import ScheduleEventController from "./scheduleEvent";
import ScheduleConfigController from "./scheduleConfigController";
// import {IEndEventSseResponse} from "../../../contracts/endEventSseResponse";


export default class CounterActionController {
    /**
     * Какие данные нужны для тика?
     * - длительность таймера
     * - сколько прошло секунд
     * - хэш настроек
     *
     * - объекты всех подключенных пользователей
     * */

    public static async handleCounterAction(
            counterAction: string,
            scheduleConfig: ScheduleConfig, 
            scheduleEvent?: ScheduleEvent, 
        ) {
        const clients = getClients()

        if (counterAction === 'tick') {
            // this.resetTimerIdAndCounter() // сделать, когда будет сохранение промежуточного стейта таймера в бд
            setCounter(scheduleConfig.counterTimePassed)
            const timerId = setInterval(() => {
                let counter = getCounter()
                if (this.getCounterLength(scheduleEvent as any) < counter) {
                    console.log('tick interruptToRest()')
                    this.endCurrentEvent()
                } else {
                    const data = {
                        timePassed: counter,
                        action: counterAction,
                        hash: scheduleConfig.hash + '__' + scheduleConfig.scheduleHash + '__' + scheduleConfig.scheduleEventsHash
                    }
                    const clients = getClients()
                    clients.forEach(client => {
                        client.response.write(`id: ${getNextEventId.next().value}\n\n`)
                        client.response.write(`data: ${JSON.stringify(data)}\n\n`)
                    })
                    counter += 1;
                    setCounter(counter)
                }
            }, 1000);
            setTimerId(timerId)
        }
        if (counterAction === 'pause') {
            this.resetTimerIdAndCounter()
            const data = {
                timePassed: scheduleConfig.counterTimePassed,
                action: counterAction,
                hash: scheduleConfig.hash + '__' + scheduleConfig.scheduleHash + '__' + scheduleConfig.scheduleEventsHash
            }
            clients.forEach(client => {
                client.response.write(`id: ${getNextEventId.next().value}\n\n`)
                client.response.write(`data: ${JSON.stringify(data)}\n\n`)
            })
        }
        if (counterAction === 'stop') {
            this.resetTimerIdAndCounter()
            const data = {
                action: 'reset',
                hash: scheduleConfig.hash + '__' + scheduleConfig.scheduleHash + '__' + scheduleConfig.scheduleEventsHash
            }
            clients.forEach(client => {
                client.response.write(`id: ${getNextEventId.next().value}\n\n`)
                client.response.write(`data: ${JSON.stringify(data)}\n\n`)
            })
        }
        if (counterAction === 'changePlayingEvent') {
            this.resetTimerIdAndCounter()
            const timerId = setInterval(() => {
                let counter = getCounter()
                if (this.getCounterLength(scheduleEvent as any) < counter) {
                    console.log('changePlayingEvent interruptToRest()')
                    this.endCurrentEvent()
                } else {
                    const data = {
                        timePassed: counter,
                        action: 'tick',
                        hash: scheduleConfig.hash + '__' + scheduleConfig.scheduleHash + '__' + scheduleConfig.scheduleEventsHash
                    }
                    const clients = getClients()
                    clients.forEach(client => {
                        client.response.write(`id: ${getNextEventId.next().value}\n\n`)
                        client.response.write(`data: ${JSON.stringify(data)}\n\n`)
                    })
                    counter += 1;
                    setCounter(counter)
                }
            }, 1000);
            setTimerId(timerId)
        }
    }

    static getCounterLength (scheduleEvent: ScheduleEvent) {
        return this.getDiffInSeconds(scheduleEvent.timeFrom, scheduleEvent.timeTo)
    }

    static getDiffInSeconds (date1: string, date2: string) {
        return Math.abs(differenceInSeconds(new Date(date1), new Date(date2)))
    }

    static resetTimerIdAndCounter () {
        let timerId = getTimerId()
        clearInterval(timerId)
        timerId = null
        setTimerId(timerId)
        setCounter(0)
    }

    static async endCurrentEvent () {
        this.resetTimerIdAndCounter()
        const {
            endedEvent,
            nextEvent,
            schedule_id,
            updatedConfig
        } = await ScheduleConfigController.stopEventAndGetNext() as any
        const scheduleConfig = updatedConfig
        const data: any = {
            endedEvent,
            nextEvent,
            schedule_id,
            action: 'eventEnd',
            nextAction: 'suggestNext',
            hash: scheduleConfig.hash + '__' + scheduleConfig.scheduleHash + '__' + scheduleConfig.scheduleEventsHash
        }
        const clients = getClients()
        clients.forEach(client => {
            client.response.write(`id: ${getNextEventId.next().value}\n\n`)
            client.response.write(`data: ${JSON.stringify(data)}\n\n`)
        })
    }
    
    static async broadcastConfig (scheduleConfig: ScheduleConfig, resetTimer?: boolean) {
        if (resetTimer) {
            this.resetTimerIdAndCounter()
        }
        const data = {
            action: 'config',
            hash: scheduleConfig.hash + '__' + scheduleConfig.scheduleHash + '__' + scheduleConfig.scheduleEventsHash
        }
        const clients = getClients()
        clients.forEach(client => {
            client.response.write(`id: ${getNextEventId.next().value}\n\n`)
            client.response.write(`data: ${JSON.stringify(data)}\n\n`)
        })
    }
}

