import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { signup as apiSignup } from '../api';
import AuthCard from '../components/AuthCard';
import PasswordStrength from '../components/PasswordStrength';
import Logo from '../components/Logo';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

function validate(field, value) {
  switch (field) {
    case 'username':
      if (!value.trim()) return 'Username is required';
      if (!USERNAME_RE.test(value)) return '3-20 chars, letters, numbers, underscores';
      return null;
    case 'email':
      if (!value.trim()) return 'Email is required';
      if (!EMAIL_RE.test(value)) return 'Please enter a valid email';
      return null;
    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 6) return 'At least 6 characters';
      return null;
    default:
      return null;
  }
}

const INITIAL_FORM = { username: '', email: '', password: '' };

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const errors = useMemo(() => {
    const errs = {};
    for (const field of Object.keys(form)) {
      errs[field] = validate(field, form[field]);
    }
    return errs;
  }, [form]);

  const isFormValid = useMemo(() => {
    return Object.values(errors).every((e) => e === null) && acceptedTerms;
  }, [errors, acceptedTerms]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const allTouched = {};
    for (const field of Object.keys(form)) allTouched[field] = true;
    setTouched(allTouched);

    if (!isFormValid) return;

    setLoading(true);
    try {
      await apiSignup({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      navigate('/');
    } catch {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  function renderField({ field, label, type, icon: Icon, placeholder, autoComplete, isPassword, showState, onToggleShow }) {
    const val = form[field];
    const hasError = touched[field] && errors[field];
    const isValid = touched[field] && !errors[field] && val;

    return (
      <div className="input-group">
        <label htmlFor={field}>{label}</label>
        <div className="input-wrapper">
          <Icon size={18} className="input-icon" />
          <input
            id={field}
            name={field}
            type={isPassword ? (showState ? 'text' : 'password') : type}
            placeholder={placeholder}
            value={val}
            onChange={handleChange(field)}
            onBlur={handleBlur(field)}
            autoComplete={autoComplete}
          />
          {touched[field] && val && (
            <span className={`input-suffix ${isValid ? 'valid' : 'invalid'}`}>
              {isValid ? <Check size={16} /> : <X size={16} />}
            </span>
          )}
          {isPassword && (
            <button
              type="button"
              className="input-toggle"
              onClick={onToggleShow}
              tabIndex={-1}
            >
              {showState ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {hasError && <div className="field-error">{errors[field]}</div>}
        {field === 'password' && touched.password && (
          <PasswordStrength password={form.password} />
        )}
      </div>
    );
  }

  return (
    <AuthCard>
      <div className="auth-header">
        <div className="auth-brand">
          <Logo />
          <span>SyncBoard</span>
        </div>
        <h1 className="auth-title">Create Your Account</h1>
        <p className="auth-subtitle">Join developers building amazing projects together.</p>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {renderField({
          field: 'username', label: 'Username', type: 'text',
          icon: User, placeholder: 'johndoe',
          autoComplete: 'username',
        })}

        {renderField({
          field: 'email', label: 'Email', type: 'email',
          icon: Mail, placeholder: 'you@example.com',
          autoComplete: 'email',
        })}

        {renderField({
          field: 'password', label: 'Password', type: 'password',
          icon: Lock, placeholder: 'Create a strong password',
          autoComplete: 'new-password', isPassword: true,
          showState: showPassword, onToggleShow: () => setShowPassword(!showPassword),
        })}

        <label className="auth-checkbox" style={{ marginTop: 2 }}>
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          I agree to the{' '}
          <button type="button" className="forgot-link" style={{ display: 'inline', fontSize: 'inherit' }}>
            Terms &amp; Conditions
          </button>
        </label>

        <button type="submit" className="auth-btn" disabled={loading || !isFormValid}>
          <span>{loading ? 'Creating account...' : 'Create Account'}</span>
        </button>
      </form>

      <p className="auth-footer-text">
        Already have an account?{' '}
        <Link to="/" className="auth-link">Sign In</Link>
      </p>

      <p className="auth-trust">Secure collaboration platform for developers.</p>
    </AuthCard>
  );
}
