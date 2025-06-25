import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, CheckCircle2, UserCircle } from 'lucide-react';
import Select from 'react-select';
import api from '../utility/api';
import Login from './Login';

const indiaCities = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai",
  "Kolkata", "Pune", "Jaipur", "Lucknow", "Nagpur", "Indore", "Bhopal",
  "Patna", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot"
];

const cityOptions = indiaCities.map(city => ({ label: city, value: city }));

const SignUp = ({ open, onClose, onSubmit, onLoginClick }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    age: '',
    city: '',
    profession: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(300);

  useEffect(() => {
    if (otpSent && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpSent, timer]);

  useEffect(() => {
    if (!open) {
      setFormData({ firstName: '', lastName: '', email: '', gender: '', age: '', city: '', profession: '', password: '' });
      setOtp(['', '', '', '', '', '']);
      setOtpSent(false);
      setTimer(300);
      setIsVerified(false);
    }
  }, [open]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!open) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index, value) => {
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleVerifyEmail = async () => {
    if (!formData.email) {
      alert("Please enter your email.");
      return;
    }

    try {
      const res = await api.post('/auth/send-otp', { email: formData.email });
      if (res.data.success) {
        alert("OTP sent successfully.");
        setOtpSent(true);
        setTimer(300);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send OTP.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isVerified) {
      alert("Please verify your email before signing up.");
      return;
    }

    try {
      const registerRes = await api.post('/auth/register', {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        age: formData.age,
        city: formData.city,
        profession: formData.profession
      });

      if (registerRes.data.success) {
        alert("Registration successful!");
        if (onSubmit) onSubmit(formData);
      } else {
        alert(registerRes.data.message);
      }

    } catch (err) {
      console.error(err);
      alert("Registration failed.");
    }
  };

  const handleOtpVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      alert("Please enter a 6-digit OTP.");
      return;
    }

    try {
      const verifyRes = await api.post('/auth/verify-otp', {
        email: formData.email,
        otp: otpCode
      });

      if (verifyRes.data.success) {
        setIsVerified(true);
        setOtpSent(false);
        alert("Email verified successfully!");
      } else {
        alert(verifyRes.data.message);
      }

    } catch (err) {
      console.error(err);
      alert("OTP verification failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()} />
      <div className="relative w-full max-w-4xl max-h-[88vh] bg-gradient-to-br from-slate-200 to-slate-300 overflow-y-auto rounded-2xl shadow-2xl p-6 border border-gray-300 z-10">
        <button className="absolute top-4 right-4 text-gray-500 hover:text-red-500" onClick={onClose}><X className="w-6 h-6" /></button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-blue-700">Create Account</h2>
          <p className="text-sm text-gray-600">Become a part of <span className="text-purple-600 font-semibold">JoinMe</span> community</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
          <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" className="col-span-1 px-4 py-2 border border-gray-300 rounded-md" required />
          <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" className="col-span-1 px-4 py-2 border border-gray-300 rounded-md" />

          <div className="col-span-2 flex gap-3 items-center">
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Your email" className="flex-1 px-4 py-2 border border-gray-300 rounded-md" required />
            <button type="button" onClick={handleVerifyEmail} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md">Verify</button>
          </div>

          {isVerified && (
            <div className="col-span-2 text-green-600 flex items-center gap-2 text-sm ml-1">
              <CheckCircle2 size={18} /> Verified email
            </div>
          )}

          {otpSent && !isVerified && (
            <>
              <div className="col-span-2 flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    maxLength={1}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    className="w-10 h-12 text-xl text-center border border-gray-300 rounded-md"
                  />
                ))}
              </div>
              <div className="col-span-2 text-center">
                <p className="text-sm text-gray-500">OTP expires in <span className="font-semibold text-red-500">{formatTime(timer)}</span></p>
                <button type="button" onClick={handleOtpVerify} className="mt-2 text-blue-600 hover:underline">Verify OTP</button>
              </div>
            </>
          )}

          <div className="col-span-2 relative">
            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Create Password" className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
            <button type="button" className="absolute top-2 right-3 text-gray-500" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <select name="gender" value={formData.gender} onChange={handleChange} className="col-span-1 px-4 py-2 border border-gray-300 rounded-md" required>
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Age" className="col-span-1 px-4 py-2 border border-gray-300 rounded-md" required />

          <div className="col-span-1">
            <Select options={cityOptions} placeholder="Select City" onChange={(selected) => setFormData({ ...formData, city: selected.value })} />
          </div>
          <input name="profession" value={formData.profession} onChange={handleChange} placeholder="Profession (e.g., Student, Developer)" className="col-span-1 px-4 py-2 border border-gray-300 rounded-md" required />

          <button type="submit" className="col-span-2 w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-lg">Sign Up</button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <button
            type="button"
            className="text-blue-700 hover:underline"
            onClick={() => {
              if (onClose) onClose();
              if (onLoginClick) onLoginClick();
            }}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;

