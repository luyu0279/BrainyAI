import React, {createContext, useEffect, useRef, useState} from "react";
import {getLatestState} from "~utils";
import {Llavav1634b} from "~libs/chatbot/perplexity/Llavav1634b";
import {KimiBot} from "~libs/chatbot/kimi";
import {CopilotBot} from "~libs/chatbot/copilot";
import ChatGPT35Turbo from "~libs/chatbot/openai/ChatGPT35Turbo";
import {Gemma7bIt} from "~libs/chatbot/perplexity/Gemma7bIt";
import {Mistral822b} from "~libs/chatbot/perplexity/Mistral822b";
import {Llama3SonarLarge32KChat} from "~libs/chatbot/perplexity/Llama3SonarLarge32KChat";
import {Storage} from "@plasmohq/storage";
import {Llama3SonarLarge32kOnline} from "~libs/chatbot/perplexity/Llama3SonarLarge32kOnline";
import {Claude3Haiku} from "~libs/chatbot/perplexity/Claude3Haiku";
import {Llama370bInstruct} from "~libs/chatbot/perplexity/Llama370bInstruct";
import  ChatGPT4Turbo from "~libs/chatbot/openai/ChatGPT4Turbo";
import {Logger} from "~utils/logger";
import ChatGPT4O from "~libs/chatbot/openai/ChatGPT4o";
import ArkoseGlobalSingleton from "~libs/chatbot/openai/Arkose";

export type M = (
    typeof ChatGPT35Turbo
    | typeof CopilotBot
    | typeof KimiBot
    | typeof Gemma7bIt
    | typeof Llavav1634b
    | typeof Mistral822b
    | typeof Llama3SonarLarge32KChat
    | typeof Llama370bInstruct
    | typeof Claude3Haiku
    | typeof Llama3SonarLarge32kOnline
    | typeof ChatGPT4Turbo
    | typeof ChatGPT4O
    )

export type Ms = M[]

export interface CMsItem {
    label: string;
    models: M[];
}
export type CMs = CMsItem[]

interface IModelManagementProvider {
    currentBots: Ms;
    setCurrentBots: React.Dispatch<React.SetStateAction<Ms>>;
    allModels: React.MutableRefObject<Ms>;
    categoryModels: React.MutableRefObject<CMs>;
    saveCurrentBotsKeyLocal: () => void;
}

export const ModelManagementContext = createContext({} as IModelManagementProvider);

export default function ModelManagementProvider({children}) {
    const defaultModels: Ms = [ChatGPT35Turbo, CopilotBot, KimiBot];
    const [currentBots, setCurrentBots] = useState<IModelManagementProvider['currentBots']>(defaultModels);
    const allModels = useRef<Ms>([Llama3SonarLarge32KChat, Llama3SonarLarge32kOnline, Claude3Haiku, ChatGPT35Turbo, ChatGPT4O, ChatGPT4Turbo, CopilotBot, KimiBot, Llama370bInstruct, Gemma7bIt, Llavav1634b, Mistral822b]);
    const storage = new Storage();
    const [isLoaded, setIsLoaded] = useState(false);
    const categoryModels = useRef<CMs>([
        {
            label: "OpenAI",
            models: [ChatGPT35Turbo, ChatGPT4Turbo, ChatGPT4O]
        },
        {
            label: "Microsoft",
            models: [CopilotBot]
        },
        {
            label: "Moonshot",
            models: [KimiBot]
        },
        {
            label: "Perplexity",
            models: [Llama3SonarLarge32KChat, Llama3SonarLarge32kOnline, Claude3Haiku, Llama370bInstruct, Gemma7bIt, Llavav1634b, Mistral822b]
        }]
    );

    const handleModelStorge = async () => {
        try {
            const value = await storage.get<string[]>("currentModelsKey");

            const arr: Ms = [];

            if (value && value.length) {
                Logger.log('local currentModels:',value);
                value.forEach((ele) => {
                    allModels.current.forEach((item) => {
                        if (item.botName === ele) {
                            arr.push(item);
                        }
                    });
                });

                if (arr.length) {
                    setCurrentBots(arr);
                }else {
                    setCurrentBots(defaultModels);
                }
            }
        }catch (e) {
            // ignore
        }
        finally {
            setIsLoaded(true);
        }
    };

    useEffect(()=>{
        void handleModelStorge();
        // init arkose
        void ArkoseGlobalSingleton.getInstance().loadArkoseScript();
    },[]);

    const getCurrentModelKey = async () => {
        const cbots: Ms = await getLatestState(setCurrentBots);
        return cbots.map(model => model.botName);
    };

    const saveCurrentBotsKeyLocal = async () => {
        void storage.set("currentModelsKey", await getCurrentModelKey());
        Logger.log('s-get', storage.get("currentModelsKey"));
    };

    return (
        <ModelManagementContext.Provider value={{currentBots, allModels, categoryModels, setCurrentBots: setCurrentBots, saveCurrentBotsKeyLocal}}>
            {isLoaded && children}
        </ModelManagementContext.Provider>
    );
}
