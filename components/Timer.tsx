import { useState, useEffect } from "react";

export default function Timer({ start }) {
  // Get the current time and add 2 minutes to it
  const [timeLeft, setTimeLeft] = useState({});
  const targetDate = new Date().getTime() + 2 * 60 * 1000; // 2 minutes from now

  useEffect(() => {
    let interval;
    if (start) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance <= 0) {
          clearInterval(interval);
          setTimeLeft({ minutes: 0, seconds: 0 });
        } else {
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft({ minutes, seconds });
        }
      }, 1000);
    } else {
      clearInterval(interval);
      setTimeLeft({});
    }

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [start]);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <div style={{ fontSize: "16px", fontWeight: "bold" }}>
        <p>
          {timeLeft.minutes < 10 ? `0${timeLeft.minutes}` : timeLeft.minutes}:
          {timeLeft.seconds < 10 ? `0${timeLeft.seconds}` : timeLeft.seconds}
        </p>
      </div>
    </div>
  );
}
