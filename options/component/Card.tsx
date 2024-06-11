import React, {memo, useEffect, useState} from 'react';
import {useDrag, useDrop} from 'react-dnd';
import {ItemTypes} from './ItemTypes.js';
import IconDrag from "data-base64:~assets/icon_drag.svg";
import IconDelete from "data-base64:~assets/icon_delete.svg";
import IconEdit from "data-base64:~assets/icon_edit.svg";
import {PromptTypes} from "~options/constant/PromptTypes";
import AskIcon from "data-base64:~assets/icon_ask.svg";
import TranslateIcon from "data-base64:~assets/icon_translate.svg";
import SummarizeIcon from "data-base64:~assets/icon_summarize.svg";
import ExplainIcon from "data-base64:~assets/icon_explain.svg";
import RephraseIcon from "data-base64:~assets/icon_rephrase.svg";
import GammarCheckIcon from "data-base64:~assets/icon_grammar_check.svg";
import AskBlueIcon from "data-base64:~assets/icon_ask_blue.svg";
import TranslateBlueIcon from "data-base64:~assets/icon_translate_blue.svg";
import SummarizeBlueIcon from "data-base64:~assets/icon_summarize_blue.svg";
import ExplainBlueIcon from "data-base64:~assets/icon_explain_blue.svg";
import RephraseBlueIcon from "data-base64:~assets/icon_rephrase_blue.svg";
import GammarCheckBlueIcon from "data-base64:~assets/icon_grammar_check_blue.svg";
import * as Icons from "@ant-design/icons";
import AskGIcon from "data-base64:~assets/g_icon_ask.svg";
import TranslateGIcon from "data-base64:~assets/g_icon_translate.svg";
import SummarizeGIcon from "data-base64:~assets/g_icon_summarize.svg";
import ExplainGIcon from "data-base64:~assets/g_icon_ask.svg";
import RephraseGIcon from "data-base64:~assets/g_icon_rephrase.svg";
import GammarCheckGIcon from "data-base64:~assets/g_icon_grammar_check.svg";


export const promptGrayImages = [
    {
        key: 'ask_ai',
        value: AskGIcon,
    },
    {
        key: 'Translate',
        value: TranslateGIcon,
    },
    {
        key: 'Summarize',
        value: SummarizeGIcon,
    },
    {
        key: 'Explain',
        value: ExplainGIcon,
    },
    {
        key: 'Rephrase',
        value: RephraseGIcon,
    },
    {
        key: 'Gammar_check',
        value: GammarCheckGIcon,
    }
];

export const imagesSrc = [
    {
        key: 'ask_ai',
        value: AskIcon,
    },
    {
        key: 'Translate',
        value: TranslateIcon,
    },
    {
        key: 'Summarize',
        value: SummarizeIcon,
    },
    {
        key: 'Explain',
        value: ExplainIcon,
    },
    {
        key: 'Rephrase',
        value: RephraseIcon,
    },
    {
        key: 'Gammar_check',
        value: GammarCheckIcon,
    }
];

export const imagesBlueSrc = [
    {
        key: 'ask_ai',
        value: AskBlueIcon,
    },
    {
        key: 'Translate',
        value: TranslateBlueIcon,
    },
    {
        key: 'Summarize',
        value: SummarizeBlueIcon,
    },
    {
        key: 'Explain',
        value: ExplainBlueIcon,
    },
    {
        key: 'Rephrase',
        value: RephraseBlueIcon,
    },
    {
        key: 'Gammar_check',
        value: GammarCheckBlueIcon,
    }
];

export const getImageSrc = (key: string) => {
    return imagesSrc.filter((item) => item.key === key)[0].value;
};

export const getImageBlueSrc = (key: string) => {
    return imagesBlueSrc.filter((item) => item.key === key)[0].value;
};

export const getGrayImageSrc = (key: string) => {
    return promptGrayImages.filter((item) => item.key === key)[0].value;
};

export type PromptTypes = typeof PromptTypes[keyof typeof PromptTypes];

interface CardProps {
    id: string;
    text: string;
    title: string;
    itemType: PromptTypes;
    imageKey: string;
    moveCard: (id: string, atIndex: number) => void;
    findCard: (id: string) => { card: any; index: number };
    editCard: (id: string) => void;
    deleteCard: (id: string) => void;
}

export const Card = memo(function Card({ id, title, text, itemType, imageKey, moveCard, findCard, editCard, deleteCard }: CardProps) {
    const originalIndex = findCard(id).index;
    const [defaultImage, setDefaultImage] = useState('');

    const [SelectedIcon, _setSelectedIcon] = useState<any>(null);
    const setSelectedIcon = (key?: string) => _setSelectedIcon(getIconSrc(key));

    useEffect(() => {
        if(itemType === PromptTypes.DEFAULT){
            setSelectedIcon(undefined);
            setDefaultImage(getImageSrc(imageKey));
        }else{
            setSelectedIcon(imageKey);
        }
    }, [imageKey]);

    function getIconSrc(key?: string) {
        if (key && Icons && Object.prototype.hasOwnProperty.call(Icons, key)) {
            return Icons[key];
        } 
        return null;
        
    }

    const [, drag] = useDrag(
        () => ({
            type: ItemTypes.CARD,
            item: { id, originalIndex },
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
            end: (item, monitor) => {
                const { id: droppedId, originalIndex } = item;
                const didDrop = monitor.didDrop();
                if (!didDrop) {
                    moveCard(droppedId, originalIndex);
                }
            },
        }),
        [id, originalIndex, moveCard],
    );
    const [, drop] = useDrop(
        () => ({
            accept: ItemTypes.CARD,
            hover({ id: draggedId }) {
                if (draggedId !== id) {
                    const { index: overIndex } = findCard(id);
                    moveCard(draggedId, overIndex);
                }
            },
        }),
        [findCard, moveCard],
    );

    return (
        <div ref={(node) => drag(drop(node))} className={'flex flex-col justify-start mt-[16px]'}>
            <div className={'h-[80px] w-full flex flex-row'}>
                <div className={'cursor-grab  h-full w-[7%] flex items-center justify-start'}>
                    <img src={IconDrag} className={'h-[32px] w-[32px]'} alt=''/>
                </div>
                <div className={'h-full w-[76%] max-w-[550px] flex flex-col justify-center'}>
                    <div className={'flex items-center justify-start flex-row'}>
                        {SelectedIcon ? <SelectedIcon
                            style={{cursor: 'pointer', fontSize: '16px', color: '#555555'}}/> :
                            <img className={'h-[16px] w-[16px]'} src={defaultImage} alt={''}/>}
                        <div style={{fontWeight: 600}} className={'text-[#333333] text-[15px] ms-[8px] flex justify-start items-center'}>{title}</div>
                    </div>
                    <div className={'justify-start items-center text-[#5E5E5E] font-[400] text-[12px] mt-[4px] text-ellipsis whitespace-pre-wrap line-clamp-3 '}  >{text}</div>
                </div>
                <div className={'h-full w-[17%] flex items-center justify-start flex-row-reverse'}>
                    <img src={IconDelete} className={'h-[24px] w-[24px] cursor-pointer'}
                        onClick={() => deleteCard(id)} alt=''/>
                    <img src={IconEdit} className={'h-[24px] w-[24px] mr-[16px] cursor-pointer'}
                        onClick={() => editCard(id)} alt=''/>
                </div>
            </div>
            <div className={'h-[1px] bg-[#DADCE0] w-full px-[2px] justify-start mt-[16px]'}/>
        </div>
    );
});
