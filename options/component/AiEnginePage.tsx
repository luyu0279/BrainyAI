import update from 'immutability-helper';
import React, {useCallback, useContext, useRef, useState} from 'react';
import {useDrop} from 'react-dnd';
import {ItemTypes} from "~options/component/ItemTypes";
import {Card, getImageSrc} from "~options/component/Card";
import IconPlus from "data-base64:~assets/icon_plus.svg";
import {PromptDatas} from "~options/constant/PromptDatas";
import {Button, Dropdown, Modal, Popover, Space} from "antd";
import EditPlusIcon from "data-base64:~assets/icon_add_plus.svg";
import QuestionIcon from "data-base64:~assets/icon_question.svg";
import CTooltip from "~component/common/CTooltip";
import {DownOutlined} from '@ant-design/icons';
import {useStorage} from "@plasmohq/storage/dist/hook";
import {PromptTypes} from "~options/constant/PromptTypes";
import {OptionsContext} from "~provider/Options";
import IconDeleteRed from "data-base64:~assets/icon_delete_red.svg";
import {items} from "~options/constant/PromptLanguage";
import * as Icons from '@ant-design/icons';
import {PROMPT_PLACEHOLDER_LANG, PROMPT_PLACEHOLDER_TEXT} from "~utils";
import {Logger} from "~utils/logger";
const defaultIcon = 'PlusSquareOutlined';
export function getIconSrc(key?: string) {
    if (key && Icons && Object.prototype.hasOwnProperty.call(Icons, key)) {
        Icons[key].name = key;
        return Icons[key];
    }
    return null;

}
export default function AiEnginePage() {
    const [cards, setCards] = useStorage('promptData', PromptDatas);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [language, setLanguage] = useState('English');
    const [, drop] = useDrop(() => ({accept: ItemTypes.CARD}));
    const {messageApi} = useContext(OptionsContext);
    const showType = useRef(0);
    const editId = useRef('');
    const [defaultImage, setDefaultImage] = useState(EditPlusIcon);
    const [SelectedIcon, _setSelectedIcon] = useState<any>(null);
    const [visible, setVisible] = useState<boolean>();
    const setSelectedIcon = (key?: string) => _setSelectedIcon(getIconSrc(key));

    const promptTips = 'Quick Action allows users to personalize prompts for selected text. The supported variables include:\n' +
        `- ${PROMPT_PLACEHOLDER_TEXT}\n` +
        `- ${PROMPT_PLACEHOLDER_LANG}\n` +
        '\n' +
        `Typically, you can manage the output language using ${PROMPT_PLACEHOLDER_LANG} and convey your selected keywords to the prompt using ${PROMPT_PLACEHOLDER_TEXT}. For instance,` +
        `Translate ${PROMPT_PLACEHOLDER_TEXT} to ${PROMPT_PLACEHOLDER_LANG}`;

    const promptTipsBr = (
        <div>
            Quick Action allows users to personalize prompts for selected text. The supported variables include:<br/>
            - {PROMPT_PLACEHOLDER_TEXT}<br/>
            - {PROMPT_PLACEHOLDER_LANG}<br/>
            <br/>
            Typically, you can manage the output language using {PROMPT_PLACEHOLDER_LANG} and convey your selected keywords to the prompt
            using {PROMPT_PLACEHOLDER_TEXT}. For instance,<br/>
            Translate {PROMPT_PLACEHOLDER_TEXT} to {PROMPT_PLACEHOLDER_LANG}.
        </div>
    );
    const [deletePrompt, contextHolder] = Modal.useModal();
    const inputTitleRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState('');
    const [inputTitleValue, setInputTitleValue] = useState('');

    const handleInput = (e) => {
        setInputValue(e.target.value);
    };

    const handleFocus = () => {
        Logger.log('textarea focused');
    };

    const deleteConfirm = (id: string) => {
        const {card, index} = findCard(id);
        if (card.itemType === PromptTypes.CUSTOM) {
            deletePrompt.confirm({
                title: 'Delete',
                icon: <img src={IconDeleteRed} className={'h-[24px] w-[24px] me-[4px]'} alt=''/>,
                content: 'Are you sure you want to delete the prompt?',
                okText: 'Delete',
                okButtonProps: {
                    style: {backgroundColor: '#FF2D10', borderColor: '#FF2D10'},
                    className: 'hover:hover:bg-red-700 hover:hover:bg-red-700'
                },
                cancelText: 'Cancel',
                onOk() {
                    void setCards(
                        update(cards, {
                            $splice: [
                                [index, 1],
                            ],
                        }),
                    );
                    void messageApi.success('Prompt deleted successfully');
                }
            });
        } else {
            void messageApi.warning('Default Prompt does not support deletion');
        }
    };
    const findCard = useCallback(
        (id: string) => {
            const card = cards.filter((c) => `${c.id}` === id)[0];
            return {
                card,
                index: cards.indexOf(card),
            };
        },
        [cards],
    );

    function findCardUnUseCallBack(id: string): { card: any, index: number } {
        const card = cards.filter((c) => `${c.id}` === id)[0];
        return {
            card,
            index: cards.indexOf(card),
        };
    }

    const moveCard = useCallback(
        (id: string, atIndex: number) => {
            const {card, index} = findCard(id);
            void setCards(
                update(cards, {
                    $splice: [
                        [index, 1],
                        [atIndex, 0, card],
                    ],
                }),
            );
        },
        [findCard, cards, setCards],
    );

    function creatShowModal(isShow: boolean) {
        Logger.log(`creatShowModal=======${isShow}`);
        showType.current = 0;
        setSelectedIcon(defaultIcon);
        setIsReadOnly(false);
        setIsModalOpen(isShow);
        setVisible(undefined);
    }

    function createCard() {
        Logger.log(`edit card=======${inputTitleValue}====${inputValue}====${language}=====${Date.now()}`);
        Logger.log(`showType=======${showType.current}`);
        Logger.log(`SelectedIcon=======${SelectedIcon} ======${SelectedIcon?SelectedIcon.name:''}`);
        if (showType.current === 0) {
            if((SelectedIcon.name === defaultIcon)){
                void messageApi.warning('Please select an icon.');
                return;
            }
            if (inputTitleValue.trim() && inputValue.trim()) {
                void setCards([...cards, {
                    id: Date.now(),
                    itemType: PromptTypes.CUSTOM,
                    imageKey: SelectedIcon.name,
                    title: inputTitleValue,
                    text: inputValue.includes(PROMPT_PLACEHOLDER_TEXT) ? inputValue : `${inputValue}${PROMPT_PLACEHOLDER_TEXT}`,
                    language: language,
                    isSelect: false,
                }]);
                closeAddPrompt();
            }else {
                void messageApi.warning('Please complete filling in the relevant information.');
            }
        } else if (showType.current === 1) {
            Logger.log(`createCard1=======${cards.length}`);
            const {card, index} = findCardUnUseCallBack(editId.current);
            if (inputTitleValue.trim() && inputValue.trim()) {
                let imageUri = card.imageKey;
                if(card.itemType === PromptTypes.CUSTOM){
                    imageUri = SelectedIcon.name;
                }
                void setCards(
                    update(cards, {
                        [index]: {
                            title: {$set: inputTitleValue},
                            text: {$set: inputValue.includes(PROMPT_PLACEHOLDER_TEXT) ? inputValue : `${inputValue}${PROMPT_PLACEHOLDER_TEXT}`},
                            language: {$set: language},
                            imageKey: {$set: imageUri},
                        },
                    }),
                );
                closeAddPrompt();
            }
            Logger.log(`createCard=======${cards.length}`);
        }
        setVisible(undefined);
    }

    function editCard(id: string) {
        {
            showType.current = 1;
            editId.current = id;
            Logger.log(`edit card showType.current =======${showType.current}`);
            Logger.log(`cars sized=======${cards?.length}`);
            const {card} = findCardUnUseCallBack(id);
            Logger.log(`edit card=======${card.text}====${card.title}====${card.language}`);
            setInputValue(card.text);
            setInputTitleValue(card.title);
            setLanguage(card.language);
            if (card.itemType === PromptTypes.DEFAULT) {
                setIsReadOnly(true);
                setSelectedIcon(undefined);
                setDefaultImage(getImageSrc(card.imageKey));
                setVisible(false);
            } else {
                setIsReadOnly(false);
                setSelectedIcon(card.imageKey);
                setVisible(undefined);
            }
            setIsModalOpen(true);
        }
    }

    function closeAddPrompt() {
        setIsModalOpen(false);
        setInputValue('');
        setInputTitleValue('');
    }

    const handleMenuClick = (item) => {
        const language = findLabelByKey(item.key);
        Logger.log(`handleMenuClick======${language}`);
        setLanguage(language);
    };

    const findLabelByKey = (key: string) => {
        const item = items.find(item => item.key === key);
        return item ? item.label : '';
    };


    const menuProps = {
        items,
        onClick: handleMenuClick,
    };

    const outlinedIcons = Object.keys(Icons)
        .filter(name => name.endsWith('Outlined') && name !== 'PlusSquareOutlined')
        .map((iconName, index) => {
            const IconComponent = Icons[iconName];
            return <IconComponent
                key={index}
                onClick={() => {
                    setSelectedIcon(iconName);
                }}
                style={{cursor: 'pointer', fontSize: '20px', color: '#555555'}}
            />;
        });

    const content = (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(15, 1fr)',
            gap: '20px',
            height: '600px',
            overflowY: 'scroll',
            justifyItems: 'start',
            padding: '30px',
            paddingTop: '10px',
        }}>
            {outlinedIcons}
        </div>
    );

    const iconPopTitle = <span className={'text-[20px] font-[600] justify-start mt-[35px] ps-[30px] text-[#333333]'}>Select Icon</span>;

    return (
        <div>
            <div
                className={'bg-white shadow-[0_4px_12px_0px_rgba(0,0,0,.2)] overflow-hidden rounded-tl-[24px] rounded-tr-[24px] px-[56px] py-[32px] mt-[32px] flex flex-col'}>
                <div className={'text-[#333333] font-[700] text-[20px] justify-start'}>Shortcut Menu</div>
                <div className={'text-[#5E5E5E] font-[400] text-[12px] justify-start mt-[8px]'}>Customize your menu of
                    actions by editing, rearranging through dragging, and including custom actions below.
                </div>
                <div ref={drop}>
                    {cards.map((card) => (
                        <Card
                            key={card.id}
                            id={`${card.id}`}
                            text={card.text}
                            title={card.title}
                            itemType={card.itemType}
                            imageKey={card.imageKey}
                            moveCard={moveCard}
                            findCard={findCard}
                            editCard={editCard}
                            deleteCard={deleteConfirm}
                        />
                    ))}
                </div>
                <div
                    onClick={() => creatShowModal(true)}
                    className={'h-[40px] w-fit bg-[#0A4DFE] rounded-[8px] bg-opacity-10 inline-flex flex-row justify-start items-center mt-[32px] px-[16px] cursor-pointer'}>
                    <img src={IconPlus} className={'h-[15px] w-[15px]'} alt=''/>
                    <div className={'text-[#0A4DFE] font-[400] text-[15px] ml-[8px]'}>Create new shortcut</div>
                </div>
                <div className={'h-[100px] w-full'}/>
            </div>
            <Modal open={isModalOpen} onCancel={() => closeAddPrompt()} width={'734px'} footer={[]} maskClosable={false}
                keyboard={false}>
                <div className={'flex flex-col items-start pl-[20px] w-full'}>
                    <div className={'flex flex-row justify-start items-center mt-[20px] h-[40px]'}>
                        <div
                            className={'font-[700] text-[20px] text-[#333333] w-[100px] flex justify-start items-center'}>icon
                        </div>
                        <Popover placement='rightTop' title={iconPopTitle} content={content} open={visible} >
                            {SelectedIcon ? <SelectedIcon style={{cursor: 'pointer', fontSize: '30px', color: '#555555'}}/> :
                                <img className={'h-[40px] w-[40px]'} src={defaultImage} alt={''}/>}
                        </Popover>
                    </div>
                    <div className={'flex flex-row justify-start items-center mt-[24px] h-[40px]'}>
                        <div
                            className={'font-[700] text-[20px] text-[#333333] w-[100px] flex justify-start items-center'}>Name
                        </div>
                        <input
                            ref={inputTitleRef}
                            value={inputTitleValue}
                            readOnly={isReadOnly}
                            onChange={(e) => setInputTitleValue(e.target.value)}
                            className={'h-[40px] rounded-[8px] border-[1px] border-[#D9D9D9] px-[16px] w-[520px]'}
                            placeholder={'Prompt manager'}
                            autoFocus/>
                    </div>
                    <div className={'flex flex-row justify-start items-start mt-[24px] h-[199px]'}>
                        <div className={'flex flex-row w-[100px] h-[40px] justify-start items-center'}>
                            <div
                                className={'font-[700] text-[20px] text-[#333333] flex justify-start items-start'}>Prompt
                            </div>
                            <CTooltip title={promptTipsBr} autoAdjustOverflow={true} placement="rightTop"
                                overlayStyle={{
                                    background: '#000000',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px 0px rgba(0,0,0,.2)'
                                }} overlayInnerStyle={{width: '523px', textAlign: 'start'}}>
                                <img src={QuestionIcon}
                                    className={'h-[16px] w-[16px] justify-start items-center ml-[4px]'}/>
                            </CTooltip>
                        </div>
                        <textarea
                            value={inputValue}
                            onChange={handleInput}
                            onFocus={handleFocus}
                            readOnly={isReadOnly}
                            className={'h-[199px] box-border rounded-[8px] border-[1px] border-[#D9D9D9] px-[16px] py-[16px] w-[520px] text-black leading-tight focus:outline-none focus:shadow-outline align-top overflow-auto whitespace-pre-wrap resize-none'}
                            placeholder={promptTips}/>
                    </div>
                    <div className={'h-[1px] w-[620px] bg-[#DADCE0] justify-start mt-[24px]'}/>
                    <div className={'h-[80px] w-[620px] flex flex-row'}>
                        <div className={'flex flex-col justify-center h-full flex-grow'}>
                            <div className={'text-[#333333] font-[700] text-[20px] justify-start'}>Variables</div>
                            <div className={'text-[#5E5E5E] font-[400] text-[13px] justify-start'}>default value of
                                $[lang]
                            </div>
                        </div>
                        <div className={'flex justify-end items-center'}>
                            <Dropdown overlayStyle={{maxHeight: '400px', overflow: 'auto'}} menu={menuProps}
                                placement="top">
                                <Button>
                                    <Space>
                                        {language}
                                        <DownOutlined/>
                                    </Space>
                                </Button>
                            </Dropdown>
                        </div>
                    </div>
                    <div className={'h-[1px] w-[620px] bg-[#DADCE0] justify-start'}/>
                    <div className={'w-[620px] justify-end flex flex-row mt-[40px]'}>
                        <Button onClick={() => createCard()} type="primary"
                            className={'bg-[#0A4DFE] h-[40px] w-[161px]'}>Submit</Button>
                    </div>
                </div>
            </Modal>
            {contextHolder}
        </div>
    );
}
