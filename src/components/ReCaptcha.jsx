"use client";
import { useEffect, useRef } from "react";

export default function ReCaptcha({ onVerify, onExpired, onError }) {
  const captchaRef = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    // Load reCAPTCHA script
    const loadRecaptcha = () => {
      if (window.grecaptcha && captchaRef.current && widgetId.current === null) {
        widgetId.current = window.grecaptcha.render(captchaRef.current, {
          sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI", // Test key
          callback: onVerify,
          "expired-callback": onExpired,
          "error-callback": onError,
        });
      }
    };

    // Check if script is already loaded
    if (window.grecaptcha) {
      loadRecaptcha();
    } else {
      // Add script if not loaded
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
      script.async = true;
      script.defer = true;
      
      window.onRecaptchaLoad = loadRecaptcha;
      
      document.body.appendChild(script);

      return () => {
        // Cleanup
        if (script.parentNode) {
          document.body.removeChild(script);
        }
      };
    }
  }, [onVerify, onExpired, onError]);

  const reset = () => {
    if (window.grecaptcha && widgetId.current !== null) {
      window.grecaptcha.reset(widgetId.current);
    }
  };

  // Expose reset method
  useEffect(() => {
    if (captchaRef.current) {
      captchaRef.current.reset = reset;
    }
  }, []);

  return <div ref={captchaRef} className="flex justify-center my-4"></div>;
}
