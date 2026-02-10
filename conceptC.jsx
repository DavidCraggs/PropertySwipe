import { useState, useEffect, useRef, useCallback } from "react";

const DECK = [
  {
    id: 1, name: "THE PRINTWORKS", where: "SE1 · BERMONDSEY", rent: 2100,
    beds: 1, type: "CONVERTED WAREHOUSE",
    notes: ["14ft ceilings", "Original brick", "Mezzanine level"],
    grad: "linear-gradient(155deg, #022c22 0%, #0f766e 55%, #5eead4 100%)",
    icon: "🏭", pct: 96,
  },
  {
    id: 2, name: "POETS CORNER", where: "SE24 · HERNE HILL", rent: 1680,
    beds: 2, type: "GARDEN MAISONETTE",
    notes: ["60ft garden", "South-facing", "Period features"],
    grad: "linear-gradient(155deg, #172554 0%, #2563eb 55%, #93c5fd 100%)",
    icon: "🌺", pct: 91,
  },
  {
    id: 3, name: "SIGNAL HOUSE", where: "SE10 · GREENWICH", rent: 1950,
    beds: 2, type: "RIVERSIDE APARTMENT",
    notes: ["Thames views", "Concierge", "Private balcony"],
    grad: "linear-gradient(155deg, #1e1b4b 0%, #7c3aed 55%, #c4b5fd 100%)",
    icon: "⛵", pct: 88,
  },
  {
    id: 4, name: "THE COOPERAGE", where: "SE15 · PECKHAM", rent: 1280,
    beds: 0, type: "LOFT STUDIO",
    notes: ["Skylight", "Mezzanine bed", "Bike storage"],
    grad: "linear-gradient(155deg, #431407 0%, #ea580c 55%, #fdba74 100%)",
    icon: "🛖", pct: 84,
  },
];

function SwipeEngine({ item, isTop, idx, onGo, dark, t }) {
  const ref = useRef(null);
  const origin = useRef({ x: 0, y: 0 });
  const active = useRef(false);
  const [d, setD] = useState({ x: 0, y: 0 });
  const [live, setLive] = useState(false);
  const [out, setOut] = useState(null);

  const down = useCallback((e) => {
    if (!isTop) return;
    const p = e.touches ? e.touches[0] : e;
    origin.current = { x: p.clientX, y: p.clientY };
    active.current = true; setLive(true);
  }, [isTop]);

  const move = useCallback((e) => {
    if (!active.current) return;
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    setD({ x: p.clientX - origin.current.x, y: (p.clientY - origin.current.y) * 0.25 });
  }, []);

  const up = useCallback(() => {
    if (!active.current) return;
    active.current = false; setLive(false);
    if (Math.abs(d.x) > 100) {
      setOut(d.x > 0 ? "r" : "l");
      setTimeout(() => onGo(d.x > 0 ? "right" : "left"), 360);
    } else setD({ x: 0, y: 0 });
  }, [d.x, onGo]);

  useEffect(() => {
    if (!isTop) return;
    const el = ref.current; if (!el) return;
    const h = (e) => { if (active.current) { e.preventDefault(); const p = e.touches[0]; setD({ x: p.clientX - origin.current.x, y: (p.clientY - origin.current.y) * 0.25 }); } };
    el.addEventListener("touchmove", h, { passive: false });
    return () => el.removeEventListener("touchmove", h);
  }, [isTop]);

  const r = d.x * 0.055;
  const yesO = Math.min(1, Math.max(0, (d.x - 20) / 60));
  const noO = Math.min(1, Math.max(0, (-d.x - 20) / 60));
  const sc = isTop ? 1 : 1 - idx * 0.04;

  return (
    <div ref={ref}
      onMouseDown={down}
      onMouseMove={!("ontouchstart" in window) ? move : undefined}
      onMouseUp={up} onMouseLeave={() => { if (active.current) up(); }}
      onTouchStart={down} onTouchEnd={up}
      style={{
        position: "absolute", inset: 0, zIndex: 10 - idx,
        transform: out
          ? `translateX(${out === "r" ? 550 : -550}px) rotate(${out === "r" ? 20 : -20}deg)`
          : `translateX(${d.x}px) translateY(${d.y + idx * 10}px) rotate(${r}deg) scale(${sc})`,
        opacity: out ? 0 : Math.max(0, 1 - idx * 0.28),
        transition: out ? "all 0.38s cubic-bezier(0.4,0,0.2,1)" : live ? "none" : "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        cursor: isTop ? "grab" : "default",
        userSelect: "none", touchAction: "none",
      }}
    >
      <div style={{
        height: "100%", borderRadius: 20, overflow: "hidden",
        background: t.card, border: `1.5px solid ${t.line}`,
        boxShadow: isTop ? (dark ? "0 20px 50px rgba(0,0,0,0.5)" : "0 20px 50px rgba(0,0,0,0.06)") : "none",
        display: "flex", flexDirection: "column",
      }}>
        {/* Visual */}
        <div style={{
          flex: "0 0 48%", background: item.grad,
          position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          <span style={{ fontSize: 76, filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.2))" }}>{item.icon}</span>

          {/* YES / NO */}
          <div style={{
            position: "absolute", top: 20, left: 18,
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 44,
            color: "#34d399", opacity: yesO, transform: "rotate(-8deg)",
            letterSpacing: 6, lineHeight: 1,
            textShadow: "0 4px 16px rgba(52,211,153,0.4)",
          }}>YES</div>
          <div style={{
            position: "absolute", top: 20, right: 18,
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 44,
            color: "#f87171", opacity: noO, transform: "rotate(8deg)",
            letterSpacing: 6, lineHeight: 1,
            textShadow: "0 4px 16px rgba(248,113,113,0.4)",
          }}>NO</div>

          {/* Type label — off-kilter */}
          <div style={{
            position: "absolute", bottom: 12, left: 16,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 13, letterSpacing: 3, color: "rgba(255,255,255,0.6)",
          }}>"{item.type}"</div>

          {/* Match */}
          <div style={{
            position: "absolute", top: 14, left: 14,
            background: "rgba(0,0,0,0.25)", backdropFilter: "blur(12px)",
            borderRadius: 10, padding: "5px 12px",
            fontFamily: "'Libre Franklin', sans-serif", fontSize: 12,
            fontWeight: 800, color: "#fff", letterSpacing: 0.5,
          }}>{item.pct}%</div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: "18px 20px 16px", display: "flex", flexDirection: "column" }}>
          {/* Decorative quote */}
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 40,
            color: t.teal, lineHeight: 0.6, opacity: 0.3, marginBottom: 4,
          }}>"</span>

          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 32,
            margin: 0, letterSpacing: 2, lineHeight: 1,
          }}>{item.name}</h2>
          <p style={{
            fontFamily: "'Libre Franklin', sans-serif", fontSize: 12,
            color: t.sub, margin: "4px 0 0", fontWeight: 600,
            letterSpacing: 1.5,
          }}>{item.where}</p>

          {/* Price */}
          <div style={{
            marginTop: 14, display: "flex", alignItems: "baseline", gap: 6,
          }}>
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 36,
              color: t.teal, letterSpacing: 1,
            }}>£{item.rent.toLocaleString()}</span>
            <span style={{
              fontFamily: "'Libre Franklin', sans-serif", fontSize: 10,
              color: t.sub, fontWeight: 700, letterSpacing: 2,
            }}>PCM</span>
          </div>

          {/* Details */}
          <div style={{
            marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.line}`,
            display: "flex", gap: 6, flexWrap: "wrap",
          }}>
            {item.notes.map((n) => (
              <span key={n} style={{
                fontFamily: "'Libre Franklin', sans-serif",
                fontSize: 11, fontWeight: 600, color: t.sub,
                border: `1px solid ${t.line}`, borderRadius: 6,
                padding: "4px 10px",
              }}>{n}</span>
            ))}
          </div>

          {/* Beds */}
          <div style={{
            marginTop: "auto", paddingTop: 10,
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 10, fontWeight: 800, letterSpacing: 2,
            color: t.sub, textTransform: "uppercase",
          }}>
            {item.beds === 0 ? "STUDIO" : `${item.beds} BED`} · AVAILABLE NOW
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConceptC() {
  const [dark, setDark] = useState(false);
  const [deck, setDeck] = useState(DECK);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { setTimeout(() => setLoaded(true), 80); }, []);

  const t = dark
    ? { bg: "#07080a", card: "#111214", text: "#eeebe4", sub: "#5e5e5e", line: "#1d1f23", teal: "#2dd4bf", nav: "rgba(7,8,10,0.92)", glow: "rgba(45,212,191,0.1)" }
    : { bg: "#f3f1eb", card: "#ffffff", text: "#0a0a0a", sub: "#8a8680", line: "#dfdbd2", teal: "#0d9488", nav: "rgba(243,241,235,0.92)", glow: "rgba(13,148,136,0.08)" };

  const go = (dir) => {
    setMsg(dir); setTimeout(() => setMsg(null), 650);
    setDeck((d) => d.slice(1));
  };

  return (
    <div style={{
      fontFamily: "'Bebas Neue', sans-serif",
      background: t.bg, color: t.text,
      height: "100vh", maxWidth: 520, margin: "0 auto",
      display: "flex", flexDirection: "column",
      overflow: "hidden", position: "relative",
      transition: "background 0.5s, color 0.5s",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Libre+Franklin:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes up { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toast { 0% { opacity:0; transform:scale(0.92); } 15% { opacity:1; transform:scale(1); } 80% { opacity:1; } 100% { opacity:0; transform:scale(0.97) translateY(-4px); } }
      `}</style>

      {/* Header */}
      <header style={{
        padding: "14px 20px 6px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        zIndex: 20,
        animation: loaded ? "up 0.4s ease forwards" : "none",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 4, lineHeight: 1 }}>
            <span style={{ color: t.teal }}>LET</span>RIGHT
          </h1>
          <p style={{
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 9, fontWeight: 800, letterSpacing: 3,
            color: t.sub, margin: "2px 0 0",
          }}>"SWIPE RIGHT. LET RIGHT."</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setDark(!dark)} style={{
            fontFamily: "'Libre Franklin', sans-serif", fontSize: 9,
            fontWeight: 900, letterSpacing: 2,
            background: "none", border: `1.5px solid ${t.line}`,
            borderRadius: 6, padding: "6px 10px", color: t.sub, cursor: "pointer",
          }}>{dark ? "LIGHT" : "DARK"}</button>
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: t.teal,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 14, fontWeight: 900,
          }}>D</div>
        </div>
      </header>

      {/* Stack */}
      <div style={{
        flex: 1, position: "relative", padding: "10px 14px 0",
        opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease 0.15s",
      }}>
        {deck.length === 0 ? (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            textAlign: "center", padding: 40,
          }}>
            <span style={{ fontSize: 48, marginBottom: 12 }}>◉</span>
            <h2 style={{ fontSize: 34, letterSpacing: 4, margin: "0 0 8px" }}>DONE</h2>
            <p style={{
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 13, color: t.sub, fontWeight: 500, lineHeight: 1.5,
            }}>Check back tomorrow for new drops.</p>
          </div>
        ) : (
          deck.slice(0, 3).map((p, i) => (
            <SwipeEngine key={p.id} item={p} isTop={i === 0} idx={i} onGo={go} dark={dark} t={t} />
          )).reverse()
        )}
      </div>

      {/* Toast */}
      {msg && (
        <div style={{
          position: "absolute", top: 68, left: 0, right: 0,
          display: "flex", justifyContent: "center", zIndex: 60,
          animation: "toast 0.65s ease forwards",
        }}>
          <div style={{
            background: msg === "right" ? t.teal : "#ef4444",
            color: "#fff", borderRadius: 10, padding: "7px 18px",
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 12, fontWeight: 900, letterSpacing: 2,
          }}>
            {msg === "right" ? "♥ SHORTLISTED" : "✕ PASSED"}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{
        padding: "10px 0 6px",
        display: "flex", justifyContent: "center", gap: 14, alignItems: "center",
        zIndex: 20,
        animation: loaded ? "up 0.4s ease 0.25s both" : "none",
      }}>
        {[
          { label: "✕", color: "#ef4444", size: 48, bg: false, fn: () => deck.length > 0 && go("left") },
          { label: "↩", color: "#60a5fa", size: 40, bg: false, fn: () => {} },
          { label: "♥", color: "#fff", size: 58, bg: true, fn: () => deck.length > 0 && go("right") },
          { label: "★", color: "#fbbf24", size: 48, bg: false, fn: () => {} },
        ].map((b, i) => (
          <button key={i} onClick={b.fn} style={{
            width: b.size, height: b.size, borderRadius: "50%",
            background: b.bg ? t.teal : "none",
            border: b.bg ? "none" : `2px solid ${t.line}`,
            color: b.color, fontSize: b.bg ? 24 : b.size > 44 ? 20 : 16,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: b.bg ? `0 6px 24px ${t.glow}` : "none",
            transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >{b.label}</button>
        ))}
      </div>

      {/* Nav */}
      <nav style={{
        background: t.nav, backdropFilter: "blur(20px)",
        borderTop: `1px solid ${t.line}`,
        display: "flex", justifyContent: "space-around",
        padding: "12px 0 28px",
      }}>
        {[
          { label: "DISCOVER", active: true },
          { label: "MATCHES", active: false },
          { label: "CHAT", active: false },
          { label: "YOU", active: false },
        ].map((tab) => (
          <span key={tab.label} style={{
            fontFamily: "'Libre Franklin', sans-serif", fontSize: 9,
            fontWeight: 900, letterSpacing: 2.5,
            color: tab.active ? t.teal : t.sub,
            cursor: "pointer", position: "relative", padding: "4px 0",
          }}>
            {tab.label}
            {tab.active && <div style={{
              position: "absolute", bottom: -3, left: "15%", right: "15%",
              height: 2.5, background: t.teal, borderRadius: 2,
            }} />}
          </span>
        ))}
      </nav>
    </div>
  );
}
