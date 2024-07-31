import React, {Fragment, memo, useContext, useEffect, useRef, useState} from "react";
import {SidePanelContext} from "~provider/sidepanel/SidePanelProvider";
import styleText, * as style from "~style/panel-main.module.scss";
import {Input, List, message, Modal, Popover, Tooltip, type UploadProps} from "antd";
import {CaretDownOutlined, LoadingOutlined, UploadOutlined} from "@ant-design/icons";
import {ConversationResponse, ResponseMessageType} from "~libs/open-ai/open-ai-interface";
import {ConversationContext, ConversationMessage, ConversationProvider} from "~provider/sidepanel/ConversationProvider";
import {IAskAi, openPanelSearchInContent} from "~libs/open-ai/open-panel";
import {
    createUuid,
    debounce,
    getLatestState,
    MESSAGE_ACTION_SET_QUOTING_CANCEL,
    MESSAGE_ACTION_SET_QUOTING_SELECTION_CLEAR_CURSOR,
    MESSAGE_ACTION_SET_QUOTING_SELECTION_TEXT,
    PROMPT_PLACEHOLDER_LANG,
    PROMPT_PLACEHOLDER_TEXT
} from "~utils";
import "~style/markdown.scss";
import "~style/modal.scss";
import ModelManagementProvider, {type M, ModelManagementContext, type Ms,} from "~provider/ModelManagementProvider";
import {type ChatError, ErrorCode} from "~utils/errors";
import hljs from 'highlight.js';
import "highlight.js/styles/idea.css";
import type {ConversationMessageAppendix} from "~component/MessageAppendix";
import RefreshIcon from "data-base64:~assets/refresh.png";
import CopyIcon from "data-base64:~assets/copy.png";
import QuotaIcon from "data-base64:~assets/quota.png";
import ArrowLIcon from "data-base64:~assets/arrow_l.png";
import ArrowRIcon from "data-base64:~assets/arrow_r.png";
import ArrowLDeepIcon from "data-base64:~assets/arrow_l_deep.png";
import ArrowRDeepIcon from "data-base64:~assets/arrow_r_deep.png";
import ChatInputCloseIcon from "data-base64:~assets/icon_chat_input_close.svg";
import {useStorage} from "@plasmohq/storage/dist/hook";
import {AskPromptData, AskPromptId, ImagePromptDatas, PdfPromptDatas, PromptDatas} from "~options/constant/PromptDatas";
import {getIconSrc} from "~options/component/AiEnginePage";
import {PromptTypes} from "~options/constant/PromptTypes";
import {getGrayImageSrc, getImageBlueSrc, getImageSrc} from "~options/component/Card";
import TriangleIcon from "data-base64:~assets/icon_triangle.svg";
import SendMsgIcon from "data-base64:~assets/icon_chat_send_msg.svg";
import {QuotingType} from "~sidepanel/constant/QuotingType";
import SearchBannerIcon from "data-base64:~assets/icon_search_banner.svg";
import {mergeAiMsg} from "~contents/base";
import eventBus from "~libs/EventBus";
import EventBus from "~libs/EventBus";
import CTooltip from "~component/common/CTooltip";
import TextQuota from "data-base64:~assets/text_quota.png";
import {Logger} from "~utils/logger";
import lottie from 'lottie-web';
import ErrorBoundary from "antd/lib/alert/ErrorBoundary";
import type {TextAreaRef} from "antd/es/input/TextArea";
import {ModelCheckList} from "~component/ModelCheckList";
import ModelSwitchImg from "data-base64:~assets/model_switch.svg";
import IconPdf from "data-base64:~assets/icon_pdf.svg";
import IconPic from "data-base64:~assets/icon_pic.svg";
import NewTag from "data-base64:~assets/new_tag.svg";
import markdownit from 'markdown-it';
import InputAttachmentIcon from "data-base64:~assets/icon_input_attachment.svg";
import Dragger from "antd/es/upload/Dragger";
import UploadCloseIcon from "data-base64:~assets/icon_upload_close.svg";
import UploadDeleteIcon from "data-base64:~assets/icon_upload_delete_no_click.svg";
import PdfIcon from "data-base64:~assets/icon_pdf_upload.svg";
import {FileTypes} from "~options/constant/FileTypes";
import {UploadUtils} from "~utils/UploadUtils";
import QuoteCardIcon from "data-base64:~assets/icon_quote_card.svg";
import DownloadCardIcon from "data-base64:~assets/icon_download_card.svg";
import FileBgIcon from "data-base64:~assets/icon_file_bg.svg";
let abortController:AbortController;

let popIsShow = false;
let currentBotsTemp:Ms = [];
const MAX_FILE_SIZE = 20 * 1024 * 1024;//20MB
/**
 *import ImageNotExistsIcon from "data-base64:~assets/icon_not_exist_image.svg";
 *import PdfNotExistsIcon from "data-base64:~assets/icon_not_exist_pdf.svg";
*/

export const getStyle = () => {
    const style = document.createElement("style");
    style.textContent = styleText;
    return style;
};

const md = markdownit({
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre><code  style="background-color: #F6F8FA" class="hljs">' +
                    hljs.highlight(str, { language: lang, ignoreIllegals: true}).value +
                    '</code></pre>';
            } catch (__) {/*ignore*/}
        }
        // Logger.log('markdownit====================');

        return '<pre><code style="background-color: #F6F8FA" class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
    },
    linkify: true,
    html: true,
    typographer: true
});

md.use(function(md) {
    const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

    md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
        const aIndex = tokens[idx].attrIndex('target');
        if (aIndex < 0) {
            tokens[idx].attrPush(['target', '_blank']);
        } else {
            tokens[idx].attrs[aIndex][1] = '_blank';
        }
        return defaultRender(tokens, idx, options, env, self);
    };
});


const YourComponent = ({ markdownText }) => {
    // Logger.log('markdownText:==============', markdownText);
    const html = md.render(markdownText);
    return (
        <div className={'markdown'} dangerouslySetInnerHTML={{ __html: html }}></div>
    );
};

const PromptTags = ({ cards, itemClick,onVisibleTagChange }) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const [visibleTag, setVisibleTag] = useState<number[]>([]);

    const checkInViewport = () => {
        Logger.log('checkInViewport=======');
        const arr: number[] = [];
        if (rootRef && rootRef.current) {
            rootRef.current.querySelectorAll('.tagAnchor').forEach((item, index) => {
                if (isElementInViewportX(item as HTMLElement)) {
                    arr.push(index);
                }
            });
        }
        setVisibleTag([...arr]);
        onVisibleTagChange([...arr]);
    };

    const handleResize = debounce(checkInViewport, 200);

    useEffect(() => {
        Logger.log('useEffect===checkInViewport');
        checkInViewport();
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    function isElementInViewportX(el: HTMLElement) {
        const rect = el.getBoundingClientRect();
        Logger.log('isElementInViewportX',rect.left, rect.right, window.innerWidth || document.documentElement.clientWidth);
        return (
            rect.left >= 0 &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth) - 30
        );
    }

    return <div ref={rootRef} className={'flex-row-reverse flex w-full justify-start items-center overflow-hidden hideScrollBar'}>
        {
            cards?.map((item, index) => {
                const ItemIcon = getIconSrc(item.imageKey);
                Logger.log(`item.imageKey:==========${item.imageKey}==========${item.imageKey != null}`);
                return <div key={index} className={'flex flex-row justify-start items-center'} style={{
                    visibility: visibleTag.includes(index) ? 'visible' : 'hidden',
                }}>
                    <div className={'w-[1px] h-[25px] me-[2px] tagAnchor'}></div>
                    <div
                        className={'bg-[#0057FF1A] rounded-[50px] flex flex-row justify-center items-center h-[25px] px-[12px] py-[4px] ms-[8px] cursor-pointer hover:bg-[#0057FF33]'}
                        onClick={(e) => itemClick(item, index, e)}>
                        {item.imageKey != null && <div className={'w-[16px] h-[16px] mr-[4px] cursor-pointer'}>
                            {item.itemType === PromptTypes.CUSTOM ? <ItemIcon style={{fontSize: '16px', color: '#0057FF',}}/> : <img className={'w-[16px] h-[16px]'} src={getImageBlueSrc(item.imageKey)} alt={''}/>}
                        </div>}
                        <div className={'text-[#0057FF] text-[12px] whitespace-nowrap'}>{item.title}</div>
                    </div>
                </div>;
            })
        }
    </div>;
};

const AIError = memo(function ({model, error, start, setCurrentBotResponseMessage, activePage}:
                                       {
                                           model: M,
                                           error: ChatError,
                                           start: () => void,
                                           setCurrentBotResponseMessage: React.Dispatch<React.SetStateAction<ConversationResponse[]>>,
                                           activePage: number
                                       }) {
    const {conversationId} = useContext(ConversationContext);

    useEffect(() => {
        Logger.log('000000-----',error?.code, model.botName, model.requireLogin);
        if (error?.code !== ErrorCode.UNAUTHORIZED) {
            EventBus.emit('errorManagement',true, model);
        }
    }, []);

    const openLogin = async function () {
        const r = await new model({globalConversationId: conversationId}).startAuth();

        if (r) {
            void clickRefresh();
        }
    };

    const openCaptcha = async function () {
        const r = await new model({globalConversationId: conversationId}).startCaptcha();

        if (r) {
            void clickRefresh();
        }
    };

    const clickRefresh = async () => {
        setCurrentBotResponseMessage(pre => {
            const updatedData = [...pre];
            updatedData[activePage - 1] = {} as ConversationResponse;
            return updatedData;
        });
        EventBus.emit('errorManagement',false, model);

        start();
    };

    const BlueBtn = ({text,handleClick}:{text: string, handleClick: () => void}) => {
        return <div onClick={handleClick} className='w-fit cursor-pointer mt-4 px-6 h-[31px] bg-[#0A4DFE] rounded-[8px] text-white text-[14px] font-medium flex items-center justify-center'>{text}</div>;
    };

    const switchModel = () => {
        EventBus.emit('model-switch');
    };

    const getError = function () {
        let errMessage: React.ReactNode;

        const { botName: name} = model;

        Logger.trace('get error', error);

        switch (error?.code) {
        case ErrorCode.REQUEST_TIMEOUT_ABORT:
            errMessage =
                    <div className='w-fit'>
                        <CatAnimation/>
                        <div className='mt-4 text-[12px] leading-loose'>If there is no response for a long time, please try to refresh manually.
                            <u className='cursor-pointer text-[#0A4DFE]' onClick={clickRefresh}> Click to Refresh</u>
                        </div>
                    </div>;
            break;
        case ErrorCode.UNAUTHORIZED:
            errMessage =
                    <div className='w-fit'>
                        <div className='text-base font-bold mb-2'>Login Required</div>
                        <div>Please log in to your <u className={"text-[#0A4DFE]"} onClick={openLogin}>{name}</u> account to continue.</div>
                        <BlueBtn text='Log in' handleClick={openLogin} />
                    </div>;
            break;
        case ErrorCode.CAPTCHA:
            errMessage =
                    <div className='w-fit'>
                        <div className='text-base font-bold mb-2'>Verification Required</div>
                        <div>You need to complete the {name} Captcha Challenge to continue using it. Please proceed to the challenge.</div>
                        <BlueBtn text='Go verify' handleClick={openCaptcha} />
                    </div>;
            break;
        case ErrorCode.CONVERSATION_LIMIT:
            errMessage =
                <div className='w-fit'>
                    <div className='text-base font-bold mb-2'>Oops! 3rd-Party Error</div>
                    {error?.message ? <div className='mb-3'>{error?.message}</div> :
                        <div className='mb-3'>Conversation limit reached. Please try it later. Or you can check your
                            <u className={"text-[#0A4DFE] cursor-pointer"} onClick={openCaptcha}> {name} </u> account for
                            more.</div>}
                    <u className={"text-[14px] text-[#0A4DFE] cursor-pointer"} onClick={clickRefresh}>Click to
                        Refresh</u>
                </div>;
            break;
        case ErrorCode.COPILOT_DISENGAGED:
        case ErrorCode.MODEL_INTERNAL_ERROR:
            errMessage =
                    <div className='w-fit'>
                        <div className='text-base font-bold mb-2'>Oops! 3rd-Party Error</div>
                        <div className='mb-3'>{error?.message ?? `This model's current conversation is no longer available. Please try to reload the ${name} service manually.`}</div>
                        <u className={"text-[14px] text-[#0A4DFE] cursor-pointer"} onClick={clickRefresh}>Click to Refresh</u>
                    </div>;
            break;
        case ErrorCode.UPLOAD_FILE_NOT_SUPPORTED:
            errMessage =
                    <div className='w-fit'>
                        <div className='text-base font-bold mb-2'>Oops! 3rd-Party Error</div>
                        <div className='mb-3'>This model cannot support PDF/Image analysis functions. You can switch models to access this function.</div>
                        <u className={"text-[14px] text-[#0A4DFE] cursor-pointer"} onClick={switchModel}>Click to Switch</u>
                    </div>;
            break;
        case ErrorCode.MODEL_NO_PERMISSION:
            errMessage =  <div className='w-fit'>
                <div className='text-base font-bold mb-2'>Oops! Access Denied! </div>
                <div className='mb-3'>{`Sorry, you currently don't have access to this model. Please visit the 3rd-party website to activate or check your ${name} permissions.`}</div>
                <u className={"text-[14px] text-[#0A4DFE] cursor-pointer"}>Click to Switch</u>
            </div>;
            break;
        case ErrorCode.FILE_OTHER:
            errMessage =
                    <div className='w-fit'>
                        <div className='text-base font-bold mb-2'>Oops! 3rd-Party Error</div>
                        <div className='mb-3'>The current model encountered an error while analyzing the image/PDF file. You can switch models to proceed with your request.</div>
                        <u className={"text-[14px] text-[#0A4DFE] cursor-pointer"} onClick={switchModel}>Click to Switch</u>
                    </div>;
            break;
        case ErrorCode.NETWORK_ERROR:
        case ErrorCode.COPILOT_WEBSOCKET_ERROR:
        case ErrorCode.COPILOT_INVALID_REQUEST:
        default:
            errMessage =
                    <div className='w-fit'>
                        <div className='text-base font-bold mb-2'>Oops! The Message Went Missing</div>
                        <div className='leading-loose'>Please refresh after check:</div>
                        <ul className='list-disc leading-loose pl-4'>
                            <li>Ensure the internet connection is stable or try to switch networks.</li>
                            <li>Make sure your <u className={"text-[#0A4DFE] cursor-pointer"} onClick={openCaptcha}>{name}</u> account is available for messaging.</li>
                        </ul>
                        <BlueBtn text='Refresh' handleClick={clickRefresh} />
                    </div>;
        }

        return errMessage;
    };

    return <div className='text-[#5E5E5E]'>
        {getError()}
    </div>;
});

const CatAnimation = () => {
    const catRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const animationRef = lottie.loadAnimation({
            container: catRef!.current!, // the dom element that will contain the animation
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: chrome.runtime.getURL("/resources/loading.json") // the path to the animation json
        });
        return () => {
            animationRef.destroy();
        };
    },[]);

    return <div className='flex justify-center w-[100%]' >
        <div className='w-20 h-20' ref={catRef}></div>
    </div>;
};

const Thinking = () => {
    return <CatAnimation />;
};

const AIMessageAppendix = memo(({appendix}: { appendix?: ConversationMessageAppendix }) => {
    if (appendix) {
        return appendix?.render();
    }

    return null;
});

const getPrompt = function (message: ConversationMessage): string {
    return message.data.prompt.replaceAll(PROMPT_PLACEHOLDER_TEXT, `"${message.data.promptText}"`).replaceAll(PROMPT_PLACEHOLDER_LANG, `"${message.data.lang}"`);
};

const AITextContent = ({bot, message, pref, i}: {
    bot: M,
    message: ConversationMessage,
    pref: React.RefObject<HTMLDivElement>,
    i: number
}) => {
    const {conversationId, messages} = useContext(ConversationContext);
    const [currentBotResponseMessage, setCurrentBotResponseMessage] = useState<ConversationResponse[]>([{message_type: ResponseMessageType.GENERATING}]);
    const [activePage, setActivePage] = useState(1);
    const {messageApi} = useContext(SidePanelContext);

    useEffect(() => {
        void start();
    }, []);

    const start = () => {
        if (message.data.prompt) {
            const prompt = getPrompt(message);
            const rid = createUuid();
            const fileRefToken = UploadUtils.getFileRefToken(message,bot.botName);
            Logger.log(`sendMsgInfo:===botName:${bot.botName}===prompt:${prompt}=====fileRefToken:${fileRefToken}====rid:${rid}`);
            void new bot({globalConversationId: conversationId}).completion({
                prompt,
                rid,
                cb: async (_rid, data) => {
                    // Logger.log('resData===========', data);
                    if (_rid === rid) {
                        if (data.message_type !== ResponseMessageType.DONE) {
                            const index = await getLatestState(setActivePage);
                            setCurrentBotResponseMessage(pre => {
                                const updatedData = [...pre];
                                // Logger.log('updatedData:', updatedData);
                                updatedData[index - 1] = data;
                                // return [...pre.slice(0,pre.length-1), data]
                                return updatedData;
                            });
                        } else {
                            setCurrentBotResponseMessage(pre => {
                                if (pre && pre.length > 0) {
                                    pre[pre.length - 1].appendix = data?.appendix;
                                    pre[pre.length - 1].message_type = data.message_type;
                                }

                                return pre;
                            });
                        }

                        Logger.log(pref);
                        // if (pref.current) {
                        //     pref.current.scrollIntoView({behavior: "smooth"});
                        // }
                    }
                },
                file: message.data.uploadFile?.length ? message.data.uploadFile[4] ?? undefined : undefined,
                fileRef : fileRefToken,
            });
        }
    };


    const refreshClick = async () => {
        setCurrentBotResponseMessage(pre => [...pre, {} as ConversationResponse]);
        const botResMsg = await getLatestState(setCurrentBotResponseMessage);
        setActivePage(botResMsg.length);
        start();
    };

    const copyClick = async () => {
        navigator.clipboard.writeText(currentBotResponseMessage[activePage - 1].message_text ?? '').then(() => {
            void messageApi.info('Copied successfully');
        });
    };

    const quotaClick = () => {
        eventBus.emit('quota-click', {
            title: QuotingType.QUOTE,
            content: currentBotResponseMessage[activePage - 1].message_text ?? ''
        });
    };

    const pageChange = (direction) => {
        if (direction === 'l' && activePage > 1) {
            setActivePage(activePage - 1);
        }

        if (direction === 'r' && activePage < currentBotResponseMessage.length) {
            setActivePage(activePage + 1);
        }
    };

    const getCardOperateArea = function (isLastChatInList: boolean, item: ConversationResponse) {
        return <div>
            {!item.error && <div
                className={`group-hover:visible flex justify-between items-center  ${isLastChatInList ? 'visible' : 'invisible'}`}>
                <div className="pl-[16px] flex items-center">
                    {
                        isLastChatInList && <CTooltip title={"Regenerate"}>
                            <img src={RefreshIcon} className="w-[16px] h-[16px] mr-[8px] cursor-pointer"
                                onClick={refreshClick}
                                alt=""/>
                        </CTooltip>
                    }
                    <CTooltip title={"Copy"}>
                        <img src={CopyIcon} className="w-[16px] h-[16px] mr-[8px] cursor-pointer"
                            onClick={copyClick}
                            alt=""/>
                    </CTooltip>
                    <CTooltip title={"Quote"}>
                        <img src={QuotaIcon} className="w-[16px] h-[16px] cursor-pointer" onClick={quotaClick}
                            alt=""/>
                    </CTooltip>
                </div>
                {isLastChatInList && <div className="pr-[16px] flex items-center">
                    <img src={activePage == 1 ? ArrowLIcon : ArrowLDeepIcon}
                        className='cursor-pointer w-[6px] h-[10px]' alt="" onClick={() => pageChange('l')}/>
                    <div className='mx-[8px] text-[12px] text-[#5E5E5E]'>
                        <span className='text-[#0057FF]'>{activePage}</span>
                        <span> / </span>
                        <span className=''>{currentBotResponseMessage.length}</span>
                    </div>
                    <img src={activePage == currentBotResponseMessage.length ? ArrowRIcon : ArrowRDeepIcon}
                        className='cursor-pointer w-[6px] h-[10px]' alt="" onClick={() => pageChange('r')}/>
                </div>}
            </div>}
        </div>;
    };

    const getMessageContent = function (item: ConversationResponse): React.ReactNode {
        if (item && item.message_text) {
            return <ErrorBoundary><YourComponent markdownText={item.message_text}/></ErrorBoundary>;
        }

        if (!item.error && !item.message_text && item.message_type !== ResponseMessageType.DONE) {
            return <Thinking/>;
        }

        return null;
    };

    return<div>
        {
            currentBotResponseMessage.map((item,index) => {
                return <div className={activePage === index+1 ? 'block' : 'hidden'} key={index}>
                    <div className='px-4 pb-4 rounded-b-[10px] mb-2 bg-white'>
                        {
                            <div className="select-text w-full relative self text-[15px]">
                                {getMessageContent(item)}
                            </div>
                        }
                        {
                            item.error ? <AIError start={start} setCurrentBotResponseMessage={setCurrentBotResponseMessage} activePage={activePage} model={bot} error={item.error}/> : null
                        }
                        {/*<AIError start={start} setCurrentBotResponseMessage={setCurrentBotResponseMessage} activePage={activePage} model={bot} error={{code: ErrorCode.REQUEST_TIMEOUT_ABORT, message: 'test'}}/>*/}
                        <AIMessageAppendix appendix={item?.appendix}/>
                    </div>

                    {getCardOperateArea(i === messages.length - 1, item)}
                </div>;
            })
        }
    </div>;
};

interface errorModels {
    modelName: string,
}

export const AIMessage = memo(({message, i}: {
            message: ConversationMessage, i: number
        }) => {
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const [, setModelTab] = useState<Ms>([]);
    const [activeTab, setActiveTab] = useState(0);
    const {currentBots,setCurrentBots, allModels, saveCurrentBotsKeyLocal} = useContext(ModelManagementContext);
    const [errorModels, setErrorModels] = useState<errorModels[]>([]);
    const [botProviders, setBotProviders] = useState<Ms>(message.botProviders || []);
    const {messages} = useContext(ConversationContext);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const switchRef = useRef<HTMLImageElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setModelTab(currentBots);

        EventBus.on('errorManagement', (errorShow: boolean, model: M) => {
            if (model) {
                if (errorShow) {
                    setErrorModels((pre) => [...pre, {modelName: model.botName}]);
                }else {
                    setErrorModels((pre) => pre.filter(item => item.modelName !== model.botName));
                }
            }
        });

        EventBus.on('model-switch', () => {
            setPopoverOpen(true);
        });

        window.addEventListener('mousedown', (e: MouseEvent) => {
            if (e.target !== switchRef.current && !popoverRef.current!.contains(e.target as Node) ) {
                setPopoverOpen(false);
            }
        });
    }, []);

    const handleTabChange = (index: number) => {
        setActiveTab(index);
    };

    const singleModelCheck = async (model: M) => {
        setErrorModels((pre) => pre.filter(item => item.modelName !== model.botName));

        setCurrentBots(pre => {
            return pre.map((item, i) => {
                if (i === activeTab) {
                    return model;
                }
                return item;
            });
        });

        setBotProviders(await getLatestState(setCurrentBots));

        message.botProviders = await getLatestState(setCurrentBots);

        saveCurrentBotsKeyLocal();

        setPopoverOpen(false);
    };

    const popoverContent = () => {
        return <div ref={popoverRef}>
            {
                allModels.current.filter(item => !currentBots.includes(item)).map((model,index) => {
                    return <div onClick={() => singleModelCheck(model)} key={index} className={`group relative w-[310px] h-10 px-4 box-border  flex justify-between items-center hover:bg-gradient-to-r hover:from-[#E5ECFF]`}>
                        <div className='flex items-center justify-start'>
                            <div className="w-1 h-full bg-[#0A4DFE] absolute left-0 top-0 hidden group-hover:block"/>
                            <div className='w-4 h-4 mr-2'>
                                <img className={'w-full h-full'} src={model.logoSrc} alt=""/>
                            </div>
                            <span className='mr-1 text-[14px]'>{model.botName}</span>
                            {model.paidModel &&
                                <div
                                    className="h-5 box-border px-2 py-1 rounded bg-[#C2C2C2] bg-opacity-20 text-[10px] text-[#C2C2C2] font-bold">3rd-paid
                                </div>
                            }
                        </div>
                        <div className="flex justify-end items-center">
                            {model.supportUploadPDF && <img className='ml-1' src={IconPdf} alt=""/>}
                            {model.supportUploadImage && <img className='ml-1' src={IconPic} alt=""/>}
                            {model.maxTokenLimit && <div
                                className="ml-1 h-5 box-border px-1 py-0.5 rounded bg-[#4948DB1A] bg-opacity-10 text-[12px] text-[#4948DB] font-medium">{Math.round(model.maxTokenLimit / 1000)}k</div>}
                        </div>
                        {
                            model.newModel && <img src={NewTag} className='w-6 h-6 absolute right-0 top-0' alt=""/>
                        }
                    </div>;
                })
            }
        </div>;
    };

    return (
        <div ref={messageContainerRef} className={style.messageItemOuter + ' justify-start mb-[20px]'}>
            {/*<div className={style.roleIconBox + ' mr-[8px]'}>*/}
            {/*    <img className={style.aiIcon} src={AIAvatar} alt=""/>*/}
            {/*</div>*/}

            <div className={`${style.contentArea} ${style.l} flex-1 group`}>
                {/*overflow-x-auto*/}
                <div className='text-[#333333]'>
                    <div className='px-4 pt-4 pb-3 bg-white rounded-t-[10px]'>
                        <div className={style.modelTab}>
                            {
                                botProviders.map((Bot, index) => {
                                    return (
                                        <div onClick={() => handleTabChange(index)} key={index}
                                            className={`${style.tabItem} ${index === activeTab ? style.active : ''}`}>
                                            <Tooltip title={Bot.botName} placement={"top"}>
                                                <div className='flex items-center overflow-hidden'>
                                                    <img className='w-4 h-4' src={Bot.logoSrc} alt=""/>
                                                    <div className='truncate'>{Bot.botName}</div>
                                                </div>
                                            </Tooltip>
                                            {messages.length - 1 === i &&
                                                errorModels.map((item) => {
                                                    return (
                                                        item.modelName === Bot.botName && index === activeTab &&
                                                        <div
                                                            key={item.modelName}
                                                            className="absolute w-6 h-6 top-[-10px] right-[-6px]">
                                                            <Tooltip title={'Try switching models'}>
                                                                <Popover overlayClassName='modelPopover'
                                                                    open={popoverOpen}
                                                                    content={popoverContent} title={null}
                                                                    trigger={'click'}>
                                                                    <img ref={switchRef} className='w-6 h-6' src={ModelSwitchImg} onClick={() => setPopoverOpen(true)}
                                                                        alt=""/>
                                                                </Popover>
                                                            </Tooltip>
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    )
                                    ;
                                })
                            }
                        </div>
                    </div>
                    {
                        botProviders.map((Bot, index) => {
                            return <div key={index}>
                                <div className={activeTab === index ? 'block' : 'hidden'}>
                                    <AITextContent key={Bot.botName} bot={Bot} message={message} pref={messageContainerRef} i={i}/>
                                </div>
                            </div>;
                        })
                    }
                </div>
            </div>
        </div>
    );
}
);
export const UserMessage = ({message}: { message: ConversationMessage }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const ItemIcon = getIconSrc(message.data.promptImageUri ? message.data.promptImageUri : undefined);
    const {messageApi} = useContext(SidePanelContext);

    Logger.log('user_message:', message);

    useEffect(() => {
        setTimeout(function () {
            if (containerRef.current) {
                containerRef.current.scrollIntoView({behavior: "smooth"});
            }
        }, 20);
    }, [containerRef]);

    const copyClick = async () => {
        navigator.clipboard.writeText(message?.data?.text ?? "").then(() => {
            void messageApi.info('Copied successfully');
        });
    };

    const quotaClick = () => {
        eventBus.emit('quota-click', {title: QuotingType.QUOTE, content: message.data.text});
    };

    const quotaUploadFileClick = () => {
        eventBus.emit('quota-uploadFile', {uploadData: message.data.uploadFile});
    };

    const downloadFile = () => {
        const file: File | null = message.data.uploadFile![4];
        if (file) {
            const url = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.name);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            void messageApi.success('Downloaded successfully');
        }
    };

    return (
        <div ref={containerRef} className={style.messageItemOuter + ' justify-end mb-[20px]'}>
            <div className={`${style.contentArea} ${style.r} group`}>
                <div className='overflow-x-auto text-white rounded-[10px] justify-start'>
                    <div className='bg-[#4948DB] text-sm p-4'>
                        {
                            message.data.promptImageTitle &&
                            <div
                                className="bg-[#333] bg-opacity-50 rounded-[50px] text-[12px] flex items-center px-3 w-fit h-6 " style={{marginBottom:message.data.text?8:0}}>
                                {
                                    message.data.promptImageUri && (message.data.promptType === 2 ?
                                        <ItemIcon className='w-4 h-4 text-[13px] text-white text-opacity-80'/> :
                                        <img className='w-4 h-4' src={getGrayImageSrc(message.data.promptImageUri!)} alt=""/>)
                                }
                                <span className='text-white text-opacity-80 ml-2'>{message.data.promptImageTitle}</span>
                            </div>
                        }
                        {/*{getPrompt(message)}*/}
                        {message.data.text && <div
                            className="select-text relative whitespace-pre-wrap self leading-[1.5em] text-white text-opacity-90"
                        >{message.data.text}</div>}
                    </div>
                    {message.data.isHaveUploadFile && <div className={'bg-[#E7E9F0]'}>
                        {message.data.uploadFile![3] == FileTypes.Image ?
                            <div className={'flex relative p-[4px] max-w-[200px] max-h-[300px]'}>
                                <img className={'rounded-[10px] object-cover w-full'} src={message.data.uploadFile ? message.data.uploadFile[0] : ''} alt=''/>
                                <div className={'flex absolute right-[12px] top-[12px] flex-row-reverse justify-end '}>
                                    <CTooltip title={'Download'}>
                                        <div
                                            className={style.actionButton} onClick={downloadFile}>
                                            <img className={'w-[16px] h-[16px]'} src={DownloadCardIcon} alt={''}/>
                                        </div>
                                    </CTooltip>
                                    <CTooltip title={'Quote'}>
                                        <div
                                            className={style.actionButton} onClick={quotaUploadFileClick}>
                                            <img className={'w-[16px] h-[16px]'} src={QuoteCardIcon} alt={''}/>
                                        </div>
                                    </CTooltip>
                                </div>
                            </div> :
                            <div className={'flex flex-row justify-between items-center h-[60px]'}>
                                <div>
                                    <div className={'flex flex-row justify-start items-center overflow-hidden'}>
                                        <div
                                            className={'w-[48px] h-[48px] flex-shrink-0 ml-[12px] rounded-[8px] border-dashed border-[1px] border-[#0A4DFE] bg-[#E6EDFF] flex justify-center items-center'}>
                                            <div className={'w-[24px] h-[24px] flex justify-center items-end'} style={{backgroundImage: `url(${FileBgIcon})`}}>
                                                <div className={'flex text-[#0A4DFE] text-[5px] font-[700] overflow-hidden whitespace-nowrap break-all justify-center items-center mb-[3px]'}>{message.data.uploadFile![1].split('.').pop()?.substring(0, 4)}</div>
                                            </div>
                                        </div>
                                        <div
                                            className={'text-[#0A4DFE] text-[14px] ml-[16px] line-clamp-1 text-ellipsis break-all pr-[24px]'}>{message.data.uploadFile![1]}</div>
                                    </div>
                                </div>
                                <div className={'flex flex-row-reverse mr-[10px]'}>
                                    <CTooltip title={'Download'}>
                                        <div
                                            className={style.actionButton} onClick={downloadFile}>
                                            <img className={'w-[16px] h-[16px]'} src={DownloadCardIcon} alt={''}/>
                                        </div>
                                    </CTooltip>
                                    <CTooltip title={'Quote'}>
                                        <div
                                            className={style.actionButton} onClick={quotaUploadFileClick}>
                                            <img className={'w-[16px] h-[16px]'} src={QuoteCardIcon} alt={''}/>
                                        </div>
                                    </CTooltip>
                                </div>
                            </div>
                        }
                    </div>
                    }
                    {
                        message.data.appendix &&
                        <div className='p-4 bg-[#E5E6ED]'>
                            <CTooltip trigger={"click"} overlayInnerStyle={{
                                maxHeight: "300px",
                                overflowY: 'scroll',
                                padding: "12px",
                                scrollbarWidth: "none"
                            }} overlayStyle={{
                                backdropFilter: 'blur(4px)',
                                fontSize: '12px',
                                lineHeight: '18px',
                                backgroundColor: "rgb(229, 229, 233)",
                                color: "rgba(0, 0, 0, 0.88)",
                                letterSpacing: 'normal',
                                width: "65%",
                                maxWidth: '400px'
                            }} title={message.data.appendix}>
                                <div
                                    className={'cursor-pointer line-clamp-2 text-ellipsis text-[#333333] text-opacity-60 '}>
                                    {message.data.appendix}
                                </div>
                            </CTooltip>
                        </div>
                    }
                </div>

                {!message.data.isHaveUploadFile && <div className="group-hover:visible pr-[16px] flex items-center justify-end mt-2 invisible">
                    <CTooltip title={"Copy"}>
                        <img src={CopyIcon} className="w-[16px] h-[16px] mr-[8px] cursor-pointer"
                            onClick={copyClick}
                            alt=""/>
                    </CTooltip>
                    <CTooltip title={"Quote"}>
                        <img src={QuotaIcon} className="w-[16px] h-[16px] cursor-pointer" onClick={quotaClick}
                            alt=""/>
                    </CTooltip>
                </div>}
            </div>


            {/*<div className={style.roleIconBox + ' pt-1 ml-[8px] bg-[#000]'}>*/}
            {/*    <img src={UserAvatar} alt="" className={style.userIcon} />*/}
            {/*    /!*<div className={style.roleTitle}>You</div>*!/*/}
            {/*</div>*/}
        </div>
    );
};

const MessageList = memo(() => {
    const {messages} = useContext(ConversationContext);
    const quotaRef = useRef<HTMLImageElement>(null);
    const [toolPositions, setToolPositions] = useState([0, 0]); // [x, y]
    const [showTool, setShowTool] = useState(false);
    const [selectedText, setSelectedText] = useState("");

    useEffect(() => {
        document.body.addEventListener('mousedown', (e: MouseEvent) => {
            if (e.target !== quotaRef.current) {
                setShowTool(false);
            }
        });
    }, []);

    const checkSelection = () => {
        const selection = window.getSelection();
        const selectionText = selection?.toString().trim();

        if (!selection?.isCollapsed && selectionText && selectionText.trim()) {
            Logger.log('selectionText================', selectionText);
            setSelectedText(selectionText);

            const range = selection?.getRangeAt(selection.rangeCount - 1);
            const rects = range?.getClientRects();

            if (rects) {
                const lastCharacterRect = rects[rects.length - 1];
                const lastPosition = lastCharacterRect.right - 40;

                setToolPositions([lastPosition, lastCharacterRect.bottom + window.scrollY]);

                setShowTool(true);
            }
        }
    };

    const handleClickQuota = () => {
        setShowTool(false);
        eventBus.emit('quota-click', {title: QuotingType.QUOTE, content: selectedText ?? ''});
    };

    return <div className={style.chatList}>
        <div>
            {
                messages?.map((message, index) => {
                    return <div onMouseUp={checkSelection} id={`message-${index}`} key={message.id}
                        className="">{message.foree === "user" ?
                            <UserMessage key={message.id} message={message}/> :
                            <AIMessage key={message.id} message={message} i={index}/>}</div>;
                })
            }
            {showTool &&
                    <img ref={quotaRef} onClick={handleClickQuota} className='fixed w-15 h-10' src={TextQuota} alt=""
                        style={{left: `${toolPositions[0]}px`, top: `${toolPositions[1]}px`,}}/>
            }
        </div>
    </div>;
});

function ConversationContent() {
    const {currentBots,setCurrentBots} = useContext(ModelManagementContext);
    const {setMessages} = useContext(ConversationContext);
    const ref = React.useRef<TextAreaRef>(null);
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
    const [cards] = useStorage('promptData', PromptDatas);
    const [pdfCards] = useStorage('pdfPromptData', PdfPromptDatas);
    const [imageCards] = useStorage('imagePromptData', ImagePromptDatas);
    const [quotingText, setQuotingText] = useState(['', '']);
    const [isHaveQuotingText, setIsHaveQuotingText] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [inputWarnShow, setInputWarnShow] = useState(false);
    const [isPromptPopShow, setIsPromptPopShow] = useState(false);
    const [quickPromptBtn, setQuickPromptBtn] = useState<[number, string]>([AskPromptId, 'AskAI']);
    const promptPop = useRef(null);
    const [promptVisibleTag, setPromptVisibleTag] = useState<number[]>([]);
    const [isUploadAttachment, setIsUploadAttachment] = useState(false);
    const [isUploading, setIsUploading] = useState<[boolean, boolean, string, string, Map<string, string>, FileTypes, File | null]>([false, false, '', '', new Map(), FileTypes.OTHERS, null]);
    const {conversationId} = useContext(ConversationContext);
    const [uploadBorderColor, setUploadBorderColo] = useState('#C2C2C2');
    const [uploadBackgroundColor, setUploadBackgroundColor] = useState('#FFFFFF');

    useEffect(() => {
        eventBus.on('quota-click', ({title, content}) => showQuotingText(title, content));
        eventBus.on('quota-uploadFile', ({uploadData}) => {
            hideQuotingText();
            setIsUploading([true,false,uploadData[0],uploadData[1],uploadData[2],uploadData[3],uploadData[4]]);
        });
    }, []);

    const handleOpenChange = (newOpen: boolean) => {
        setModelSelectorOpen(newOpen);
        Logger.log('currentBots==========', currentBots);
        // setIsShowMore(false);
        void refreshUploadFile(newOpen);
    };

    async function refreshUploadFile(newOpen: boolean){
        const isUploadingInfo = await getLatestState(setIsUploading);
        const Bots = await getLatestState(setCurrentBots);
        if(!newOpen && isUploadingInfo[0] && currentBotsTemp.length>0 && isUploadingInfo[6]!= null && !Bots.every(bot => currentBotsTemp.includes(bot))){
            void fileUpload(isUploadingInfo[6]);
        }
    }

    const getModelLoginTag = function (model) {
        return model.requireLogin ? "Login Required" : "No Login Required";
    };

    const modelSelectorModal = (
        <Modal destroyOnClose className='modelModal' title={null} closeIcon={false} width={600}
            style={{top: 60, bottom: 0, }} footer={null}
            open={modelSelectorOpen} onCancel={() => handleOpenChange(false)}>
            <ModelCheckList onClose={() => handleOpenChange(false)} />
        </Modal>
    );

    const currentModelView = () => {
        return <div onClick={() => showModelSelector(true)}
            className={'cursor-pointer rounded-[40px] bg-[#F3F4F9] px-3 text-[12px] h-[25px] flex justify-center items-center'}>
            {
                currentBots.length &&
                currentBots.map(item => {
                    return (
                        <div key={item.botName} className={'flex justify-center items-center'}>
                            <Tooltip title={item.botName} placement={"top"}>
                                <img className={'mr-2 w-[16px] h-[16px]'}
                                    src={item.logoSrc} alt=''/>
                            </Tooltip>

                            {currentBots.length === 1 && `${item.botName}(${getModelLoginTag(item)})`}
                        </div>
                    );
                })
            }
            <CaretDownOutlined className={'ml-[4px]'}/>
        </div>;
    };

    async function showModelSelector(isShow: boolean) {
        const isUploadingInfo = await getLatestState(setIsUploading);
        if(isUploadingInfo[0] && isUploadingInfo[1]){
            void message.warning('File is uploading, please wait a moment.');
            return;
        }
        handleOpenChange(isShow);
    }

    async function showQuotingText(title: QuotingType, content: string) {
        const isQuotShow = await getLatestState(setIsUploading);
        if(isQuotShow[0]){
            return;
        }
        if (title && content) {
            const titleText = title.toString();
            Logger.log('titleText', titleText, content);
            setQuotingText([titleText, content]);
            setIsHaveQuotingText(true);
        }
    }

    function hideQuotingText() {
        setQuotingText(['', '']);
        setIsHaveQuotingText(false);
    }

    useEffect(() => {
        chrome.runtime.onMessage.addListener(handleMessage);
        document.body.addEventListener('mousedown', handleMouseDown);

        document.body.addEventListener('keydown', (e) => {
            if (e.shiftKey && e.metaKey && e.code === 'Enter') {
                goToSearch(e).then(() => {
                    Logger.log('goToSearchByAskBar is completed');
                }).catch((error) => {
                    Logger.log('goToSearchByAskBar is Error: ', error);
                });
            }
        });

        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage);
            document.body.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    const handleMouseDown = (e: MouseEvent) => {
        Logger.log(`mousedown handleMouseDown===============${popIsShow}`);
        if (popIsShow) {
            const popComponent = promptPop.current;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            if (popComponent && !popComponent.contains(e.target)) {
                Logger.log(`mousedown closePromptPopup=============${popIsShow}`);
                setIsPromptPopShow(false);
            }
        }
    };

    function handleMessage(message: any) {
        switch (message.action) {
        case MESSAGE_ACTION_SET_QUOTING_SELECTION_TEXT:
            void showQuotingText(QuotingType.SELECTION, message.data);
            break;
        case MESSAGE_ACTION_SET_QUOTING_CANCEL:
            Logger.log('MESSAGE_ACTION_SET_QUOTING_CANCEL=========');
            void cancelSelectQuot();
            break;
        }
    }

    async function cancelSelectQuot() {
        const quotText = await getLatestState(setQuotingText);
        const isQuotShow = await getLatestState(setIsHaveQuotingText);
        const title = QuotingType.SELECTION.toString();
        Logger.log('cancelSelectQuot=========',title);
        Logger.log('cancelSelectQuot quotText[1]=========',quotText[0]);
        if (isQuotShow && quotText[0] == title) {
            hideQuotingText();
        }
    }

    async function textInputFocus() {
        setInputWarnShow(false);
        const isQuotShow = await getLatestState(setIsHaveQuotingText);
        Logger.log(`textInputFocus=========${isQuotShow}`);
        if (isQuotShow) {
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                const currentTabId = tabs[0].id;
                Logger.log(`tab.id==========${currentTabId}`);

                if(currentTabId) {
                    void chrome.tabs.sendMessage(currentTabId, {action: MESSAGE_ACTION_SET_QUOTING_SELECTION_CLEAR_CURSOR});

                }
            });
        }
    }

    async function itemClick(car: any, index: number, isQuotClick: boolean, e: React.MouseEvent<HTMLDivElement>) {
        e.stopPropagation();
        const inputText = await getLatestState(setInputValue);
        const quotText = await getLatestState(setQuotingText);
        const isQuotShow = await getLatestState(setIsHaveQuotingText);
        const isUploadingInfo = await getLatestState(setIsUploading);
        if(isUploadingInfo[0] && isUploadingInfo[1]){
            message.warning('File is uploading, please wait a moment.');
            return;
        }
        if(isQuotClick){
            if(isUploadingInfo[0] && isUploadingInfo[4].size>0){
                goToAskEngine(null, car, undefined, true, [isUploadingInfo[2], isUploadingInfo[3], isUploadingInfo[4], isUploadingInfo[5], isUploadingInfo[6]]);
            }else if (isQuotShow && quotText[1]) {
                goToAskEngine(quotText[1], car, undefined);
            }
        }else{
            setQuickPromptBtn([car.id, car.title]);
            if(inputText && isUploadingInfo[0] && isUploadingInfo[4].size>0){
                goToAskEngine(inputText, car, undefined, true, [isUploadingInfo[2], isUploadingInfo[3], isUploadingInfo[4], isUploadingInfo[5], isUploadingInfo[6]]);
            }else if (inputText && isQuotShow && quotText[1]) {
                goToAskEngine(inputText, car, quotText[1]);
            } else if (inputText) {
                goToAskEngine(inputText, car, undefined);
            } else if (isQuotShow && quotText[1]) {
                goToAskEngine(quotText[1], car, undefined);
            } else {
                //setInputWarnShow(true)
            }
            setIsPromptPopShow(false);
        }
    }


    async function goAskAi() {
        const inputText = await getLatestState(setInputValue);
        const quotText = await getLatestState(setQuotingText);
        const isQuotShow = await getLatestState(setIsHaveQuotingText);
        const quickPrompt = await getLatestState(setQuickPromptBtn);
        const isUploadingInfo = await getLatestState(setIsUploading);
        if(isUploadingInfo[0] && isUploadingInfo[1]){
            message.warning('File is uploading, please wait a moment.');
            return;
        }
        if (inputText && inputText.trim()) {
            const card = quickPrompt[0]==AskPromptId?AskPromptData:cards.find((card) => card.id === quickPrompt[0]);
            if(isUploadingInfo[0] && isUploadingInfo[4].size>0){
                goToAskEngine(inputText, card, undefined, true, [isUploadingInfo[2], isUploadingInfo[3], isUploadingInfo[4], isUploadingInfo[5], isUploadingInfo[6]]);
            }else if (isQuotShow && quotText[1]) {
                goToAskEngine(inputText, card, quotText[1]);
            } else {
                goToAskEngine(inputText, card, undefined);
            }
        } else {
            Logger.log('inputText is empty===========');
            setInputWarnShow(true);
        }
    }

    function goToAskEngine(msg: string|null, card: any, quotingText?: string, isUploadFile = false, uploadFileInfo: [string, string, Map<string, string>, FileTypes, File | null] | null = null) {
        if (card.id != AskPromptId) {
            Logger.log(`goToAskEngine===============${msg?msg:'msg==null'}`);
            const iAskAI = new IAskAi({
                prompt: card.text,
                lang: card.language,
                text: msg,
                promptText: msg?mergeAiMsg(msg, quotingText):null,
                appendix: quotingText,
                promptImageUri: card.imageKey,
                promptImageTitle: card.title,
                promptType: card.itemType == PromptTypes.CUSTOM ? 2 : 1,
                isHaveUploadFile: isUploadFile,
                uploadFile: uploadFileInfo
            });
            setMsgService(iAskAI);
        } else {
            const iAskAI = new IAskAi({
                prompt: msg?mergeAiMsg(msg, quotingText):'',
                text: msg,
                appendix: quotingText,
                isHaveUploadFile: isUploadFile,
                uploadFile: uploadFileInfo
            });
            setMsgService(iAskAI);
        }
        clearInputArea();
    }

    function setMsgService(message: IAskAi) {
        Logger.log('send message by IAskAi:======', JSON.stringify(message));
        Logger.log('currentBots:', currentBots);
        const userMessage = new ConversationMessage('user', message, currentBots);
        const botMessage = new ConversationMessage('bot', message, currentBots);
        setMessages(preState => [...preState, userMessage, botMessage]);
    }

    async function goToSearch(e) {
        e.stopPropagation();
        const inputText = await getLatestState(setInputValue);
        const quotText = await getLatestState(setQuotingText);
        const isQuotShow = await getLatestState(setIsHaveQuotingText);

        if ((!quotText[1] || !quotText[1].trim()) && (!inputText || !inputText.trim())) {
            return;
        }

        if (isQuotShow && quotText[1] && inputText && inputText.trim()) {
            openPanelSearchInContent(mergeAiMsg(inputText, quotText[1]));
        } else if (inputText && inputText.trim()) {
            openPanelSearchInContent(inputText);
        } else if (isQuotShow && quotText[1]) {
            openPanelSearchInContent(quotText[1]);
        }
        clearInputArea();
    }

    function clearInputArea() {
        setInputValue('');
        setQuotingText(['', '']);
        setIsHaveQuotingText(false);
        setIsUploading([false, false, '', '', new Map(), FileTypes.OTHERS, null]);
        currentBotsTemp=[];
    }

    const handleKeyDown = (e) => {
        if (((e.metaKey || e.ctrlKey) || e.shiftKey) && e.key === 'Enter') {
            e.preventDefault();
            setInputValue(inputValue + '\n');
        } else if (e.keyCode === 13) {
            e.preventDefault();
            void goAskAi();
        } else if (e.key === '/') {
            e.preventDefault();
            popIsShow = true;
            setIsPromptPopShow(true);
        }
    };

    const props: UploadProps = {
        onDrop(e) {
            Logger.log('Dropped files=========', e.dataTransfer.files);
            if(e.dataTransfer.files.length<1){
                return;
            }
        },
        beforeUpload(file) {
            Logger.log('beforeUpload=================', file);
            if(file.size > MAX_FILE_SIZE){
                setUploadBorderColo('#F93943');
                void message.error('File must smaller than 20MB!');
            }else {
                setIsUploadAttachment(false);
                Logger.log('file.type=================', file.type);
                void fileUpload(file);
            }
            return false;
        },
        maxCount: 1,
        itemRender: () => {
            return (<div></div>);
        },
    };

    async function showUploadFile(){
        const isUploadingInfo = await getLatestState(setIsUploading);
        if(isUploadingInfo[0] && isUploadingInfo[1]){
            void message.warning('File is uploading, please wait a moment.');
            return;
        }
        setUploadBorderColo('#C2C2C2');
        setIsUploadAttachment(true);
    }

    async function fileUpload(file: File) {
        const fileType = UploadUtils.isImageFile(file)?FileTypes.Image:FileTypes.OTHERS;
        abortController = new AbortController();
        const signal = abortController.signal;
        let abortHandler: any;
        const abort = new Promise((_, reject) => {
            abortHandler = () => reject(new Error('Aborted'));
        });
        signal.addEventListener('abort', abortHandler);
        try {
            Logger.log('uploadResult start=================', conversationId, fileType);
            setIsUploading([true, true, fileType == FileTypes.OTHERS ? PdfIcon : URL.createObjectURL(file), file.name, new Map(), fileType, file]);
            const isQuotShow = await getLatestState(setIsHaveQuotingText);
            const Bots = await getLatestState(setCurrentBots);
            currentBotsTemp = Bots;
            if (isQuotShow) {
                hideQuotingText();
            }
            const uploadResult: unknown = await Promise.race([
                UploadUtils.uploadFiles(Bots, file, conversationId),
                abort
            ]);
            if (uploadResult instanceof Map) {
                setIsUploading([true, false, fileType == FileTypes.OTHERS ? PdfIcon : URL.createObjectURL(file), file.name, uploadResult, fileType, file]);
            }
            Logger.log('uploadResult finish=================', uploadResult);
            return uploadResult;
        } catch (err) {
            Logger.log('fileUpload Cancel=================', err.name);
        } finally {
            if (abortHandler) {
                signal.removeEventListener('abort', abortHandler);
            }
        }
    }

    async function handlePaste(e: React.ClipboardEvent) {
        const isUploadingInfo = await getLatestState(setIsUploading);
        if(isUploadingInfo[0] && isUploadingInfo[1]){
            void message.warning('File is uploading, please wait a moment.');
            return;
        }
        const items = Array.from(e.clipboardData.items) as DataTransferItem[];
        let latestFile: File | null = null;

        for (const item of items) {
            if (item.kind === "file") {
                latestFile = item.getAsFile();
            }
        }

        if (latestFile !== null) {
            e.preventDefault();
            if(latestFile.size > MAX_FILE_SIZE){
                void message.error('File must smaller than 20MB!');
            }else {
                void fileUpload(latestFile);
            }
        }
    }

    const onUploadEnter = () => {
        setUploadBorderColo('#0A4DFE');
        setUploadBackgroundColor('#E6EDFF');
    };

    const onUploadLeave = () => {
        setUploadBorderColo('#C2C2C2');
        setUploadBackgroundColor('#FFFFFF');
    };

    const PopupPrompt = ({isQuotClick}) => (
        <div ref={promptPop} style={{
            maxHeight: '300px',
            minWidth: '224px',
            background: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <List
                itemLayout="vertical"
                dataSource={(!isQuotClick && quickPromptBtn[0] != AskPromptId) ? [AskPromptData, ...cards] : cards}
                bordered={false}
                split={false}
                style={{
                    maxHeight: '300px',
                    overflow: 'auto',
                    display: isHaveQuotingText && !isQuotClick ? 'none' : 'block'
                }}
                className={'hideScrollBar'}
                renderItem={(car, index) => {
                    const ItemIcon = getIconSrc(car.imageKey);
                    return (
                        <List.Item style={{height: '40px'}} className={'hover:bg-[#F2F5FF] box-border'}
                            onClick={(e) => itemClick(car, index, isQuotClick, e)}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'start',
                                alignItems: 'center',
                                cursor: "pointer",
                                paddingLeft: '16px'
                            }}>
                                <div className={'inline-flex items-center '}>
                                    {car.itemType === PromptTypes.CUSTOM ?
                                        <ItemIcon style={{fontSize: '16px', color: '#5E5E5E'}}/> :
                                        <img style={{
                                            height: '16px',
                                            width: '16px'
                                        }} src={getImageSrc(car.imageKey)} alt={''}/>}
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#5E5E5E',
                                        paddingLeft: '8px',
                                        maxWidth: '200px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>{car.title}</div>
                                </div>
                            </div>
                        </List.Item>
                    );
                }
                }>
            </List>
            <div style={{display: !isUploading[0]&&!isHaveQuotingText && !isQuotClick ? 'block' : 'none'}}
                className={'w-full bg-[#F6F6F6] h-[1px]'}/>
            <div style={{display: isUploading[0]||(isHaveQuotingText && isQuotClick)? 'none' : 'flex', paddingLeft: '16px'}}
                className={'h-[40px] box-border w-full flex flex-row justify-between items-center hover:bg-[#F2F5FF]'}
                onClick={(e) => goToSearch(e)}>
                <div className={'flex items-center'}>
                    <img style={{
                        height: '16px',
                        width: '16px',
                    }} src={SearchBannerIcon} alt={''}/>
                    <div style={{
                        fontSize: '13px',
                        color: '#5E5E5E',
                        paddingLeft: '8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>{'AI Search'}</div>
                </div>
                <div className={'w-fit text-right text-[#C2C2C2] text-[12px] mr-[16px]'}>{'⇧ ⌘ ⏎'}</div>
            </div>
        </div>
    );

    return <Fragment>
        <MessageList/>
        <div className={style.mainInputArea}>
            <div className={style.chatInputTopBar}>
                <div className={'flex flex-row justify-start items-center'}>
                    {modelSelectorModal}
                    {currentModelView()}
                    <img src={InputAttachmentIcon} alt='' className={'w-[16px] h-[16px] ms-[12px] cursor-pointer'} onClick={() => showUploadFile()}/>
                </div>
            </div>
            <div
                className={'flex flex-col items-center relative bg-white min-h-[97px] w-full rounded-[16px] border-[1px] pb-[4px] border-solid border-[#0A4DFE] cursor-text'}
                style={{borderColor: inputWarnShow ? '#FE0A36' : '#0A4DFE'}}>
                {isHaveQuotingText && <div className={'flex flex-col items-center w-full'}>
                    <div
                        className={'bg-[#F3F4F9] rounded-[16] flex w-[calc(100%-8px)] flex-row justify-between my-[4px] mx-[4px] box-border relative'}>
                        <div className={'flex-col flex justify-start items-start break-words pr-[11px] overflow-hidden'}>
                            <div
                                className={'ms-[11px] mt-[5px] text-[#5E5E5E] text-[12px] font-[600] line-clamp-1 text-ellipsis w-full'}>{quotingText[0]}</div>
                            <div
                                className={'ps-[11px] mt-[1px] text-[#5E5E5E] text-[12px] font-[400] line-clamp-2 text-ellipsis mb-[4px] box-border w-full'}>{quotingText[1]}</div>
                        </div>
                        <img className={'w-[16px] h-[16px] cursor-pointer absolute top-[5px] right-[8px]'}
                            src={ChatInputCloseIcon} alt='' onClick={(e) => {
                                e.stopPropagation();
                                hideQuotingText();
                            }}/>
                    </div>
                    <div className={'flex-row flex w-full justify-between items-center mt-[8px] overflow-hidden'}>
                        <PromptTags cards={cards}
                            onVisibleTagChange={(tags: number[]) => {
                                Logger.log(`tags=============${tags}`);
                                setPromptVisibleTag(tags);
                            }}
                            itemClick={(car: any, index: number, e: React.MouseEvent<HTMLDivElement>) => itemClick(car, index, true, e)}></PromptTags>
                        <Popover title={null} align={{offset: [0, 20]}} content={<PopupPrompt isQuotClick={true}/>}
                            arrow={false} placement='topLeft' overlayInnerStyle={{
                                paddingLeft: 0,
                                paddingRight: 0,
                                paddingTop: '8px',
                                paddingBottom: '8px'
                            }}>
                            <img className={'w-[20px] h-[20px] ms-[4px] me-[4px] cursor-pointer'} src={TriangleIcon}
                                alt=''
                                style={{visibility: (Math.max(...promptVisibleTag) + 1 < cards.length ? 'visible' : 'hidden')}}/>
                        </Popover>
                    </div>
                    <div className={'w-[calc(100%-16px)] h-[1px] bg-[#F6F6F6] mt-[8px]'}/>
                </div>}
                {isUploading[0] && <div className={'flex flex-col w-full'}>
                    <div
                        className={'flex flex-row justify-between w-auto m-[8px] h-[56px] rounded-[12px] border-[1px] border-[#F3F4F9] items-center'}>
                        <div className={'flex flex-row justify-start items-center overflow-hidden'}>
                            <div className={'w-[48px] h-[48px] my-[4px] ml-[4px]'}>
                                {isUploading[1] ? <div
                                    className={'w-full h-full border-[1px] border-[#C2C2C2] border-dashed flex justify-center items-center rounded-[8px]'}>
                                    <LoadingOutlined className={'text-[32px] text-[#0A4DFE]'}/>
                                </div> : (isUploading[5] == FileTypes.Image
                                    ?<img className={'w-full h-full rounded-[8px] object-cover'} src={isUploading[2]} alt=''/>
                                    :<div className={'w-full h-full rounded-[8px] border-dashed border-[1px] border-[#0A4DFE] bg-[#E6EDFF] flex justify-center items-center'}>
                                        <div className={'w-[24px] h-[24px] flex justify-center items-end'} style={{backgroundImage:`url(${FileBgIcon})`}}>
                                            <div className={'flex text-[#0A4DFE] text-[5px] font-[700] overflow-hidden whitespace-nowrap break-all justify-center items-center mb-[3px]'}>{isUploading[3].split('.').pop()?.substring(0,4)}</div>
                                        </div>
                                    </div>)}
                            </div>
                            <div className={'text-[#5E5E5E] text-[14px] ml-[16px] line-clamp-1 text-ellipsis max-w-[calc(100%-68px)] break-all'}>{isUploading[3]}</div>
                        </div>
                        <img className={'w-[16px] h-[16px] mx-[20px] cursor-pointer'} src={UploadDeleteIcon} alt='' onClick={(e) => {
                            e.stopPropagation();
                            if(isUploading[1] && abortController){
                                Logger.log('abortController.abort()=================');
                                abortController.abort();
                            }
                            setIsUploading([false,false,'','',new Map(),FileTypes.OTHERS,null]);
                            currentBotsTemp=[];
                        }}/>
                    </div>
                    <div className={'w-auto mr-[8px]'}>
                        <PromptTags cards={isUploading[5]== FileTypes.Image?imageCards:pdfCards} onVisibleTagChange={()=>{/* do nothing */}} itemClick={(car: any, index: number, e: React.MouseEvent<HTMLDivElement>) => itemClick(car, index, true, e)}></PromptTags>
                    </div>
                    <div className={'w-[calc(100%-16px)] h-[1px] bg-[#F6F6F6] mt-[8px]'}/>
                </div>}

                <Input.TextArea
                    ref={ref}
                    style={{border: 'none', boxShadow: 'none', outline: 'none', background: 'transparent'}}
                    className={'w-full px-[12px] py-[8px] text-black align-top bg overflow-auto whitespace-pre-wrap resize-none focus:bg-transparent focus:shadow-none focus:border-none focus:outline-none hover:bg-transparent hover:shadow-none hover:border-none hover:outline-none'}
                    autoFocus={true}
                    onFocus={() => textInputFocus()}
                    placeholder="Enter message..."
                    onKeyDown={(e) => handleKeyDown(e)}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                    }}
                    onPaste={(e) => handlePaste(e)}
                    autoSize={{minRows: 3, maxRows: 6}}
                />
                <div className={'w-full h-[23px] flex flex-row-reverse justify-start items-center mb-[8px]'}>
                    <Popover trigger={"click"} title={null} align={{offset: [0, 20]}} overlayInnerStyle={{
                        paddingLeft: 0,
                        paddingRight: 0,
                        paddingTop: '8px',
                        paddingBottom: '8px'
                    }} content={<PopupPrompt isQuotClick={false}/>} arrow={false} placement='topLeft'
                    open={isPromptPopShow} onOpenChange={(visibleAskPop) => {
                        Logger.log(`visibleAskPop=============${visibleAskPop}`);
                        popIsShow = visibleAskPop;
                        Logger.log(`popIsShow=============${popIsShow}`);
                        setIsPromptPopShow(visibleAskPop);
                    }}>
                        <img className={'w-[20px] h-[20px] mr-[12px] cursor-pointer'} src={TriangleIcon} alt=''/>
                    </Popover>
                    <img className={'w-[20px] h-[20px] cursor-pointer'} src={SendMsgIcon} alt=''
                        onClick={() => goAskAi()}/>
                    <div
                        className={'flex justify-center items-center h-[25px] text-[#C2C2C2] bg-[#F3F4F9] rounded-[8px] px-[8px] py-[4px] text-[12px] font-[400] mr-[8px] whitespace-nowrap cursor-pointer'}
                        onClick={() => goAskAi()}>{`⏎ ${quickPromptBtn[1]}`}</div>
                </div>
            </div>
        </div>
        <Modal open={isUploadAttachment} className={'absolute top-[calc(50%-200px)] left-0 right-0 p-0 modelUpload bg-transparent overflow-hidden'} footer={[]} closable={false} width='600px'>
            <div className={'flex flex-col justify-start w-full h-full bg-[#F3F4F9] rounded-[16px] overflow-hidden'}>
                <div className={'flex flex-row justify-between items-center px-[16px] mt-[12px]'}>
                    <div className={'text-[#C2C2C2] text-[16px] font-[700]'}>Upload file</div>
                    <img className={'w-[16px] h-[16px] cursor-pointer'} src={UploadCloseIcon} alt='' onClick={(e)=>{
                        e.stopPropagation();
                        setIsUploadAttachment(false);}}/>
                </div>
                <div className={'flex flex-col w-auto justify-start bg-white rounded-[16px] ml-[4px] mr-[4px] mb-[4px] mt-[12px]'}>
                    <div className={'text-[#5E5E5E] text-[14px] mt-[16px] mx-[24px]'}>Upload a file to receive intelligent answers to your questions or requests</div>
                    <div
                        className={`w-auto m-[16px] border-[1px] border-dashed rounded-[8px] hover:rounded-[8px]`}
                        style={{borderColor: uploadBorderColor,backgroundColor:uploadBackgroundColor}} onMouseEnter={onUploadEnter} onMouseLeave={onUploadLeave} onDragOver={onUploadEnter} onDragLeave={onUploadLeave}>
                        <Dragger {...props} className={'w-auto'} style={{background: "transparent", borderRadius: '8px', borderColor: 'transparent'}}>
                            <p className="ant-upload-drag-icon">
                                <UploadOutlined className={' w-[32px] h-[32px]'} style={{color: '#C2C2C2'}}/>
                            </p>
                            <p className="ant-upload-text text-[#333333]">Drag and drop here to upload or</p>
                            <p className="text-[16px] mb-[4px] text-[#0A4DFE] underline block">click to upload</p>
                            <p className="ant-upload-hint">Depending on the different models, support for file formats such as PDF, TXT, PNG, etc. (max size 20MB)</p>
                        </Dragger>
                    </div>
                </div>
            </div>
        </Modal>
    </Fragment>;
}

export default function Conversation() {
    const {windowHeight} = useContext(SidePanelContext);

    return <ModelManagementProvider>
        <ConversationProvider>
            <div style={{height: `${windowHeight}px`}} className={style.conversation}>
                <ConversationContent/>
            </div>
        </ConversationProvider>
    </ModelManagementProvider>;
}
