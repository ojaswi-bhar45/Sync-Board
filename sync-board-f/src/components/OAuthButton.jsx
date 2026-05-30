import { toast } from './Toast';

export default function OAuthButton({ provider, icon }) {
  const handleClick = () => {
    toast(`${provider} sign-in coming soon!`, 'info');
  };

  return (
    <button className="auth-oauth-btn" onClick={handleClick} type="button">
      {icon}
      Continue with {provider}
    </button>
  );
}
