import {
    type BotCompletionParams,
    type BotConstructorParams,
    type ConversationResponseCb,
    type IBot
} from "~libs/chatbot/IBot";
import {BotBase} from "~libs/chatbot/BotBase";
import {customChatFetch} from "~utils/custom-fetch-for-chat";
import {ChatError, ErrorCode} from "~utils/errors";
import WebSocketAsPromised from "websocket-as-promised";
import {ConversationResponse, ResponseMessageType} from "~libs/open-ai/open-ai-interface";
import {
    appendParamToUrl,
    createUuid,
    IS_OPEN_IN_CHAT_AUTH_WINDOW,
    IS_OPEN_IN_CHAT_CAPTCHA_WINDOW,
    IS_OPEN_IN_PLUGIN,
    MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS,
    MESSAGE_ACTION_CHAT_PROVIDER_CAPTCHA_SUCCESS,
    R_SCP_PARAM,
    WINDOW_FOR_REMOVE_STORAGE_KEY
} from "~utils";
import {sendToBackground} from "@plasmohq/messaging";
import {Storage} from "@plasmohq/storage";
import IconPerplexity from "data-base64:~assets/perplexity.png";
import type {IBotSessionSingleton} from "~libs/chatbot/BotSessionBase";
import {Logger} from "~utils/logger";
import XFramePerplexityChat from "~component/xframe/perplexity-chat";
import {PerplexityFileSingleton, PerplexitySupportedMimeTypes} from "~libs/chatbot/perplexity/fileInstance";
import {checkModelSupportUploadImage, checkModelSupportUploadPDF} from "~libs/chatbot/utils";

class Message {
    content: string;
    role: "user" | "assistant";
    priority: number;

    constructor(content: string, role: "user" | "assistant", priority: number) {
        this.content = content;
        this.role = role;
        this.priority = priority;
    }
}

export class PerplexitySession {
    private model: string;

    constructor(model: string) {
        this.model = model;
    }

    private seq = 1;
    private ws: WebSocketAsPromised;
    private msgCallback: ConversationResponseCb;
    private rid: string;
    private prompt: string;
    private sid: string;
    private messages: Message[] = [];


    static destroy() {
        // if(PerplexitySession?.ws?.isOpened) {
        //     void PerplexitySession?.ws?.close();
        //     PerplexitySession.ws = null;
        // }
        // PerplexitySession.instance = null;
    }

    // static getInstance(params: BotConstructorParams): PerplexitySession {
    //     if(!params.conversationId || PerplexitySession?.ws?.isClosed) {
    //         PerplexitySession.destroy()
    //     }
    //
    //     if (!PerplexitySession.instance) {
    //         PerplexitySession.instance = new PerplexitySession();
    //     }
    //
    //     return PerplexitySession.instance;
    // }

    get wsClosed() {
        return this.ws?.isClosed;
    }

    wsClose() {
        return this.ws?.close();
    }

    private V =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(
            "",
        );

    private Z(e: number): string {
        let t = "";
        do (t = this.V[e % 64] + t), (e = Math.floor(e / 64));
        while (e > 0);
        return t;
    }

    private get t() {
        return this.Z(+new Date());
    }

    async checkAvailability(): Promise<[ChatError | null]> {
        const request = await customChatFetch(
            "https://www.perplexity.ai/api/auth/session",
        );

        if (request.error) {
            return [request.error];
        }

        try {
            const result = await request?.response?.text();
            if (result === "{}") {
                return [new ChatError(ErrorCode.UNAUTHORIZED)];
            }

            return [null];
        } catch (e) {
            return [new ChatError(ErrorCode.UNKNOWN_ERROR)];
        }
    }

    async completion(prompt: string, rid: string, cb: ConversationResponseCb): Promise<void> {
        this.prompt = prompt;
        this.rid = rid;
        this.msgCallback = cb;

        // await sendToBackground({
        //     name: "fix-partition-cookie",
        //     body: {
        //         domain: "perplexity.ai",
        //         url: "https://www.perplexity.ai"
        //     },
        // });

        if (!this.ws) {
            // const [err] = await this.checkAvailability();
            //
            // if (err) {
            //     this.msgCallback(this.rid, new ConversationResponse(
            //         {
            //             conversation_id: this.sid,
            //             message_type: ResponseMessageType.ERROR,
            //             error: err
            //         }
            //     ));
            //
            //     return;
            // }

            await this.startSession();
        } else {
            this.sendMessage();
        }
    }

    private async someRequest() {
        const myHeaders = new Headers();

        await customChatFetch(`https://www.perplexity.ai/socket.io/?EIO=4&transport=polling&t=${this.t}&sid=${this.sid}`, {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        });
    }

    private separateNumberAndObject(input: string) {
        const regex = /^(\d+)(.*)/;
        const match = input.match(regex);
        if (match) {
            const number = parseInt(match[1]);
            try {
                const object = JSON.parse(match[2]);
                return {number, object};
            } catch (error) {
                return {number, object: match[2]};
            }
        } else {
            return {object: input};
        }
    }

    private async startSession() {
        const myHeaders = new Headers();

        const request = await customChatFetch(`https://www.perplexity.ai/socket.io/?transport=polling&EIO=4&t=${this.t}`, {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        });

        if (request.error) {
            this.msgCallback(this.rid, new ConversationResponse({
                conversation_id: this.sid,
                message_type: ResponseMessageType.ERROR,
                error: request.error
            }));

            return;
        }

        const response = await request?.response?.text();

        if (!response) {
            this.msgCallback(this.rid, new ConversationResponse({
                conversation_id: this.sid,
                message_type: ResponseMessageType.ERROR,
                error: new ChatError(ErrorCode.UNKNOWN_ERROR)
            }));

            return;
        }

        const result = this.separateNumberAndObject(response);
        this.sid = result.object.sid;

        const checkSidRequest = await customChatFetch(
            `https://www.perplexity.ai/socket.io/?EIO=4&transport=polling&sid=${this.sid}&t=${this.t}`,
            {
                body: `40${JSON.stringify({jwt: "anonymous-ask-user"})}`,
                method: "POST"
            },
        );

        if (checkSidRequest.error) {
            this.msgCallback(this.rid, new ConversationResponse({
                conversation_id: this.sid,
                message_type: ResponseMessageType.ERROR,
                error: checkSidRequest.error
            }));

            return;
        }

        // await this.someRequest()

        // this.sid = "QmkN05TPMR7K0JDyAH51"
        this.createWs();
    }

    private addMessage(message: Message) {
        this.messages.push(message);
    }

    private sendMessage() {
        this.addMessage(new Message(this.prompt, "user", 0));

        const ask = [
            "perplexity_labs",
            {
                "version": "2.9",
                "source": "default",
                "model": this.model,
                "messages": this.messages,
                // timezone: "Asia/Shanghai"
            }
        ];

        this.ws.sendPacked(ask);
    }

    private createWs(): void {
        // this.sid = "3pv0EzwUQ7vAgEMcAHLw"
        const wsp = new WebSocketAsPromised(
            `wss://www.perplexity.ai/socket.io/?EIO=4&transport=websocket&sid=${this.sid}`,
            {
                packMessage: (data) => {
                    return `42${this.seq++}${JSON.stringify(data)}`;
                },
                unpackMessage: (data) => {
                    return this.separateNumberAndObject(data as string);
                },
            },
        );

        wsp.onOpen.addListener(() => {
            wsp.send("2probe");
        });

        wsp.onMessage.addListener(function () {
            // Logger.log("PerplexityBot onMessage", data)
        });

        wsp.onSend.addListener(function () {
            // Logger.log("PerplexityBot onSend", data)
        });

        wsp.onUnpackedMessage.addListener(async (data) => {
            if (!data) {
                Logger.error("Error PerplexityBot onUnpackedMessage");
                return;
            }
            try {
                // Logger.log("data number", data.number, data)
                switch (Number(data.number)) {
                case 2:
                    wsp.send("3");
                    break;
                case 3:
                    if (data.object === "probe") {
                        wsp.send("5");
                        this.sendMessage();
                    }
                    break;
                case 42:
                    if (data?.object?.length >= 2) {
                        const result = data.object[1];
                        try {
                            const response = result.output;
                            if (response) {
                                this.msgCallback(this.rid, new ConversationResponse(
                                    {
                                        conversation_id: this.sid,
                                        message_text: response,
                                        message_type: ResponseMessageType.GENERATING,
                                    }
                                ));
                            }
                        } catch (error) {
                            this.msgCallback(this.rid, new ConversationResponse(
                                {
                                    conversation_id: this.sid,
                                    message_type: ResponseMessageType.ERROR,
                                    message_id: createUuid(),
                                    error: new ChatError(ErrorCode.UNKNOWN_ERROR)
                                }
                            ));
                        }
                    }
                    break;
                default:
                    if (String(data.number).toString().startsWith("43")) {
                        if (data?.object?.length >= 1) {
                            const result = data.object[0];

                            try {
                                if (result.status === "failed") {
                                    Logger.log('=====================', result.text);
                                    this.msgCallback(this.rid, new ConversationResponse({
                                        conversation_id: this.sid,
                                        message_type: ResponseMessageType.ERROR,
                                        message_id: createUuid(),
                                        error: new ChatError(ErrorCode.MODEL_INTERNAL_ERROR, result.text)
                                    }));

                                    return;
                                }

                                this.addMessage(new Message(result.output, "assistant", 0));

                                const text = result.output;
                                if (text) {
                                    this.msgCallback(this.rid, new ConversationResponse(
                                        {
                                            conversation_id: this.sid,
                                            message_text: text,
                                            message_id: createUuid(),
                                            message_type: ResponseMessageType.DONE,
                                        }
                                    ));
                                }
                            } catch (error) {
                                this.msgCallback(this.rid, new ConversationResponse(
                                    {
                                        conversation_id: this.sid,
                                        message_type: ResponseMessageType.ERROR,
                                        error: new ChatError(ErrorCode.UNKNOWN_ERROR)
                                    }
                                ));
                            }
                        }
                    }
                    break;
                }
            } catch (error) {
                this.msgCallback(this.rid, new ConversationResponse(
                    {
                        conversation_id: this.sid,
                        message_type: ResponseMessageType.ERROR,
                        error: new ChatError(ErrorCode.UNKNOWN_ERROR)
                    }
                ));
            }
        });

        wsp.onError.addListener(() => {
            wsp.removeAllListeners();
            void wsp.close();
            this.msgCallback(this.rid, new ConversationResponse(
                {
                    conversation_id: this.sid,
                    message_type: ResponseMessageType.ERROR,
                    error: new ChatError(ErrorCode.COPILOT_WEBSOCKET_ERROR)
                }
            ));
            // reject(event);
        });

        wsp.onClose.addListener(() => {
            Logger.log('onclose======');
            // resolve();
            // onUpdateResponse(callbackParam, { done: true });
        });

        void wsp.open();

        this.ws = wsp;
    }
}

export class PerplexitySessionSingleton {
    static model = "";
    private static sessionInstance: PerplexitySession | null;
    static globalConversationId: string;

    protected constructor() {
        // ignore
    }

    static getInstance(params: BotConstructorParams, model: string): PerplexitySession {
        PerplexitySessionSingleton.model = model;

        if (PerplexitySessionSingleton?.sessionInstance?.wsClosed) {
            PerplexitySessionSingleton.destroy();
        }

        if (this.globalConversationId !== params.globalConversationId) {
            PerplexitySessionSingleton.destroy();
        }

        if (!PerplexitySessionSingleton.sessionInstance) {
            PerplexitySessionSingleton.sessionInstance = new PerplexitySession(PerplexitySessionSingleton.model);
        }

        this.globalConversationId = params.globalConversationId;

        return PerplexitySessionSingleton.sessionInstance;
    }

    static destroy() {
        void PerplexitySessionSingleton?.sessionInstance?.wsClose();
        PerplexitySessionSingleton.sessionInstance = null;
    }
}

export abstract class PerplexityBot extends BotBase implements IBot {
    static logoSrc = IconPerplexity;
    static botName = 'Perplexity';
    static loginUrl = 'https://perplexity.ai/';
    static AUTH_WINDOW_KEY = 'perplexity_auth_window';
    static CAPTCHA_WINDOW_KEY = 'perplexity_captcha_window';
    static isLogin : boolean | null = null;
    static maxTokenLimit = 0;
    static paidModel = false;
    static requireLogin = false;
    static get supportUploadImage() {
        return checkModelSupportUploadImage(PerplexitySupportedMimeTypes);
    }
    static get supportUploadPDF() {
        return checkModelSupportUploadPDF(PerplexitySupportedMimeTypes);
    }
    fileInstance: PerplexityFileSingleton;

    protected perplexitySession: PerplexitySession;
    model: string;
    botSession: IBotSessionSingleton;

    protected constructor(params: BotConstructorParams) {
        super(params);
        this.fileInstance = PerplexityFileSingleton.getInstance();
    }

    async completion({prompt, rid, cb, fileRef, file}: BotCompletionParams): Promise<void> {
        // const [checkErr, isLogin] = await PerplexityBot.checkIsLogin();

        // if(checkErr || !isLogin) {
        //     return cb(rid, new ConversationResponse({
        //         error: checkErr ?? new ChatError(ErrorCode.UNAUTHORIZED),
        //         message_type: ResponseMessageType.ERROR
        //     }));
        // }

        if(fileRef || file) {
            return cb(rid, new ConversationResponse({
                error: new ChatError(ErrorCode.UPLOAD_FILE_NOT_SUPPORTED),
                message_type: ResponseMessageType.ERROR
            }));
        }

        void this.perplexitySession.completion(prompt, rid, cb);
    }


    static async checkIsLogin(): Promise<[ChatError | null, boolean]> {
        const request = await customChatFetch(
            "https://www.perplexity.ai/api/auth/session",
        );

        if (request.error) {
            return [request.error, false];
        }

        this.isLogin = await request.response?.text() !== "{}";

        return [null, true];
    }

    static async checkModelCanUse(): Promise<boolean> {
        if(this.isLogin == null) {
            const [, isLogin] = await this.checkIsLogin();
            return isLogin;
        }

        return Promise.resolve(this.isLogin);
    }

    async startAuth(): Promise<boolean> {
        const randomKey = '__window_key_' + Math.random() * 1000;
        const perplexityAuthValue = createUuid();

        const url = appendParamToUrl(appendParamToUrl(
            appendParamToUrl(PerplexityBot.loginUrl, IS_OPEN_IN_CHAT_AUTH_WINDOW, '1'),
            WINDOW_FOR_REMOVE_STORAGE_KEY, randomKey
        ), PerplexityBot.AUTH_WINDOW_KEY, perplexityAuthValue);

        const res = await sendToBackground({
            name: "open-new-window",
            body: {
                url,
                width: 800,
                height: 660,
                focused: true,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height
            },
        });

        const storage = new Storage();
        await storage.set(randomKey, res);

        return new Promise((resolve) => {
            const listener = function (message: any) {
                if (message.action === MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS) {
                    if (message.authKey === perplexityAuthValue) {
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(true);
                    }
                }
            };
            chrome.runtime.onMessage.addListener(listener);
        });
    }

    async startCaptcha(): Promise<boolean> {
        const randomKey = '__window_key_' + Math.random() * 1000;
        const perplexityCaptchaValue = createUuid();

        const url =
            appendParamToUrl(
                appendParamToUrl(
                    appendParamToUrl(
                        appendParamToUrl(
                            appendParamToUrl(PerplexityBot.loginUrl, IS_OPEN_IN_CHAT_CAPTCHA_WINDOW, '1'),
                            WINDOW_FOR_REMOVE_STORAGE_KEY, randomKey
                        ), PerplexityBot.CAPTCHA_WINDOW_KEY, perplexityCaptchaValue), R_SCP_PARAM, "1"), IS_OPEN_IN_PLUGIN, "1");

        // const res = await sendToBackground({
        //     name: "open-new-window",
        //     body: {
        //         url,
        //         width: 1100,
        //         height: 660,
        //         focused: true,
        //         screenWidth: window.screen.width,
        //         screenHeight: window.screen.height
        //     },
        // });
        //
        // Popover.;

        // ({
        //     children: XFramePerplexityChat({src: url}),
        // })

        const frame = new XFramePerplexityChat(url);
        frame.render();


        // const storage = new Storage();
        // await storage.set(randomKey, res);

        return new Promise((resolve) => {
            const listener = function (message: any) {
                if (message.action === MESSAGE_ACTION_CHAT_PROVIDER_CAPTCHA_SUCCESS) {
                    Logger.log("message.authKey", message.authKey, perplexityCaptchaValue);
                    if (message.authKey === perplexityCaptchaValue) {
                        chrome.runtime.onMessage.removeListener(listener);
                        frame.destroy();
                        resolve(true);
                    }
                }
            };
            chrome.runtime.onMessage.addListener(listener);
        });
    }

    supportedUploadTypes = [];

    uploadFile(file: File): Promise<string> {
        return this.fileInstance.uploadFile(file, this.supportedUploadTypes);
    }

    getBotName(): string {
        return PerplexityBot.botName;
    }

    getLoginUrl(): string {
        return PerplexityBot.loginUrl;
    }

    getLogoSrc(): string {
        return PerplexityBot.logoSrc;
    }

    getRequireLogin(): boolean {
        return PerplexityBot.requireLogin;
    }

    getSupportUploadImage(): boolean {
        return PerplexityBot.supportUploadImage;
    }

    getSupportUploadPDF(): boolean {
        return PerplexityBot.supportUploadPDF;
    }

    getMaxTokenLimit(): number {
        return PerplexityBot.maxTokenLimit;
    }

    getPaidModel(): boolean {
        return PerplexityBot.paidModel;
    }

    getNewModel(): boolean {
        return PerplexityBot.newModel;
    }
}
