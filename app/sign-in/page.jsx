'use client'
import { useState } from 'react';
import { auth } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [userType, setUserType] = useState(''); // 'user' or 'admin'
  const router = useRouter();

  const handleUserSignIn = async () => {
    try {
      toast.loading('Signing In...');
      await signInWithEmailAndPassword(auth, email, password);
      toast.dismiss();
      toast.success('Sign In Successfully');
      sessionStorage.setItem('user', true);
      setEmail('');
      setPassword('');
      router.push('/');
    } catch (e) {
      toast.dismiss();
      toast.error('Invalid Credentials');
      console.error(e);
    }
  };

  const handleAdminSignIn = () => {
    if (username === 'admin' && adminPassword === '123') {
      toast.success('Admin Sign In Successfully');
      setUsername('');
      setAdminPassword('');
      document.cookie = "adminLoggedIn=true; path=/; max-age=3600"; 
      router.push('/admin'); // Redirect to admin page
    } else {
      toast.error('Invalid Admin Credentials');
    }
  };

  const handleForgotPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success('Password reset email sent!');
      setShowResetModal(false);
      setResetEmail('');
    } catch (e) {
      toast.error('Failed to send reset email');
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1c2a36]">
      <Toaster />
      {userType === '' && (
        <div className="bg-[#091e28] p-10 rounded-lg mx-2 shadow-xl w-96">
          <h1 className="text-[#ffffff] text-2xl mb-5">Choose Sign In Type</h1>
          <button
            onClick={() => setUserType('user')}
            className="w-full p-3 mb-4 bg-[#ffffff] rounded text-[#091e28] font-bold"
          >
            User Sign In
          </button>
          <button
            onClick={() => setUserType('admin')}
            className="w-full p-3 bg-[#ffffff] rounded text-[#091e28] font-bold"
          >
            Admin Sign In
          </button>
        </div>
      )}
      {userType === 'user' && (
        <div className="bg-[#091e28] p-10 rounded-lg mx-2 shadow-xl w-96">
          <h1 className="text-[#ffffff] text-2xl mb-5">User Sign In</h1>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
          />
          <button
            onClick={handleUserSignIn}
            className="w-full p-3 bg-[#ffffff] rounded text-[#091e28] font-bold mb-4"
          >
            Sign In
          </button>
          <div className="flex justify-between text-[#ffffff]">
            <button
              onClick={() => setShowResetModal(true)}
              className="text-[#ffffff] underline"
            >
              Forgot Password?
            </button>
            <button
              onClick={() => router.push('/sign-up')}
              className="text-[#ffffff] underline"
            >
              Create New Account
            </button>
          </div>
        </div>
      )}
      {userType === 'admin' && (
        <div className="bg-[#091e28] p-10 rounded-lg mx-2 shadow-xl w-96">
          <h1 className="text-[#ffffff] text-2xl mb-5">Admin Sign In</h1>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
          />
          <button
            onClick={handleAdminSignIn}
            className="w-full p-3 bg-[#ffffff] rounded text-[#091e28] font-bold"
          >
            Sign In
          </button>
          <button
            onClick={() => setUserType('')}
            className="w-full p-3 mt-4 bg-gray-500 rounded text-white font-bold"
          >
            Back
          </button>
        </div>
      )}
      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#091e28] p-10 rounded-lg shadow-xl w-80">
            <h2 className="text-[#ffffff] text-xl mb-4">Reset Password</h2>
            <input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
            />
            <button
              onClick={handleForgotPassword}
              className="w-full p-3 bg-[#ffffff] rounded text-[#091e28] font-bold"
            >
              Submit
            </button>
            <button
              onClick={() => setShowResetModal(false)}
              className="w-full p-3 mt-2 bg-gray-500 rounded text-white font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
