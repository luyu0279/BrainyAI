const debugOn = process.env.PLASMO_PUBLIC_DEBUG_ON === "1";

export class Logger {
    static console = console;

    static log(...args: any[]) {
        if (process.env.NODE_ENV !== 'production' || debugOn) {
            this.console.log(...args);
        }
    }

    static trace(...args: any[]) {
        if (process.env.NODE_ENV !== 'production' || debugOn) {
            this.console.trace(...args);
        }
    }

    static error(...args: any[]) {
        if (process.env.NODE_ENV !== 'production' || debugOn) {
            this.console.error(...args);
        }
    }
}
