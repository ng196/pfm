// Chatbot Widget JavaScript
class ChatbotWidget {
    constructor() {
        this.apiKey = "86f90fe16ae34556b84f61f69bfc772c.bDA0Er5ScuCqbpEq";
        this.baseURL = 'https://api.z.ai/api/coding/paas/v4';
        this.messages = [];
        this.isOpen = false;
        this.isLoading = false;
        this.init();
    }

    init() {
        this.createWidget();
        this.attachEventListeners();
    }

    createWidget() {
        // Create HTML structure
        const widgetHTML = `
            <button class="chatbot-toggle" id="chatbot-toggle" title="Chat with AI">
                <i class="fas fa-comments"></i>
            </button>

            <div class="chatbot-widget" id="chatbot-widget">
                <div class="chatbot-header">
                    <div>
                        <div class="chatbot-title">💬 FinBot Assistant</div>
                        <div class="chatbot-subtitle">Your Financial AI Helper</div>
                    </div>
                    <button class="chatbot-close" id="chatbot-close" title="Close chat">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="empty-state">
                        <div class="empty-state-icon">💰</div>
                        <div class="empty-state-text">Hi! I'm FinBot. Ask me about your finances!</div>
                    </div>
                </div>

                <div class="chatbot-input-area">
                    <input 
                        type="text" 
                        class="chatbot-input" 
                        id="chatbot-input" 
                        placeholder="Ask me anything..."
                        autocomplete="off"
                    >
                    <button class="chatbot-send" id="chatbot-send" title="Send message">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        // Add to body
        const container = document.createElement('div');
        container.innerHTML = widgetHTML;
        document.body.appendChild(container);

        // Cache elements
        this.widget = document.getElementById('chatbot-widget');
        this.toggle = document.getElementById('chatbot-toggle');
        this.closeBtn = document.getElementById('chatbot-close');
        this.input = document.getElementById('chatbot-input');
        this.sendBtn = document.getElementById('chatbot-send');
        this.messagesContainer = document.getElementById('chatbot-messages');
    }

    attachEventListeners() {
        this.toggle.addEventListener('click', () => this.toggleWidget());
        this.closeBtn.addEventListener('click', () => this.closeWidget());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    toggleWidget() {
        if (this.isOpen) {
            this.closeWidget();
        } else {
            this.openWidget();
        }
    }

    openWidget() {
        this.isOpen = true;
        this.widget.classList.add('active');
        this.toggle.classList.add('hidden');
        this.input.focus();
    }

    closeWidget() {
        this.isOpen = false;
        this.widget.classList.remove('active');
        this.toggle.classList.remove('hidden');
    }

    sendMessage() {
        const message = this.input.value.trim();
        if (!message || this.isLoading) return;

        // Clear input
        this.input.value = '';

        // Add user message
        this.addMessage(message, 'user');

        // Show typing indicator
        this.showTypingIndicator();

        // Send to API
        this.callChatAPI(message);
    }

    addMessage(content, sender) {
        // Remove empty state if exists
        const emptyState = this.messagesContainer.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        messageDiv.id = 'typing-indicator';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        messageDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    async callChatAPI(userMessage) {
        this.isLoading = true;
        this.sendBtn.disabled = true;

        try {
            this.messages.push({
                role: 'user',
                content: userMessage
            });

            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'glm-4.7',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are FinBot, a helpful financial assistant for a personal finance application. You help users with expense tracking, budgeting, goal setting, and financial advice. Be concise and friendly in your responses.'
                        },
                        ...this.messages
                    ],
                    temperature: 0.7,
                    max_tokens: 512
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const botMessage = data.choices[0].message.content;

            this.messages.push({
                role: 'assistant',
                content: botMessage
            });

            this.removeTypingIndicator();
            this.addMessage(botMessage, 'bot');

        } catch (error) {
            console.error('Chatbot Error:', error);
            this.removeTypingIndicator();
            this.addMessage(`Sorry, I encountered an error. Please try again. (${error.message})`, 'bot');
        } finally {
            this.isLoading = false;
            this.sendBtn.disabled = false;
            this.input.focus();
        }
    }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ChatbotWidget();
    });
} else {
    new ChatbotWidget();
}
