import { Product, ChatMessage } from '../types';
import { askAboutProducts } from './api';

export async function sendSpecialChatRequest({
  message,
  product,
  previousMessages = [],
}: {
  message: string;
  product: Product;
  previousMessages?: ChatMessage[];
}): Promise<string> {
  // Only include the single product in context
  const userMsg: ChatMessage = { role: 'user', content: message };
  const context = {
    products: [product],
    answers: [],
    summary: '',
    chatMessages: [...previousMessages, userMsg].slice(-5),
  };
  return askAboutProducts(message, context);
} 