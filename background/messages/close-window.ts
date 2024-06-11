import type {PlasmoMessaging} from "@plasmohq/messaging";

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    chrome.windows.remove(parseInt(req.body.windowId), function () {
        res.send('close window');
    });
};

export default handler;
