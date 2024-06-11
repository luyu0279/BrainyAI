import type {PlasmoMessaging} from "@plasmohq/messaging";
import {Logger} from "~utils/logger";

const setCookie = async (url: string, name: string, value: string) => {
    return new Promise((resolve) => {
        chrome.cookies.set({url, name, value}, function (cookie) {
            resolve(cookie);
        });
    });
};

const setPartitionCookie = async (domain: string, url: string) => {
    return new Promise((resolve) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        chrome.cookies.getAll({domain, partitionKey: {
            // topLevelSite: "https://perplexity.ai",
        }},  async(cookies) => {

            await Promise.all([...cookies.map(cookie => {
                Logger.trace(cookie);
                if(cookie['partitionKey']) {
                    return setCookie(url, cookie.name, cookie.value);
                }
            })]);

            resolve({});
        });
    });
};


const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const {domain, url} = req.body;
    await setPartitionCookie(domain, url);

    res.send({});
};

export default handler;
