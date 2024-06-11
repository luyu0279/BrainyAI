import type {PlasmoMessaging} from "@plasmohq/messaging";

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const {width, height, screenWidth, screenHeight} = req.body;

    const left = Math.round((screenWidth / 2) - (width / 2));
    const top = Math.round((screenHeight / 2) - (height / 2));

    delete req.body.screenWidth;
    delete req.body.screenHeight;

    chrome.windows.create(
        {...req.body, width, height, left, top}, function (w) {
            res.send(w?.id);
        }
    );
};

export default handler;
