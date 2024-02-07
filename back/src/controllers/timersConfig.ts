import {
    Post,
    Get,
    Route,
    Body,
    Query,
    Path,
    Example,
    SuccessResponse
} from "tsoa";
import {
    setTimersConfig2
} from "../index";


export interface ITimerConfig {
    sessionId:number
    sessionLength: number
    sessionRestLength:number
    sessionName: string
}

export interface IBaseResponse {
    status: string
}

@Route("setTimersConfig2")
export default class SetTimersConfigController {
    /**
     * Принять конфиги таймеров, чтобы сохранить их на сервере и отправить всем клиентам.
     */
    @Example<IBaseResponse>({
        status: "ok",
    })
    @Example<IBaseResponse>({
        status: "err",
    })
    
    @Post()
    public async setTimersConfig(
        @Body() request: ITimerConfig[]
    ): Promise<any> {
        try {
            setTimersConfig2(request)
            return { status: 'ok' }
        } catch (err) {
            return { status: 'err' }
        }
    }
}
