export type ControlId = 'volume' | 'microphone' | 'wifi' | 'bluetooth' | 'brightness' | 'doNotDisturb';
export type MediaAction = 'playPause' | 'previous' | 'next';
export interface ControlValues { volume: number; microphone: number; brightness: number; wifi: boolean; bluetooth: boolean; doNotDisturb: boolean }
export interface Reading { value: number | null; unit: string; reason: string | null }
export interface ControlState { available: boolean; writable: boolean; value: number | boolean | null; reason: string | null }
export interface MediaState {
    available: boolean; title: string; artist: string; artwork: string | null; playing: boolean;
    positionSeconds: number | null; durationSeconds: number | null;
    controls: { playPause: boolean; previous: boolean; next: boolean }; reason: string | null;
}
export interface NativeSnapshot {
    protocolVersion: 1; sampledAt: number; provider: string;
    telemetry: { cpu: Reading; ram: Reading; gpu: Reading; temperature: Reading;
        memoryUsedBytes: number | null; memoryTotalBytes: number | null;
        sensors: Array<{ id: string; name: string; kind: string; value: number; unit: string }> };
    controls: Record<ControlId, ControlState>; media: MediaState;
}
export interface NativeCapabilities {
    protocolVersion: 1; platform: string; provider: string; controls: Record<ControlId, ControlState>;
    media: boolean; sensorProvider: string | null;
}
export interface ControlResult<K extends ControlId = ControlId> { protocolVersion: 1; id: K; value: ControlValues[K] }
export const NATIVE_CONTROL_IDS: ControlId[];
export function validateSnapshot(value: unknown): NativeSnapshot;
export function validateMedia(value: unknown): MediaState;
export type Invoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
export class NativeBridge {
    constructor(invoke?: Invoke | null, timeout?: number);
    available: boolean;
    call(command: string, args?: Record<string, unknown>): Promise<unknown>;
    discover(): Promise<NativeCapabilities>;
    snapshot(): Promise<NativeSnapshot>;
    setControl<K extends ControlId>(id: K, value: ControlValues[K]): Promise<ControlResult<K>>;
    mediaAction(action: MediaAction): Promise<MediaState>;
}
