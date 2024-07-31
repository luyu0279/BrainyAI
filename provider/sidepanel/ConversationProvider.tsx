import React, {useContext, useEffect, useState} from "react";
import {SidePanelContext} from "~provider/sidepanel/SidePanelProvider";
import type {IAskAi} from "~libs/open-ai/open-panel";
import {ModelManagementContext, type Ms} from "~provider/ModelManagementProvider";
import {createUuid} from "~utils";
import eventBus from "~libs/EventBus";

interface IConversationContext {
    messages: ConversationMessage[],
    setMessages: React.Dispatch<React.SetStateAction<ConversationMessage[]>>;
    conversationId: string;
    setConversationId: React.Dispatch<React.SetStateAction<string>>;
    isGeneratingMessage: boolean;
    setIsGeneratingMessage: React.Dispatch<React.SetStateAction<boolean>>;
    conversationTitle: string;
    setConversationTitle: React.Dispatch<React.SetStateAction<string>>;
    resetConversation: () => void;
}

export class ConversationMessage {
    id: string;
    foree: 'bot' | 'user';
    data: IAskAi;
    botProviders?: Ms;

    constructor(foree: 'bot' | 'user', data: IAskAi, botProviders?: Ms) {
        // random id with timestamp
        this.id = `${Date.now()}-${Math.random()}`;
        this.foree = foree;
        this.data = data;
        this.botProviders = botProviders;

        return this;
    }
}

export const ConversationContext = React.createContext<IConversationContext>({} as IConversationContext);

export const ConversationProvider = ({children}: { children: React.ReactNode }) => {
    const {askAiData} = useContext(SidePanelContext);
    const [messages, setMessages] = useState<IConversationContext['messages']>([]);
    const [globalConversationId, setGlobalConversationId] = useState<IConversationContext['conversationId']>(createUuid());
    const [isGeneratingMessage, setIsGeneratingMessage] = useState<IConversationContext['isGeneratingMessage']>(false);
    const [conversationTitle, setConversationTitle] = useState<string>('');
    const {currentBots} = useContext(ModelManagementContext);

    const resetConversation = () => {
        setGlobalConversationId(createUuid());
        setIsGeneratingMessage(false);
        setMessages([]);
    };

    useEffect( () => {
        if (askAiData) {
            const userMessage = new ConversationMessage('user', askAiData);
            const botMessage = new ConversationMessage('bot', askAiData, currentBots);

            setMessages(preState => [...preState, userMessage, botMessage]);
        }
    }, [askAiData]);

    useEffect(() => {
        eventBus.on('newChat', resetConversation);

        return () => {
            eventBus.removeListener('newChat', resetConversation);
        };
    },[]);

    return <ConversationContext.Provider value={{
        messages,
        setMessages,
        conversationId: globalConversationId,
        setConversationId: setGlobalConversationId,
        isGeneratingMessage,
        setIsGeneratingMessage,
        conversationTitle,
        setConversationTitle,
        resetConversation
    }}>
        {children}
    </ConversationContext.Provider>;
};
