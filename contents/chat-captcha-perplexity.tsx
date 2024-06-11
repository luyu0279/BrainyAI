import type {PlasmoCSConfig, PlasmoGetStyle} from "plasmo";
import {useEffect, useState} from "react";
import styleText from "data-text:~base.scss";
import ChatCaptchaBanner from "~component/common/ChatCaptchaBanner";
import {PerplexityBot} from "~libs/chatbot/perplexity/PerplexityBase";
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
    matches: ['https://*.perplexity.ai/*--oiccw*'],
    all_frames: true,
    run_at: 'document_end'
};

export default function PerplexityInStandaloneChallengeWindow() {
    const [captchaSucceed, setCaptchaSucceed] = useState(false);
    const isOpenInPlugin = new URLSearchParams(location.search).get(IS_OPEN_IN_PLUGIN);

    const checkCaptchaSuccess = function () {
        const canonicalElement =  document.querySelectorAll("title");

        if (canonicalElement.length) {
            const success = canonicalElement[0]?.textContent?.toLowerCase() === "perplexity";
            setCaptchaSucceed(success);
        }
    };

    useEffect(() => {
        const id = setInterval(checkCaptchaSuccess, 1000);

        return () => {
            clearInterval(id);
        };
    }, []);

    return <div>
        {isOpenInPlugin && !captchaSucceed && <ChatCaptchaBanner text={""} windowKey={PerplexityBot.CAPTCHA_WINDOW_KEY}/>}
        {captchaSucceed && <ChatCaptchaBanner closeWhileShow={true} windowKey={PerplexityBot.CAPTCHA_WINDOW_KEY}/> }
    </div>;
}
