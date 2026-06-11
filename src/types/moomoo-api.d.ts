declare module 'moomoo-api' {
  export default class MoomooWebSocket {
    onlogin?: (ret?: unknown, msg?: unknown) => void | Promise<void>;
    start(ip: string, port: number, ssl: boolean, key?: string): void;
    stop(): void;
    getConnID(): string | number;
    GetAccList(req: unknown): Promise<unknown>;
    UnlockTrade(req: unknown): Promise<unknown>;
    PlaceOrder(req: unknown): Promise<unknown>;
  }
}

declare module 'moomoo-api/proto' {
  export const Common: Record<string, unknown>;
  export const Trd_Common: Record<string, unknown>;
}
