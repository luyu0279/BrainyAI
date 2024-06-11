import type {IChatRequirementsResponse} from "~libs/open-ai/open-ai-interface";
import {Logger} from "~utils/logger";

export default class ArkoseGlobalSingleton {
    private static instance: ArkoseGlobalSingleton;
    myEnforcement: any;
    // eslint-disable-next-line @typescript-eslint/ban-types
    arkosePromise: { resolve: Function; reject: Function} | undefined;
    // eslint-disable-next-line @typescript-eslint/ban-types
    loadScriptPromise: { resolve: Function; reject: Function } | undefined;
    // for gpt4 only
    requirementsData?: IChatRequirementsResponse;
    arkoseScriptLoaded = false;

    protected constructor() {
        // ignore
    }

    static getInstance(): ArkoseGlobalSingleton {
        if (!ArkoseGlobalSingleton.instance) {
            ArkoseGlobalSingleton.instance = new ArkoseGlobalSingleton();
        }

        return ArkoseGlobalSingleton.instance;
    }

    setupEnforcement(myEnforcement) {
        Logger.log('load myEnforcement====', myEnforcement);
        setTimeout(() => {
            this.loadScriptPromise?.resolve(true);
            this.loadScriptPromise = undefined;
        }, 2000);
        this.myEnforcement = myEnforcement;
        this.myEnforcement.setConfig({
            // onReady: () => {
            // },
            // onShown: () => {
            // },
            // onShow: () => {
            // },
            // onSuppress: () => {
            // },
            onCompleted: (response) => {
                this.arkosePromise?.resolve(response.token);
                this.arkosePromise = undefined;
            },
            // onReset: () => {
            // },
            // onHide: () => {
            // },
            onError: (response) => {
                Logger.log("Arkose error:", response);
                this.arkosePromise?.reject(response);
                this.arkosePromise = undefined;
            },
            onFailed: (response) => {
                Logger.log("Arkose failed:", response);
                this.arkosePromise?.reject(response);
                this.arkosePromise = undefined;
            }
        });
    }

    async loadArkoseScript(requirementsData?: IChatRequirementsResponse) {
        this.requirementsData = requirementsData;
        await this.waitLoadScript();
        // Append the Arkose JS tag to the Document Body. Reference https://github.com/ArkoseLabs/arkose-examples/blob/main/vue-example/src/components/Arkose.vue
        return new Promise((resolve, reject) => {
            this.loadScriptPromise = {resolve, reject};
            if (!this.arkoseScriptLoaded) {
                this.arkoseScriptLoaded = true;
                const script = document.createElement("script");
                script.src = chrome.runtime.getURL("/resources/js/v2/35536E1E-65B4-4D96-9D97-6ADB7EFF8147/api.js");
                script.async = true;
                script.defer = true;
                const cbName = "useArkoseSetupEnforcement" + Math.floor(Math.random() * 900) + 100;
                script.setAttribute("data-callback", cbName);
                document.body.appendChild(script);

                script.onload = () => {
                    Logger.log("Arkose API Script loaded");
                    // this.loadScriptPromise.resolve(true);
                    window[cbName] = this.setupEnforcement.bind(this);
                };

                script.onerror = () => {
                    this.loadScriptPromise?.resolve(false);
                    this.loadScriptPromise = undefined;
                    Logger.log("Could not load the Arkose API Script!");
                };
            } else {
                this.requirementsData && this.myEnforcement.setConfig({data: {blob: this.requirementsData.arkose.dx}});
                this.loadScriptPromise.resolve(true);
                this.loadScriptPromise = undefined;
            }
        });
    }

    private waitLoadScript() {
        return new Promise((resolve) => {
            if(!this.loadScriptPromise) {
                resolve(true);
                return;
            }

            const id = setInterval(() => {
                if(!this.loadScriptPromise) {
                    clearInterval(id);
                    resolve(true);
                }
            }, 5000);
        });
    }

    private waitGetToken() {
        let n = 1;
        return new Promise((resolve) => {
            if(!this.arkosePromise) {
                resolve(true);

                return;
            }

            const id = setInterval(() => {
                if(n === 4) {
                    clearInterval(id);
                    this.arkosePromise?.reject("timeout");
                    this.arkosePromise = undefined;
                    resolve(true);
                }

                if(!this.arkosePromise) {
                    clearInterval(id);
                    resolve(true);
                }

                n += 1;
            }, 5000);
        });
    }

    async getArkoseToken() {
        await this.waitGetToken();
        if (this.myEnforcement) {
            this.myEnforcement.setConfig({
                data: {
                    blob: this.requirementsData?.arkose.dx
                }
            });

            return new Promise((resolve, reject) => {
                this.arkosePromise = {resolve, reject};
                this.myEnforcement.run();
            });
        }
        return null;

    }
}
