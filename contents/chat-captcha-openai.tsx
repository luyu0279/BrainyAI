import type {PlasmoCSConfig, PlasmoGetStyle} from "plasmo";
import {useEffect, useState} from "react";
import styleText from "data-text:~base.scss";
import ChatCaptchaBanner from "~component/common/ChatCaptchaBanner";
import {OpenaiBot} from "~libs/chatbot/openai";
import {IS_OPEN_IN_PLUGIN} from "~utils";

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
    matches: ['https://chatgpt.com/*--oiccw*'],
    all_frames: true,
    run_at: 'document_end'
};

export default function OpenAiChatInStandaloneChallengeWindow() {
    const [captchaSucceed, setCaptchaSucceed] = useState(false);
    const isOpenInPlugin = new URLSearchParams(location.search).get(IS_OPEN_IN_PLUGIN);

    const checkCaptchaSuccess = function () {
        const canonicalElement =  document.querySelectorAll("title");

        if (canonicalElement.length) {
            setCaptchaSucceed(canonicalElement[0]?.textContent?.toLowerCase() === "chatgpt");
        }
    };

    useEffect(() => {
        const id = setInterval(checkCaptchaSuccess, 1000);

        return () => {
            clearInterval(id);
        };
    }, []);

    return <div>
        {isOpenInPlugin && !captchaSucceed && <ChatCaptchaBanner text={""} windowKey={OpenaiBot.CAPTCHA_WINDOW_KEY}/>}
        {captchaSucceed && <ChatCaptchaBanner closeWhileShow={true} windowKey={OpenaiBot.CAPTCHA_WINDOW_KEY}/> }
    </div>;
}
