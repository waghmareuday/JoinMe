import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import Select from 'react-select';

const indiaCities = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai",
  "Kolkata", "Pune", "Jaipur", "Lucknow", "Nagpur", "Indore", "Bhopal",
  "Patna", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot"
];

const cityOptions = indiaCities.map(city => ({ label: city, value: city }));

const SignUp = ({ open, onClose, onSubmit }) => {
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

  const [emailVerified, setEmailVerified] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
  };

  const handleVerifyEmail = () => {
    setEmailVerified(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit({ ...formData, otp: otp.join('') });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      ></div>

      {/* Modal Box */}
      <div className="relative w-full max-w-4xl max-h-[88vh] bg-gradient-to-br from-slate-100 to-slate-200 overflow-y-auto rounded-2xl shadow-2xl p-6 border border-gray-300 z-10">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-blue-700">Create Account</h2>
          <p className="text-sm text-gray-600">Become a part of <span className="text-purple-600 font-semibold">JoinMe</span> community</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First Name"
            className="col-span-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
            required
          />
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            className="col-span-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
          />

          {/* Email with verify button */}
          <div className="col-span-2 flex gap-3">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
              required
            />
            <button
              type="button"
              onClick={handleVerifyEmail}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition"
            >
              Verify
            </button>
          </div>

          {emailVerified && (
            <div className="col-span-2 flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  maxLength={1}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className="w-10 h-12 text-xl text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-400"
                  required
                />
              ))}
            </div>
          )}

          {/* Password with toggle */}
          <div className="col-span-2 relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create Password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500"
              required
            />
            <button
              type="button"
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Gender & Age */}
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="col-span-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-slate-700"
            required
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Age"
            className="col-span-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
            required
          />

          {/* City & Profession */}
          <div className="col-span-1">
            <Select
              options={cityOptions}
              placeholder="Select City"
              onChange={(selected) => setFormData({ ...formData, city: selected.value })}
              className="placeholder:text-slate-400"
            />
          </div>
          <input
            name="profession"
            value={formData.profession}
            onChange={handleChange}
            placeholder="Profession (e.g., Student, Developer)"
            className="col-span-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
            required
          />

          {/* Submit */}
          <button
            type="submit"
            className="col-span-2 w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition"
          >
            Sign Up
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline font-medium">
    Login
  </a>
</p>
      </div>
    </div>
  );
};

export default SignUp;
