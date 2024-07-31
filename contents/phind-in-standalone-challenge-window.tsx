import type {PlasmoCSConfig} from "plasmo";
import CInStandaloneWindowChallenge from "~component/xframe/challenge/c-in-standalone-window-challenge";
import {SiteName} from "~provider/sidepanel/SidePanelProvider";

export const config: PlasmoCSConfig = {
    matches: ['https://*.phind.com/*--oppcw*'],
    all_frames: true,
    run_at: 'document_start'
};

export default function PhindInChallengeWindow() {
    const targetSourceValidator = function () {
        const canonicalElement = document.querySelector('link[rel="search"]');

        if (canonicalElement) {
            const href = canonicalElement.getAttribute('title');
            return href?.indexOf("phind.com") !== -1;
        }

        return false;
    };

    return <div>
        <CInStandaloneWindowChallenge siteName={SiteName.PHIND}
            verifySuccessValidator={targetSourceValidator}/>
    </div>;
}
