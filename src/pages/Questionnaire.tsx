
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, ArrowRight, ShieldCheck, Mic, MicOff, AlertTriangle, Check, Users, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui-elements/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLoan, LoanPurpose, EmploymentStatus } from "@/context/LoanContext";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import useCamera from "@/hooks/useCamera";
import useSpeechToText from "@/hooks/useSpeechToText";
import VideoPlayer from "@/components/ui-elements/VideoPlayer";
import { formatCurrency } from "@/utils/formatCurrency";
import InstructionalVideo from "@/components/ui-elements/InstructionalVideo";

// Instruction videos for different fields
const INSTRUCTION_VIDEOS = {
  intro: "/videos/1.Welcome.mp4",
  fullName: "/videos/2.FullName.mp4",
  loanAmount: "/videos/3.LoanAmt.mp4",
  purpose: "/videos/4.PurposeLoan.mp4",
  employment: "/videos/5.EmpType.mp4",
  income: "/videos/6.Annualinc.mp4",
};

const Questionnaire = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { updatePersonalInfo, application } = useLoan();
  
  const [step, setStep] = useState(1);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showCameraConsent, setShowCameraConsent] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isPiPDragging, setIsPiPDragging] = useState(false);
  const [pipPosition, setPipPosition] = useState({ x: 20, y: 20 });
  const [micDetected, setMicDetected] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState(application.fullName || "");
  const [loanAmount, setLoanAmount] = useState(application.loanAmount || 500000);
  const [purpose, setPurpose] = useState<LoanPurpose>(application.purpose || "Personal");
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>(application.employmentStatus || "Employed");
  const [annualIncome, setAnnualIncome] = useState(application.annualIncome || 0);
  
  // Video intro ref
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Initialize camera hook with face detection
  const {
    videoRef: cameraVideoRef,
    canvasRef: cameraCanvasRef,
    isStreaming,
    hasPermission,
    startCamera,
    stopCamera,
    isPiPActive,
    togglePiP,
    multipleFacesDetected,
    faceCount
  } = useCamera({
    frameRate: 5, // Process 5 frames per second for face detection
    withAudio: true, // Enable audio
    onFaceDetection: ({ count, multiple }) => {
      if (multiple) {
        toast.warning("Multiple faces detected. Please ensure only you are visible.", {
          id: "multiple-faces",
          duration: 3000,
        });
      } else if (count > 0) {
        console.log("Face detected:", count);
      }
    }
  });
  
  // Initialize speech-to-text hook
  const { 
    transcript, 
    isListening, 
    startListening, 
    stopListening, 
    resetTranscript,
    hasSupport: hasSpeechSupport
  } = useSpeechToText({
    onTranscriptChange: (text) => {
      if (activeField === 'fullName') {
        setFullName(text);
        // If we detect speech, it means microphone is working
        if (text && text.length > 0) {
          setMicDetected(true);
          toast.success("Microphone is working correctly!");
        }
      }
    }
  });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  // Auto-advance to next step if microphone is detected
  useEffect(() => {
    if (micDetected && step === 2) {
      // Wait a moment before advancing to make the success toast visible
      const timer = setTimeout(() => {
        handleNext();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [micDetected, step]);
  
  // Handle voice input for a specific field
  const handleVoiceInput = (fieldName: string) => {
    if (isListening && activeField === fieldName) {
      stopListening();
      setActiveField(null);
    } else {
      resetTranscript();
      setActiveField(fieldName);
      startListening();
    }
  };
  
  // Handle video intro playback
  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };
  
  // Handle video intro events
  useEffect(() => {
    const video = videoRef.current;
    
    if (video) {
      const handlePlay = () => setIsVideoPlaying(true);
      const handlePause = () => setIsVideoPlaying(false);
      const handleEnded = () => {
        setIsVideoPlaying(false);
        setStep(2);
      };
      
      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("ended", handleEnded);
      
      return () => {
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("ended", handleEnded);
      };
    }
  }, []);
  
  // Handle camera permission
  const handleCameraConsent = async (granted: boolean) => {
    setShowCameraConsent(false);
    
    if (granted) {
      try {
        await startCamera();
        toast.success("Camera and microphone access granted");
        
        // Automatically start listening for voice input to test microphone
        setTimeout(() => {
          resetTranscript();
          setActiveField('fullName');
          startListening();
          toast.info("Testing microphone. Please say something...");
        }, 1000);
        
      } catch (error) {
        console.error("Camera error:", error);
        toast.error("Unable to access camera. Please check your permissions.");
      }
    } else {
      toast.info("You can continue without camera access, but it may affect your application.");
      setStep(3);
    }
  };
  
  // Handle PiP dragging
  const handlePiPDragStart = () => {
    setIsPiPDragging(true);
  };
  
  const handlePiPDragEnd = () => {
    setIsPiPDragging(false);
  };
  
  const handlePiPDrag = (e: any, info: any) => {
    setPipPosition({
      x: info.offset.x,
      y: info.offset.y
    });
  };
  
  // Handle next step
  const handleNext = () => {
    // Validate current step
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!fullName.trim()) {
        toast.error("Please enter your full name");
        return;
      }
      
      // Prompt for camera permission
      setShowCameraConsent(true);
    } else if (step === 3) {
      if (loanAmount < 50000 || loanAmount > 5000000) {
        toast.error("Loan amount must be between ₹50,000 and ₹50,00,000");
        return;
      }
      
      if (!purpose) {
        toast.error("Please select a loan purpose");
        return;
      }
      
      if (!employmentStatus) {
        toast.error("Please select your employment status");
        return;
      }
      
      if (annualIncome <= 0) {
        toast.error("Please enter your annual income");
        return;
      }
      
      // Save application data
      updatePersonalInfo({
        fullName,
        loanAmount,
        purpose,
        employmentStatus,
        annualIncome
      });
      
      // Navigate to document upload page
      navigate("/document-upload");
    }
  };
  
  // Handle skip intro
  const handleSkipIntro = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsVideoPlaying(false);
    setStep(2);
  };
  
  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (isListening) {
        stopListening();
      }
    };
  }, [stopCamera, isListening, stopListening]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-10 md:py-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white shadow-lg rounded-xl p-6 md:p-10"
          >
            {/* Progress indicator */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Application Progress</span>
                <span className="text-sm text-muted-foreground">Step {step} of 3</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(step / 3) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-4">Welcome to Your LoanOne Application</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      We've streamlined our process to make it fast and easy to get the funds you need.
                      Watch this short video to learn more.
                    </p>
                  </div>
                  
                  <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
                    <VideoPlayer
                      src={INSTRUCTION_VIDEOS.intro}
                      title="Application Guide" 
                      width="100%"
                      height="400"
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                      onEnded={() => {
                        setIsVideoPlaying(false);
                        setStep(2);
                      }}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={handleSkipIntro}
                      variant="outline"
                    >
                      Skip Video
                    </Button>
                    <Button
                      onClick={handleNext}
                      icon={<ArrowRight size={16} />}
                      iconPosition="right"
                    >
                      Continue to Application
                    </Button>
                  </div>
                </motion.div>
              )}
              
              {step === 2 && (
                <motion.div
                  key="personal-info"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-4">Tell Us About Yourself</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      We'll need some basic information to get started with your loan application.
                    </p>
                  </div>
                  
                  <div className="space-y-6 mb-8">
                    <div className="space-y-2">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <Label htmlFor="fullName">Full Name</Label>
                          <div className="relative">
                            <Input
                              id="fullName"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Enter your full legal name"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => handleVoiceInput('fullName')}
                              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full ${
                                isListening && activeField === 'fullName' 
                                  ? 'bg-primary/20 text-primary' 
                                  : 'hover:bg-secondary'
                              }`}
                              aria-label="Use voice input"
                            >
                              {isListening && activeField === 'fullName' ? (
                                <MicOff size={16} />
                              ) : (
                                <Mic size={16} />
                              )}
                            </button>
                          </div>
                          {isListening && activeField === 'fullName' && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Listening... "{transcript}"
                            </p>
                          )}
                        </div>
                        <div className="md:w-40">
                          <InstructionalVideo 
                            videoSrc={INSTRUCTION_VIDEOS.fullName}
                            title="Name guidance"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <Button
                      onClick={handleNext}
                      icon={<ArrowRight size={16} />}
                      iconPosition="right"
                    >
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}
              
              {step === 3 && (
                <motion.div
                  key="loan-details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-4">Loan Details</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Tell us about the loan you're looking for and your financial situation.
                    </p>
                  </div>
                  
                  <div className="space-y-8 mb-8">
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="flex-1">
                          <Label className="flex items-center">
                            Loan Amount: <span className="ml-1 flex items-center"><IndianRupee size={16} />{formatCurrency(loanAmount, { displaySymbol: false })}</span>
                          </Label>
                          <Slider
                            value={[loanAmount]}
                            min={50000}
                            max={5000000}
                            step={10000}
                            onValueChange={(value) => setLoanAmount(value[0])}
                            className="py-4"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>₹50,000</span>
                            <span>₹50,00,000</span>
                          </div>
                        </div>
                        <div className="md:w-40">
                          <InstructionalVideo 
                            videoSrc={INSTRUCTION_VIDEOS.loanAmount}
                            title="Loan amount"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="flex-1">
                          <Label htmlFor="purpose">Purpose of Loan</Label>
                          <Select
                            value={purpose}
                            onValueChange={(value) => setPurpose(value as LoanPurpose)}
                          >
                            <SelectTrigger id="purpose">
                              <SelectValue placeholder="Select purpose" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Personal">Personal</SelectItem>
                              <SelectItem value="Business">Business</SelectItem>
                              <SelectItem value="Education">Education</SelectItem>
                              <SelectItem value="Home">Home</SelectItem>
                              <SelectItem value="Auto">Auto</SelectItem>
                              <SelectItem value="Debt Consolidation">Debt Consolidation</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:w-40">
                          <InstructionalVideo 
                            videoSrc={INSTRUCTION_VIDEOS.purpose}
                            title="Loan purpose"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="flex-1">
                          <Label htmlFor="employment">Employment Status</Label>
                          <Select
                            value={employmentStatus}
                            onValueChange={(value) => setEmploymentStatus(value as EmploymentStatus)}
                          >
                            <SelectTrigger id="employment">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Employed">Employed</SelectItem>
                              <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                              <SelectItem value="Unemployed">Unemployed</SelectItem>
                              <SelectItem value="Retired">Retired</SelectItem>
                              <SelectItem value="Student">Student</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:w-40">
                          <InstructionalVideo 
                            videoSrc={INSTRUCTION_VIDEOS.employment}
                            title="Employment"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="flex-1">
                          <Label htmlFor="income" className="flex items-center">Annual Income <IndianRupee className="ml-1" size={16} /></Label>
                          <Input
                            id="income"
                            type="number"
                            value={annualIncome || ""}
                            onChange={(e) => setAnnualIncome(Number(e.target.value))}
                            placeholder="Enter your annual income in rupees"
                            min={0}
                          />
                        </div>
                        <div className="md:w-40">
                          <InstructionalVideo 
                            videoSrc={INSTRUCTION_VIDEOS.income}
                            title="Income details"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <Button
                      onClick={handleNext}
                      icon={<ArrowRight size={16} />}
                      iconPosition="right"
                    >
                      Continue to Document Upload
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
      
      {/* Camera consent dialog */}
      <AlertDialog open={showCameraConsent} onOpenChange={setShowCameraConsent}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Camera and Microphone Access</AlertDialogTitle>
            <AlertDialogDescription>
              To enhance security during the application process, we'd like to access your camera and microphone. 
              This helps us verify your identity, detect any signs of fraud, and provide voice input capabilities.
              <div className="flex items-center gap-2 mt-4 p-3 bg-secondary/50 rounded-lg">
                <ShieldCheck className="text-primary" size={24} />
                <p className="text-sm font-medium">Your privacy is important to us. We only detect the number of faces present and do not store video or audio recordings.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleCameraConsent(false)}>
              Deny
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleCameraConsent(true)}>
              Allow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Footer className="mt-auto" />
    </div>
  );
};

export default Questionnaire;
