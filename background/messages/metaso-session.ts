import type {PlasmoMessaging} from "@plasmohq/messaging";

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/json, text/plain, */*");
    myHeaders.append("Accept-Language", "zh-CN,zh;q=0.9");
    myHeaders.append("Connection", "keep-alive");
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Origin", "https://metaso.cn");
    myHeaders.append("Sec-Fetch-Dest", "empty");
    myHeaders.append("Sec-Fetch-Mode", "cors");
    myHeaders.append("Sec-Fetch-Site", "same-origin");
    myHeaders.append("is-mini-webview", "0");

    const raw = JSON.stringify({
        "question": req.body.searchText,
        "mode": "detail",
        "engineType": ""
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const response = await fetch("https://metaso.cn/api/session", requestOptions);

        const result = await response.json();
        res.send(result);
    } catch (e) {
        res.send(null);
    }
};

export default handler;
