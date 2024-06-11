import type {PlasmoMessaging} from "@plasmohq/messaging";
import {customChatFetch} from "~utils/custom-fetch-for-chat";
import {ChatError, ErrorCode} from "~utils/errors";
import {KimiBot} from "~libs/chatbot/kimi";

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const myHeaders = new Headers();
    myHeaders.append("accept", "*/*");
    myHeaders.append("content-type", "application/json");
    myHeaders.append("origin", "https://kimi.moonshot.cn");
    // TODO
    myHeaders.append("r-timezone", "Asia/Shanghai");
    myHeaders.append("referer", "https://kimi.moonshot.cn/");
    myHeaders.append("Origin", "https://kimi.moonshot.cn");
    // myHeaders.append("x-traffic-id", "7351723399195934466");
    const accessToken =  await KimiBot.getAccessToken();

    if(accessToken) {
        myHeaders.append("Authorization", `Bearer ${accessToken}`);
    }

    const raw = JSON.stringify({
        "offset": 0,
        "size": 10,
        "query": " "
    });

    const r = await customChatFetch("https://kimi.moonshot.cn/api/prompt-snippet/instance",  {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    });

    if(r.error) {
        return res.send([r.error, null]);
    }

    try {
        const result = await r.response?.json();
        res.send([null, result]);
    } catch (e) {
        res.send([new ChatError(ErrorCode.UNKNOWN_ERROR), null]);
    }
};

export default handler;
