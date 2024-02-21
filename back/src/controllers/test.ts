import {
    Get,
    Route
} from "tsoa";
import {
    getClients,
    getCounter
} from "../index";
import {test} from "../dbActions/test";
import ScheduleEventController from "./scheduleEvent";
import ScheduleConfigController from "./scheduleConfigController";

@Route("test")
export default class TestController {
    private testCase: any;

    constructor(testCase: any) {
        this.testCase = testCase;
    }

    @Get("/")
    public async handle(): Promise<any> {
        if (this.testCase === '5') {
            return {getCounter: getCounter()}
        } else if (this.testCase === '2') {
            const res = await ScheduleConfigController.stopEventAndGetNext()
            console.log('res: ')
            console.log(res)
            return res
        } else {
            return test(this.testCase)
        }
    }
}
