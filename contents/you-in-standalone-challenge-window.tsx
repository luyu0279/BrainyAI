import type {PlasmoCSConfig} from "plasmo";
import CInStandaloneWindowChallenge from "~component/xframe/challenge/c-in-standalone-window-challenge";
import {SiteName} from "~provider/sidepanel/SidePanelProvider";

export const config: PlasmoCSConfig = {
    matches: ['https://you.com/*--oppcw*'],
    all_frames: true,
    run_at: 'document_start'
};

export default function PhindInChallengeWindow() {
    const targetSourceValidator = function () {
        const meatOg = document.querySelector('meta[property="og:url"]');

        if (meatOg) {
            const href = meatOg.getAttribute('content');
            return href?.indexOf("you.com") !== -1;
        }

        return false;
    };

    return <div>
        <CInStandaloneWindowChallenge siteName={SiteName.YOU}
            verifySuccessValidator={targetSourceValidator}/>
    </div>;
}
