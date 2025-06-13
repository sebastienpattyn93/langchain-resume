"use client";

import { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from "react";
import "./resume-chat.css";
import dynamic from "next/dynamic";

// Dynamically import the SimpleParticleBackground component with SSR disabled
const SimpleParticleBackground = dynamic(
  () => import("@/components/SimpleParticleBackground"),
  {
    ssr: false,
  }
);

// Import the TypedText component
import TypedText from "@/components/TypedText";

// Dynamically import the DebugInfo component
const DebugInfo = dynamic(() => import("@/components/DebugInfo"), {
  ssr: false,
});

// Import CareerTimeline component
const CareerTimeline = dynamic(() => import("@/components/CareerTimeline"), {
  ssr: false,
});

// Import CareerTimeline CSS
import "@/components/CareerTimeline.css";

// Material Icons are imported via CSS in layout.tsx

type Message = {
  sender: "user" | "bot";
  text: string;
  timestamp: number;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [currentView, setCurrentView] = useState<"chat" | "career">("chat");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize theme from localStorage on component mount
  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as "dark" | "light" | null;
      // Only update if there's a saved theme
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // If no saved preference, check for system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? "dark" : "light");
      }
    }
  }, []);

  // Function to toggle between dark and light mode
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // View switching functions
  const switchToView = (view: "chat" | "career") => {
    if (currentView === view) return;
    
    setIsTransitioning(true);
    
    // Short timeout to allow CSS transitions to work
    setTimeout(() => {
      setCurrentView(view);
      setIsTransitioning(false);
    }, 300);
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    // Add user message to chat
    const userMessage: Message = {
      sender: "user",
      text: input,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();

      // Check for rate limit error
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit exceeded
          const rateLimitMessage: Message = {
            sender: "bot",
            text:
              data.message ||
              "You've reached the rate limit. Please try again later.",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, rateLimitMessage]);
          return;
        } else {
          throw new Error("API request failed");
        }
      }

      // Add bot response to chat
      const botMessage: Message = {
        sender: "bot",
        text: data.answer,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message to chat
      const errorMessage: Message = {
        sender: "bot",
        text: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      // Scroll to bottom of messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    setInput(e.target.value);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  // Function to convert URLs and markdown links to clickable links
  const convertLinksToAnchors = (text: string) => {
    // Process the text in two passes: first for markdown links, then for direct URLs

    // 1. Process markdown links [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;

    // Check if there are markdown links in the text
    if (markdownLinkRegex.test(text)) {
      // Reset regex lastIndex after test
      markdownLinkRegex.lastIndex = 0;

      // Replace all markdown links with anchor tags
      const processedText = text.replace(
        markdownLinkRegex,
        (match, linkText, linkUrl) => {
          return `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        }
      );

      // Split the text by HTML tags to preserve non-link text
      const parts = processedText.split(/(<a [^>]+>[^<]+<\/a>)/);
      const result: React.ReactNode[] = [];

      parts.forEach((part, i) => {
        if (part.startsWith("<a ")) {
          // Extract href and text from the anchor tag
          const hrefMatch = part.match(/href="([^"]+)"/);
          const textMatch = part.match(/>([^<]+)<\/a>/);

          if (hrefMatch && textMatch) {
            result.push(
              <a
                key={`link-${i}`}
                href={hrefMatch[1]}
                target="_blank"
                rel="noopener noreferrer"
              >
                {textMatch[1]}
              </a>
            );
          }
        } else if (part) {
          result.push(<span key={`text-${i}`}>{part}</span>);
        }
      });

      return result;
    }

    // 2. If no markdown links were found, process direct URLs
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

    // Split the text by URLs
    const urlParts = text.split(urlRegex);

    // Find all URLs in the text
    const urls = text.match(urlRegex) || [];

    // Combine parts and URLs into a single array with React elements
    const urlResult: React.ReactNode[] = [];

    for (let i = 0; i < urlParts.length; i++) {
      // Add the text part
      if (urlParts[i]) {
        urlResult.push(<span key={`text-${i}`}>{urlParts[i]}</span>);
      }

      // Add the URL as a link if it exists
      if (i < urls.length) {
        const url = urls[i].startsWith("www.") ? `https://${urls[i]}` : urls[i];
        urlResult.push(
          <a
            key={`link-${i}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {urls[i]}
          </a>
        );
      }
    }

    return urlResult.length > 0
      ? urlResult
      : [<span key="text-0">{text}</span>];
  };

  return (
    <div className={`app-container ${theme}`}>
      <SimpleParticleBackground />
      <DebugInfo />
      
      <div className="feature-buttons-container">        
        <button 
          onClick={() => switchToView('chat')}
          className={`feature-button chat-button ${currentView === 'chat' ? 'active' : ''}`}
          aria-label="View Chat"
        >
          <span className="material-icons">chat</span>
        </button>
        
        <button 
          onClick={() => switchToView('career')}
          className={`feature-button career-flow-button ${currentView === 'career' ? 'active' : ''}`}
          aria-label="View Career Flow"
        >
          <span className="material-icons">timeline</span>
        </button>
        
        <button 
          onClick={toggleTheme} 
          className="feature-button theme-toggle-button"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            // Sun icon for dark mode (clicking switches to light)
            <span className="material-icons">light_mode</span>
          ) : (
            // Moon icon for light mode (clicking switches to dark)
            <span className="material-icons">dark_mode</span>
          )}
        </button>
      </div>
      
      {/* No back button needed since we have the chat button in the feature buttons */}

      <div
        className={`content-container ${
          messages.length === 0 ? "no-messages" : ""
        } ${isTransitioning ? 'fade-out' : 'fade-in'} ${
          currentView !== 'chat' ? 'hidden' : ''
        }`}
      >
        {messages.length > 0 && (
          <div className="clear-button-container">
            <button className="clear-button" onClick={() => setMessages([])}>
              Clear Conversation
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="centered-content">
            <div className="welcome-message">
              <TypedText
                texts={["Sébastien Pattyn"]}
                typingSpeed={50}
                cursorBlinkCount={2}
                as="h1"
                className="typed-heading glow"
                onComplete={() => {}}
              />
              <TypedText
                texts={[
                  "This is my personal resumé agent that can help you with any questions related to my resumé, experience, and skills.",
                ]}
                typingSpeed={25}
                startDelay={1800}
                cursorBlinkCount={2}
                as="p"
              />
            </div>

            <div className="input-container centered">
              <input
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about my resumé…"
                disabled={loading}
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 2L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="messages-container">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.sender}`}>
                  <div className="message-content">
                    {msg.sender === "bot"
                      ? convertLinksToAnchors(msg.text)
                      : msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message bot loading">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-container">
              <input
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask me about my resumé..."
                disabled={loading}
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 2L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Career Flow View */}
      {currentView === 'career' && (
        <div className={`career-view ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
          <CareerTimeline />
        </div>
      )}
    </div>
  );
}
