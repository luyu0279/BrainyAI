import {OpenaiAuthSingleton} from "~libs/chatbot/openai/index";
import {OpenAIAuth} from "~libs/open-ai/open-ai-auth";
import {customChatFetch} from "~utils/custom-fetch-for-chat";
import {Logger} from "~utils/logger";

interface OpenAiModel {
    slug: string;
    max_tokens: number;
    title: string;
    description: string;
    tags: string[];
    capabilities: Record<string, unknown>;
    product_features?: {
        attachments: {
            type: string;
            accepted_mime_types: string[];
            image_mime_types: string[];
            can_accept_all_mime_types: boolean;
        };
    };
    enabled_tools?: string[];
}

interface Category {
    category: string;
    human_category_name: string;
    human_category_short_name: string;
    icon: string;
    icon_src: string;
    subscription_level: string;
    default_model: string;
    code_interpreter_model?: string;
    plugins_model?: string;
    color: string;
    short_explainer: string;
    tagline: string;
}

interface OpenaiModelsAndCategories {
    models: OpenAiModel[];
    categories: Category[];
}

export class OpenAiUserModelInfoSingleton {
    private readonly modelInfo?: Promise<OpenaiModelsAndCategories | null>;
    private static instance: OpenAiUserModelInfoSingleton;

    private constructor() {
        this.modelInfo = this.refreshModelInfo();
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new OpenAiUserModelInfoSingleton();
        }

        return this.instance;
    }

    async getModelInfo() {
        if(this.modelInfo) {
            return this.modelInfo;
        }

        return this.refreshModelInfo();
    }

    async refreshModelInfo(): Promise<OpenaiModelsAndCategories | null> {
        return new Promise((resolve) => {
            OpenaiAuthSingleton.getInstance().auth.initSessionInfo().then(async ([initError]) => {
                let token = "";
                // const [initError] = await OpenaiAuthSingleton.getInstance().auth.initSessionInfo();

                if (!initError) {
                    token = OpenaiAuthSingleton.getInstance().auth.authSessionInfo?.accessToken || "";
                }

                const myHeaders = new Headers();

                if (token) {
                    myHeaders.append("authorization", "Bearer " + token);
                }

                myHeaders.append("oai-device-id", await OpenAIAuth.getOpenAiDeviceId());
                myHeaders.append("oai-language", "");

                customChatFetch("https://chatgpt.com/backend-api/models?history_and_training_disabled=false", {
                    method: "GET",
                    headers: myHeaders,
                    redirect: "follow"
                }).then(async (request) => {
                    if (!request.error) {
                        try {
                            resolve(await request.response?.json() as OpenaiModelsAndCategories);
                            // this.modelInfo = await request.response?.json();
                        } catch (e) {
                            resolve(null);
                            Logger.trace(e);
                        }
                    }
                });
            });
        });
    }
}
