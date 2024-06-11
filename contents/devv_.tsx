import type {PlasmoCSConfig} from "plasmo";
import {useEffect} from "react";
import {DEVV_SEARCH_KEY, openInPlugin} from "~utils";


export const config: PlasmoCSConfig = {
    matches: ['https://devv.ai/*'],
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    exclude_globs: ["https://devv.ai/search*"],
    all_frames: true,
    run_at: "document_end"
};

export default function Devv() {

    function insertText() {
        const searchText = getSearchText();

        if (searchText) {
            const findTextAreaInterval = setInterval(function () {
                const els = document.querySelectorAll('textarea');
                let t: HTMLTextAreaElement | null = null;

                if(!els.length) { return; }


                clearInterval(findTextAreaInterval);

                t = els[0];

                setTimeout(function () {
                    t?.focus();
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                    nativeInputValueSetter?.call(t, searchText);

                    const event = new Event('input', {bubbles: true});
                    t?.dispatchEvent(event);

                    setTimeout(function () {
                        const searchButton = document.querySelectorAll("button[aria-label='Search']")[0] as HTMLButtonElement;
                        if (searchButton) {
                            searchButton.click();
                        }
                    }, 20);
                }, 50);
            }, 50);
        }
    }

    function getSearchText() {
        const urlObj = new URL(location.href);
        const urlParams = urlObj.searchParams;
        return urlParams.get(DEVV_SEARCH_KEY);
    }

    useEffect(() => {
        if (openInPlugin(location.href)) {
            insertText();
        }
    }, []);

    return <div>

    </div>;
}
