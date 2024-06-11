import {Storage} from '@plasmohq/storage';

export default class RequestLog {
    storage: Storage;
    prefix = 'request-log';
    constructor() {
        this.storage = new Storage();
    }

    async getStorage() {
        const all = await this.storage.getAll();
        return Object.values(all).reverse;
    }

    setStorage(requestUrl: string, resultRaw: string) {
        void this.storage.set(`${this.prefix}-${Date.now()}`, {
            requestUrl,
            resultRaw
        });
    }
}
