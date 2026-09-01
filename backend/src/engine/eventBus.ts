import { EventEmitter } from 'events';
import { ChatMessage, AlertEvent, AiSpeechEvent, AiStatusEvent } from '../types';

export interface EventBusEvents {
  'chat:message': (message: ChatMessage) => void;
  'alert:event': (alert: AlertEvent) => void;
  'bot:status': (status: {
    twitch: { connected: boolean; channel?: string; error?: string };
    kick: { connected: boolean; channel?: string; error?: string };
  }) => void;
  'goal:update': (data: { current: number; target: number; title: string; type: string }) => void;
  'ai:speech': (event: AiSpeechEvent) => void;
  'ai:status': (event: AiStatusEvent) => void;
}

class AppEventBus extends EventEmitter {
  public emitMessage(message: ChatMessage) {
    this.emit('chat:message', message);
  }

  public emitAlert(alert: AlertEvent) {
    this.emit('alert:event', alert);
  }

  public emitBotStatus(status: {
    twitch: { connected: boolean; channel?: string; error?: string };
    kick: { connected: boolean; channel?: string; error?: string };
  }) {
    this.emit('bot:status', status);
  }

  public emitGoalUpdate(data: { current: number; target: number; title: string; type: string }) {
    this.emit('goal:update', data);
  }

  public emitAiSpeech(event: AiSpeechEvent) {
    this.emit('ai:speech', event);
  }

  public emitAiStatus(event: AiStatusEvent) {
    this.emit('ai:status', event);
  }
}

export const eventBus = new AppEventBus();
