import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, Mail, Lock, User, MapPin, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utility/api';
import { useUser } from '../context/userContext';

const cities = ["Nagpur", "Pune", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Jaipur"];

const Signup = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', gender: '', age: '', city: '', profession: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (otpSent && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpSent, timer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return; 
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyEmail = async () => {
    if (!formData.email) {
      toast.error("Please enter your email first.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { email: formData.email });
      if (res.data.success) {
        toast.success("OTP sent successfully to your email.");
        setOtpSent(true);
        setTimer(300); 
      } else {
        toast.error(res.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const verifyRes = await api.post('/auth/verify-otp', {
        email: formData.email,
        otp: otpCode
      });

      if (verifyRes.data.success) {
        setIsVerified(true);
        setOtpSent(false);
        toast.success("Email verified successfully! ✅");
      } else {
        toast.error(verifyRes.data.message || 'OTP verification failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isVerified) {
      toast.error("Please verify your email before signing up.");
      return;
    }

    setLoading(true);
    try {
      const registerRes = await api.post('/auth/register', {
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        age: Number(formData.age),
        city: formData.city,
        profession: formData.profession
      });

      if (registerRes.data.success) {
        toast.success("Registration successful! Welcome to JoinMe 🎉");
        
        // 🟢 THE FIX: Safely store the Bearer token!
        if (registerRes.data.token) {
          localStorage.setItem('token', registerRes.data.token);
        }

        const userData = registerRes.data.user || null;
        if (userData) setUser(userData); 
        navigate('/dashboard');
      } else {
        toast.error(registerRes.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 px-4 py-12 pt-24">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100 relative overflow-hidden">
        
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">Create Account</h2>
          <p className="text-gray-500 mt-2 font-medium">Become a part of the <span className="text-indigo-600 font-extrabold">JoinMe</span> community</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
          
          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">First Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" required />
            </div>
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Last Name</label>
            <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" required />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={isVerified || otpSent} placeholder="john@example.com" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60 font-medium" required />
              </div>
              {!isVerified && (
                <button type="button" onClick={handleVerifyEmail} disabled={loading || otpSent || !formData.email} className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap border border-indigo-100">
                  {otpSent ? 'OTP Sent' : 'Verify Email'}
                </button>
              )}
            </div>
          </div>

          {isVerified && (
            <div className="col-span-1 md:col-span-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm">
              <CheckCircle2 size={18} /> Email successfully verified!
            </div>
          )}

          {otpSent && !isVerified && (
            <div className="col-span-1 md:col-span-2 bg-indigo-50 border border-indigo-100 p-5 rounded-2xl animate-fade-in-down">
              <label className="block text-center text-sm font-bold text-indigo-800 mb-3">Enter the 6-digit code sent to your email</label>
              <div className="flex justify-center gap-2 sm:gap-3 mb-4">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    maxLength={1}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl font-black text-center text-indigo-700 bg-white border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-all"
                  />
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
                <p className="text-sm font-medium text-gray-500">Expires in: <span className="font-bold text-red-500">{formatTime(timer)}</span></p>
                <button type="button" onClick={handleOtpVerify} disabled={loading} className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all">
                  Confirm Code
                </button>
              </div>
            </div>
          )}

          <div className="col-span-1 md:col-span-2 relative mt-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Create Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" required minLength={6} />
              <button type="button" className="absolute top-3.5 right-3 text-gray-400 hover:text-indigo-600 transition-colors" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none text-gray-700 font-medium" required>
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Age</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 21" min="16" max="100" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" required />
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
              <select name="city" value={formData.city} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none text-gray-700 font-medium" required>
                <option value="" disabled>Select City</option>
                {cities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Profession</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 text-gray-400" size={18} />
              <input name="profession" value={formData.profession} onChange={handleChange} placeholder="Student, Developer..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" required />
            </div>
          </div>

          <button type="submit" disabled={loading || !isVerified} className="col-span-1 md:col-span-2 mt-4 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            {loading ? 'Processing...' : 'Complete Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 font-medium mt-6 relative z-10">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-bold hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;