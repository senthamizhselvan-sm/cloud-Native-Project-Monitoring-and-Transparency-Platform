import { useNavigate } from 'react-router-dom';

export default function RegisterSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
      <h2 className="text-3xl font-bold text-green-700">Registration successful</h2>
      <p className="mt-4 text-sm text-slate-600">Your account was created. Please verify your email if required, then sign in.</p>
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => navigate('/login')}
          className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white"
        >
          Go to login
        </button>
      </div>
    </div>
  );
}
