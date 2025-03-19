import { useState, useEffect, useCallback, useRef } from "react";

interface UseSpeechToTextProps {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}

const useSpeechToText = ({ onResult, onError }: UseSpeechToTextProps) => {
  const [isListening, setIsListening] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const retryCountRef = useRef(0);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError?.("Speech-to-text not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = "en-US";

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(
    (field: string) => {
      const recognition = recognitionRef.current;
      if (!recognition) {
        onError?.("Speech-to-text not initialized.");
        return;
      }

      setIsListening(true);
      setActiveField(field);
      setTranscript("");
      retryCountRef.current = 0;

      recognition.onstart = () => {
        console.log(`Speech-to-text started for field: ${field}`);
      };

      recognition.onaudiostart = () => {
        console.log("Audio capture started");
      };

      recognition.onsoundstart = () => {
        console.log("Sound detected");
      };

      recognition.onspeechstart = () => {
        console.log("Speech detected");
      };

      recognition.onresult = (event) => {
        const newTranscript = event.results[0][0].transcript.trim();
        console.log(`Transcript received: "${newTranscript}"`);
        setTranscript(newTranscript);
        onResult(newTranscript);
        stopListening();
      };

      recognition.onerror = (event) => {
        console.error(`Speech-to-text error: ${event.error}`);
        if (retryCountRef.current < 3) {
          retryCountRef.current += 1;
          console.log(`Retry ${retryCountRef.current} of 3`);
          setTimeout(() => startListening(field), 1000);
        } else {
          onError?.(`Speech-to-text failed after 3 retries: ${event.error}`);
          stopListening();
        }
      };

      recognition.onend = () => {
        console.log("Speech-to-text ended");
        if (isListening && retryCountRef.current >= 3) {
          setIsListening(false);
          setActiveField(null);
        }
      };

      try {
        recognition.start();
        console.log("Attempting to start speech recognition");
      } catch (err) {
        console.error("Start error:", err);
        onError?.(`Failed to start speech-to-text: ${err.message}`);
        stopListening();
      }
    },
    [onResult, onError]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setActiveField(null);
  }, []);

  return { isListening, activeField, startListening, stopListening, transcript };
};

export default useSpeechToText;