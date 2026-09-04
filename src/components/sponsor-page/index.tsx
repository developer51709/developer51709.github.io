import { useState } from 'react';
import { FaHeart, FaBackspace } from 'react-icons/fa';
import { SiBitcoin } from 'react-icons/si';
import { BG_COLOR } from '../../constants';

const PRESET_AMOUNTS = [3, 5, 10, 25];

/**
 * Sponsor page — lets visitors donate crypto via OxaPay.
 * The merchant API key never reaches the browser: donation links are created
 * by the serverless function at /api/create-invoice (deployed on Vercel).
 */
const SponsorPage = ({ onBack }: { onBack: () => void }) => {
  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveAmount = customAmount ? Number(customAmount) : amount;

  const handleDonate = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: effectiveAmount,
          description: 'Portfolio sponsorship',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.paymentUrl) {
        throw new Error(data.error || 'Failed to start payment');
      }
      window.location.href = data.paymentUrl as string;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Try again.',
      );
      setLoading(false);
    }
  };

  return (
    <div className={`relative z-10 min-h-full p-4 lg:p-10 ${BG_COLOR}/80`}>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="btn btn-ghost btn-sm text-base-content/60 mb-6"
        >
          <FaBackspace className="w-4 h-4" /> Back to portfolio
        </button>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
                <FaHeart className="text-2xl text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-base-content">
                  Sponsor my work
                </h1>
                <p className="text-base-content/60 text-sm">
                  Your donation in crypto helps fund open-source projects.
                  Powered by{' '}
                  <a
                    href="https://oxapay.com"
                    target="_blank"
                    rel="noreferrer"
                    className="link link-hover text-primary"
                  >
                    OxaPay
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount('');
                  }}
                  className={`btn btn-outline ${!customAmount && amount === preset ? 'btn-primary' : 'text-base-content'}`}
                >
                  ${preset}
                </button>
              ))}
            </div>

            <label className="form-control mb-6">
              <span className="label-text text-base-content/60 mb-2 block text-sm">
                Or enter a custom amount (USD)
              </span>
              <input
                type="number"
                min={1}
                step="any"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="e.g. 7.50"
                className="input input-bordered w-full bg-base-200 text-base-content"
              />
            </label>

            {error && (
              <div className="alert alert-error mb-6 text-sm">{error}</div>
            )}

            <button
              onClick={handleDonate}
              disabled={loading || !effectiveAmount || effectiveAmount <= 0}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <SiBitcoin className="w-5 h-5" />
              )}
              Donate ${effectiveAmount || 0} with Crypto
            </button>

            <p className="text-xs text-base-content/40 mt-4 text-center">
              You'll be redirected to a secure OxaPay checkout to complete your
              payment. Crypto payments are final and non-refundable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorPage;
