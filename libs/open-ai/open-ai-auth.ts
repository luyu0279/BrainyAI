import type {
    IOpenAISessionResponse,
    IOpenaiAccountData,
} from "~libs/open-ai/open-ai-interface";
import {OPEN_AI_REFERER_BASE} from "~libs/open-ai/open-ai-constant";
import {ChatError, ErrorCode} from "~utils/errors";
import {customChatFetch} from "~utils/custom-fetch-for-chat";
import {Storage} from "@plasmohq/storage";
import {createUuid, STORAGE_OPEN_AI_DEVICE_ID} from "~utils";
import {Logger} from "~utils/logger";

// a singleton only in background.js
export class OpenAIAuth {
    private static instance: OpenAIAuth;
    authSessionInfo: IOpenAISessionResponse | null = null;
    private accountInfo: IOpenaiAccountData | null = null;
    wss: WebSocket | null = null;
    fallbackWss: WebSocket | null = null;

    constructor() {
        // ignore
    }

    async init() {
        return this.getSession();
    }

    async initSessionInfo(): Promise<[ChatError | null, IOpenAISessionResponse | null]> {
        if (!this.authSessionInfo) {
            const [error, session] = await this.createSession();
            Logger.trace('initSessionInfo', error, session);

            if (error) {
                return [error, this.authSessionInfo];
            }

            this.authSessionInfo = session?.accessToken ? session : null;
        }

        return [null, this.authSessionInfo];
    }


    async getSession(): Promise<[ChatError | null, IOpenAISessionResponse | null]> {
        const [err] = await this.initSessionInfo();

        if(err) {
            return [err, null];
        }

        if (!this.accountInfo) {
            const [error2, accountData] = await this.checkAccount();

            if (error2) {
                return [error2, null];
            }

            this.accountInfo = accountData;
        }

        if (!this.wss) {
            await this.tryInitWss();
        }

        return [null, this.authSessionInfo];
    }

    private async tryInitWss() {
        if (this.accountInfo?.accounts['default'].features.includes('shared_websocket') && this.authSessionInfo?.accessToken) {
            // const wss = new WebSocket(`wss://chatgpt.com/backend-api/ws/v4-2023-04-27?authorization=Bearer ${this.sessionInfo.accessToken}`)
            await this.registerWebsocket();
        }
    }

    async registerWebsocket() {
        const myHeaders = new Headers();
        myHeaders.append("oai-device-id", await OpenAIAuth.getOpenAiDeviceId());
        myHeaders.append("oai-language", "");

        if (this.authSessionInfo?.accessToken) {
            myHeaders.append("authorization", `Bearer ${this.authSessionInfo.accessToken}`);
        }

        try {
            const request = await customChatFetch("https://chatgpt.com/backend-api/register-websocket", {
                method: "POST",
                headers: myHeaders,
                redirect: "follow"
            });

            // eslint-disable-next-line no-unsafe-optional-chaining
            const {wss_url} = await request.response?.json();

            if (wss_url) {
                this.wss = new WebSocket(wss_url);
                this.wss.binaryType = "arraybuffer";
                this.wss.onopen = () => {
                    // ignore
                };

                this.wss.onclose = () => {
                    this.wss = null;
                };

                this.wss.onerror = () => {
                    this.wss = null;
                };
            }

        } catch (e) {
            // ignore
        }
    }

    // async refreshSession() {
    //     const [error, session] = await this.createSession();
    //
    //     this.authSessionInfo = session;
    //
    //     return [error, session];
    // }

    static async getOpenAiDeviceId() {
        const storage = new Storage();
        const openAiDeviceId = await storage.get(STORAGE_OPEN_AI_DEVICE_ID);

        if (openAiDeviceId) {
            return openAiDeviceId;
        }

        const newOpenAiDeviceId = createUuid();
        await storage.set(STORAGE_OPEN_AI_DEVICE_ID, newOpenAiDeviceId);
        return newOpenAiDeviceId;
    }

    private async checkAccount(): Promise<[ChatError | null, IOpenaiAccountData | null]> {
        // shared_websocket
        const myHeaders = new Headers();
        myHeaders.append("accept", "*/*");
        myHeaders.append("oai-device-id", await OpenAIAuth.getOpenAiDeviceId());
        myHeaders.append("oai-language", "");

        if (this.authSessionInfo?.accessToken) {
            myHeaders.append("authorization", `Bearer ${this.authSessionInfo?.accessToken}`);
        }

        const request = await customChatFetch(`https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27`, {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        });

        if (request.error) {
            return [request.error, null];
        }

        try {
            const response = await request?.response?.json() as IOpenaiAccountData;

            return [null, response];
        } catch (e) {
            return [new ChatError(ErrorCode.UNKNOWN_ERROR), null];
        }
    }

    private async createSession(): Promise<[ChatError | null, IOpenAISessionResponse | null]> {
        const myHeaders = new Headers();
        myHeaders.append("accept", "application/json");
        myHeaders.append("referer", OPEN_AI_REFERER_BASE);
        myHeaders.append("origin", "https://chatgpt.com");
        // myHeaders.append("sec-fetch-site", "same-origin");

        const request = await customChatFetch(`https://chatgpt.com/api/auth/session`, {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        });

        if (request.error) {
            return [request.error, null];
        }

        try {
            const data = await request?.response?.text();

            if(!data) {
                return [new ChatError(ErrorCode.UNKNOWN_ERROR), null];
            }

            return [null, JSON.parse(data) as IOpenAISessionResponse];
        } catch (e) {
            return [new ChatError(ErrorCode.UNKNOWN_ERROR), null];
        }
    }
}
