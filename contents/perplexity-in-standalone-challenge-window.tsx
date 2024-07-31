import type {PlasmoCSConfig} from "plasmo";
import CInStandaloneWindowChallenge from "~component/xframe/challenge/c-in-standalone-window-challenge";
import {SiteName} from "~provider/sidepanel/SidePanelProvider";

export const config: PlasmoCSConfig = {
    matches: ['https://*.perplexity.ai/*--oppcw*'],
    all_frames: true,
    run_at: 'document_start'
};

export default function PerplexityInStandaloneChallengeWindow() {
    const targetSourceValidator = function () {
        const canonicalElement =  document.querySelectorAll("title");

        if (canonicalElement.length) {
            return canonicalElement[0]?.textContent?.toLowerCase() === "perplexity";
        }

        return false;
    };

    return <div>
        <CInStandaloneWindowChallenge siteName={SiteName.PERPLEXITY}
            verifySuccessValidator={targetSourceValidator}/>
    </div>;
}
