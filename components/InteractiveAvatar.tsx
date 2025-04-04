import type { StartAvatarResponse } from "@heygen/streaming-avatar";
import Image from 'next/image';
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion,
} from "@heygen/streaming-avatar";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
  Spinner,
  Tab,
  Tabs,
  CircularProgress,
  autocomplete
 
} from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, usePrevious } from "ahooks";



import { AVATARS, STT_LANGUAGE_LIST } from "@/app/lib/constants";
import InteractiveAvatarTextInput from "./InteractiveAvatarTextInput";
import Timer from "./Timer";

export default function InteractiveAvatar() {
  const avtarTimer = 120;
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();
  const [knowledgeId, setKnowledgeId] = useState<string>("9f403f53d26e45cd8eeb85c732d9a695");
  const [avatarId, setAvatarId] = useState<string>("723f05df2d174c7d9ebc7e3fb413e739");
  const [language, setLanguage] = useState<string>("en");

  const [data, setData] = useState<StartAvatarResponse>();
  const [text, setText] = useState<string>("");
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatar | null>(null);
  const [chatMode, setChatMode] = useState("text_mode");
  const [isUserTalking, setIsUserTalking] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState({minutes: 0, seconds: 0}); // 2 minutes = 120 seconds
  

  const [startTimer, setStartTimer] = useState(false);
  const timerRef = useRef<any>(); 
  let interval: NodeJS.Timer;
  function baseApiUrl() {
    return process.env.NEXT_PUBLIC_BASE_API_URL;
  }

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();
      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
    }
    return "";
  }
  
  async function startSession() {
    
    setIsLoadingSession(true);
    const newToken = await fetchAccessToken();

    avatar.current = new StreamingAvatar({
      token: newToken,
      basePath: baseApiUrl(),
    });
    avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
      
    });
    avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
    });
    avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      endSession();
    });
    avatar.current?.on(StreamingEvents.STREAM_READY, (event) => {
      setStream(event.detail);
      const targetDate = new Date().getTime() + 1 * 60 * 1000;
      interval = setInterval(() => {
        const now = new Date().getTime();
        
        const distance = targetDate - now;

        if (distance <= 0) {
          endSession();
        } else {
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft({ minutes, seconds });
        }
      }, 1000);
      // setStartTimer(true);
    });
    avatar.current?.on(StreamingEvents.USER_START, (event) => {
      setIsUserTalking(true);
    });
    avatar.current?.on(StreamingEvents.USER_STOP, (event) => {
      setIsUserTalking(false);
    });
    try {
      const res = await avatar.current.createStartAvatar({
        quality: AvatarQuality.Low,
        avatarName: avatarId,
        knowledgeId: knowledgeId,
        voice: {
          rate: 1.5,
          emotion: VoiceEmotion.EXCITED,
        },
        language: language,
        
        disableIdleTimeout: false
      });

      setData(res);
      await avatar.current?.startVoiceChat({
        useSilencePrompt: true,
      });
      setChatMode("voice_mode");
    } catch (error) {
      console.error("Error starting avatar session:", error);
    } finally {
      setIsLoadingSession(false);
    }
  }
  async function handleSpeak() {
    setIsLoadingRepeat(true);
    if (!avatar.current) {
      setDebug("Avatar API not initialized");

      return;
    }
    // speak({ text: text, task_type: TaskType.REPEAT })
    await avatar.current
      .speak({ text: text, taskType: TaskType.REPEAT, taskMode: TaskMode.SYNC })
      .catch((e) => {
        setDebug(e.message);
      });
    setIsLoadingRepeat(false);
  }
  async function handleInterrupt() {
    if (!avatar.current) {
      setDebug("Avatar API not initialized");

      return;
    }
    await avatar.current.interrupt().catch((e) => {
      setDebug(e.message);
    });
  }
  async function endSession() {
    await avatar.current?.stopAvatar();
    setStream(undefined);
    if (interval) {
      clearInterval(interval);
    }
    setTimeLeft({ minutes: 0, seconds: 0 });
    // if (timerRef.current) {
    //   clearInterval(timerRef.current);
    // }
    // setStartTimer(false);
    // setTimeLeft(avtarTimer);
  }

  const handleChangeChatMode = useMemoizedFn(async (v) => {
    if (v === chatMode) {
      return;
    }
    if (v === "text_mode") {
      avatar.current?.closeVoiceChat();
    } else {
      await avatar.current?.startVoiceChat();
    }
    setChatMode(v);
  });

  const previousText = usePrevious(text);
  useEffect(() => {
    if (!previousText && text) {
      avatar.current?.startListening();
    } else if (previousText && !text) {
      avatar?.current?.stopListening();
    }
  }, [text, previousText]);

  useEffect(() => {
    
    return () => {
      endSession();
    };
  }, []);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
        setDebug("Playing");
      };
    }
  }, [mediaStream, stream]);

  return (
    <div className="w-full flex flex-col">
      {/* <Card>
        <CardBody className="h-[500px] flex flex-col justify-center "> */}
       <Button isIconOnly size="md" className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white rounded-lg w-[200px]" color="primary">
              <div style={{ textAlign: "center", padding: "50px" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                  <p>
                    {timeLeft.minutes < 10 ? `0${timeLeft.minutes}` : timeLeft.minutes}:
                    {timeLeft.seconds < 10 ? `0${timeLeft.seconds}` : timeLeft.seconds}
                  </p>
                </div>
              </div>
              </Button>
      {stream ? (
        <div className="h-[500px] w-[600px] justify-center items-center flex rounded-lg overflow-hidden">
          <video
            ref={mediaStream}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "fill",
            }}
          >
            <track kind="captions" />
          </video>
          <div className="flex flex-col gap-2 absolute bottom-3 left-1/2 transform -translate-x-1/2 right-3 z-10">
            <div className="flex gap-4 w-full justify-center">
              <Button isIconOnly size="md" className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white rounded-lg w-[200px]" color="primary">
              <div style={{ textAlign: "center", padding: "50px" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                  <p>
                    {timeLeft.minutes < 10 ? `0${timeLeft.minutes}` : timeLeft.minutes}:
                    {timeLeft.seconds < 10 ? `0${timeLeft.seconds}` : timeLeft.seconds}
                  </p>
                </div>
              </div>
              </Button>
              <Button
                className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white rounded-lg"
                size="md"
                variant="shadow"
                onClick={handleInterrupt}
              >
                Interrupt task
              </Button>
              <Button
                className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white rounded-lg"
                size="md"
                variant="shadow"
                onClick={endSession}
              >
                End session
              </Button>
            </div>
          </div>
        </div>
      ) : !isLoadingSession ? (
        <div className="h-full v-full justify-center  flex flex-col gap-8  self-center">
          <Image
            src="/placeholder_img.webp"  // Path to the image in the public folder
            alt="A WebP image"
            width="700"
            height={1000}
          />
        <div className="absolute top-1000 w-[200px] flex flex-col gap-4  self-center">
          <div className="flex flex-col gap-2 w-full">
            <Select
              label="Chat in"
              placeholder="Chat in"
              className="max-w-xs"
              selectedKeys={[language]}
              onChange={(e) => {
                setLanguage(e.target.value);
              }}
            >
              {STT_LANGUAGE_LIST.map((lang) => (
                <SelectItem key={lang.key}>{lang.label}</SelectItem>
              ))}
            </Select>
          </div>
          <Button
            className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white"
            size="sm"
            variant="shadow"
            onClick={startSession}
          >
            Start session
          </Button>
        </div>
        </div>
      ) : (
        <div className="h-full v-full justify-center  flex flex-col gap-8  self-center">
        <Image
            src="/placeholder_img.webp"  // Path to the image in the public folder
            alt="A WebP image"
            width="700"
            height={1000}
          />
        <Spinner className="absolute top-1000 w-[200px] flex flex-col gap-4  self-center" color="default" size="lg" />
        </div>
      )}
      {/* </CardBody> */}
      {/* <Divider /> */}
      {/* <CardFooter className="flex flex-col gap-3">
          <Tabs
            aria-label="Options"
            selectedKey={chatMode}
            onSelectionChange={(v) => {
              handleChangeChatMode(v);
            }}
          >
            <Tab key="text_mode" title="Text mode" />
            <Tab key="voice_mode" title="Voice mode" />
          </Tabs>
          {chatMode === "text_mode" ? (
            <div className="w-full flex relative">
              <InteractiveAvatarTextInput
                disabled={!stream}
                input={text}
                label="Chat"
                loading={isLoadingRepeat}
                placeholder="Type something for the avatar to respond"
                setInput={setText}
                onSubmit={handleSpeak}
              />
              {text && (
                <Chip className="absolute right-16 top-3">Listening</Chip>
              )}
            </div>
          ) : (
            <div className="w-full text-center">
              <Button
                isDisabled={!isUserTalking}
                className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white"
                size="md"
                variant="shadow"
              >
                {isUserTalking ? "Listening" : "Voice chat"}
              </Button>
            </div>
          )}
        </CardFooter> */}
      {/* </Card> */}
    </div>
  );
}
