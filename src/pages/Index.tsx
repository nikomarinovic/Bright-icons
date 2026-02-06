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
          <svg viewBox="0 0 32 32" class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="none">
            
            <rect width="32" height="32" rx="8" fill="#288e45" />

            <rect x="5" y="5" width="6" height="6" rx="1.5" fill="#ffffff" />
            <rect x="13" y="5" width="6" height="6" rx="1.5" fill="#ffffff" />
            <rect x="21" y="5" width="6" height="6" rx="1.5" fill="#ffffff" />

            
            <rect x="5" y="13" width="6" height="6" rx="1.5" fill="#ffffff" />
            <rect x="13" y="13" width="6" height="6" rx="1.5" fill="#ffffff" />
            <rect x="21" y="13" width="6" height="6" rx="1.5" fill="#ffffff" />

            <rect x="5" y="21" width="6" height="6" rx="1.5" fill="#ffffff" />
            <rect x="13" y="21" width="6" height="6" rx="1.5" fill="#ffffff" />
            <rect x="21" y="21" width="6" height="6" rx="1.5" fill="#ffffff" />
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
      <footer class="fixed bottom-0 left-0 w-full border-t border-border py-4 text-center text-muted-foreground text-sm font-display bg-background flex flex-col items-center gap-1">
        <p>© 2026 Niko Marinović. All rights reserved.</p>
        <a href="https://github.com/nikomarinovic" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.11.78-.25.78-.56v-2.02c-3.19.69-3.86-1.54-3.86-1.54-.52-1.32-1.28-1.67-1.28-1.67-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.95.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.06 11.06 0 0 1 5.8 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.68 5.41-5.23 5.7.41.36.77 1.08.77 2.18v3.23c0 .31.21.68.79.56A10.52 10.52 0 0 0 23.5 12c0-6.27-5.23-11.5-11.5-11.5z"/>
          </svg>
        </a>
      </footer>
    </div>
  );
};

export default Index;
