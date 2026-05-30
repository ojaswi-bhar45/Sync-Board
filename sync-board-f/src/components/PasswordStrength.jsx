import { useMemo } from 'react';

function evaluateStrength(password) {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const LEVELS = [
  { label: 'Weak', color: '#ef4444', width: '25%' },
  { label: 'Fair', color: '#f59e0b', width: '50%' },
  { label: 'Good', color: '#eab308', width: '65%' },
  { label: 'Strong', color: '#10b981', width: '85%' },
  { label: 'Very strong', color: '#059669', width: '100%' },
];

export default function PasswordStrength({ password }) {
  const strength = useMemo(() => evaluateStrength(password), [password]);
  const level = LEVELS[strength];

  if (!password) return null;

  return (
    <div>
      <div className="password-strength">
        <div
          className="password-strength-bar"
          style={{ width: level.width, background: level.color }}
        />
      </div>
      <div className="password-strength-text" style={{ color: level.color }}>
        {level.label}
      </div>
    </div>
  );
}
