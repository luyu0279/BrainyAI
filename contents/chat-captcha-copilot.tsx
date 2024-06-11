import type {PlasmoCSConfig, PlasmoGetStyle} from "plasmo";
import {useState} from "react";
import styleText from "data-text:~base.scss";
import ChatCaptchaBanner from "~component/common/ChatCaptchaBanner";
import {CopilotBot} from "~libs/chatbot/copilot";

export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement("style");
    style.textContent =
        styleText + `#plasmo-overlay-0 {
        position: relative!important;
      }
    `;
    return style;
};


export const config: PlasmoCSConfig = {
    matches: ['https://copilot.microsoft.com/*--oiccw*'],
    all_frames: true,
    run_at: 'document_start'
};

export default function CopilotChatInStandaloneChallengeWindow() {
    const [captchaSucceed] = useState(true);


    return <div>
        {captchaSucceed && <ChatCaptchaBanner windowKey={CopilotBot.CAPTCHA_WINDOW_KEY}/>}
    </div>;
}
