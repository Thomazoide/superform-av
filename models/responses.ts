export interface ResponsePayload<T> {
    message: string;
    data?: T;
    error: boolean;
}