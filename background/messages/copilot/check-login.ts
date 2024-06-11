import type {PlasmoMessaging} from "@plasmohq/messaging";
import {customChatFetch} from "~utils/custom-fetch-for-chat";
import {createUuid} from "~utils";

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const myHeaders = new Headers();
    myHeaders.append("x-ms-client-request-id", createUuid());
    myHeaders.append("x-ms-useragent", "azsdk-js-api-client-factory/1.0.0-beta.1 core-rest-pipeline/1.12.3 OS/macOS");

    const request = await customChatFetch("https://copilot.microsoft.com/turing/conversation/create?bundleVersion=1.1655.0", {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    });

    if (request.error) {
        res.send([request.error, false]);
    }

    const text = await request?.response?.text();

    res.send([null, !!text]);
};

export default handler;
