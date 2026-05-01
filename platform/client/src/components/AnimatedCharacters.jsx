import { useEffect, useRef, useState } from 'react';

/**
 * Animated cartoon characters for the auth pages. Eyes track the mouse,
 * blink at random intervals, and react to the form's typing / password
 * visibility state. Pure presentational component — keep it free of any
 * router or auth logic.
 *
 * Props:
 *   - typing      : boolean — pass `true` while the user is focused inside an input
 *   - hasPassword : boolean — `true` when the password field has any value
 *   - showPassword: boolean — `true` when the password is visible (eye icon)
 */
export default function AnimatedCharacters({ typing = false, hasPassword = false, showPassword = false }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [purpleBlink, setPurpleBlink] = useState(false);
  const [blackBlink, setBlackBlink] = useState(false);
  const [lookAtEachOther, setLookAtEachOther] = useState(false);
  const [purplePeek, setPurplePeek] = useState(false);

  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Random blink schedulers
  useEffect(() => {
    let timer;
    const tick = () => {
      timer = setTimeout(() => {
        setPurpleBlink(true);
        setTimeout(() => { setPurpleBlink(false); tick(); }, 150);
      }, Math.random() * 4000 + 3000);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    let timer;
    const tick = () => {
      timer = setTimeout(() => {
        setBlackBlink(true);
        setTimeout(() => { setBlackBlink(false); tick(); }, 150);
      }, Math.random() * 4000 + 3000);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  // Briefly look at each other when typing starts
  useEffect(() => {
    if (typing) {
      setLookAtEachOther(true);
      const t = setTimeout(() => setLookAtEachOther(false), 800);
      return () => clearTimeout(t);
    }
    setLookAtEachOther(false);
  }, [typing]);

  // Purple peeks when password is visible
  useEffect(() => {
    if (hasPassword && showPassword) {
      const t = setTimeout(() => {
        setPurplePeek(true);
        setTimeout(() => setPurplePeek(false), 800);
      }, Math.random() * 3000 + 2000);
      return () => clearTimeout(t);
    }
    setPurplePeek(false);
  }, [hasPassword, showPassword, purplePeek]);

  const calcPos = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 3;
    const dx = mouse.x - cx;
    const dy = mouse.y - cy;
    const faceX = Math.max(-15, Math.min(15, dx / 20));
    const faceY = Math.max(-10, Math.min(10, dy / 30));
    const bodySkew = Math.max(-6, Math.min(6, -dx / 120));
    return { faceX, faceY, bodySkew };
  };

  const purple = calcPos(purpleRef);
  const black = calcPos(blackRef);
  const yellow = calcPos(yellowRef);
  const orange = calcPos(orangeRef);

  const looking = hasPassword && showPassword;

  return (
    <div className="relative" style={{ width: 550, height: 400 }}>
      {/* Purple — back */}
      <div
        ref={purpleRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 70,
          width: 180,
          height: typing || (hasPassword && !showPassword) ? 440 : 400,
          backgroundColor: '#6C3FF5',
          borderRadius: '10px 10px 0 0',
          zIndex: 1,
          transform: looking
            ? 'skewX(0deg)'
            : typing || (hasPassword && !showPassword)
              ? `skewX(${purple.bodySkew - 12}deg) translateX(40px)`
              : `skewX(${purple.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-700 ease-in-out"
          style={{
            left: looking ? 20 : lookAtEachOther ? 55 : 45 + purple.faceX,
            top: looking ? 35 : lookAtEachOther ? 65 : 40 + purple.faceY,
          }}
        >
          <Eye size={18} pupilSize={7} blinking={purpleBlink}
               forceX={looking ? (purplePeek ? 4 : -4) : lookAtEachOther ? 3 : null}
               forceY={looking ? (purplePeek ? 5 : -4) : lookAtEachOther ? 4 : null} mouse={mouse} />
          <Eye size={18} pupilSize={7} blinking={purpleBlink}
               forceX={looking ? (purplePeek ? 4 : -4) : lookAtEachOther ? 3 : null}
               forceY={looking ? (purplePeek ? 5 : -4) : lookAtEachOther ? 4 : null} mouse={mouse} />
        </div>
      </div>

      {/* Black — middle */}
      <div
        ref={blackRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 240,
          width: 120,
          height: 310,
          backgroundColor: '#2D2D2D',
          borderRadius: '8px 8px 0 0',
          zIndex: 2,
          transform: looking
            ? 'skewX(0deg)'
            : lookAtEachOther
              ? `skewX(${black.bodySkew * 1.5 + 10}deg) translateX(20px)`
              : typing || (hasPassword && !showPassword)
                ? `skewX(${black.bodySkew * 1.5}deg)`
                : `skewX(${black.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-700 ease-in-out"
          style={{
            left: looking ? 10 : lookAtEachOther ? 32 : 26 + black.faceX,
            top: looking ? 28 : lookAtEachOther ? 12 : 32 + black.faceY,
          }}
        >
          <Eye size={16} pupilSize={6} blinking={blackBlink}
               forceX={looking ? -4 : lookAtEachOther ? 0 : null}
               forceY={looking ? -4 : lookAtEachOther ? -4 : null} mouse={mouse} />
          <Eye size={16} pupilSize={6} blinking={blackBlink}
               forceX={looking ? -4 : lookAtEachOther ? 0 : null}
               forceY={looking ? -4 : lookAtEachOther ? -4 : null} mouse={mouse} />
        </div>
      </div>

      {/* Orange — front-left dome */}
      <div
        ref={orangeRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 0,
          width: 240,
          height: 200,
          zIndex: 3,
          backgroundColor: '#FF9B6B',
          borderRadius: '120px 120px 0 0',
          transform: looking ? 'skewX(0deg)' : `skewX(${orange.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-200 ease-out"
          style={{
            left: looking ? 50 : 82 + orange.faceX,
            top: looking ? 85 : 90 + orange.faceY,
          }}
        >
          <Pupil size={12} forceX={looking ? -5 : null} forceY={looking ? -4 : null} mouse={mouse} />
          <Pupil size={12} forceX={looking ? -5 : null} forceY={looking ? -4 : null} mouse={mouse} />
        </div>
      </div>

      {/* Yellow — front-right */}
      <div
        ref={yellowRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 310,
          width: 140,
          height: 230,
          backgroundColor: '#E8D754',
          borderRadius: '70px 70px 0 0',
          zIndex: 4,
          transform: looking ? 'skewX(0deg)' : `skewX(${yellow.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-200 ease-out"
          style={{
            left: looking ? 20 : 52 + yellow.faceX,
            top: looking ? 35 : 40 + yellow.faceY,
          }}
        >
          <Pupil size={12} forceX={looking ? -5 : null} forceY={looking ? -4 : null} mouse={mouse} />
          <Pupil size={12} forceX={looking ? -5 : null} forceY={looking ? -4 : null} mouse={mouse} />
        </div>
        {/* Mouth */}
        <div
          className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
          style={{
            left: looking ? 10 : 40 + yellow.faceX,
            top: looking ? 88 : 88 + yellow.faceY,
          }}
        />
      </div>
    </div>
  );
}

function Pupil({ size = 12, forceX, forceY, mouse }) {
  const ref = useRef(null);
  const { x, y } = (() => {
    if (forceX != null && forceY != null) return { x: forceX, y: forceY };
    if (!ref.current) return { x: 0, y: 0 };
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = mouse.x - cx;
    const dy = mouse.y - cy;
    const dist = Math.min(Math.hypot(dx, dy), 5);
    const ang = Math.atan2(dy, dx);
    return { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist };
  })();
  return (
    <div
      ref={ref}
      className="rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: '#2D2D2D',
        transform: `translate(${x}px, ${y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
}

function Eye({ size = 18, pupilSize = 7, blinking = false, forceX, forceY, mouse }) {
  const ref = useRef(null);
  const { x, y } = (() => {
    if (forceX != null && forceY != null) return { x: forceX, y: forceY };
    if (!ref.current) return { x: 0, y: 0 };
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = mouse.x - cx;
    const dy = mouse.y - cy;
    const dist = Math.min(Math.hypot(dx, dy), 5);
    const ang = Math.atan2(dy, dx);
    return { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist };
  })();
  return (
    <div
      ref={ref}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: size,
        height: blinking ? 2 : size,
        backgroundColor: 'white',
        overflow: 'hidden',
      }}
    >
      {!blinking && (
        <div
          className="rounded-full"
          style={{
            width: pupilSize,
            height: pupilSize,
            backgroundColor: '#2D2D2D',
            transform: `translate(${x}px, ${y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
}
