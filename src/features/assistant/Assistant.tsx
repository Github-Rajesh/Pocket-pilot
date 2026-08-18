import { FormEvent, useMemo, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { useFinance } from '../../app/FinanceProvider';
import {
  calculateDashboardMetrics,
  currency,
  evaluatePurchase,
  generateInsights,
} from '../../domain/services/financeCalculations';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function Assistant() {
  const { state } = useFinance();
  const [input, setInput] = useState('Can I buy a laptop for 95000?');
  const metrics = calculateDashboardMetrics(state);
  const starterMessages = useMemo<Message[]>(
    () => [
      {
        role: 'assistant',
        content: `You can safely spend ${currency(metrics.safeSpendToday)} today. Ask about purchases, goals, salary changes, or spending leaks.`,
      },
    ],
    [metrics.safeSpendToday],
  );
  const [messages, setMessages] = useState<Message[]>(starterMessages);

  function submit(event: FormEvent) {
    event.preventDefault();
    const question = input.trim();

    if (!question) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: 'user', content: question },
      { role: 'assistant', content: answerQuestion(question) },
    ]);
    setInput('');
  }

  function answerQuestion(question: string) {
    const normalized = question.toLowerCase();
    const amountMatch = normalized.match(/(?:rs|₹)?\s?([0-9][0-9,]*)/i);
    const amount = amountMatch ? Number(amountMatch[1].replaceAll(',', '')) : 0;

    if (normalized.includes('buy') || normalized.includes('afford')) {
      const item = question.replace(/can i|should i|buy|afford|for|rs|₹|[0-9,?]/gi, '').trim() || 'this';
      const decision = evaluatePurchase(state, item, amount || 95000);
      return `${decision.verdict}: ${decision.summary} ${decision.impact.join(' ')}`;
    }

    if (normalized.includes('salary') || normalized.includes('lpa')) {
      const future = state.profile.expectedSalaryMin;
      const gain = future - state.profile.monthlySalary;
      return `At ${currency(future)} per month, your monthly planning room improves by about ${currency(gain)} before lifestyle changes. Keep the savings target fixed for one cycle after the hike.`;
    }

    if (normalized.includes('spend') || normalized.includes('spent')) {
      return `This month you have spent ${currency(metrics.currentMonthExpenses)}. The safest daily spend from here is ${currency(metrics.safeSpendToday)}.`;
    }

    if (normalized.includes('waste') || normalized.includes('leak')) {
      return `${metrics.topSpendingCategory} is the current spending leak candidate. Review every transaction in that category before adding new discretionary spends.`;
    }

    return generateInsights(state).join(' ');
  }

  return (
    <section className="screen assistant-screen">
      <header className="screen-header">
        <div>
          <span className="eyebrow">Decision engine</span>
          <h1>AI Financial Assistant</h1>
          <p>Rule-based now, ready for a real LLM backend later.</p>
        </div>
      </header>

      <div className="assistant-layout">
        <article className="panel chat-panel">
          <div className="chat-list">
            {messages.map((message, index) => (
              <div className={`chat-bubble chat-bubble--${message.role}`} key={`${message.role}-${index}`}>
                {message.role === 'assistant' && <Bot size={18} />}
                <p>{message.content}</p>
              </div>
            ))}
          </div>

          <form className="chat-input" onSubmit={submit}>
            <input
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask: Can I buy an iPhone this month?"
              value={input}
            />
            <button aria-label="Send question" type="submit">
              <Send size={18} />
            </button>
          </form>
        </article>

        <aside className="panel prompt-panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Try asking</span>
              <h2>Smart prompts</h2>
            </div>
          </div>
          {[
            'How much did I spend this month?',
            'Can I buy a laptop for 95000?',
            'What category wastes the most money?',
            'What if my salary increases?',
          ].map((prompt) => (
            <button className="prompt-chip" key={prompt} onClick={() => setInput(prompt)} type="button">
              <Sparkles size={16} />
              {prompt}
            </button>
          ))}
        </aside>
      </div>
    </section>
  );
}
