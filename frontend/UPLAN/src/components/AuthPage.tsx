import { useState } from 'react';
import { CheckCircle2, XCircle, ArrowLeft, Eye, EyeOff, Calendar, HelpCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import logoImage from 'figma:asset/0550e77f773f70cb0e6201f9400b3cccad8c1d9b.png';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface AuthPageProps {
  onLogin: (name: string, email: string) => void;
  onNavigate: (page: string) => void;
}

export default function AuthPage({ onLogin, onNavigate }: AuthPageProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupGender, setSignupGender] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupDateOfBirth, setSignupDateOfBirth] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [activeTab, setActiveTab] = useState('login'); // Default to login
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [socialLoginProvider, setSocialLoginProvider] = useState<string | null>(null);
  const [socialEmail, setSocialEmail] = useState('');
  const [socialName, setSocialName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [genderError, setGenderError] = useState('');

  // Username validation requirements
  const usernameRequirements = {
    validLength: signupName.length >= 3 && signupName.length <= 20,
    validFormat: /^[a-zA-Z0-9_.]{3,20}$/.test(signupName),
    noSpaces: !/\s/.test(signupName),
    notReserved: !['admin', 'system', 'null', 'me', 'root', 'user', 'test', 'help'].includes(signupName.toLowerCase()),
  };

  // Password validation requirements
  const passwordRequirements = {
    minLength: signupPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(signupPassword),
    hasLowerCase: /[a-z]/.test(signupPassword),
    hasNumber: /[0-9]/.test(signupPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(signupPassword),
  };

  // Password validation requirements for reset password
  const newPasswordRequirements = {
    minLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  // Check if passwords match in real-time
  const checkPasswordMatch = (password: string, confirmPassword: string) => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Validate date of birth (must be 13+ years old)
  const validateAge = (dateOfBirth: string): boolean => {
    if (!dateOfBirth) {
      setAgeError('Date of birth is required');
      return false;
    }
    
    const age = calculateAge(dateOfBirth);
    
    if (age < 13) {
      setAgeError('You must be at least 13 years old to create an account');
      return false;
    }
    
    setAgeError('');
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: loginEmail,   // email OR username
        password: loginPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Show the exact backend message if available
      toast.error(data.detail || "Login failed");
      return; // stop further execution
    }

    // Login successful
    if (rememberMe) {
      localStorage.setItem("rememberMe", "true");
    }

    localStorage.setItem("currentUserEmail", loginEmail);

    // Store backend user id (used for workspace/chat APIs via X-User-Id header)
    if (data.user_id) localStorage.setItem("currentUserId", data.user_id);
    if (data.full_name) localStorage.setItem("currentUserName", data.full_name);

    toast.success("Welcome back!");
    onLogin(data.full_name || "", loginEmail);

  } catch (err: any) {
    // Catch network errors or unexpected issues
    console.error("Login error:", err);
    toast.error(err.message || "Something went wrong during login");
  }
};

  const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();

  // ================= EXISTING VALIDATIONS (UNCHANGED) =================
  if (!usernameRequirements.validLength) {
    setUsernameError('Username must be between 3 and 20 characters long!');
    toast.error('Username must be between 3 and 20 characters long!');
    return;
  }

  if (!usernameRequirements.validFormat) {
    setUsernameError('Username can only contain letters, numbers, underscores, and periods!');
    toast.error('Username can only contain letters, numbers, underscores, and periods!');
    return;
  }

  if (!usernameRequirements.noSpaces) {
    setUsernameError('Username cannot contain spaces!');
    toast.error('Username cannot contain spaces!');
    return;
  }

  if (!usernameRequirements.notReserved) {
    setUsernameError('Username is reserved. Please choose a different one!');
    toast.error('Username is reserved. Please choose a different one!');
    return;
  }

  if (!validateAge(signupDateOfBirth)) {
    toast.error(ageError || 'You must be at least 13 years old to create an account');
    return;
  }

  if (!signupGender) {
    setGenderError('Please select your gender');
    toast.error('Please select your gender');
    return;
  }

  if (signupPassword !== signupConfirmPassword) {
    toast.error('Passwords do not match!');
    return;
  }

  if (!passwordRequirements.minLength) {
    toast.error('Password must be at least 8 characters long!');
    return;
  }

  if (!passwordRequirements.hasUpperCase) {
    toast.error('Password must contain at least one uppercase letter!');
    return;
  }

  if (!passwordRequirements.hasLowerCase) {
    toast.error('Password must contain at least one lowercase letter!');
    return;
  }

  if (!passwordRequirements.hasNumber) {
    toast.error('Password must contain at least one number!');
    return;
  }

  if (!passwordRequirements.hasSpecialChar) {
    toast.error('Password must contain at least one special character!');
    return;
  }

  // ================= BACKEND SIGNUP (MERGED) =================
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Store the "name" field also as username on the backend.
        username: signupName,
        email: signupEmail,
        password: signupPassword,
        full_name: signupName,
        date_of_birth: signupDateOfBirth,
        gender: signupGender,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Signup failed");
    }

    const data = await response.json();

    // Store backend user id (used for workspace/chat APIs via X-User-Id header)
    localStorage.setItem("currentUserEmail", signupEmail);
    if (data.user_id) localStorage.setItem("currentUserId", data.user_id);
    if (data.full_name) localStorage.setItem("currentUserName", data.full_name);

    toast.success(`Account created successfully! Welcome, ${signupName}!`);
    onLogin(data.full_name || signupName, signupEmail);

  } catch (err: any) {
    toast.error(err.message || "Signup failed");
  }
};


  const handleForgotPassword = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const response = await fetch(`${API_BASE_URL}/request_reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetEmail }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.detail || "No account found with this email.");
      return;
    }

    toast.success(`Verification code sent to ${resetEmail}.`);

    // Optionally store the code temporarily if you need to verify on frontend
    // setGeneratedCode(data.code); // but usually frontend doesn’t see code
    setShowForgotPassword(false);
    setShowVerificationCode(true);

    } catch (err: any) {
    console.error("Reset password error:", err);
    toast.error(err.message || "Failed to request reset code.");
    }
  };
  const handleVerifyCode = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const response = await fetch(`${API_BASE_URL}/verify_code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: resetEmail,       // the email used in forgot password
        code: verificationCode,  // user-entered verification code
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.detail || "Invalid verification code. Please try again.", {
        duration: 4000,
        position: "top-center",
      });
      setVerificationCode(""); // clear input for re-entry
      return;
    }

    toast.success("Verification successful!", {
      duration: 3000,
      position: "top-center",
    });

    // Move to password reset page
    setShowVerificationCode(false);
    setShowResetPassword(true);

  } catch (err: any) {
    console.error("Verify code error:", err);
    toast.error(err.message || "Something went wrong during verification.");
  }
};


  const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();

  // Frontend validation
  if (newPassword !== confirmNewPassword) {
    toast.error("Passwords do not match!");
    return;
  }
  if (newPassword.length < 8) {
    toast.error("Password must be at least 8 characters long!");
    return;
  }
  if (!/[A-Z]/.test(newPassword)) {
    toast.error("Password must contain at least one uppercase letter!");
    return;
  }
  if (!/[a-z]/.test(newPassword)) {
    toast.error("Password must contain at least one lowercase letter!");
    return;
  }
  if (!/[0-9]/.test(newPassword)) {
    toast.error("Password must contain at least one number!");
    return;
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
    toast.error("Password must contain at least one special character!");
    return;
  }

  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const response = await fetch(`${API_BASE_URL}/reset_password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: resetEmail,
        code: verificationCode, // the code user received via email
        new_password: newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.detail || "Failed to reset password");
      return;
    }

    toast.success("Password reset successfully! Logging you in...");

    // Reset all states
    setShowResetPassword(false);
    setResetEmail("");
    setVerificationCode("");
    setGeneratedCode("");
    setNewPassword("");
    setConfirmNewPassword("");

    // Optionally, log the user in and redirect
    onLogin("", resetEmail);

  } catch (err: any) {
    console.error("Reset password error:", err);
    toast.error(err.message || "Something went wrong during password reset");
    }
  };


  const handleSocialLogin = (provider: string) => {
  if (provider !== "google") return;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // OAuth MUST be a full redirect
  window.location.href = `${API_BASE_URL}/login`;
};

  const handleSocialLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!socialEmail || !socialName) {
      toast.error('Please enter all required information.');
      return;
    }
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const existingUser = users.find((u: any) => u.email === socialEmail);
    
    if (existingUser) {
      // User exists, log them in
      localStorage.setItem('currentUserEmail', existingUser.email);
      toast.success(`Welcome back, ${existingUser.name}.`);
      onLogin(existingUser.name, existingUser.email);
    } else {
      // Register new user
      const newUser = {
        name: socialName,
        email: socialEmail,
        provider: socialLoginProvider,
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(users));
      localStorage.setItem('currentUserEmail', socialEmail);
      
      toast.success(`Account created successfully! Welcome, ${socialName}!`);
      onLogin(socialName, socialEmail);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 p-12 flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80"
            alt="Student studying"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 text-center max-w-xl">
          {/* Logo removed as per user request */}
          
          <h1 className="text-white text-4xl mb-4">
            Master Your Study Schedule
          </h1>
          <p className="text-blue-100 text-lg">
            AI-powered timetable generation that adapts to your learning style and goals
          </p>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 relative">
        <div className="w-full max-w-md">
          {/* Back to Home Button */}
          <Button
            variant="ghost"
            onClick={() => onNavigate('home')}
            className="mb-6 -mt-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="lg:hidden flex items-center gap-3 text-blue-600 mb-8 justify-center">
            <img 
              src={logoImage} 
              alt="U PLAN Logo" 
              className="w-10 h-10 rounded-lg" 
            />
            <div className="flex flex-col">
              <span className="text-blue-600 font-bold text-lg tracking-tight">
                PLAN
              </span>
              <span className="text-blue-500 text-xs tracking-wide uppercase">
                Corporate Academic Service
              </span>
            </div>
          </div>

          {socialLoginProvider ? (
            /* Social Login Information Form */
            <Card>
              <CardHeader>
                <CardTitle>Complete {socialLoginProvider} Login</CardTitle>
                <CardDescription>
                  Enter your email and name to complete the login process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSocialLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="social-email">Email</Label>
                    <Input
                      id="social-email"
                      type="email"
                      placeholder="your.email@gmail.com"
                      value={socialEmail}
                      onChange={(e) => setSocialEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social-name">Full Name</Label>
                    <Input
                      id="social-name"
                      type="text"
                      placeholder="John Doe"
                      value={socialName}
                      onChange={(e) => setSocialName(e.target.value)}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                  >
                    Complete Login
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      setSocialLoginProvider(null);
                      setSocialEmail('');
                      setSocialName('');
                    }}
                  >
                    Back to Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : showVerificationCode ? (
            /* Verification Code Page - Step 2 */
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => {
                      setShowVerificationCode(false);
                      setShowForgotPassword(true);
                      setVerificationCode('');
                    }}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <CardTitle>Enter Verification Code</CardTitle>
                </div>
                <CardDescription>
                  We've sent a 6-digit verification code to <strong>{resetEmail}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyCode} className="space-y-6">
                  {/* Verification Code Input */}
                  <div className="space-y-3">
                    <Label htmlFor="verification-code" className="text-center block">Verification Code</Label>
                    <Input
                      id="verification-code"
                      type="text"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      className="text-center text-3xl tracking-[0.5em] font-bold h-16"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-md h-12"
                    disabled={verificationCode.length !== 6}
                  >
                    Verify Code
                  </Button>

                  {/* Resend Code Option */}
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
                    <button
                          type="button"
                          className="text-sm text-blue-600 hover:underline font-medium"
                          onClick={async (e) => {
                            e.preventDefault();

                            try {
                              const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

                              const response = await fetch(`${API_BASE_URL}/request_reset`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ email: resetEmail }),
                              });

                              const data = await response.json();

                              if (!response.ok) {
                                toast.error(data.detail || "Failed to resend verification code");
                                return;
                              }

                              toast.success("New verification code sent!");
                              setVerificationCode(""); // clear input for re-entry

                            } catch (err: any) {
                              console.error("Resend code error:", err);
                              toast.error(err.message || "Something went wrong");
                            }
                          }}
                        >
                          Resend Code
                        </button>

                  </div>
                  
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      setShowVerificationCode(false);
                      setShowForgotPassword(false);
                      setResetEmail('');
                      setVerificationCode('');
                      setGeneratedCode('');
                    }}
                  >
                    Back to Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : showResetPassword ? (
            /* Reset Password Page - Step 3 */
            <Card>
              <CardHeader>
                <CardTitle>Create New Password</CardTitle>
                <CardDescription>
                  Enter your new password for {resetEmail}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {/* Password Requirements Display */}
                    {newPassword && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md space-y-2 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Password must contain:</p>
                        
                        <div className="flex items-center gap-2">
                          {newPasswordRequirements.minLength ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-sm ${newPasswordRequirements.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            At least 8 characters
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {newPasswordRequirements.hasUpperCase ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-sm ${newPasswordRequirements.hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            One uppercase letter (A-Z)
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {newPasswordRequirements.hasLowerCase ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-sm ${newPasswordRequirements.hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            One lowercase letter (a-z)
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {newPasswordRequirements.hasNumber ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-sm ${newPasswordRequirements.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            One number (0-9)
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {newPasswordRequirements.hasSpecialChar ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-sm ${newPasswordRequirements.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            One special character (!@#$%^&*)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-new-password"
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                      <div className="flex items-center gap-1 text-red-500">
                        <XCircle className="w-3 h-3" />
                        <p className="text-xs">Passwords do not match</p>
                      </div>
                    )}
                    {newPassword && confirmNewPassword && newPassword === confirmNewPassword && (
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="w-3 h-3" />
                        <p className="text-xs">Passwords match</p>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md h-12"
                    disabled={!newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                  >
                    Reset Password
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      setShowResetPassword(false);
                      setShowForgotPassword(false);
                      setResetEmail('');
                      setVerificationCode('');
                      setGeneratedCode('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                  >
                    Back to Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : showForgotPassword ? (
            /* Forgot Password Form - Email Entry */
            <Card>
              <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>
                  Enter your email address and we'll send you a verification code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="name@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-md"
                  >
                    Send Verification Code
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                    }}
                  >
                    Back to Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-200 dark:bg-gray-800 h-12">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>
                      Enter your credentials to access your study timetable
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email/Username</Label>
                        <Input
                          id="login-email"
                          type="text"
                          placeholder="name@example.com or username"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password">Password</Label>
                          <button
                            type="button"
                            className="text-sm text-blue-600 hover:underline"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        />
                        <label
                          htmlFor="remember"
                          className="text-sm cursor-pointer select-none"
                        >
                          Remember me
                        </label>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                      >
                        Sign In
                      </Button>
                      
                      {/* Divider */}
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">
                            Or continue with
                          </span>
                        </div>
                      </div>

                      {/* Social Login Buttons */}
                      <div className="grid grid-cols-1 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSocialLogin("google")}
                          className="w-full"
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Continue with Google
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Signup Form */}
              <TabsContent value="signup">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>
                      Start organizing your study schedule today
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Username</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="johndoe123"
                          value={signupName}
                          onChange={(e) => {
                            setSignupName(e.target.value);
                            setUsernameError('');
                          }}
                          required
                        />
                        {signupName && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md space-y-2 border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Username requirements:</p>
                            
                            <div className="flex items-center gap-2">
                              {usernameRequirements.validLength ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className={`text-sm ${usernameRequirements.validLength ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                Between 3-20 characters
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {usernameRequirements.validFormat ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className={`text-sm ${usernameRequirements.validFormat ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                Only letters, numbers, underscores, and periods
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {usernameRequirements.noSpaces ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className={`text-sm ${usernameRequirements.noSpaces ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                No spaces allowed
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {usernameRequirements.notReserved ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className={`text-sm ${usernameRequirements.notReserved ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                Not a reserved username
                              </span>
                            </div>
                          </div>
                        )}
                        {usernameError && <p className="text-red-500 text-sm mt-1">{usernameError}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="name@example.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showSignupPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={signupPassword}
                            onChange={(e) => {
                              setSignupPassword(e.target.value);
                              checkPasswordMatch(e.target.value, signupConfirmPassword);
                              setShowPasswordRequirements(true);
                            }}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                          >
                            {showSignupPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {showPasswordRequirements && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md space-y-2 border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Password must contain:</p>
                            
                            <div className="flex items-center gap-2">
                              {passwordRequirements.minLength ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className={`text-sm ${passwordRequirements.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                At least 8 characters
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {passwordRequirements.hasUpperCase ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className={`text-sm ${passwordRequirements.hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                One uppercase letter (A-Z)
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {passwordRequirements.hasLowerCase ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className={`text-sm ${passwordRequirements.hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                One lowercase letter (a-z)
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {passwordRequirements.hasNumber ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className={`text-sm ${passwordRequirements.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                One number (0-9)
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {passwordRequirements.hasSpecialChar ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className={`text-sm ${passwordRequirements.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                One special character (!@#$%^&*)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="signup-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={signupConfirmPassword}
                            onChange={(e) => {
                              setSignupConfirmPassword(e.target.value);
                              checkPasswordMatch(signupPassword, e.target.value);
                            }}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-date-of-birth">Date of Birth</Label>
                        <div className="relative">
                          <Input
                            id="signup-date-of-birth"
                            type="date"
                            value={signupDateOfBirth}
                            onChange={(e) => {
                              setSignupDateOfBirth(e.target.value);
                              if (e.target.value) {
                                validateAge(e.target.value);
                              } else {
                                setAgeError('');
                              }
                            }}
                            required
                            className="pr-10"
                            placeholder="mm / dd / yyyy"
                          />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                        {ageError && (
                          <div className="flex items-center gap-1 text-red-500">
                            <XCircle className="w-3 h-3" />
                            <p className="text-xs">{ageError}</p>
                          </div>
                        )}
                        {signupDateOfBirth && !ageError && (
                          <div className="flex items-center gap-1 text-green-500">
                            <CheckCircle2 className="w-3 h-3" />
                            <p className="text-xs">Age verified (13+ years)</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-gender">
                          Gender
                        </Label>
                        <Select
                          value={signupGender}
                          onValueChange={(value) => {
                            setSignupGender(value);
                            setGenderError('');
                          }}
                        >
                          <SelectTrigger id="signup-gender" className={genderError ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select your gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        {genderError && (
                          <div className="flex items-center gap-1 text-red-500">
                            <XCircle className="w-3 h-3" />
                            <p className="text-xs">{genderError}</p>
                          </div>
                        )}
                        {signupGender && !genderError && (
                          <div className="flex items-center gap-1 text-green-500">
                            <CheckCircle2 className="w-3 h-3" />
                            <p className="text-xs">Gender selected</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox id="terms" required />
                        <label
                          htmlFor="terms"
                          className="text-sm cursor-pointer select-none"
                        >
                          I agree to the Terms of Service and Privacy Policy
                        </label>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                      >
                        Create Account
                      </Button>
                      
                      {/* Divider */}
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">
                            Or continue with
                          </span>
                        </div>
                      </div>

                      {/* Social Login Buttons */}
                      <div className="grid grid-cols-1 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSocialLogin('google')}
                          className="w-full"
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Continue with Google
                        </Button>
                      </div>
                      
                      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                        By continuing, you agree to our{' '}
                        <a 
                          href="#terms" 
                          className="text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate('terms');
                          }}
                        >
                          Terms of Service
                        </a>
                        {' '}and{' '}
                        <a 
                          href="#privacy" 
                          className="text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate('privacy');
                          }}
                        >
                          Privacy Policy
                        </a>
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
        
        {/* Help Button - Figma Design */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50"
          title="Need help?"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
        
        {/* Help Dialog */}
        {showHelp && (
          <div className="fixed bottom-24 right-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-80 z-50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Need Help?</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Creating an Account:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Choose a unique username (3-20 characters)</li>
                  <li>Use a valid email address</li>
                  <li>Create a strong password with uppercase, lowercase, numbers, and special characters</li>
                  <li>You must be 13+ years old to sign up</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Having Issues?</p>
                <p className="text-xs">
                  If you're having trouble signing up or logging in, please check your internet connection and ensure all fields are filled correctly.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}