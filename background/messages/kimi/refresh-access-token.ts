import type {PlasmoMessaging} from "@plasmohq/messaging";
import {customChatFetch} from "~utils/custom-fetch-for-chat";
import {ChatError, ErrorCode} from "~utils/errors";
import {KimiBot} from "~libs/chatbot/kimi";

export const kimiRefreshAccessToken = async (): Promise<[ChatError | null, any]> => {
    const myHeaders = new Headers();
    myHeaders.append("authorization", "Bearer " + (await KimiBot.getRefreshToken()));
    myHeaders.append("referer", "https://kimi.moonshot.cn/");
    myHeaders.append("Origin", "https://kimi.moonshot.cn");

    const request = await customChatFetch("https://kimi.moonshot.cn/api/auth/token/refresh", {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    });

    if(request.error) {
        return [request.error, null];
    }

    try {
        const result = await request.response?.json();

        if(result['error_type'] === "auth.token.invalid") {
            return [new ChatError(ErrorCode.UNAUTHORIZED), null];
        }

        if(result["access_token"] && result["refresh_token"]) {
            KimiBot.setAccessToken(result["access_token"]);
            KimiBot.setRefreshToken(result["refresh_token"]);
            return [null, result];
        }
        return [new ChatError(ErrorCode.UNAUTHORIZED), null];

    } catch (e) {
        return [new ChatError(ErrorCode.UNKNOWN_ERROR), null];
    }
};

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    // const myHeaders = new Headers();
    // myHeaders.append("authorization", "Bearer " + (await KimiBot.getRefreshToken()));
    // myHeaders.append("referer", "https://kimi.moonshot.cn/");
    // myHeaders.append("Origin", "https://kimi.moonshot.cn");
    //
    // const request = await customChatFetch("https://kimi.moonshot.cn/api/auth/token/refresh", {
    //     method: "GET",
    //     headers: myHeaders,
    //     redirect: "follow"
    // })
    //
    // if(request.error) {
    //     return res.send([request.error, null])
    // }
    //
    // try {
    //     const result = await request.response.json()
    //
    //     if(result['error_type'] === "auth.token.invalid") {
    //         return res.send([new ChatError(ErrorCode.UNAUTHORIZED), null])
    //     }
    //
    //     if(result["access_token"] && result["refresh_token"]) {
    //         KimiBot.setAccessToken(result["access_token"])
    //         KimiBot.setRefreshToken(result["refresh_token"])
    //         res.send([null, result])
    //     } else {
    //         return res.send([new ChatError(ErrorCode.UNAUTHORIZED), null])
    //     }
    // } catch (e) {
    //     res.send([new ChatError(ErrorCode.UNKNOWN_ERROR), null])
    // }
    res.send(await kimiRefreshAccessToken());
};

export default handler;
