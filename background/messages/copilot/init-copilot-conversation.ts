import type {PlasmoMessaging} from "@plasmohq/messaging";
import {ConversationResponse, ResponseMessageType} from "~libs/open-ai/open-ai-interface";
import {ChatError, ErrorCode} from "~utils/errors";
import {customChatFetch} from "~utils/custom-fetch-for-chat";
import {Logger} from "~utils/logger";

export interface CopilotConversation {
    conversationSignature: string;
    encryptedConversationSignature: string;
    clientId: string;
    conversationId: string;
    result: {
        message: null | any;
        value: string;
    };
}

class CoreUtils {
    static clamp(O: any, B: any, U: any) {
        return isNaN(O) || O <= B ? B : O >= U ? U : O;
    }

    static uuid() {
        return (this.partUUID() + this.partUUID() + "-" + this.partUUID() + "-" + this.partUUID() + "-" + this.partUUID() + "-" + this.partUUID() + this.partUUID() + this.partUUID()).toLowerCase();
    }

    static partUUID() {
        return (65536 * (1 + Math.random()) | 0).toString(16).substring(1);
    }
}

const runConversation = async function (): Promise<[ChatError | null, any]> {
    const myHeaders = new Headers();
    myHeaders.append("referer", "https://copilot.microsoft.com/?showconv=1");
    myHeaders.append("x-ms-client-request-id", CoreUtils.uuid());
    myHeaders.append("x-ms-useragent", "azsdk-js-api-client-factory/1.0.0-beta.1 core-rest-pipeline/1.12.3 OS/macOS");

    // return new Promise((resolve, reject) => {
    //     // @ts-ignore
    //     fetch("https://copilot.microsoft.com/turing/userconsent?bundleVersion=1.1678.0&isStartOfConversation=true", requestOptions)
    //         .then((response) => response.text())
    //         .then((result) => {
    //             try {
    //                 const data = JSON.parse(result)
    //
    //                 resolve(data)
    //             } catch (e) {
    //                 reject(e)
    //             }
    //         })
    //         .catch((error) => reject(error));
    // })
    const r = await customChatFetch("https://copilot.microsoft.com/turing/userconsent?bundleVersion=1.1678.0&isStartOfConversation=true", {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    });

    if (r.error) {
        return [r.error, null];
    }

    try {
        return [null, JSON.parse(await r.response!.text())];
    } catch (e) {
        return [new ChatError(ErrorCode.UNKNOWN_ERROR), null];
    }
};

const createConversation = async function (): Promise<[ChatError | null, CopilotConversation | null]> {
    const myHeaders = new Headers();
    myHeaders.append("accept", "application/json");
    myHeaders.append("referer", "https://copilot.microsoft.com/");
    myHeaders.append("sec-fetch-mode", "cors");
    myHeaders.append("sec-fetch-site", "same-origin");
    myHeaders.append("x-ms-client-request-id", CoreUtils.uuid());
    myHeaders.append("x-ms-useragent", "azsdk-js-api-client-factory/1.0.0-beta.1 core-rest-pipeline/1.12.3 OS/macOS");

    const r = await customChatFetch("https://copilot.microsoft.com/turing/conversation/create?bundleVersion=1.1655.0", {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    });

    if (r.error) {
        return [r.error, null];
    }

    try {
        const headers = r.response?.headers;
        const conversationSignature = headers?.get("X-Sydney-Conversationsignature") || "";
        const encryptedConversationSignature = headers?.get("X-Sydney-Encryptedconversationsignature");
        const text = await r.response?.text();

        if(!text) {
            return [new ChatError(ErrorCode.UNAUTHORIZED), null];
        }

        const data = JSON.parse(text);

        return [null, {
            ...data,
            conversationSignature,
            encryptedConversationSignature
        }];
    } catch (e) {
        Logger.log("headers==", e);
        return [new ChatError(ErrorCode.UNKNOWN_ERROR), null];
    }
};

let lastConversation: CopilotConversation | null = null;

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const {conversationId, withRun} = req.body;
    const conversationErr = new ConversationResponse({
        conversation_id: conversationId,
        message_type: ResponseMessageType.ERROR,
    });
    Logger.trace('init-copilot-conversation', req.body);
    try {
        if (conversationId && lastConversation?.conversationId === conversationId) {
            res.send([null, lastConversation]);
            Logger.trace('init-copilot-conversation 0', req.body);
            return;
        }

        const [conversationCreateErr, conversation] = await createConversation();

        Logger.trace('init-copilot-conversation 1', conversationCreateErr, conversation);

        if (conversationCreateErr) {
            conversationErr.error = conversationCreateErr;

            return res.send([conversationCreateErr, null]);
        }

        if(withRun) {
            const [runErr] = await runConversation();

            Logger.trace('init-copilot-conversation 2', runErr);
            if (runErr) {
                conversationErr.error = runErr;

                return res.send([runErr, null]);
            }
        }

        lastConversation = conversation;
        res.send([null, conversation]);
    } catch (e) {
        Logger.error('init-copilot-conversation err', e);
        conversationErr.error = new ChatError(ErrorCode.UNKNOWN_ERROR);
        res.send([conversationErr, null]);
    }
};

export default handler;
