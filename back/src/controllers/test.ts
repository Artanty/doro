import {
    Get,
    Route
} from "tsoa";
import {
    getClients,
    getCounter
} from "../index";
import {test} from "../dbActions/test";

@Route("test")
export default class TestController {
    private testCase: any;

    constructor(testCase: any) {
        this.testCase = testCase;
    }

    @Get("/")
    public async handle(): Promise<any> {
        if (this.testCase === '5'){
           return { getCounter: getCounter() }
        } else {
            return test(this.testCase)
        }
    }
}