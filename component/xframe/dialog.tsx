import styleText from 'data-text:~style/panel-main.module.scss';
import type {PlasmoGetStyle} from "plasmo";
import type {SiteName} from "~provider/sidepanel/SidePanelProvider";

export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement("style");
    style.textContent = styleText;
    return style;
};

export default function XFrameDialog({onStartClick, siteName}: { onStartClick: () => void, siteName: SiteName }) {
    return <div
        className={"fixed top-0 left-0 right-0 bottom-0 flex justify-center items-center bg-black bg-opacity-50 text-black"}>
        <div className={"bg-white p-[16px] rounded-[6px] w-[80%] max-w-[340px]"}>
            <div className={'text-[18px] font-medium'}>Verification Required</div>
            <div className={'text-sm text-gray-500 mt-[10px]'}>
                <p>｢{siteName}｣ requires you to complete human verification. Clicking the button will open a new browser window.</p>
                <p className={'mt-[8px]'}>- Click the "Start Verification" button.</p>
                <p>- Complete the verification process in the newly opened browser window.</p>
                <p>- Once verification is complete, you can seamlessly use our plugin application.</p>
            </div>
            <div
                onClick={onStartClick}
                className={'mt-[16px] inline-flex cursor-pointer justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'}>
                Start Verification
            </div>
        </div>
    </div>;
}
