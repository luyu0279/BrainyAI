import type {PlasmoCSConfig} from "plasmo";
import CInStandaloneWindowChallenge from "~component/xframe/challenge/c-in-standalone-window-challenge";
import {Logger} from "~utils/logger";
import {MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS} from "~utils";
import {CopilotBot} from "~libs/chatbot/copilot";

export const config: PlasmoCSConfig = {
    matches: ['https://copilot.microsoft.com/*--opaw*'],
    all_frames: true,
    run_at: 'document_start'
};

export default function CopilotInStandaloneAuthWindow() {
    const validator = function () {
        const userName = document.querySelector('#id_n')?.getAttribute("title");
        let haveUserAvatar = false;
        const userAvatar = document.querySelectorAll('.id_avatar');
        Logger.log('userName', userName);

        if(userAvatar.length > 0) {
            // eslint-disable-next-line @typescript-eslint/prefer-for-of
            for (let i = 0; i < userAvatar.length; i++) {
                if(userAvatar[i]?.getAttribute("src")?.startsWith('http')) {
                    haveUserAvatar = true;
                    break;
                }
            }
        }

        const authed = userName && haveUserAvatar;

        if(authed) {
            const copilotAuthKey = new URLSearchParams(location.search).get(CopilotBot.AUTH_WINDOW_KEY);

            Logger.log("copilotAuthKey", copilotAuthKey);
            void chrome.runtime.sendMessage(chrome.runtime.id, {
                action: MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS,
                authKey: copilotAuthKey
            });
        }

        return !!authed;
    };

    return <div>
        <CInStandaloneWindowChallenge verifySuccessValidator={validator}/>
    </div>;
}
