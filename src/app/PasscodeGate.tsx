import { FormEvent, type ReactNode, useEffect, useState } from 'react';
import { LockKeyhole, WalletCards } from 'lucide-react';

const sessionKey = 'pocket-pilot-unlocked';
const passcodeHash = '55a628def0083e4f483db7b62d016371ee2ce9cd78a42a2acc32a3330966eb36';

export function PasscodeGate({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setIsUnlocked(window.sessionStorage.getItem(sessionKey) === 'true');
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const digest = await sha256(code.trim());

    if (digest !== passcodeHash) {
      setError('Incorrect code');
      setCode('');
      return;
    }

    window.sessionStorage.setItem(sessionKey, 'true');
    setIsUnlocked(true);
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <main className="lock-screen">
      <section className="lock-card" aria-labelledby="lock-title">
        <div className="brand lock-card__brand">
          <div className="brand__mark">
            <WalletCards size={24} />
          </div>
          <div>
            <strong>Pocket Pilot</strong>
            <span>Private financial OS</span>
          </div>
        </div>

        <div className="lock-card__icon">
          <LockKeyhole size={30} />
        </div>

        <div>
          <span className="eyebrow">Protected</span>
          <h1 id="lock-title">Enter access code</h1>
          <p>This workspace is private.</p>
        </div>

        <form className="lock-form" onSubmit={submit}>
          <label>
            Access code
            <input
              autoComplete="one-time-code"
              autoFocus
              inputMode="numeric"
              maxLength={12}
              onChange={(event) => {
                setCode(event.target.value);
                setError('');
              }}
              placeholder="Enter code"
              type="password"
              value={code}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit">
            Unlock
          </button>
        </form>
      </section>
    </main>
  );
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  return [...new Uint8Array(hashBuffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
