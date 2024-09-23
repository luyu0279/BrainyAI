import type {PlasmoCSConfig, PlasmoGetStyle} from "plasmo";
import CInPanelChallenge from "~component/xframe/challenge/c-in-panel-challenge";
import styleText from 'data-text:~base.scss';
import {SiteName} from "~provider/sidepanel/SidePanelProvider";

export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement("style");
    style.textContent = styleText;
    return style;
};

export const config: PlasmoCSConfig = {
    matches: ['https://you.com/*'],
    all_frames: true
};

export default function You() {
    return <div>
        <CInPanelChallenge siteName={SiteName.YOU}/>
    </div>;
}
