import React from "react";
import CTooltip from "~component/common/CTooltip";
import newSearchIcon from "data-base64:~assets/icon_search_new.svg";
import {getIconSrc} from "~options/component/AiEnginePage";
import {PromptTypes} from "~options/constant/PromptTypes";
import {getImageSrc} from "~options/component/Card";
import {Popover} from "antd";
import TriangleIcon from "data-base64:~assets/icon_triangle.svg";
import {Logger} from "~utils/logger";
export type PromptTypesType = typeof PromptTypes[keyof typeof PromptTypes];

export interface Card {
    id: number,
    itemType: PromptTypesType
    imageKey: string,
    title: string,
    language: string,
    isSelect: boolean,
    text: string,
}

export interface SearchBarProps {
    cards: Card[],
    popupPrompt: React.ReactNode,
    isVisible: boolean
    onOpenChange: (visible: boolean) => void
    onItemClick: (id: number) => void
    onItemSearchClick: () => void
}
export const SearchBar = ({ cards, popupPrompt,isVisible,onOpenChange,onItemClick,onItemSearchClick}: SearchBarProps) => {
    return <div style={{
        display: 'flex',
        justifyContent: 'start',
        flexDirection: 'row',
        alignItems: 'center',
    }}>
        <div className={'flex flex-row justify-start max-w-[500px] overflow-x-auto overflow-y-hidden hideScrollBar'}>
            <CTooltip title='Search' autoAdjustOverflow={true} placement="top" overlayStyle={{
                background: '#000000',
                borderRadius: '8px',
                boxShadow: '0 4px 12px 0px rgba(0,0,0,.2)'
            }} overlayInnerStyle={{textAlign: 'center'}}>
                <div
                    className={'flex w-[28px] h-[28px] rounded-[4px] justify-center items-center bg-white hover:bg-[#F2F5FF]'}>
                    <img className={'w-[16px] h-[16px] cursor-pointer'} src={newSearchIcon} alt=''
                        onClick={() => {
                            onItemSearchClick();
                        }}/>
                </div>
            </CTooltip>
            {
                cards.filter((card) => card.isSelect).map((car) => {
                    const ItemIcon = getIconSrc(car.imageKey);
                    return (
                        <CTooltip key={car.title} title={car.title} autoAdjustOverflow={true} placement="top" overlayStyle={{
                            background: '#000000',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px 0px rgba(0,0,0,.2)'
                        }} overlayInnerStyle={{textAlign: 'center'}}>
                            <div
                                className={'flex w-[28px] h-[28px] rounded-[4px] justify-center items-center bg-white hover:bg-[#F2F5FF] ml-[2px]'}
                                onClick={() => {
                                    onItemClick(car.id);
                                }}>
                                {car.itemType === PromptTypes.CUSTOM ?
                                    <ItemIcon style={{
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        color: '#555555',
                                    }}/> :
                                    <div className={'w-[16px] h-[16px]'}>
                                        <img style={{
                                            cursor: 'pointer',
                                            height: '100%',
                                            flex: 'block',
                                        }} src={getImageSrc(car.imageKey)} alt={''}/>
                                    </div>
                                }
                            </div>
                        </CTooltip>
                    );
                })
            }
        </div>
        <Popover overlayInnerStyle={{paddingLeft: 0, paddingRight:0,paddingTop:'8px',paddingBottom:'8px'}} title={null} align={{offset: [0, 20]}} content={popupPrompt} arrow={false} placement='bottomRight' open={isVisible}
            onOpenChange={(visible) => {
                Logger.log(`onOpenChange=================${visible}`);
                onOpenChange(visible);
            }}>
            <img className={'w-[16px] h-[16px] justify-start ms-[2px] cursor-pointer ml-[2px]'} src={TriangleIcon} alt=''/>
        </Popover>
    </div>;
};
