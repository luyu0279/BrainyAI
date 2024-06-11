import type {PlasmoMessaging} from "@plasmohq/messaging";
import {customChatFetch} from "~utils/custom-fetch-for-chat";
import {ChatError, ErrorCode} from "~utils/errors";
import {KimiBot} from "~libs/chatbot/kimi";

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const myHeaders = new Headers();
    myHeaders.append("content-type", "application/json");
    myHeaders.append("accept", "*/*");
    myHeaders.append("origin", "https://kimi.moonshot.cn");
    // TODO
    myHeaders.append("r-timezone", "Asia/Shanghai");
    myHeaders.append("referer", "https://kimi.moonshot.cn/");
    // myHeaders.append("x-traffic-id", "co3939ucp7fct0va4ocg");

    const accessToken =  await KimiBot.getAccessToken();

    if(accessToken) {
        myHeaders.append("Authorization", `Bearer ${accessToken}`);
    }

    const raw = JSON.stringify({
        "name": "unnamed session",
        "is_example": false
    });

    const r = await customChatFetch("https://kimi.moonshot.cn/api/chat",  {
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
