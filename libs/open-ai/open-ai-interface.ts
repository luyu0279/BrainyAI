import type {ChatError} from "~utils/errors";
import type {ConversationMessageAppendix} from "~component/MessageAppendix";

export interface IOpenAISessionResponse {
    user?: {
        id: string;
        name: string;
        email: string;
        image: string;
        picture: string;
        idp: string;
        iat: number;
        mfa: boolean;
        groups: any[];
        intercom_hash: string;
    };
    expires?: string;
    accessToken?: string;
    authProvider?: string;
}

export interface IChatRequirementsResponse {
    persona: string;
    arkose: {
        required: false;
        dx?: any;
    };
    turnstile: {
        required: false;
    };
    proofofwork: {
        required: true;
        grade: string;
        seed: string;
        difficulty: string;
    };
    token: string
}

interface AccountProcessor {
    a001: {
        has_customer_object: boolean;
    };
    b001: {
        has_transaction_history: boolean;
    };
    c001: {
        has_transaction_history: boolean;
    };
}

interface AccountEntitlement {
    subscription_id: string;
    has_active_subscription: boolean;
    subscription_plan: string;
    expires_at: string;
    billing_period: any;
}

interface AccountLastActiveSubscription {
    subscription_id: string;
    purchase_origin_platform: string;
    will_renew: boolean;
}

interface Account {
    account_user_role: string;
    account_user_id: string;
    processor: AccountProcessor;
    account_id: string;
    organization_id: any;
    is_most_recent_expired_subscription_gratis: boolean;
    has_previously_paid_subscription: boolean;
    name: any;
    profile_picture_id: any;
    profile_picture_url: any;
    structure: string;
    plan_type: string;
    is_deactivated: boolean;
    promo_data: any;
}

type Accounts = Record<string, {
        account: Account;
        features: string[];
        entitlement: AccountEntitlement;
        rate_limits: any[];
        last_active_subscription: AccountLastActiveSubscription;
        is_eligible_for_yearly_plus_subscription: boolean;
    }>;

type AccountOrdering = Record<number, string>;

export interface IOpenaiAccountData {
    accounts: Accounts;
    account_ordering: AccountOrdering;
}

export enum GenerateStatus {
    GENERATING = "generating",
    DONE = "done",
}

export enum ResponseMessageType {
    DONE = "done",
    GENERATING = "generating",
    TITLED = "titled",
    ERROR = "error",
    ERROR_RETRY_MESSAGE = "error_retry_message",
    ERROR_NEED_NEW_CONVERSATION = "error_need_new_conversation",
}

export class ConversationResponse {
    conversation_id?: string;
    message_id?: string;
    message_text?: string;
    title?: string;
    message_type: ResponseMessageType;
    error?: ChatError;
    appendix?: ConversationMessageAppendix;
    adaptiveCards?: any;

    constructor({conversation_id, message_id, message_text,  message_type,title, error, appendix}: {conversation_id?: string, parent_message_id?: string, message_id?: string, message_text?: string, message_type: ResponseMessageType, title?: string, error?: ChatError, appendix?: ConversationMessageAppendix}) {
        this.conversation_id = conversation_id;
        this.message_id = message_id;
        this.message_text = message_text;
        this.message_type = message_type;
        this.error = error;
        this.title = title;
        this.appendix = appendix;
    }
}
