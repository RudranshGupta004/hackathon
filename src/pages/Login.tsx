
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Mic, MicOff, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui-elements/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import useSpeechToText from "@/hooks/useSpeechToText";
import { motion } from "framer-motion";
import CameraPreview from "@/components/ui-elements/CameraPreview";
import InstructionalVideo from "@/components/ui-elements/InstructionalVideo";

// Video sources for instructional content
const INSTRUCTION_VIDEOS = {
  login: "/videos/Login.mp4",
  signup: "/videos/AccCreation.mp4",
  name: "/videos/EnterName.mp4",
  email: "/videos/EnterEmail.mp4",
  phone: "/videos/PhoneNo.mp4",
  password: "/videos/Password.mp4",
};

const Login = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formTab, setFormTab] = useState("login");
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  
  // Speech-to-text integration
  const emailSpeech = useSpeechToText({
    onTranscriptChange: (transcript) => {
      if (formTab === "login") {
        setLoginEmail(transcript);
      } else {
        setSignupEmail(transcript);
      }
    }
  });
  
  const phoneSpeech = useSpeechToText({
    onTranscriptChange: (transcript) => {
      const cleanPhoneNumber = transcript.replace(/\D/g, "");
      setSignupPhone(cleanPhoneNumber);
    }
  });
  
  const nameSpeech = useSpeechToText({
    onTranscriptChange: (transcript) => {
      setSignupName(transcript);
    }
  });
  
  // Form handling
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail.trim()) {
      toast.error("Please enter your email or phone number");
      return;
    }
    
    if (!loginPassword) {
      toast.error("Please enter your password");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(loginEmail, loginPassword);
      if (success) {
        navigate("/questionnaire");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    
    if (!signupEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    
    if (!validateEmail(signupEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (signupPhone && !validatePhone(signupPhone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    
    if (!signupPassword || signupPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await signup(signupEmail, signupPassword, signupName, signupPhone);
      if (success) {
        navigate("/questionnaire");
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const validatePhone = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {formTab === "login" ? "Welcome to LoanOne" : "Join LoanOne Today"}
            </h1>
            <p className="text-muted-foreground">
              {formTab === "login" 
                ? "Enter your credentials to continue" 
                : "Fill in your details to get started"
              }
            </p>
          </div>
          
          <div className="bg-white shadow-lg rounded-xl p-8">
            <Tabs 
              defaultValue="login" 
              value={formTab} 
              onValueChange={setFormTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <div className="mb-6">
                  <InstructionalVideo 
                    videoSrc={INSTRUCTION_VIDEOS.login}
                    title="How to log in to your account"
                    className="mb-4"
                  />
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email or Phone Number</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="text"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter your email or phone"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={emailSpeech.isListening ? emailSpeech.stopListening : emailSpeech.startListening}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                        aria-label={emailSpeech.isListening ? "Stop listening" : "Start voice input"}
                      >
                        {emailSpeech.isListening ? (
                          <MicOff size={18} className="text-primary animate-pulse" />
                        ) : (
                          <Mic size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link 
                        to="/forgot-password" 
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    loading={isLoading}
                    icon={<ArrowRight size={16} />}
                    iconPosition="right"
                  >
                    Log In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <div className="mb-6">
                  <InstructionalVideo 
                    videoSrc={INSTRUCTION_VIDEOS.signup}
                    title="How to create your account"
                    className="mb-4"
                  />
                </div>
                
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Input
                          id="name"
                          type="text"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="Enter your full name"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={nameSpeech.isListening ? nameSpeech.stopListening : nameSpeech.startListening}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                          aria-label={nameSpeech.isListening ? "Stop listening" : "Start voice input"}
                        >
                          {nameSpeech.isListening ? (
                            <MicOff size={18} className="text-primary animate-pulse" />
                          ) : (
                            <Mic size={18} />
                          )}
                        </button>
                      </div>
                      <div className="w-32">
                        <InstructionalVideo 
                          videoSrc={INSTRUCTION_VIDEOS.name}
                          title="Name tips"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Input
                          id="signup-email"
                          type="email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={emailSpeech.isListening ? emailSpeech.stopListening : emailSpeech.startListening}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                          aria-label={emailSpeech.isListening ? "Stop listening" : "Start voice input"}
                        >
                          {emailSpeech.isListening ? (
                            <MicOff size={18} className="text-primary animate-pulse" />
                          ) : (
                            <Mic size={18} />
                          )}
                        </button>
                      </div>
                      <div className="w-32">
                        <InstructionalVideo 
                          videoSrc={INSTRUCTION_VIDEOS.email}
                          title="Email tips"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (optional)</Label>
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Input
                          id="phone"
                          type="tel"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter your 10-digit phone number"
                          maxLength={10}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={phoneSpeech.isListening ? phoneSpeech.stopListening : phoneSpeech.startListening}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                          aria-label={phoneSpeech.isListening ? "Stop listening" : "Start voice input"}
                        >
                          {phoneSpeech.isListening ? (
                            <MicOff size={18} className="text-primary animate-pulse" />
                          ) : (
                            <Mic size={18} />
                          )}
                        </button>
                      </div>
                      <div className="w-32">
                        <InstructionalVideo 
                          videoSrc={INSTRUCTION_VIDEOS.phone}
                          title="Phone tips"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Create a password (min. 8 characters)"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="w-32">
                        <InstructionalVideo 
                          videoSrc={INSTRUCTION_VIDEOS.password}
                          title="Password tips"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    loading={isLoading}
                    icon={<ArrowRight size={16} />}
                    iconPosition="right"
                  >
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </motion.div>
      </main>
      
      <Footer className="mt-auto" />
    </div>
  );
};

// Special wrapper component to conditionally show camera preview based on route
Login.CameraPreviewWrapper = function CameraPreviewWrapper() {
  const location = useLocation();
  
  // Don't show on landing page
  if (location.pathname === '/') {
    return null;
  }
  
  return <CameraPreview />;
};

export default Login;
