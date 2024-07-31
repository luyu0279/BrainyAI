import IconLogo from "data-base64:~assets/icon_ask_ai_small.svg";
import IconEnter from "data-base64:~assets/icon_enter.svg";
import React, {useContext, useEffect, useRef} from "react";
import {SidePanelContext} from "~provider/sidepanel/SidePanelProvider";
import {PanelRouterPath} from "~libs/constants";
import { MESSAGE_ACTION_SYNC_SEARCH_TEXT} from "~utils";
import {Logger} from "~utils/logger";

export default function SearchHome() {
    const {searchSites, setSearchText, navigation} = useContext(SidePanelContext);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const startSearch = function () {
        const value = textareaRef?.current?.value.trim();
        if(value) {
            setSearchText(value.replaceAll('\n', ' '));
            Logger.log('searchSites', searchSites, PanelRouterPath.SEARCH);
            if (navigation) {
                navigation(PanelRouterPath.SEARCH);
            }
        }
    };


    const listenMessage = function (request: any) {
        Logger.log('listenMessage====search engine', request);
        if (request.action === MESSAGE_ACTION_SYNC_SEARCH_TEXT) {
            setSearchText(request.data);
            if (navigation) {
                navigation(PanelRouterPath.SEARCH);
            }
        }
    };

    useEffect(() => {
        chrome.runtime.onMessage.addListener(listenMessage);

        return () => {
            chrome.runtime.onMessage.removeListener(listenMessage);
        };
    }, []);

    const handleKeyDown = function (event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === 'Enter' && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
            event.preventDefault();
            startSearch();
        }
    };

    return <div className={'p-[14px] max-w-[600px] m-auto'}>
        <img className={'w-[64px] h-[64px] block mb-[34px] m-auto'} src={IconLogo} alt=""/>
        <div className={'text-[18px] font-bold w-full mb-[24px] text-center'}>AI Work Assistant</div>
        <div className={'bg-[#F3F4F9] p-[14px] rounded-[16px]'}>
            <textarea onKeyDown={handleKeyDown} ref={textareaRef} autoFocus className={'bg-[#F3F4F9] w-full h-[60px] outline-0 resize-none text-[15px]'} placeholder={"Enter your question..."}/>
            <div className={'flex items-center justify-end text-[12px] cursor-pointer text-[#C2C2C2]'}>
                <div onClick={startSearch} className={'flex'}><img className={'w-[15px] mr-[4px] mt-[3px]'} src={IconEnter} alt=""/> Search</div>
            </div>
        </div>
        <div className={'grid-cols-2 grid gap-[20px] mt-[28px]'}>
            {
                searchSites.map(item => {
                    return <div key={item.name} className={'rounded-[20px] shadow flex flex-col justify-between p-[20px]'}>
                        <img className={'w-[20px] block mb-[6px]'} src={item.icon} alt=""/>
                        <div className={'text-[18px] font-bold'}>{item.name}</div>
                    </div>;
                })
            }
        </div>
    </div>;
}
