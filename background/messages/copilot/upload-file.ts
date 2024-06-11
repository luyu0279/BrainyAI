import type {PlasmoMessaging} from "@plasmohq/messaging";
import { customChatFetch} from "~utils/custom-fetch-for-chat";

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const {conversationId, imageBase64} = req.body;

    const myHeaders = new Headers();
    myHeaders.append("origin", "https://copilot.microsoft.com");
    myHeaders.append("referer", "https://copilot.microsoft.com/");

    const formData = new FormData();
    const rawData = {
        "imageInfo": {},
        "knowledgeRequest": {
            "invokedSkills": [
                "ImageById"
            ],
            "subscriptionId": "Bing.Chat.Multimodal",
            "invokedSkillsRequestData": {
                "enableFaceBlur": true
            },
            "convoData": {
                "convoid": conversationId,
                "convotone": "Balanced"
            }
        }
    };

    formData.append("knowledgeRequest", JSON.stringify(rawData));
    formData.append("imageBase64", imageBase64);


    const request = await customChatFetch("https://copilot.microsoft.com/images/kblob?--cua=1", {
        method: "POST",
        headers: myHeaders,
        body: formData,
        redirect: "follow"
    });

    if(request.error) {
        return res.send([request.error, null]);
    }

    const response = await request?.response?.json();
    return res.send([null, response]);
};

export default handler;
