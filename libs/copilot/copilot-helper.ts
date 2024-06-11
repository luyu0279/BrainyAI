import type {CopilotConversation} from "~background/messages/copilot/init-copilot-conversation";
import moment from "moment/moment";
import {ConversationResponse, ResponseMessageType} from "~libs/open-ai/open-ai-interface";
import {ChatError, ErrorCode} from "~utils/errors";
import {CopilotImageCreateAppendix} from "~component/MessageAppendix";
import {Logger} from "~utils/logger";
//
// const kSeedIncrement = 500
//
// const getNextKSeed = function () {
//     return this.currentKSeed += this.config.telemetry.kSeedIncrement,
//         this.currentKSeed
// }
//
// const getNextInstSuffix = function () {
//     return this.config.features.enableAnsCardSfx ? (this.instSuffix += this.config.telemetry.instSuffixIncrement,
//         this.instSuffix > 1 ? `${this.instSuffix}` : "") : ""
// }

class CoreUtils {
    static clamp(O, B, U) {
        return isNaN(O) || O <= B ? B : O >= U ? U : O;
    }

    static uuid() {
        return (this.partUUID() + this.partUUID() + "-" + this.partUUID() + "-" + this.partUUID() + "-" + this.partUUID() + "-" + this.partUUID() + this.partUUID() + this.partUUID()).toLowerCase();
    }

    static partUUID() {
        return (65536 * (1 + Math.random()) | 0).toString(16).substring(1);
    }
}

export const initWss = function (conversation: CopilotConversation): Promise<[ChatError | null, WebSocket]> {
    return new Promise((resolve) => {
        const ws = new WebSocket("wss://sydney.bing.com/sydney/ChatHub?sec_access_token=" + encodeURIComponent(conversation.encryptedConversationSignature));

        ws.onopen = function () {
            ws.send(formatSendMessage({"protocol": "json", "version": 1}));
        };

        ws.onmessage = function (event) {
            if (event.data === formatSendMessage({})) {
                ws.send(formatSendMessage({"type": 6}));
                resolve([null, ws]);
            }
        };

        // ws.onclose = function () {
        //     reject([null, ws])
        // };

        ws.onerror = function () {
            resolve([new ChatError(ErrorCode.COPILOT_WEBSOCKET_ERROR), ws]);
            ws?.close();
        };
    });
};

export const formatSendMessage = function (message: NonNullable<unknown>) {
    return JSON.stringify(message) + '';
};

const getTraceId = function () {
    return CoreUtils.uuid().replaceAll("-", "");
};

const getImageMessageParams = function (content: string, conversation: CopilotConversation, imageSource: string) {
    const uuid = CoreUtils.uuid();
    return {
        "arguments": [
            {
                "source": "cib",
                "optionsSets": [
                    "nlu_direct_response_filter",
                    "deepleo",
                    "disable_emoji_spoken_text",
                    "responsible_ai_policy_235",
                    "enablemm",
                    "dv3sugg",
                    "autosave",
                    "enable_user_consent",
                    "fluxmemcst",
                    "iyxapbing",
                    "iycapbing",
                    "galileo"
                ],
                "allowedMessageTypes": [
                    "ActionRequest",
                    "Chat",
                    "ConfirmationCard",
                    "Context",
                    "InternalSearchQuery",
                    "InternalSearchResult",
                    "Disengaged",
                    "InternalLoaderMessage",
                    "Progress",
                    "RenderCardRequest",
                    "RenderContentRequest",
                    "AdsQuery",
                    "SemanticSerp",
                    "GenerateContentQuery",
                    "SearchQuery",
                    "GeneratedCode",
                    "InternalTasksMessage",
                    "Disclaimer"
                ],
                "sliceIds": [],
                "verbosity": "verbose",
                "scenario": "CopilotMicrosoftCom",
                "plugins": [
                    {
                        "id": "c310c353-b9f0-4d76-ab0d-1dd5e979cf68",
                        "category": 1
                    }
                ],
                "traceId": getTraceId(),
                "conversationHistoryOptionsSets": [
                    "autosave",
                    "savemem",
                    "uprofupd",
                    "uprofgen"
                ],
                "gptId": "copilot",
                "isStartOfSession": true,
                "requestId": uuid,
                "message": {
                    "locale": "",
                    "market": "",
                    "region": "",
                    "location": "",
                    "userIpAddress": "",
                    "timestamp": moment().format(),
                    "imageUrl": "https://copilot.microsoft.com/images/blob?bcid=" + imageSource,
                    "originalImageUrl": "https://copilot.microsoft.com/images/blob?bcid=" + imageSource,
                    "adaptiveCards": [],
                    "author": "user",
                    "inputMethod": "Keyboard",
                    "text": content,
                    "messageType": "Chat",
                    "requestId": uuid,
                    "messageId": uuid
                },
                "tone": "Balanced",
                "extraExtensionParameters": {
                    "gpt-creator-persona": {
                        "personaId": "copilot"
                    }
                },
                "spokenTextMode": "None",
                "conversationId": conversation.conversationId,
                "participant": {
                    "id": conversation.clientId
                }
            }
        ],
        "invocationId": "0",
        "target": "chat",
        "type": 4
    };
};

const getCommonTextMessageParams = function (content: string, conversation: CopilotConversation) {
    const uuid = CoreUtils.uuid();

    return {
        "arguments": [
            {
                "source": "cib",
                "optionsSets": [
                    "nlu_direct_response_filter",
                    "deepleo",
                    "disable_emoji_spoken_text",
                    "responsible_ai_policy_235",
                    "enablemm",
                    "dv3sugg",
                    "iyxapbing",
                    "iycapbing",
                    "h3imaginative",
                    "clgalileo",
                    "up4resp14cst",
                    "cgptrngnp",
                    "gndlogcf",
                    "techinstgndcf",
                    "uprv4p1upd",
                    "localreducehho"
                ],
                "allowedMessageTypes": [
                    "ActionRequest",
                    "Chat",
                    "ConfirmationCard",
                    "Context",
                    "InternalSearchQuery",
                    "InternalSearchResult",
                    "Disengaged",
                    "InternalLoaderMessage",
                    "Progress",
                    "RenderCardRequest",
                    "RenderContentRequest",
                    "AdsQuery",
                    "SemanticSerp",
                    "GenerateContentQuery",
                    "SearchQuery",
                    "GeneratedCode",
                    "InternalTasksMessage",
                    "Disclaimer"
                ],
                "sliceIds": [
                    "inputdestf",
                    "gldidentitycf",
                    "301hlinks0",
                    "cmcchalcf",
                    "qnav2table1",
                    "fltlatest",
                    "ntbkwco",
                    "cntralign2",
                    "cntralign",
                    "bcece403c",
                    "romicmsg",
                    "romic",
                    "rwt2",
                    "sydtransjson",
                    "advtokall",
                    "cacblvsdscf",
                    "0301techgnds0",
                    "shopgpt",
                    "0329mupcst",
                    "0327cgptc",
                    "enstconncf",
                    "stconcf",
                    "0306flows0",
                    "gptsmobile",
                    "mgptsp",
                    "mgptspcop",
                    "0404redhoo",
                    "ntbkgoldcf",
                    "kcclickthru",
                    "kcclickt",
                    "cacfrwebt3",
                    "sswebtop1cf",
                    "sswebtop3",
                    "sstopnbg",
                    "styleoffss"
                ],
                "verbosity": "verbose",
                "scenario": "CopilotMicrosoftCom",
                "plugins": [],
                "traceId": CoreUtils.uuid().replaceAll("-", ""),
                "conversationHistoryOptionsSets": [
                    "autosave",
                    "savemem",
                    "uprofupd",
                    "uprofgen"
                ],
                "gptId": "copilot",
                "isStartOfSession": true,
                "requestId": uuid,
                "message": {
                    "locale": "zh-CN",
                    "market": "zh-CN",
                    "region": "",
                    "location": "",
                    "userIpAddress": "",
                    // "region": "HK",
                    // "location": "lat:47.639557;long:-122.128159;re=1000m;",
                    // "userIpAddress": "2404:c140:1f03:4:e0c3:2bff:fec3:4786",
                    "timestamp": moment().format(),
                    "adaptiveCards": [],
                    "author": "user",
                    "inputMethod": "Keyboard",
                    "text": content,
                    "messageType": "Chat",
                    "requestId": uuid,
                    "messageId": uuid
                },
                "tone": "Creative",
                "spokenTextMode": "None",
                "conversationId": conversation.conversationId,
                "participant": {
                    "id": conversation.clientId
                }
            }
        ],
        "invocationId": "0",
        "target": "chat",
        "type": 4
    };
};


export const sendFirstMessage = function (content: string, conversation: CopilotConversation, ws: WebSocket, imageSource?: string) {
    const t = imageSource ? getImageMessageParams(content, conversation, imageSource) : getCommonTextMessageParams(content, conversation);

    ws.send(formatSendMessage(t));
};

const findImageMessage = function (messages: any[]) {
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (message["contentType"] === "IMAGE") {
            return message;
        }
    }
};

const findCommonAdaptiveCardText = function (adaptiveBody: any[]) {
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < adaptiveBody.length; i++) {
        const body = adaptiveBody[i];
        if (body["type"] === "TextBlock" && !body["id"]) {
            return body["text"];
        }
    }
};

const findBlockIdAdaptiveCardText = function (adaptiveBody: any[]) {
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < adaptiveBody.length; i++) {
        const body = adaptiveBody[i];
        if (body["type"] === "TextBlock" && body["id"] === "AttributionsTextBlockID") {
            return body["text"];
        }
    }
};

export const getConversationResponseFromRaw = function (raw: string, c: CopilotConversation): ConversationResponse | null {
    const unknownError = new ConversationResponse({
        conversation_id: c.conversationId,
        message_type: ResponseMessageType.ERROR,
        error: new ChatError(ErrorCode.UNKNOWN_ERROR),
    });

    const conversationDone = new ConversationResponse({
        conversation_id: c.conversationId,
        message_type: ResponseMessageType.DONE,
    });

    const jsons = raw.split('\x1E');

    if (jsons.length) {
        try {
            const json0 = JSON.parse(jsons[0]);
            const json0Type = json0["type"];

            if (json0Type === 1) {
                const arg = json0["arguments"][0];
                const messages = arg["messages"];

                const response = new ConversationResponse({
                    conversation_id: c.conversationId,
                    message_type: ResponseMessageType.GENERATING,
                    title: "",
                });

                if (messages && messages[0]) {
                    const message = messages[0];

                    if (message['messageType'] === "Disengaged") {
                        response.error = new ChatError(ErrorCode.COPILOT_DISENGAGED);
                    }

                    const {text, messageId, adaptiveCards} = message;

                    response.message_id = messageId;

                    if (adaptiveCards && adaptiveCards.length) {
                        let messageText = "";
                        let attributionsTextBlock = "";
                        const adaptiveCard = adaptiveCards[0];

                        if (adaptiveCard["type"] === "AdaptiveCard") {
                            if (adaptiveCard["body"] && adaptiveCard["body"].length) {
                                messageText = findCommonAdaptiveCardText(adaptiveCard["body"]);
                                attributionsTextBlock = findBlockIdAdaptiveCardText(adaptiveCard["body"]);
                            }
                        }

                        if (messageText) {
                            if (attributionsTextBlock) {
                                messageText = messageText + "\n\n" + attributionsTextBlock;
                            }

                            response.message_text = messageText;

                            return response;
                        }

                    }

                    Logger.log('response.message_text', response.message_text);

                    response.message_text = text;

                    return response;
                }

                return response;
            } else if (json0Type === 7) {
                // currently ignore
                // return conversationDone
            } else if (json0Type === 2) {
                const item = json0["item"];
                if (item && item["result"]) {
                    const value = item["result"]["value"];

                    if (value === "InvalidRequest") {
                        return new ConversationResponse({
                            conversation_id: c.conversationId,
                            message_type: ResponseMessageType.ERROR,
                            error: new ChatError(ErrorCode.COPILOT_INVALID_REQUEST),
                        });
                    } else if(value === "UnauthorizedRequest") {
                        return new ConversationResponse({
                            conversation_id: c.conversationId,
                            message_type: ResponseMessageType.ERROR,
                            error: new ChatError(ErrorCode.UNAUTHORIZED),
                        });
                    } else if (value === "Success") {

                        const createImageMessage = findImageMessage(item["messages"]);
                        Logger.log('success =======================');
                        Logger.log('item', item, item["messages"], createImageMessage);
                        if (createImageMessage) {
                            const text = createImageMessage["text"];
                            const messageId = createImageMessage["messageId"];
                            conversationDone.appendix = new CopilotImageCreateAppendix(text, messageId);

                            return conversationDone;
                        }

                        return conversationDone;
                    } else if (value === "Throttled") {
                        return new ConversationResponse({
                            conversation_id: c.conversationId,
                            message_type: ResponseMessageType.ERROR,
                            error: new ChatError(ErrorCode.CONVERSATION_LIMIT),
                        });
                    } else if (value === "CaptchaChallenge") {
                        return new ConversationResponse({
                            conversation_id: c.conversationId,
                            message_type: ResponseMessageType.ERROR,
                            error: new ChatError(ErrorCode.CAPTCHA),
                        });
                    }
                }
            } else if (json0Type === 6) {
                // currently ignore
                // return new ConversationResponse({
                //     conversation_id: c.conversationId,
                //     message_type: ResponseMessageType.DONE,
                //     error: new ChatError("unknown error", ErrorCode.UNKOWN_ERROR),
                // })
            } else {
                return unknownError;
            }
        } catch (e) {
            return unknownError;
        }
    }

    return null;
};
