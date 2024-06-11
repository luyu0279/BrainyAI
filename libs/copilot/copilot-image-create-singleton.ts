export class CopilotImageCreateSingleton {
    private config = {
        telemetry: {
            eventID: "Codex",
            instrumentedLinkName: "CodexInstLink",
            externalLinkName: "CodexInstExtLink",
            kSeedBase: 6500,
            kSeedIncrement: 500,
            instSuffix: 0,
            instSuffixIncrement: 1
        },
        features: {
            enableAnsCardSfx: !1,
        }
    };
    private kSeedIncrement = 500;
    private currentKSeed = 6500;
    private instSuffixIncrement = 1;
    private instSuffix = 0;
    private static instance: CopilotImageCreateSingleton;
    private textContext: string;
    private messageId: string;

    private constructor(textContext: string, messageId: string) {
        // Exists only to defeat instantiation.
        this.currentKSeed = this.config.telemetry.kSeedBase;
        this.instSuffix = this.config.telemetry.instSuffix;
        this.textContext = textContext;
        this.messageId = messageId;
    }

    static getInstance(text: string, messageId: string) {
        if (!CopilotImageCreateSingleton.instance) {
            CopilotImageCreateSingleton.instance = new CopilotImageCreateSingleton(text, messageId);
        }

        return CopilotImageCreateSingleton.instance;
    }

    createFrameUrl(textContent: string, massageId: string): string {
        this.textContext = textContent;
        this.messageId = massageId;

        return `https://copilot.microsoft.com/images/create?partner=sydney&re=1&showselective=1&sude=1&kseed=${this.getNextKSeed()}&SFX=${this.getNextInstSuffix()}&gptexp=unknown&q=${encodeURIComponent(this.textContext)}&iframeid=${this.messageId}&--pif=1&w=300&h=300&width=300&height=300`;
    }

    private getNextKSeed() {
        this.currentKSeed += this.config.telemetry.kSeedIncrement;
        return this.currentKSeed;
    }

    private getNextInstSuffix() {
        this.instSuffix += this.config.telemetry.instSuffixIncrement;
        return this.instSuffix > 1 ? `${this.instSuffix}` : "";
    }
}
