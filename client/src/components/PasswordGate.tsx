import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { api } from '@/lib/api';
import { setToken } from '@/lib/auth';

export function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const token = await api.login(password);
      setToken(token);
      onUnlock();
    } catch {
      setError('Wrong password');
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-semibold">EatList</h1>
          <p className="text-sm text-ink/60 mt-1">
            Italy & Greece — enter password to continue
          </p>
        </div>
        <Input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={busy || !password}
        >
          {busy ? 'Checking…' : 'Unlock'}
        </Button>
      </form>
    </div>
  );
}
