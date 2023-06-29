import axios, { AxiosRequestConfig } from "axios";
import { AsyncLogModel } from '../../worker/src/lib/models/AsyncLog';

export class HeliconeLogger {
    private heliconeUrl: string;
    constructor(heliconeUrl: string){
        this.heliconeUrl = heliconeUrl;
    }

    async log(asyncLogModel: AsyncLogModel): Promise<void> {
        if (!asyncLogModel) return;

        // Make request
        const options: AxiosRequestConfig = {
            method: "POST",
            url: this.heliconeUrl,
            data: asyncLogModel,
        };

        await axios(options);
    }
}