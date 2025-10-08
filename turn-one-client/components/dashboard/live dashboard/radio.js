import { useState, useRef, useEffect } from "react";
import moment from "moment";

const pad = (n, l) => {
  let str = `${n}`;
  while (str.length < l) str = `0${str}`;
  return str;
};

const secondsToMinutes = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds - minutes * 60);
  return `${pad(minutes, 2)}:${pad(remaining, 2)}`;
};

const Radio = ({ radio, path, driver }) => {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef();
  const intervalRef = useRef();

  useEffect(() => {
    const handleEnd = () => {
      setPlaying(false);
      setProgress(0);
    };

    if (audioRef.current) {
      audioRef.current.addEventListener("ended", handleEnd);
    }

    return () => {
      audioRef.current?.removeEventListener("ended", handleEnd);
    };
  }, []);

  useEffect(() => {
    if (playing && typeof audioRef.current?.play === "function") {
      audioRef.current.play();
      intervalRef.current = setInterval(() => {
        setProgress(audioRef.current.currentTime);
      }, 100);
    }
    if (!playing && typeof audioRef.current?.pause === "function") {
      audioRef.current.pause();
      clearInterval(intervalRef.current);
    }
  }, [playing]);

  const percent = (progress / duration) * 100;

  return (
    <li style={{ 
      padding: "10px",
      display: "flex",
      alignItems: "center",
     }}>
      <span
        style={{
          color: "grey",
          width: "80px",
          marginRight: "var(--space-4)",
        }}
      >
        {moment.utc(radio.Utc).format("HH:mm:ss")}
      </span>
      <span
        style={{
          //color: driver?.TeamColour ? `#${driver.TeamColour}` : undefined,
          backgroundColor: driver?.TeamColour ? `#${driver.TeamColour}` : 'white',
          color: "#d9dadc",
          display: "inline-block",
          width: "80px",
          textAlign: "center",
          marginRight: "var(--space-3)",
          border: `4px solid ${driver?.TeamColour ? `#${driver.TeamColour}` : 'red'}`,
          borderRadius: "5px",
          
         }}
      >
        {radio.RacingNumber} {driver?.Tla}
      </span>
      <button
        onClick={() => setPlaying((p) => !p)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          background: `linear-gradient(to right, ${driver?.TeamColour ? `#${driver.TeamColour}` : 'red'} ${percent}%, var(--colour-bg) ${percent}%)`,
          padding: "var(--space-1) var(--space-3)",
          marginRight: "var(--space-4)",
          borderRadius: "20px",
          borderColor: '#d9dadc',
        }}
      >
        <p>▶</p>
        {secondsToMinutes(progress)} / {secondsToMinutes(duration)}
      </button>
      <audio
        ref={audioRef}
        src={path}
        onLoadedMetadata={() => {
          setDuration(audioRef.current.duration);
        }}
        controls
        style={{ display: "none" }}
      />
    </li>
  );
};

export default Radio;
