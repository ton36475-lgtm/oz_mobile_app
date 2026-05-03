/**
 * Communication Bus
 * Handles inter-agent messaging and event broadcasting
 */

import type { CommunicationMessage, DebugLog } from './types';

export type MessageHandler = (message: CommunicationMessage) => void | Promise<void>;

export class CommunicationBus {
  private messageQueue: CommunicationMessage[] = [];
  private subscribers: Map<string, Set<MessageHandler>> = new Map();
  private debugLogs: DebugLog[] = [];
  private messageId: number = 0;

  /**
   * Subscribe to messages from specific agent
   */
  subscribe(agentId: string, handler: MessageHandler): () => void {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, new Set());
    }

    const handlers = this.subscribers.get(agentId)!;
    handlers.add(handler);

    this.log('debug', 'Subscriber registered', { agentId, handlerCount: handlers.size });

    // Return unsubscribe function
    return () => {
      handlers.delete(handler);
      this.log('debug', 'Subscriber unregistered', { agentId });
    };
  }

  /**
   * Publish message to specific agent
   */
  async publish(message: Omit<CommunicationMessage, 'id' | 'timestamp'>): Promise<string> {
    const fullMessage: CommunicationMessage = {
      ...message,
      id: `msg-${this.messageId++}`,
      timestamp: new Date(),
    };

    this.messageQueue.push(fullMessage);
    this.log('debug', 'Message published', {
      messageId: fullMessage.id,
      fromAgent: message.fromAgentId,
      type: message.type,
    });

    // Deliver to subscribers
    if (message.type === 'broadcast') {
      await this.broadcastMessage(fullMessage);
    } else if (message.toAgentId) {
      await this.deliverToAgent(message.toAgentId, fullMessage);
    }

    return fullMessage.id;
  }

  /**
   * Get message history
   */
  getMessageHistory(limit: number = 100): CommunicationMessage[] {
    return this.messageQueue.slice(-limit);
  }

  /**
   * Get messages from specific agent
   */
  getMessagesByAgent(agentId: string, limit: number = 50): CommunicationMessage[] {
    return this.messageQueue.filter((m) => m.fromAgentId === agentId).slice(-limit);
  }

  /**
   * Clear message queue
   */
  clearMessageQueue(): void {
    this.messageQueue = [];
    this.log('info', 'Message queue cleared');
  }

  /**
   * Get debug logs
   */
  getLogs(): DebugLog[] {
    return [...this.debugLogs];
  }

  /**
   * Clear debug logs
   */
  clearLogs(): void {
    this.debugLogs = [];
  }

  // Private helper methods

  private async broadcastMessage(message: CommunicationMessage): Promise<void> {
    const allHandlers: MessageHandler[] = [];

    for (const handlers of this.subscribers.values()) {
      allHandlers.push(...handlers);
    }

    this.log('debug', 'Broadcasting message', { messageId: message.id, recipientCount: allHandlers.length });

    await Promise.all(allHandlers.map((handler) => this.safeExecute(handler, message)));
  }

  private async deliverToAgent(agentId: string, message: CommunicationMessage): Promise<void> {
    const handlers = this.subscribers.get(agentId);

    if (!handlers || handlers.size === 0) {
      this.log('warn', 'No handlers for agent', { agentId, messageId: message.id });
      return;
    }

    this.log('debug', 'Delivering message to agent', { agentId, messageId: message.id });

    await Promise.all(Array.from(handlers).map((handler) => this.safeExecute(handler, message)));
  }

  private async safeExecute(handler: MessageHandler, message: CommunicationMessage): Promise<void> {
    try {
      await handler(message);
    } catch (error) {
      this.log('error', 'Handler execution failed', { error: String(error), messageId: message.id });
    }
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: Record<string, any>): void {
    const log: DebugLog = {
      level,
      message,
      timestamp: new Date(),
      context,
    };
    this.debugLogs.push(log);
    console.log(`[CommunicationBus] [${level.toUpperCase()}] ${message}`, context);
  }
}
