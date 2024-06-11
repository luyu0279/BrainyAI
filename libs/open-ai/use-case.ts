import {Logger} from "~utils/logger";

function getMimeType(extension) {
    const ext = extension.split(".").pop()?.toLowerCase();
    const mimeTypes = {
        md: "text/markdown",
        java: "text/x-java",
        py: "text/x-script.python",
        c: "text/x-c",
        cpp: "text/x-c++",
        h: "text/x-c++",
        php: "text/x-php",
        rb: "text/x-ruby",
        tex: "application/x-latex",
        ts: "text/x-typescript",
        cs: "text/x-csharp"
    };
    return mimeTypes[ext ?? ""] || "";
}

// function createFileMetadata(file) {
//     return JSON.stringify({
//         file: file.name,
//         modified: file.lastModified,
//         currentTime: new Date().toString()
//     });
// }

function determineMimeType(e, t, n, r, o) {
    Logger.trace(e,t,n,r,o);
    if (null == o)
        return e;
    const i = getMimeType(t);
    i && (n = i),
    r && (n = function(e) {
        switch (e) {
        case "application/vnd.google-apps.spreadsheet":
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        case "application/vnd.google-apps.document":
            return "text/plain";
        default:
            return e;
        }
    }(n));
    const {accepted_mime_types: l, can_accept_all_mime_types: a} = o;
    return null != l && 0 !== l.length && a ? l.includes(n) ? e : AJ.Interpreter : e;
}

// function translateMimeType(mimeType) {
//     switch (mimeType) {
//     case "application/vnd.google-apps.spreadsheet":
//         return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
//     case "application/vnd.google-apps.document":
//         return "text/plain";
//     default:
//         return mimeType;
//     }
// }

const USE_CASE = {
    AceUpload: "ace_upload",
    DalleAgent: "dalle_agent",
    Gizmo: "gizmo",
    Multimodal: "multimodal",
    MyFiles: "my_files",
    ProfilePicture: "profile_picture"
};

const AJ = {
    "0": "None",
    "1": "Multimodal",
    "2": "Interpreter",
    "3": "Retrieval",
    "4": "ContextConnector",
    "5": "ProfilePicture",
    "None": 0,
    "Multimodal": 1,
    "Interpreter": 2,
    "Retrieval": 3,
    "ContextConnector": 4,
    "ProfilePicture": 5
};

const OL = {
    PrimaryAssistant: "primary_assistant",
    GizmoInteraction: "gizmo_interaction",
    GizmoMagicCreate: "gizmo_magic_create",
    GizmoTest: "gizmo_test"
};

const Cd = {
    CodeInterpreter: "code_interpreter",
    Multimodal: "multimodal",
    Retrieval: "retrieval",
    ContextConnector: "context_connector"
};

function getProductFeatures(e, t) {
    if ((t?.kind) === OL.GizmoInteraction || (t?.kind) === OL.GizmoTest) {
        return t.gizmo?.product_features;
    }
    return e?.product_features;
}

function determineAttachmentType(e, t) {
    const productFeatures = getProductFeatures(e, t);
    if (productFeatures?.attachments?.type === Cd.CodeInterpreter) {
        return AJ.Interpreter;
    }
    if (productFeatures?.attachments?.type === Cd.Multimodal) {
        return AJ.Multimodal;
    }
    if (productFeatures?.attachments?.type === Cd.Retrieval) {
        return AJ.Retrieval;
    }
    if (productFeatures?.attachments?.type === Cd.ContextConnector) {
        return AJ.ContextConnector;
    }
    return AJ.None;
}

const EP = {
    id: "gpt-4o",
    maxTokens: 32767,
    title: "GPT-4o",
    description: "The latest and most advanced model",
    tags: ["gpt4", "gpt4o"],
    enabledTools: ["tools", "tools2"],
    product_features: {
        attachments: {
            type: "retrieval",
            accepted_mime_types: [
                "text/calendar",
                "text/x-makefile",
                "application/x-yaml",
                "text/x-typescript",
                "text/html",
                "application/msword",
                "text/javascript",
                "text/rtf",
                "text/vbscript",
                "text/xml",
                "text/x-csharp",
                "application/json",
                "text/x-asm",
                "application/rtf",
                "application/vnd.apple.pages",
                "application/x-scala",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "text/x-c",
                "text/x-shellscript",
                "text/x-rst",
                "text/plain",
                "text/x-sh",
                "text/markdown",
                "text/x-c++",
                "application/javascript",
                "text/x-php",
                "text/x-vcard",
                "application/x-sql",
                "text/x-tex",
                "application/x-rust",
                "application/vnd.apple.keynote",
                "text/x-java",
                "application/x-powershell",
                "text/x-lisp",
                "application/pdf",
                "message/rfc822",
                "application/vnd.ms-powerpoint",
                "text/x-script.python",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.oasis.opendocument.text",
                "text/x-python",
                "text/x-ruby",
                "text/x-diff",
                "text/css"
            ],
            image_mime_types: [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif"
            ],
            can_accept_all_mime_types: true
        }
    }
};

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export  function getUseCaseType(
    file,
    options: any = {},
    contextConnector?: any
) {
    const attachmentType = determineAttachmentType(EP, { kind: "primary_assistant" });
    const { gizmoId } = options as any;
    const mimeType = determineMimeType(attachmentType, file.name, file.type, contextConnector, EP.product_features.attachments);
    let useCaseType;
    if (imageMimeTypes.includes(file.type)) {
        useCaseType = USE_CASE.Multimodal;
    } else {
        switch (mimeType) {
        case AJ.Multimodal:
            throw new Error(`Multimodal file upload not supported mime type, ${file.type}\nSupported mime types: ${imageMimeTypes.join(", ")}`);
        case AJ.Interpreter:
            useCaseType = USE_CASE.AceUpload;
            break;
        case AJ.Retrieval:
            useCaseType = USE_CASE.MyFiles;
            break;
        case AJ.ProfilePicture:
            throw new Error("cannot upload profile picture via uploadFile");
        case AJ.ContextConnector:
        case AJ.None:
            return;
        }
    }

    if (gizmoId != null) {
        useCaseType = USE_CASE.Gizmo;
    }

    return useCaseType;
}
