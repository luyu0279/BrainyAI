import {ChatError, ErrorCode} from "~utils/errors";
import {ConversationResponse, ResponseMessageType} from "~libs/open-ai/open-ai-interface";
import {sendToBackground} from "@plasmohq/messaging";
import {Storage} from "@plasmohq/storage";
import {
    appendParamToUrl,
    createUuid,
    IS_OPEN_IN_CHAT_AUTH_WINDOW,
    MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS,
    WINDOW_FOR_REMOVE_STORAGE_KEY
} from "~utils";
import {
    type BotCompletionParams,
    type BotConstructorParams,
    type ConversationResponseCb,
    type IBot
} from "~libs/chatbot/IBot";
import {BotBase} from "~libs/chatbot/BotBase";
import KimiSessionSingleton from "~libs/chatbot/kimi/kimiSession";
import {SimpleBotMessage} from "~libs/chatbot/BotSessionBase";
import IconKimi from "data-base64:~assets/kimi.png";
import {Logger} from "~utils/logger";
import {KimiFileSingleton, KimiSupportedMimeTypes} from "~libs/chatbot/kimi/fileInstance";
import {checkModelSupportUploadPDF} from "~libs/chatbot/utils";

const STORAGE_REFRESH_TOKEN_KEY = "kimi_refresh_token";
const STORAGE_ACCESS_TOKEN_KEY = "kimi_access_token";

interface KimiCreateConversation {
    id: string;
    name: string;
    thumb_status: {
        is_thumb_up: boolean;
        is_thumb_down: boolean;
    };
    created_at: string;
    is_example: boolean;
    status: string;
    type: string;
}

export class KimiBot extends BotBase implements IBot {
    private fileInstance: KimiFileSingleton;
    static botName = 'moonshot-v1';
    static logoSrc = IconKimi;
    static loginUrl = 'https://kimi.moonshot.cn';
    static maxTokenLimit = 400 * 1000;
    static get supportUploadImage() {
        return checkModelSupportUploadPDF(KimiSupportedMimeTypes);
    }
    static get supportUploadPDF() {
        return checkModelSupportUploadPDF(KimiSupportedMimeTypes);
    }
    static desc = 'Suitable for online text generation, chatbots, text summarization, and creative writing.';
    botSession: KimiSessionSingleton;
    fileRefs: string[];

    constructor(params: BotConstructorParams) {
        super(params);
        this.botSession = KimiSessionSingleton.getInstance(params.globalConversationId);
        this.fileInstance = KimiFileSingleton.getInstance();
    }

    static AUTH_WINDOW_KEY = 'kawk';

    static async getAccessToken(): Promise<string> {
        const storage = new Storage();
        return (await storage.get(STORAGE_ACCESS_TOKEN_KEY) ?? "");
    }

    static setAccessToken(token: string) {
        const storage = new Storage();
        void storage.set(STORAGE_ACCESS_TOKEN_KEY, token);
    }

    static setRefreshToken(token: string) {
        const storage = new Storage();
        void storage.set(STORAGE_REFRESH_TOKEN_KEY, token);
    }

    static async getRefreshToken(): Promise<string> {
        const storage = new Storage();
        return (await storage.get(STORAGE_REFRESH_TOKEN_KEY) ?? "");
    }


    static async checkIsLogin(): Promise<[ChatError | null, boolean]> {
        const [err1] = await sendToBackground({
            name: "kimi/prompt-snippet-instance",
        });

        if (err1) {
            if (err1.code === ErrorCode.UNAUTHORIZED) {
                const [err2] = await sendToBackground({
                    name: "kimi/refresh-access-token",
                });

                return [err2, false];
            } {
                return [err1, false];
            }
        }

        return [null, true];
    }

    static async checkModelCanUse(): Promise<boolean> {
        const [, canUse] = await this.checkIsLogin();
        return canUse;
    }

    async completion({prompt, rid, cb, fileRef, file}: BotCompletionParams) {
        const [error] = await this.callPromptSnippetInstance();

        if (error) {
            if (error.code === ErrorCode.UNAUTHORIZED) {
                const [err, res] = await this.tokenRefresh();
                Logger.log('tokenRefresh', err, res);
                if (err) {
                    return cb(rid, new ConversationResponse({
                        error: err,
                        message_type: ResponseMessageType.ERROR
                    }));
                }
            } else {
                return cb(rid, new ConversationResponse(
                    {
                        error: error,
                        message_type: ResponseMessageType.ERROR
                    }
                ));
            }
        }

        Logger.trace('kimi completion', {prompt, rid, cb, fileRef, file});

        if(fileRef) {
            const refObj = this.fileInstance.getRef(fileRef);

            if(!refObj || refObj.err) {
                if(file) {
                    const newRef = await this.uploadFile(file);
                    const theNewRef = this.fileInstance.getRef(newRef);

                    if(!theNewRef || theNewRef.err) {
                        return cb(rid, new ConversationResponse({
                            error: theNewRef?.err || new ChatError(ErrorCode.UNKNOWN_ERROR),
                            message_type: ResponseMessageType.ERROR
                        }));
                    }

                    this.fileRefs = [theNewRef!.ref!.id];
                } else {
                    return cb(rid, new ConversationResponse({
                        error: refObj?.err || new ChatError(ErrorCode.UNKNOWN_ERROR),
                        message_type: ResponseMessageType.ERROR
                    }));
                }
            } else {
                this.fileRefs = [refObj!.ref!.id];
            }
        } else {
            if(file) {
                let refObj = this.fileInstance.getRefByFile(file);

                if(!refObj) {
                    const newRef = await this.uploadFile(file);
                    refObj = this.fileInstance.getRef(newRef);
                }

                if(!refObj || refObj.err) {
                    return cb(rid, new ConversationResponse({
                        error: refObj?.err || new ChatError(ErrorCode.UNKNOWN_ERROR),
                        message_type: ResponseMessageType.ERROR
                    }));
                }

                this.fileRefs = [refObj!.ref!.id];
            }
        }

        if (!this.botSession.session.botConversationId) {
            const [error, kimiConversation] = await this.createConversation();
            Logger.log('createConversation', error, kimiConversation);
            if (error) {
                return cb(rid, new ConversationResponse(
                    {
                        error: error,
                        message_type: ResponseMessageType.ERROR
                    }
                ));
            }

            this.botSession.session.setBotConversationId(kimiConversation!.id);
        }

        void this.streamChat(prompt, rid, cb);
    }

    private convertToSuperscript(input: string): string {
        return input.replace(/【(\d+)】/g, '[^$1^][$1]');
    }

    private getRefDocsMarkdown(refs: any[], links: string[], tags: string[]): {
        links: string[],
        tags: string[]
    } {
        try {
            // eslint-disable-next-line @typescript-eslint/prefer-for-of
            for (let i = 0; i < refs.length; i++) {
                const item = refs[i];
                links.push(`[${item.index}]: ${item.url}`);
                const url = new URL(item.url);
                tags.push(`[${item.index}. ${url?.origin ?? ""}](${item.url})`);
            }

            return {
                links, tags
            };
        } catch (e) {
            return {
                links,
                tags
            };
        }
    }

    private async streamChat(prompt: string, rid: string, cb: ConversationResponseCb) {
        const conversationId = this.botSession.session.botConversationId;

        const myHeaders = new Headers();
        // myHeaders.append("authorization", "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ1c2VyLWNlbnRlciIsImV4cCI6MTcxMzMzMzkxNCwiaWF0IjoxNzEzMzMzMDE0LCJqdGkiOiJjb2ZtNjVoa3FxNHR0cmozbGowZyIsInR5cCI6ImFjY2VzcyIsInN1YiI6ImNvMzkzOXVjcDdmY3QwdmE0b2NnIiwic3BhY2VfaWQiOiJjbzM5Mzl1Y3A3ZmN0MHZhNG9jMCIsImFic3RyYWN0X3VzZXJfaWQiOiJjbzM5Mzl1Y3A3ZmN0MHZhNG9iZyJ9.4SyiCzUhkGXxhIfuDwdQxcGSUsbPqDAj7hAqWZ-m-snHaJlRvVsudDv2JsZYi8Gm6iAKIEA8selxnJK5WLbciQ");
        myHeaders.append("content-type", "application/json");
        myHeaders.append("origin", "https://kimi.moonshot.cn");
        myHeaders.append("r-timezone", "Asia/Shanghai");
        myHeaders.append("referer", "https://kimi.moonshot.cn/chat/" + conversationId);
        // myHeaders.append("x-traffic-id", "co3939ucp7fct0va4ocg");

        const accessToken = await KimiBot.getAccessToken();

        if (accessToken) {
            myHeaders.append("Authorization", `Bearer ${accessToken}`);
        }

        const params = {
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "refs": [] as string[],
            "use_search": true
        };

        if(this.fileRefs && this.fileRefs.length) {
            params.refs = this.fileRefs;
            params.use_search = false;
        }

        const raw = JSON.stringify(params);

        fetch(`https://kimi.moonshot.cn/api/chat/${conversationId}/completion/stream?--kkm=1`, {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        })
            .then(response => {
                const stream = response.body;
                const reader = stream?.getReader();

                if (!response.ok) {
                    cb(
                        rid,
                        new ConversationResponse({
                            conversation_id: conversationId,
                            message_type: ResponseMessageType.ERROR,
                            error: new ChatError(ErrorCode.CONVERSATION_LIMIT)
                        })
                    );

                    return;
                }

                let messageId = "";
                // let groupId = ""
                let outputText = "";
                let textAppendix = "";
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const _this = this;

                let refLinks: string[] = [];
                let refTags: string[] = [];

                function readStream() {
                    reader?.read().then(async ({done, value}) => {
                        if (done) {
                            return;
                        }

                        const enc = new TextDecoder("utf-8");
                        const str = enc.decode(value.buffer);

                        for (const line of str.split("\n")) {
                            const raw = line.replace("data: ", "").replace("\n", "");

                            if (raw !== "") {
                                try {
                                    const {event,  ref_docs, text, id } = JSON.parse(raw);

                                    if (event === "cmpl") {
                                        messageId = id;
                                        // groupId = group_id
                                        outputText += text;

                                        cb(rid, new ConversationResponse({
                                            conversation_id: conversationId,
                                            message_type: ResponseMessageType.GENERATING,
                                            message_text: _this.convertToSuperscript(outputText) + textAppendix,
                                            message_id: messageId
                                        })
                                        );
                                    } else if (event === "ping") {
                                        // ignore
                                    } else if (event === "all_done") {
                                        const text = _this.convertToSuperscript(outputText) + textAppendix;

                                        cb(rid, new ConversationResponse({
                                            conversation_id: conversationId,
                                            message_type: ResponseMessageType.DONE,
                                            message_text: text,
                                            message_id: messageId
                                        }
                                        ));

                                        _this.botSession.session.addMessage(new SimpleBotMessage(text, messageId));
                                    } else if (event === "ref_docs") {
                                        if (ref_docs && ref_docs.length) {
                                            const {
                                                links: _links,
                                                tags: _tags
                                            } = _this.getRefDocsMarkdown(ref_docs, refLinks, refTags);
                                            refLinks = _links;
                                            refTags = _tags;

                                            const tags = Array.from(new Set(refTags)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
                                            const links = Array.from(new Set(refLinks));

                                            textAppendix = "\n\n" + links.join("\n") + "\nLearn more: " + tags.join(" ");
                                        }
                                    } else if (event === "error") {
                                        cb(rid, new ConversationResponse({
                                            conversation_id: conversationId,
                                            message_type: ResponseMessageType.ERROR,
                                            error: new ChatError(ErrorCode.MODEL_INTERNAL_ERROR,)
                                        })
                                        );
                                    }
                                } catch (e) {
                                    Logger.log(e);
                                }
                            }
                        }
                        readStream();
                    });
                }

                readStream();
            }).catch(() => {
                cb(rid, new ConversationResponse({
                    conversation_id: conversationId,
                    message_type: ResponseMessageType.ERROR,
                    error: new ChatError(ErrorCode.UNKNOWN_ERROR)
                })
                );
            }
            );
    }

    async startAuth(): Promise<boolean> {
        const randomKey = '__window_key_' + Math.random() * 1000;
        const kimiAuthValue = createUuid();

        const url = appendParamToUrl(appendParamToUrl(
            appendParamToUrl(KimiBot.loginUrl, IS_OPEN_IN_CHAT_AUTH_WINDOW, '1'),
            WINDOW_FOR_REMOVE_STORAGE_KEY, randomKey
        ), KimiBot.AUTH_WINDOW_KEY, kimiAuthValue);

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
                    if (message.authKey === kimiAuthValue) {
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(true);
                    }
                }
            };
            chrome.runtime.onMessage.addListener(listener);
        });
    }

    private async createConversation(): Promise<[ChatError?, KimiCreateConversation?]> {
        const [err, res] = await sendToBackground({
            name: "kimi/create-conversation",
        });

        return [err, res];
    }

    private async callPromptSnippetInstance(): Promise<[ChatError?, any?]> {
        const [err, res] = await sendToBackground({
            name: "kimi/prompt-snippet-instance",
        });

        return [err, res];
    }

    private async tokenRefresh(): Promise<[ChatError?, any?]> {
        const [err, res] = await sendToBackground({
            name: "kimi/refresh-access-token",
        });

        return [err, res];
    }

    // private setAccessToken(access_token: string) {
    // }
    //
    // private setRefreshToken(refresh_token: string) {
    // }

    startCaptcha(): Promise<boolean> {
        return Promise.resolve(false);
    }

    uploadFile(file: File): Promise<string> {
        return this.fileInstance.uploadFile(file, this.supportedUploadTypes);
    }

    get supportedUploadTypes() {
        return KimiSupportedMimeTypes;
    }

    getBotName(): string {
        return KimiBot.logoSrc;
    }

    getLoginUrl(): string {
        return KimiBot.loginUrl;
    }

    getLogoSrc(): string {
        return KimiBot.logoSrc;
    }

    getRequireLogin(): boolean {
        return KimiBot.requireLogin;
    }

    getSupportUploadImage(): boolean {
        return KimiBot.supportUploadImage;
    }

    getSupportUploadPDF(): boolean {
        return KimiBot.supportUploadPDF;
    }

    getPaidModel(): boolean {
        return KimiBot.paidModel;
    }

    getMaxTokenLimit(): number {
        return KimiBot.maxTokenLimit;
    }

    getNewModel(): boolean {
        return KimiBot.newModel;
    }
}
