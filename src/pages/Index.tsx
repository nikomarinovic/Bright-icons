import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Palette, Move, Download, Layers } from "lucide-react";

const Index = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-display font-bold text-xl text-foreground">
          <svg width="256px" height="256px" viewBox="-2.73 -2.73 26.46 26.46" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#ffffff" stroke="#ffffff">
            <g id="SVGRepo_bgCarrier" stroke-width="0">
              <rect x="-2.73" y="-2.73" width="26.46" height="26.46" rx="5.292000000000001" fill="#288e45" strokewidth="0"></rect>
            </g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.126"></g>
            <g id="SVGRepo_iconCarrier">
              <title>grid [#fff]</title>
              <desc>Created with Sketch.</desc>
              <defs> </defs>
              <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                <g id="Dribbble-Light-Preview" transform="translate(-219.000000, -200.000000)" fill="#fff">
                  <g id="icons" transform="translate(56.000000, 160.000000)">
                    <path d="M181.9,54 L179.8,54 C178.63975,54 177.7,54.895 177.7,56 L177.7,58 C177.7,59.105 178.63975,60 179.8,60 L181.9,60 C183.06025,60 184,59.105 184,58 L184,56 C184,54.895 183.06025,54 181.9,54 M174.55,54 L172.45,54 C171.28975,54 170.35,54.895 170.35,56 L170.35,58 C170.35,59.105 171.28975,60 172.45,60 L174.55,60 C175.71025,60 176.65,59.105 176.65,58 L176.65,56 C176.65,54.895 175.71025,54 174.55,54 M167.2,54 L165.1,54 C163.93975,54 163,54.895 163,56 L163,58 C163,59.105 163.93975,60 165.1,60 L167.2,60 C168.36025,60 169.3,59.105 169.3,58 L169.3,56 C169.3,54.895 168.36025,54 167.2,54 M181.9,47 L179.8,47 C178.63975,47 177.7,47.895 177.7,49 L177.7,51 C177.7,52.105 178.63975,53 179.8,53 L181.9,53 C183.06025,53 184,52.105 184,51 L184,49 C184,47.895 183.06025,47 181.9,47 M174.55,47 L172.45,47 C171.28975,47 170.35,47.895 170.35,49 L170.35,51 C170.35,52.105 171.28975,53 172.45,53 L174.55,53 C175.71025,53 176.65,52.105 176.65,51 L176.65,49 C176.65,47.895 175.71025,47 174.55,47 M167.2,47 L165.1,47 C163.93975,47 163,47.895 163,49 L163,51 C163,52.105 163.93975,53 165.1,53 L167.2,53 C168.36025,53 169.3,52.105 169.3,51 L169.3,49 C169.3,47.895 168.36025,47 167.2,47 M181.9,40 L179.8,40 C178.63975,40 177.7,40.895 177.7,42 L177.7,44 C177.7,45.105 178.63975,46 179.8,46 L181.9,46 C183.06025,46 184,45.105 184,44 L184,42 C184,40.895 183.06025,40 181.9,40 M174.55,40 L172.45,40 C171.28975,40 170.35,40.895 170.35,42 L170.35,44 C170.35,45.105 171.28975,46 172.45,46 L174.55,46 C175.71025,46 176.65,45.105 176.65,44 L176.65,42 C176.65,40.895 175.71025,40 174.55,40 M169.3,42 L169.3,44 C169.3,45.105 168.36025,46 167.2,46 L165.1,46 C163.93975,46 163,45.105 163,44 L163,42 C163,40.895 163.93975,40 165.1,40 L167.2,40 C168.36025,40 169.3,40.895 169.3,42" id="grid-[#fff]"></path>
                  </g>
                </g>
              </g>
            </g>
          </svg>
          Bright Icons
        </div>
        <Link
          to="/editor"
          className="px-5 py-2 rounded-lg bg-secondary text-secondary-foreground font-display font-medium text-sm hover:bg-muted transition-colors"
        >
          Open Editor
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 max-w-4xl mx-auto">
        <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-block px-4 py-1.5 rounded-full bg-secondary text-primary font-display text-xs mb-8 animate-pulse-glow">
            • 1500+ Icons
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-display leading-tight mb-6 text-foreground">
            Icons that
            <br />
            <span className="text-gradient">stand out.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 font-body leading-relaxed">
            Generate stunning GitHub-ready icons with custom backgrounds, shapes, patterns, 
            and full control over color, rotation, and position. No signup required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-display font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{ background: "var(--gradient-accent)", color: "white", boxShadow: "var(--shadow-glow)" }}
            >
              Start Creating
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-32">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { title: "1500+ Icons", desc: "Massive built-in library with search. Upload your own SVG, PNG, or JPG.", Icon: Layers },
            { title: "Custom Styles", desc: "Choose background shapes, patterns, colors, and tint your icons any color.", Icon: Palette },
            { title: "Full Control", desc: "Drag, scale, rotate, and snap to grid for pixel-perfect positioning.", Icon: Move },
            { title: "Export Anywhere", desc: "Download as SVG, PNG, or JPG. Copy raw SVG to clipboard instantly.", Icon: Download },
          ].map((f, i) => (
            <div
              key={f.title}
              className="glass-panel rounded-2xl p-6 hover-lift animate-fade-up"
              style={{ animationDelay: `${i * 100 + 400}ms`, animationFillMode: "both" }}
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-4">
                <f.Icon size={20} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-muted-foreground text-sm font-display">
        <p>IconForge — Open source icon background generator</p>
      </footer>
    </div>
  );
};

export default Index;
