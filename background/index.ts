import {
    MESSAGE_ACTION_OPEN_PANEL,
    MESSAGE_ACTION_SET_PANEL_OPEN_OR_NOT,
    MESSAGE_PANEL_OPENED_PING_FROM_PANEL,
    MESSAGE_UPDATE_PANEL_INIT_DATA,
    PORT_LISTEN_PANEL_CLOSED_KEY
} from "~utils";
import {Logger} from "~utils/logger";
import Analytics from '~libs/ga';

chrome.sidePanel
    .setPanelBehavior({
        openPanelOnActionClick: true,
    })
    .then(() => {
        // ignore
    })
    .catch((error) => Logger.error(error));
let panelOpened = false;

// --- currentWindowId start ---
let currentWindowId: number | undefined;

function updateCurrentWindowId() {
    chrome.windows.getCurrent({populate: true}, (currentWindow) => {
        currentWindowId = currentWindow.id;
    });
}

function closePanel() {
    void chrome.sidePanel.setOptions({enabled: false}).then(() => {
        void chrome.sidePanel.setOptions({enabled: true});
    });
}

function changePanelShowStatus() {
    panelOpened = !panelOpened;

    if (panelOpened) {
        void openPanel(undefined);
    } else {
        closePanel();
    }
}

updateCurrentWindowId();

addEventListener('unhandledrejection', async (event) => {
    Logger.trace('unhandledrejection', event.reason);
    void Analytics.fireErrorEvent(event.reason);
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        currentWindowId = windowId;
    }
});

chrome.windows.onCreated.addListener(() => {
    updateCurrentWindowId();
});

chrome.windows.onRemoved.addListener(() => {
    updateCurrentWindowId();
});

// --- currentWindowId end ---
const injectContentScript = async function () {
    if (!chrome.runtime.getManifest().content_scripts) return;

    for (const cs of chrome.runtime.getManifest().content_scripts!) {
        for (const tab of await chrome.tabs.query({url: cs.matches})) {
            if(tab?.url?.startsWith("http")) {
                void chrome.scripting.executeScript({
                    files: cs.js!,
                    target: {tabId: tab.id!, allFrames: cs.all_frames},
                    injectImmediately: cs.run_at === 'document_start',
                    // world: cs.world, // uncomment if you use it in manifest.json in Chrome 111+
                });
            }
        }
    }
};

const openGuidePageAfterInstall = function () {
    chrome.tabs.create({
        url: `chrome-extension://${chrome.runtime.id}/tabs/greeting.html`,
        active: true
    }, function(tab) {
        Logger.log("New tab opened at index " + tab.index);
    });
};

chrome.runtime.onInstalled.addListener(async () => {
    void Analytics.fireEvent('install');
    void injectContentScript();
    openGuidePageAfterInstall();
});

chrome.action.onClicked.addListener(() => {
    changePanelShowStatus();
});

// chrome.declarativeNetRequest.getEnabledRulesets().then((rulesets) => {
//     Logger.log('getEnabledRulesets')
//     Logger.log(rulesets)
// })
// chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((details) => {
//     Logger.log("declarativeNetRequest")
//     Logger.log(details)
// })
//
// chrome.declarativeNetRequest.getMatchedRules({tabId: -1},
//     function (rules) {
//         Logger.log("getMatchedRules")
//         Logger.log(rules)
//     }
// )

chrome.runtime.onMessage.addListener(async function (request) {
    switch (request.action) {
    // case 'sync_panel_info':
    //     const tab = request.data as chrome.tabs.Tab
    //     scriptingGoogle(tab.id);
    //     break;
    // case MESSAGE_ACTION_OPEN_PANEL_WITH_SEARCH_TEXT:
    //     await openPanel(request.windowId)
    //     setTimeout(() => {
    //         void chrome.runtime.sendMessage({action: MESSAGE_ACTION_SYNC_SEARCH_TEXT, data: request.data});
    //     }, 500)
    //     break;
    case MESSAGE_ACTION_SET_PANEL_OPEN_OR_NOT:
        changePanelShowStatus();
        break;
        // case MESSAGE_ACTION_OPEN_PANEL_ASK_AI:
        //     await openPanel(request.windowId)
        //     break;
    case MESSAGE_ACTION_OPEN_PANEL:
        Logger.log('MESSAGE_ACTION_OPEN_PANEL', MESSAGE_ACTION_OPEN_PANEL);
        void chrome.runtime.sendMessage({action: MESSAGE_UPDATE_PANEL_INIT_DATA}).catch(e => {
            panelOpened = false;
            Logger.log('send message error', e);
        });

        if(!panelOpened) {
            changePanelShowStatus();
        }

        break;
    case MESSAGE_PANEL_OPENED_PING_FROM_PANEL:
        panelOpened = true;
        break;
    }
});

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === PORT_LISTEN_PANEL_CLOSED_KEY) {
        port.onDisconnect.addListener(() => {
            panelOpened = false;
        });
    }
});

//
// type SearchText = string;
//
// class OpenPanelOptions {
//     panelPath: PanelRouterPath
//     data: IAskAi | SearchText
// }

async function openPanel(windowId: number | undefined) {
    if (windowId === undefined) {
        windowId = currentWindowId;
    }

    // This will open the panel in all the pages on the current window.
    void chrome.sidePanel.open({windowId: windowId!});
}

