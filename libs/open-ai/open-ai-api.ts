import {
    ConversationResponse,
    type IChatRequirementsResponse,
    ResponseMessageType
} from "~libs/open-ai/open-ai-interface";
import {OPEN_AI_REFERER_BASE} from "~libs/open-ai/open-ai-constant";
import {createUuid} from "~utils";
import {ChatError, ErrorCode} from "~utils/errors";
import {ChatFetchResponse, customChatFetch} from "~utils/custom-fetch-for-chat";
import {sha3_512} from "js-sha3";
import {OpenAIAuth} from "~libs/open-ai/open-ai-auth";
import ArkoseGlobalSingleton from "~libs/chatbot/openai/Arkose";
import {Logger} from "~utils/logger";
import {OpenAiFileRef} from "~libs/chatbot/openai/fileInstance";
import {fetchAndCacheResult} from "~libs/chatbot/openai/RequirementsRequestToken";

export class OpenAiApi {
    COOKIE_OPEN_AI_DEVICE_ID = 'oai-did';
    conversationId = "";
    messageId = "";
    parentMessageId = "";
    openAiAuth: OpenAIAuth | null = null;
    messageCallback: ((message: ConversationResponse) => void) | null = null;
    requirementsData: IChatRequirementsResponse;
    model = "text-davinci-002-render-sha";
    arkoseInstance: ArkoseGlobalSingleton;

    constructor(authInstance: OpenAIAuth, model: string) {
        this.openAiAuth = authInstance;
        this.model = model;
        this.arkoseInstance = ArkoseGlobalSingleton.getInstance();
    }

    private getReferrer() {
        if (this.conversationId) {
            return `${OPEN_AI_REFERER_BASE}c/${this.conversationId}`;
        }

        return OPEN_AI_REFERER_BASE;
    }

    close() {
        // close open ai session
        this.messageCallback = null;
    }

    private createWss(r: any) {
        // listen wss response
        const websocket = new WebSocket(r.wss_url);

        websocket.onopen = function (event) {
            Logger.log('WebSocket opened：', event);
        };

        websocket.onmessage = function (event) {
            Logger.log('receive：', event.data);
        };

        websocket.onerror = function () {
            // ignore
        };

        websocket.onclose = function () {
            // ignore
        };
    }

    async chatRequirement(): Promise<[ChatError | null, IChatRequirementsResponse | null]> {
        const myHeaders = new Headers();
        const authToken = await this.getOpenAIAuthToken();

        if (authToken) {
            myHeaders.append("authorization", `Bearer ${authToken}`);
        }

        myHeaders.append("content-type", "application/json");
        myHeaders.append("oai-device-id", await OpenAIAuth.getOpenAiDeviceId());
        myHeaders.append("oai-language", "");
        // myHeaders.append("origin", "https://chatgpt.com");
        // myHeaders.append("referer", this.getReferrer());
        myHeaders.append("sec-fetch-site", "same-origin");

        const raw = JSON.stringify({
            p: await fetchAndCacheResult(Math.random().toString())
        });

        const request = await customChatFetch("https://chatgpt.com/backend-api/sentinel/chat-requirements", {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        });

        if (request.error) {
            return [request.error, null];
        }

        try {
            const res = JSON.parse(await request?.response?.text() ?? "") as IChatRequirementsResponse;
            this.requirementsData = res;
            return [null, res];
        } catch (e) {
            return [new ChatError(ErrorCode.UNKNOWN_ERROR), null];
        }
    }

    private parseStreamEventData(data: string) {
        // parse stream event data
        // const prefix = 'data: '
        const json = data;

        if (json === "[DONE]") {
            return new ConversationResponse({
                message_type: ResponseMessageType.DONE
            });
        }
        try {
            const obj = JSON.parse(json);

            if (obj["type"] === "title_generation") {
                // this.conversationId = obj["conversation_id"]
                // Logger.log('parseStreamEventData title_generation')
                // return new ConversationResponse({
                //     message_type: ResponseMessageType.TITLED,
                //     conversation_id: obj["conversation_id"],
                //     // title: obj["title"]
                // })

            } else if (obj["message"] && obj["message"]["content"]["content_type"] === "text") {
                this.conversationId = obj["conversation_id"];
                const message = obj["message"];

                return new ConversationResponse({
                    message_type: ResponseMessageType.GENERATING,
                    conversation_id: obj["conversation_id"],
                    message_id: message["id"],
                    message_text: message["content"]["parts"][0]
                });
            } else if (obj["error"]) {
                return new ConversationResponse({
                    message_type: ResponseMessageType.ERROR,
                    error: new ChatError(ErrorCode.MODEL_INTERNAL_ERROR, obj["error"])
                });
            } else {
                return null;
            }
        } catch (e) {
            Logger.log('eeee', e);
            return null;
        }

    }

    private IRe() {
        return [navigator.hardwareConcurrency + screen.width + screen.height, new Date().toString(), 4294705152, 0, navigator.userAgent];
    }

    private MRe(seed: string, difficulty: string) {
        const n = this.IRe();
        for (let i = 0; i < 1e5; i++) {
            n[3] = i;
            const o = JSON.stringify(n)
                , a = btoa(String.fromCharCode(...new TextEncoder().encode(o)));
            if (sha3_512(seed + a).slice(0, difficulty.length) <= difficulty)
                return "gAAAAAB" + a;
        }
        return "gAAAAABwQ8Lk5FbGpA2NcR9dShT6gYjU7VxZ4D" + btoa(seed);
    }

    async conversation(
        messageCallback: (message: ConversationResponse) => void | null,
        content: string,
        parentMessageId?: string,
        conversationId?: string,
        fileRef?: OpenAiFileRef | null
    ) {
        this.messageCallback = messageCallback;

        if (parentMessageId) {
            this.parentMessageId = parentMessageId;
        } else {
            parentMessageId = createUuid();
        }

        if (conversationId) this.conversationId = conversationId;

        const myHeaders = new Headers();
        myHeaders.append("accept", "text/event-stream");

        const token = await this.getOpenAIAuthToken();

        if (token) {
            myHeaders.append("authorization", `Bearer ${token}`);
        }

        // const [err, requirement] = await this.chatRequirement()
        //
        // if (err) {
        //     messageCallback(
        //         new ConversationResponse({
        //             conversation_id: conversationId,
        //             message_type: ResponseMessageType.ERROR,
        //             error: err
        //         })
        //     )
        //
        //     return
        // }

        myHeaders.append("content-type", "application/json");
        myHeaders.append("oai-device-id", await OpenAIAuth.getOpenAiDeviceId());
        myHeaders.append("oai-language", "");
        myHeaders.append("openai-sentinel-chat-requirements-token", (this.requirementsData.token));
        // myHeaders.append("origin", "https://chatgpt.com");
        // myHeaders.append("referer", this.getReferrer());
        myHeaders.append("sec-fetch-site", "same-origin");

        if (this.requirementsData.arkose.required) {
            try {
                myHeaders.append("Openai-Sentinel-Arkose-Token", (await this.arkoseInstance.getArkoseToken()) as string);
            } catch (_) {
                this?.messageCallback && this?.messageCallback(
                    new ConversationResponse({
                        conversation_id: conversationId,
                        message_type: ResponseMessageType.ERROR,
                        error: new ChatError(ErrorCode.UNKNOWN_ERROR)
                    })
                );
            }
        }

        Logger.log('Arkose-Token token settle',);

        if (this.requirementsData.proofofwork) {
            myHeaders.append("Openai-Sentinel-Proof-Token", this.MRe(this.requirementsData.proofofwork.seed, this.requirementsData.proofofwork.difficulty));
        }

        const ref = {};
        const parts: any[] = [];

        Logger.trace('fileRef == conversation', fileRef);

        if (fileRef) {
            const attachment = {
                id: fileRef.id,
                name: fileRef.name,
                mime_type: fileRef.mimeType,
                size: fileRef.size,
            };

            if (fileRef.width) {
                attachment['width'] = fileRef.width;
            }

            if (fileRef.height) {
                attachment['height'] = fileRef.height;
            }

            ref['attachments'] = [attachment];

            if(fileRef.mimeType.startsWith('image')) {
                parts.push({
                    asset_pointer: `file-service://${fileRef.id}`,
                    content_type:"image_asset_pointer",
                    height: fileRef.height,
                    size_bytes: fileRef.size,
                    width: fileRef.width
                });
            }
        }

        parts.push(content);

        const struct = {
            "action": "next",
            "messages": [
                {
                    "id": createUuid(),
                    "author": {
                        "role": "user"
                    },
                    "content": {
                        "content_type": fileRef && fileRef.mimeType.startsWith('image') ? "multimodal_text" : "text",
                        "parts": parts
                    },
                    "metadata": {
                        ...ref
                    }
                }
            ],
            // "conversation_id": "c3bea594-ed9c-48ab-b21a-e9e22d99aa3e",
            "parent_message_id": parentMessageId,
            "model": this.model,
            // "timezone_offset_min": this.getTimezoneOffsetMin(),
            "suggestions": [],
            "history_and_training_disabled": false,
            "conversation_mode": {
                "kind": "primary_assistant",
            },
            "force_nulligen": false,
            "force_paragen": false,
            "force_paragen_model_slug": "",
            "force_rate_limit": false,
            "arkose_token": undefined,
            "websocket_request_id": createUuid(),
            // "timezone_offset_min": -getTimezoneOffsetMin()
        };

        if (conversationId) {
            struct["conversation_id"] = conversationId;
        }

        const raw = JSON.stringify(struct);

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const _this = this;

        const request = await customChatFetch(token ? "https://chatgpt.com/backend-api/conversation" : "https://chatgpt.com/backend-anon/conversation", {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        });

        if (request.error) {
            _this?.messageCallback && _this?.messageCallback(
                new ConversationResponse({
                    conversation_id: conversationId,
                    message_type: ResponseMessageType.ERROR,
                    error: request.error
                })
            );

            return;
        }


        if (!request?.response?.ok) {
            if (429 === request?.response?.status) {
                _this?.messageCallback && _this?.messageCallback(
                    new ConversationResponse({
                        conversation_id: conversationId,
                        message_type: ResponseMessageType.ERROR,
                        error: new ChatError(ErrorCode.CONVERSATION_LIMIT)
                    })
                );
            }

            return;
        }

        const responseContentType = request.response.headers.get("content-type");

        if (responseContentType?.includes('application/json')) {
            // wss
            void this.readFromWss();
        } else {
            // event stream
            this.readFromStream(request);
        }
    }

    private async readFromWss() {
        const wss = this?.openAiAuth?.wss;

        if (wss) {
            wss.onmessage = (event) => {
                try {
                    const {body} = JSON.parse(event.data);
                    const decoded = atob(body);
                    this.readDataBody(decoded, wss);
                } catch (e) {
                    Logger.log(e);
                }
            };

            wss.onclose = function () {
                // ignore
            };

            wss.onerror = function () {
                // ignore
            };
        }
    }

    private readDataBody(str: string, ws?: WebSocket) {
        for (const line of str.split("\n")) {
            const text = line.replace("data: ", "").replace("\n", "");

            if (text !== "") {
                if (text === "[DONE]") {
                    ws?.close();
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    this?.messageCallback && this?.messageCallback(this.parseStreamEventData(text));
                    return;
                }
                try {
                    // const payload = JSON.parse(text);
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    this?.messageCallback && this?.messageCallback(this.parseStreamEventData(text));
                } catch (e) {
                    Logger.log(e);
                }

            }
        }
    }

    private readFromStream(request: ChatFetchResponse) {
        const stream = request?.response?.body;

        const reader = stream?.getReader();

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const _this = this;

        function readStream() {
            reader?.read().then(async ({done, value}) => {
                if (done) {
                    return;
                }

                const enc = new TextDecoder("utf-8");
                const str = enc.decode(value.buffer);

                for (const line of str.split("\n")) {
                    const text = line.replace("data: ", "").replace("\n", "");

                    if (text !== "") {
                        if (text === "[DONE]") {
                            const parsedData = _this.parseStreamEventData(text);
                            if (parsedData) {
                                _this?.messageCallback && _this?.messageCallback(parsedData);
                            }
                            return;
                        }
                        try {
                            const parsedData = _this.parseStreamEventData(text);
                            if (parsedData) {
                                _this?.messageCallback && _this?.messageCallback(parsedData);
                            }
                        } catch (e) {
                            Logger.log(e);
                        }

                    }
                }
                // _this.readDataBody(str)
                readStream();
            });
        }

        readStream();
    }

    private async getOpenAIAuthToken() {
        return this.openAiAuth?.authSessionInfo?.accessToken ?? "";
    }

    private getCookieByName(name: string): Promise<string> {
        return new Promise((resolve) => {
            chrome.cookies.get({url: 'https://chatgpt.com', name: name}, function (cookie) {
                resolve(cookie?.value ?? "");
            });
        });
    }

    getLanguagesWithWeights() {
        const languages = navigator.languages;

        return languages.map((lang, index) => {
            const quality = (index === 0 ? 1.0 : (1 - (index * 0.1))).toFixed(1);
            return `${lang};q=${quality}`;
        }).join(',');
    }

    getFirstLanguage() {
        const languages = navigator.languages;

        return languages[0];
    }
}
