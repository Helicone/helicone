import { Dispatcher } from 'undici';
import { InputGatedEventTarget } from '@miniflare/shared';
import { kWrapListener } from '@miniflare/shared';
import { Plugin } from '@miniflare/shared';
import { PluginContext } from '@miniflare/shared';
import { RequestInfo } from '@miniflare/core';
import { RequestInit } from '@miniflare/core';
import { Response } from '@miniflare/core';
import { SetupResult } from '@miniflare/shared';
import StandardWebSocket from 'ws';

export declare class CloseEvent extends Event {
    readonly code: number;
    readonly reason: string;
    readonly wasClean: boolean;
    constructor(type: "close", init?: {
        code?: number;
        reason?: string;
        wasClean?: boolean;
    });
}

export declare function coupleWebSocket(ws: StandardWebSocket, pair: WebSocket): Promise<void>;

export declare class ErrorEvent extends Event {
    readonly error: Error | null;
    constructor(type: "error", init?: {
        error?: Error;
    });
}

declare const kAccepted: unique symbol;

declare const kClose: unique symbol;

declare const kClosedIncoming: unique symbol;

declare const kClosedOutgoing: unique symbol;

declare const kCoupled: unique symbol;

declare const kError: unique symbol;

declare const kPair: unique symbol;

declare const kSend: unique symbol;

export declare class MessageEvent extends Event {
    readonly data: ArrayBuffer | string;
    constructor(type: "message", init: {
        data: ArrayBuffer | string;
    });
}

export declare function upgradingFetch(this: Dispatcher | void, input: RequestInfo, init?: RequestInit): Promise<Response>;

export declare class WebSocket extends InputGatedEventTarget<WebSocketEventMap> {
    #private;
    static readonly READY_STATE_CONNECTING = 0;
    static readonly READY_STATE_OPEN = 1;
    static readonly READY_STATE_CLOSING = 2;
    static readonly READY_STATE_CLOSED = 3;
    [kPair]: WebSocket;
    [kAccepted]: boolean;
    [kCoupled]: boolean;
    [kClosedOutgoing]: boolean;
    [kClosedIncoming]: boolean;
    protected [kWrapListener]<Type extends keyof WebSocketEventMap>(listener: (event: WebSocketEventMap[Type]) => void): (event: WebSocketEventMap[Type]) => void;
    get readyState(): number;
    accept(): void;
    send(message: ArrayBuffer | string): void;
    [kSend](message: ArrayBuffer | string): void;
    close(code?: number, reason?: string): void;
    [kClose](code?: number, reason?: string): void;
    [kError](error?: Error): void;
}

export declare type WebSocketEventMap = {
    message: MessageEvent;
    close: CloseEvent;
    error: ErrorEvent;
};

export declare type WebSocketPair = {
    0: WebSocket;
    1: WebSocket;
};

export declare const WebSocketPair: {
    new (): WebSocketPair;
};

export declare class WebSocketPlugin extends Plugin {
    #private;
    constructor(ctx: PluginContext);
    setup(): SetupResult;
    fetch: (input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>;
    reload(): void;
    dispose(): void;
}

export { }
