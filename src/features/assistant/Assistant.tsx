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
  const [isThinking, setIsThinking] = useState(false);
  const metrics = calculateDashboardMetrics(state);
  const starterMessages = useMemo<Message[]>(
    () => [
      {
        role: 'assistant',
        content: `You can safely spend ${currency(metrics.safeSpendToday)} today. Ask about purchases, goals, debts, salary changes, or spending leaks.`,
      },
    ],
    [metrics.safeSpendToday],
  );
  const [messages, setMessages] = useState<Message[]>(starterMessages);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const question = input.trim();

    if (!question || isThinking) {
      return;
    }

    setMessages((current) => [...current, { role: 'user', content: question }]);
    setInput('');
    setIsThinking(true);

    const answer = await answerWithBackend(question);
    setMessages((current) => [...current, { role: 'assistant', content: answer }]);
    setIsThinking(false);
  }

  async function answerWithBackend(question: string) {
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question,
          finance: {
            profile: state.profile,
            transactions: state.transactions,
            goals: state.goals,
            debts: state.debts,
            creditCards: state.creditCards,
            metrics,
          },
        }),
      });
      const payload = (await response.json()) as { answer?: string; error?: string };

      if (!response.ok || !payload.answer) {
        return `${answerQuestion(question)}\n\nAI backend is not active yet: ${payload.error ?? 'missing response'}.`;
      }

      return payload.answer;
    } catch {
      return `${answerQuestion(question)}\n\nAI backend could not be reached, so I used the local finance rules.`;
    }
  }

  function answerQuestion(question: string) {
    const normalized = question.toLowerCase();
    const amountMatch = normalized.match(/(?:rs)?\s?([0-9][0-9,]*)/i);
    const amount = amountMatch ? Number(amountMatch[1].replaceAll(',', '')) : 0;

    if (normalized.includes('buy') || normalized.includes('afford')) {
      const item =
        question.replace(/can i|should i|buy|afford|for|rs|[0-9,?]/gi, '').trim() || 'this';
      const decision = evaluatePurchase(state, item, amount || 95000);
      return `${decision.verdict}: ${decision.summary} ${decision.impact.join(' ')}`;
    }

    if (normalized.includes('salary') || normalized.includes('lpa')) {
      const future = state.profile.expectedSalaryMin;
      const gain = future - state.profile.monthlySalary;
      return `At ${currency(future)} per month, your monthly planning room improves by about ${currency(gain)} before lifestyle changes.`;
    }

    if (normalized.includes('spend') || normalized.includes('spent')) {
      return `This month you have spent ${currency(metrics.currentMonthExpenses)} on flexible expenses. The safest daily spend from here is ${currency(metrics.safeSpendToday)}.`;
    }

    if (normalized.includes('debt') || normalized.includes('owe')) {
      return `You currently track ${currency(metrics.debtOutstandingTotal)} outstanding debt, with ${currency(metrics.unpaidDebtPaymentTotal)} still due this month.`;
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
          <p>Uses your current app data to answer purchase, budget, debt, and salary questions.</p>
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
            {isThinking && (
              <div className="chat-bubble chat-bubble--assistant">
                <Bot size={18} />
                <p>Thinking...</p>
              </div>
            )}
          </div>

          <form className="chat-input" onSubmit={submit}>
            <input
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask: Can I buy an iPhone this month?"
              value={input}
            />
            <button aria-label="Send question" disabled={isThinking} type="submit">
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
            'How much debt is still due?',
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
