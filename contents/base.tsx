import type {PlasmoCSConfig, PlasmoGetStyle} from "plasmo";
import styleText from 'data-text:~base.scss';
import baseContentStyleText from 'data-text:~style/base-content.module.scss';
import * as baseContentStyle from '~style/base-content.module.scss';
import React, {useEffect, useRef, useState} from "react";
import {
    getLatestState,
    MESSAGE_ACTION_SET_PANEL_OPEN_OR_NOT,
    MESSAGE_ACTION_SET_QUOTING_CANCEL,
    MESSAGE_ACTION_SET_QUOTING_SELECTION_CLEAR_CURSOR,
    MESSAGE_ACTION_SET_QUOTING_SELECTION_TEXT,
    openInPlugin
} from "~utils";
import Icon from "data-base64:~assets/icon.png";
import AskEditIcon from "data-base64:~assets/icon_ask_content_edit.svg";
import CTooltip from "~component/common/CTooltip";
import {useStorage} from "@plasmohq/storage/dist/hook";
import {PromptDatas} from "~options/constant/PromptDatas";
import {Input, List, Popover} from "antd";
import {PromptTypes} from "~options/constant/PromptTypes";
import {getIconSrc} from "~options/component/AiEnginePage";
import {getImageSrc} from "~options/component/Card";
import popupSettingIcon from "data-base64:~assets/icon_popup_setting.svg";
import DingSelectIcon from "data-base64:~assets/icon_ding_select.svg";
import DingUnSelectIcon from "data-base64:~assets/icon_ding_unselect.svg";
import update from "immutability-helper";
import SmallAskAiIcon from "data-base64:~assets/icon_ask_ai_small.svg";
import askCloseIcon from "data-base64:~assets/icon_ask_close.svg";
import {IAskAi, openPanelAskAi, openPanelSearchInContent} from "~libs/open-ai/open-panel";
import SearchBannerIcon from "data-base64:~assets/icon_search_banner.svg";
import PupHeaderIcon from "data-base64:~assets/icon_pup_header.svg";
import {SearchBar} from "~options/component/SearchBar";
import {Logger} from "~utils/logger";
import {BASE_ZINDEX} from "~component/common/CPopover";

export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement("style");
    style.textContent = styleText + baseContentStyleText;
    return style;
};

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    exclude_globs: ["*opis=1*", "chrome://*", "*--oppcw*", "*--opaw*"],
    all_frames: false,
};

export function mergeAiMsg(msg:string,quotingText?:string):string{
    if(quotingText && quotingText.trim()){
        msg = msg+quotingText;
    }
    return msg;
}

/**
 * ask bar is show?
 */
let popIsShow = false;
/**
 * quick bar is show?
 */
let popIsShowByShortcuts = false;
/**
 * quick bar 1
 * ask bar 2
 */
let selectPopType = 1;

let tempHostNames:string[] = [];

export default function Base() {
    const [toolPositions, setToolPositions] = useState([0, 0]); // [x, y]
    const [showTool, setShowTool] = useState(false);
    const [selectedText, setSelectedText] = useState("");
    const divRef = useRef<HTMLDivElement>(null);
    const [showAskContent, setShowAskContent] = useState(false);
    const [showAskSearch, setShowAskSearch] = useState(false);
    const [askInputValue, setAskInputValue] = useState('');
    const [visible, setVisible] = useState(null);
    const [visiblePop, setVisiblePop] = useState(null);
    /**
     * quick bar Keyboard shortcuts is show?
     */
    const [visibleAsk, setVisibleAsk] = useState(false);
    const [cards, setCards] = useStorage('promptData', PromptDatas);
    const [quickConfigOpen, setQuickConfigOpen] = useState(false);
    const [closeHostNames, setCloseHostNames] = useStorage<string[]>('CloseHostNamesData', []);
    const appendCloseHostName = (newHostName: string) => {
        setCloseHostNames(prevNames => {
            if (!prevNames?.includes(newHostName)) {
                return [...prevNames ?? [], newHostName];
            }
            return prevNames;
        }).then(() => {
            Logger.log('newHostName add success:=========', closeHostNames);
        });
    };

    const appendTempCloseHostName = (newHostName: string) => {
        if (!tempHostNames.includes(newHostName)) {
            tempHostNames = [...tempHostNames, newHostName];
            Logger.log('newTempHostName add success: ', newHostName);
        }
    };

    function checkSelection() {
        const selection = window.getSelection();
        const selectionText = selection?.toString().trim();

        if (!selection?.isCollapsed && selectionText && selectionText.trim()){
            Logger.log('selectionText================', selectionText);
            setSelectedText(selectionText);
            const range = selection?.getRangeAt(0);

            const rect = range?.getBoundingClientRect();

            let x = (rect?.left ?? 0) + window.scrollX;

            let toolTipWidth = 280;

            if (divRef.current) {
                toolTipWidth = divRef.current.offsetWidth;
            }

            if (x + toolTipWidth > window.innerWidth) {
                x = window.innerWidth - toolTipWidth - 10;
            }

            setToolPositions([x, (rect?.bottom ?? 0) + window.scrollY + 10]);
            void chrome.runtime.sendMessage({action: MESSAGE_ACTION_SET_QUOTING_SELECTION_TEXT, data:selectionText});
            void showToolByConfig();
            setVisibleAsk(false);
            setShowAskSearch(false);
        } else {
            if(!popIsShowByShortcuts){
                setShowTool(false);
                sendMessageQuotingCancel();
            }
        }
    }

    async function showToolByConfig(){
        const hostname = window.location.hostname;
        const hostNames = await getLatestState(setCloseHostNames);
        Logger.log('hostname================', hostname);
        Logger.log('closeHostNames================', hostNames);
        Logger.log('!closeHostNames.includes(hostname)======',!hostNames?.includes(hostname));
        if (!hostNames?.includes(hostname) && !tempHostNames.includes(hostname)) {
            setShowTool(true);
        }
    }

    async function closeAsKQuickBtn(){
        const quickConfigOpen = await getLatestState(setQuickConfigOpen);
        if(!quickConfigOpen){
            setVisibleAsk(false);
        }
    }

    function showAskBar(isSelectText = false) {
        if(isSelectText){
            setShowAskContent(true);
        }else {
            setSelectedText('');
            setShowAskContent(false);
        }
        window?.getSelection()?.removeAllRanges();
        setShowTool(false);
        setAskInputValue('');
        setShowAskSearch(true);
    }


    const setPanelOpenOrNot = function () {
        void chrome.runtime.sendMessage({action: MESSAGE_ACTION_SET_PANEL_OPEN_OR_NOT});
    };

    const sendMessageQuotingCancel = function () {
        void chrome.runtime.sendMessage({action: MESSAGE_ACTION_SET_QUOTING_CANCEL});
    };

    const closeTool = function (e: React.MouseEvent<HTMLImageElement, MouseEvent>) {
        e.stopPropagation();
        setShowTool(false);
        sendMessageQuotingCancel();
    };

    const askBarContentCopy = function (e: React.MouseEvent<HTMLImageElement, MouseEvent>) {
        e.stopPropagation();
        Logger.log("askAi=========");
        setAskInputValue(selectedText);
        setShowAskContent(false);
        setSelectedText('');
    };

    const quickBarHeaderClick = function (e: React.MouseEvent<HTMLImageElement, MouseEvent>) {
        e.stopPropagation();
        Logger.log("askAi=========");
        showAskBar(true);
    };

    function goToSearch(msg:string) {
        if (msg && msg.trim()) {
            Logger.log(`search=========${msg}`);
            openPanelSearchInContent(msg);
            closeAllPop();
        }
    }

    async function goToSearchByAskBar() {
        const isQuotShow = await getLatestState(setShowAskContent);
        const quotingText = await getLatestState(setSelectedText);
        const askBarText = await getLatestState(setAskInputValue);
        const isAskBarShow = await getLatestState(setShowAskSearch);
        if(isAskBarShow){
            if (isQuotShow && quotingText && quotingText.trim() && askBarText && askBarText.trim()) {
                goToSearch(mergeAiMsg(askBarText,quotingText));
            } else if (askBarText && askBarText.trim()) {
                goToSearch(askBarText);
            } else if (isQuotShow && quotingText && quotingText.trim()) {
                goToSearch(quotingText);
            }
        }
    }

    async function sendAskAIDefault() {
        const isAskBarShow = await getLatestState(setShowAskSearch);
        const isQuotShow = await getLatestState(setShowAskContent);
        const askBarText = await getLatestState(setAskInputValue);
        const quotingText = await getLatestState(setSelectedText);
        Logger.log('sendAskAIDefault================',isAskBarShow,isQuotShow,askBarText,quotingText);
        if(isAskBarShow && askBarText && askBarText.trim()){
            if(isQuotShow && quotingText && quotingText.trim()){
                goToAskEngine(askBarText,undefined,quotingText);
            }else {
                goToAskEngine(askBarText);
            }
        }
    }

    async function sendAskAI(id:number) {
        const isQuotShow = await getLatestState(setShowAskContent);
        const quotingText = await getLatestState(setSelectedText);
        const askBarText = await getLatestState(setAskInputValue);
        const isAskBarShow = await getLatestState(setShowAskSearch);
        if(isAskBarShow){
            if (isQuotShow && quotingText && quotingText.trim() && askBarText && askBarText.trim()) {
                goToAskEngine(askBarText, id, quotingText);
            } else if (askBarText && askBarText.trim()) {
                goToAskEngine(askBarText, id, undefined);
            } else if (isQuotShow && quotingText && quotingText.trim()) {
                goToAskEngine(quotingText, id, undefined);
            }
        }
    }

    function goToAskEngine(msg:string,cardId?:number,quotingText?:string) {
        if (msg && msg.trim()) {
            if(cardId){
                Logger.log(`goToAskEngine===============${msg}`);
                const card = cards.find((card) => card.id === cardId);
                if (card != null) {
                    const iAskAI = new IAskAi({
                        prompt: card.text,
                        lang: card.language,
                        text: msg,
                        promptText:mergeAiMsg(msg,quotingText),
                        appendix: quotingText,
                        promptImageUri:card.imageKey,
                        promptImageTitle:card.title,
                        promptType: card.itemType==PromptTypes.CUSTOM?2:1
                    });
                    openPanelAskAi(iAskAI);
                }
            }else {
                const iAskAI = new IAskAi({
                    prompt: mergeAiMsg(msg,quotingText),
                    text:msg,
                    appendix: quotingText,
                });
                openPanelAskAi(iAskAI);
            }
            closeAllPop();
        }
    }

    function closeAllPop(isCancelQuot = true) {
        setShowTool(false);
        if(isCancelQuot){
            sendMessageQuotingCancel();
        }
        setShowAskContent(false);
        setShowAskSearch(false);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        setVisiblePop(false);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        setVisible(false);
        setSelectedText('');
        window?.getSelection()?.removeAllRanges();
    }

    useEffect(() => {
        Logger.log('chrome.runtime.onMessage.addListener============');
        chrome.runtime.onMessage.addListener(handleMessage);
        if (!openInPlugin(location.href)) {
            document.body.addEventListener('mouseup', () => {
                Logger.log(`mouseup ===============${showAskSearch}`);
                setTimeout(() => checkSelection());
            });

            document.body.addEventListener('mousedown', () => {
                Logger.log(`addEventListener mousedown ===============`);
                if(!popIsShowByShortcuts){
                    Logger.log(`mousedown popIsShowByShortcuts=============${popIsShowByShortcuts}`);
                    setShowTool(false);
                    sendMessageQuotingCancel();
                }
                if(!popIsShow){
                    Logger.log(`mousedown popIsShow=============${popIsShow}`);
                    setShowAskSearch(false);
                }

            });

            document.body.addEventListener('keydown', (e) => {
                if (e.shiftKey && e.metaKey && e.key === 'Enter') {
                    Logger.log('viewGroup shiftKey and metaKey and Enter ==============');
                    goToSearchByAskBar().then(() => {
                        Logger.log('goToSearchByAskBar is completed');
                    }).catch((error) => {
                        Logger.log('goToSearchByAskBar is Error: ', error);
                    });
                }else if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
                    e.preventDefault();
                    e.stopPropagation();
                    showAskBar();
                } else if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
                    Logger.log('i clicked');
                    e.preventDefault();
                    e.stopPropagation();
                    setPanelOpenOrNot();
                }

            });
        }
        return () => {
            Logger.log('chrome.runtime.onMessage.removeListener============');
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, []);

    function handleMessage(message: any) {
        Logger.log('message================', message);
        switch (message.action) {
        case MESSAGE_ACTION_SET_QUOTING_SELECTION_CLEAR_CURSOR:
            Logger.log('MESSAGE_ACTION_SET_QUOTING_SELECTION_CLEAR_CURSOR================');
            closeAllPop(false);
            break;
        }
    }

    const popupPrompt =  (
        <div className={baseContentStyle.popupPrompt}>
            <div className={baseContentStyle.header}>
                <div className={baseContentStyle.title} >Shortcut Menu</div>
                <img className={baseContentStyle.iconImage} src={popupSettingIcon} alt='' onClick={() => {
                    window.open(`chrome-extension://${chrome.runtime.id}/options.html`);
                }}/>
            </div>
            <List
                itemLayout="vertical"
                dataSource={cards}
                bordered={false}
                split={false}
                className={`hideScrollBar ${baseContentStyle.listWrap}`}
                renderItem={(car, index) => {
                    const ItemIcon = getIconSrc(car.imageKey);
                    return (
                        <List.Item className={baseContentStyle.listItem} onClick={(e) => itemClick(car,index,e)}>
                            <div className={baseContentStyle.listContent}>
                                <div className={baseContentStyle.leading} >
                                    {car.itemType === PromptTypes.CUSTOM ?
                                        <ItemIcon style={{fontSize: '16px', color: '#5E5E5E'}}/> :
                                        <img className={baseContentStyle.leadingIcon} src={getImageSrc(car.imageKey)} alt={''}/>}
                                    <div className={baseContentStyle.leadingText}>{car.title}</div>
                                </div>
                                <img className={baseContentStyle.pinIcon}
                                    src={car.isSelect?DingSelectIcon:DingUnSelectIcon} alt='' onClick={(e) =>{
                                        e.stopPropagation();
                                        setPromptIsDisplay(car,index,e);
                                    }}/>
                            </div>
                        </List.Item>
                    );
                }
                }>
            </List>
        </div>
    );

    const dealQuickBarVisibleConfig =  function (e: React.MouseEvent<HTMLElement, MouseEvent>, type: number) {
        e.stopPropagation();
        Logger.log('dealQuickBarVisibleConfig================', type);
        const currentDomain = window.location.hostname;
        if(type == 1){
            appendTempCloseHostName(currentDomain);
        }else if(type == 2){
            appendCloseHostName(currentDomain);
        }
        setQuickConfigOpen(false);
    };

    const popupQuickPromptConfig = (
        <div className={baseContentStyle.popupQuickConfig}>
            <div onClick={(e) => dealQuickBarVisibleConfig(e,1)}>Hide until Next visit</div>
            <div onClick={(e) => dealQuickBarVisibleConfig(e,2)}>Disable for this site</div>
        </div>
    );

    async function itemClick(car: any, index: number,e: React.MouseEvent<HTMLDivElement>) {
        e.stopPropagation();
        let msg = '';
        if(selectPopType == 1){
            msg = await getLatestState(setSelectedText);
        }else if(selectPopType == 2){
            msg = await getLatestState(setAskInputValue);
        }
        Logger.log('itemClick===============', car.id, index, msg);
        goToAskEngine(msg,car.id,undefined);
    }

    function setPromptIsDisplay(car: any, index: number,e: React.MouseEvent<HTMLImageElement>) {
        e.stopPropagation();
        Logger.log('setPromptIsDisplay===============', car, index);
        void setCards(
            update(cards, {
                [index]: {
                    isSelect: {$set: !car.isSelect},
                },
            }),
        );
    }

    const handleKeyDown = (e) => {
        if (e.shiftKey && e.metaKey && e.key === 'Enter') {
            Logger.log('input shiftKey and metaKey and Enter ==============');
            e.preventDefault();
            goToSearchByAskBar().then(() => {
                Logger.log('goToSearchByAskBar is completed');
            }).catch((error) => {
                Logger.log('goToSearchByAskBar is Error: ', error);
            });
        } else if (((e.metaKey || e.ctrlKey) || e.shiftKey) && e.key === 'Enter') {
            e.preventDefault();
            setAskInputValue(askInputValue + '\n');
        } else if (e.key === 'Enter') {
            Logger.log('e.Enter ==============');
            e.preventDefault();
            sendAskAIDefault().then(() => {
                Logger.log('sendAskAIDefault is completed');
            }).catch((error) => {
                Logger.log('sendAskAIDefault is Error: ', error);
            });
        }
    };

    return <div>
        {
            <div ref={divRef} style={{
                left: `${toolPositions[0]}px`,
                top: `${toolPositions[1]}px`,
                display: showTool ? 'block' : 'none',
                padding: '8px',
            }} className={'relative'} onMouseLeave={() => {
                void closeAsKQuickBtn();
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                }}
                className={'bg-white shadow-[0_4px_12px_0px_rgba(0,0,0,.2)] z-[1] overflow-hidden rounded-[8px] h-[32px] py-[4px] items-center'}>
                    <div
                        className={'pl-[4px] box-border flex justify-center cursor-pointer items-center'}>
                        <div className={'flex w-[28px] h-[28px] rounded-[4px] justify-center items-center bg-white hover:bg-[#F2F5FF]'}>
                            <img onClick={quickBarHeaderClick} className={'block w-[20px] h-[20px] mr-[4px]'}
                                src={PupHeaderIcon} alt=''/>
                        </div>
                        <div className={"w-[1px] h-[24px] bg-[#000000] opacity-20 mr-[4px]"}></div>
                    </div>
                    <div >
                        <SearchBar cards={cards} popupPrompt={popupPrompt} isVisible={visiblePop ?? false} onOpenChange={(visiblePopup) =>{
                            if(visiblePopup) {
                                selectPopType = 1;
                            }
                            popIsShowByShortcuts = visiblePopup;
                            Logger.log(`popIsShowByShortcuts=================${popIsShowByShortcuts}`);
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-expect-error
                            setVisiblePop(visiblePopup);}} onItemClick={(id)=>{goToAskEngine(selectedText,id,null);}} onItemSearchClick={()=>{goToSearch(selectedText);}}/>
                    </div>
                    <div className={"w-[1px] h-[24px] bg-[#000000] opacity-20 ms-[8px]"}></div>

                    <div onClick={() => {showAskBar();}} className={"cursor-pointer flex justify-center items-center"}>
                        <img className={'w-[20px] h-[20px] ms-[8px] me-[8px] cursor-pointer'} src={SmallAskAiIcon}
                            onMouseEnter={() => {
                                setVisibleAsk(true);
                            }} alt=''/>
                        {visibleAsk &&
                            <div className={'text-[#0A4DFE] text-[12px] font-[400] justify-start items-center me-[16px]'}>⌘
                                + J</div>}
                    </div>

                </div>
                <Popover zIndex={BASE_ZINDEX+100} overlayInnerStyle={{paddingLeft: 0, paddingRight:0,paddingTop:'8px',paddingBottom:'8px'}} title={null} content={popupQuickPromptConfig} arrow={false} placement='bottomLeft' open={quickConfigOpen}
                    onOpenChange={(isOpen) => {
                        Logger.log(`quickConfigOpen=================${isOpen}`);
                        setQuickConfigOpen(isOpen);}}>
                    {visibleAsk && <img className={'w-[16px] h-[16px] absolute top-0 right-0 cursor-pointer'} src={askCloseIcon} alt=''
                        onClick={closeTool}/>}
                </Popover>
            </div>
        }
        <div onClick={setPanelOpenOrNot}
            className={'fixed group right-[-50px] hover:quick-text:block transition-all bg-white hover:bg-[#CEDBFF] hover:right-0 cursor-pointer bottom-[18%] flex items-center rounded-l-[20px] h-[40px] w-[90px] shadow-[0_4px_24px_0px_rgba(0,0,0,.2)]'}>
            <img className={'block  w-[24px] h-[24px] ml-[8px]'} src={Icon} alt=''/>
            <div className={'quick-text text-[15px] hidden group-hover:block ml-[8px] text-[#0A4DFE]'}>⌘ + I</div>
        </div>

        <div onClick={() => showAskBar()}
            className={'fixed right-[6px] transition-all hover:right-[8px] cursor-pointer bottom-[calc(18%+65px)] flex justify-center items-center bg-white rounded-full h-[32px] w-[32px] shadow-xl transform hover:scale-110'}>
            <CTooltip title={'⌘ + J'} autoAdjustOverflow={true} placement="left" overlayStyle={{
                width: '70px',
                background: '#000000',
                borderRadius: '8px',
                boxShadow: '0 4px 12px 0px rgba(0,0,0,.2)'
            }} overlayInnerStyle={{textAlign: 'center'}}>
                <img className={'block w-[20px] h-[20px] mx-auto my-auto'} src={SearchBannerIcon} alt=''/>
            </CTooltip>
        </div>

        {showAskSearch && <div
            style={{
                position: 'fixed',
                left: `0`,
                right: '0',
                top: `25%`,
                minWidth: '378px',
                maxWidth: '600px',
                width:'40%',
                margin: "auto"
            }}
            className={'bg-white shadow-[0_4px_12px_0px_rgba(0,0,0,.2)] overflow-hidden rounded-[8px] relative flex flex-col'}>
            <div
                style={{display: showAskContent ? 'flex' : 'none'}}
                className={'justify-start bg-[#F2F5FF] leading-[24px] p-[16px] text-black font-weight-400 text-[15px]'}>
                <p>
                    {selectedText}
                    <CTooltip title="Edit a quote" autoAdjustOverflow={true} placement="bottom" overlayStyle={{
                        background: '#000000',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px 0px rgba(0,0,0,.2)'
                    }} overlayInnerStyle={{textAlign: 'center'}}>
                        <img onClick={askBarContentCopy}
                            className={'ml-[8px] inline-block align-text-bottom w-[16px] h-[16px]'} src={AskEditIcon}
                            alt=''/>
                    </CTooltip>
                </p>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', minHeight: '97px'}}>
                <Input.TextArea
                    value={askInputValue}
                    onChange={(e) => {
                        setAskInputValue(e.target.value);
                    }}
                    className={'p-[16px] border-none font-sans text-[15px] text-black leading-tight focus:outline-none focus:shadow-outline bg-transparent align-top overflow-auto whitespace-pre-wrap resize-none'}
                    placeholder={'Input your Question'}
                    autoFocus={true}
                    onKeyDown={(e) =>handleKeyDown(e)}
                />
                <div className={'flex flex-row justify-between mt-[8px] me-[16px] items-center mb-[8px]'}>
                    <div
                        className={'h-[25px] text-[#C2C2C2] bg-[#F3F4F9] rounded-tr-[8px] rounded-br-[8px] px-[8px] py-[4px] text-[12px] font-[400] me-[12px] whitespace-nowrap cursor-pointer flex justify-center items-center'} onClick={()=>sendAskAIDefault()}>{'⏎ AskAI'}</div>
                    <SearchBar cards={cards} popupPrompt={popupPrompt} isVisible={visible ?? false}
                        onOpenChange={(visibleAskPop) => {
                            Logger.log(`visibleAskPop=================${visibleAskPop}`);
                            if (visibleAskPop) {
                                selectPopType = 2;
                            }
                            popIsShow = visibleAskPop;
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-expect-error
                            setVisible(visibleAskPop);
                        }}
                        onItemClick={(id) => sendAskAI(id)}
                        onItemSearchClick={() => goToSearchByAskBar()}
                    />
                </div>
            </div>
        </div>
        }
    </div>;
}
