// palette-tweaks.jsx — Tweaks panel.
// • Dark mode toggle: switches between 'bone' (default) and 'cocoa'.
// • TOC hover picker: live-preview 5 hover treatments for the chapter list.
// All choices saved per-device via localStorage so every page picks them up.

const HOVER_OPTIONS = [
  { id: 'marker',   label: 'Marker',
    note: 'Accent rule grows on the left edge' },
  { id: 'drift',    label: 'Drift',
    note: 'Row gently slides right, name picks up accent' },
  { id: 'lined',    label: 'Lined',
    note: 'Accent line draws under the chapter name' },
  { id: 'ornament', label: 'Ornament',
    note: 'Small fleurons flank the chapter name' },
  { id: 'wash',     label: 'Wash',
    note: 'Warm accent sweeps across the row' },
];

function applyPalette(id) {
  document.documentElement.dataset.palette = id || 'bone';
  try { localStorage.setItem('refl-palette', id || 'bone'); } catch (e) {}
}
function applyHover(id) {
  if (id) document.documentElement.dataset.tocHover = id;
  else    delete document.documentElement.dataset.tocHover;
  try {
    if (id) localStorage.setItem('refl-toc-hover', id);
    else    localStorage.removeItem('refl-toc-hover');
  } catch (e) {}
}

function readInitial() {
  try {
    return {
      palette: localStorage.getItem('refl-palette') || 'bone',
      hover:   localStorage.getItem('refl-toc-hover') || 'marker',
    };
  } catch (e) {
    return { palette: 'bone', hover: 'marker' };
  }
}

function PaletteTweaks() {
  const init = readInitial();
  const [dark, setDark]   = React.useState(init.palette === 'cocoa');
  const [hover, setHover] = React.useState(init.hover);

  React.useEffect(() => { applyPalette(dark ? 'cocoa' : 'bone'); }, [dark]);
  React.useEffect(() => { applyHover(hover); }, [hover]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection
        title="Theme"
        description="Bone is the default. Cocoa is the inverted, dark-paper mode."
      >
        <TweakToggle
          label="Dark mode (Cocoa)"
          value={dark}
          onChange={setDark}
        />
      </TweakSection>

      <TweakSection
        title="Chapter list — hover"
        description="How a chapter row reacts when you point at it."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {HOVER_OPTIONS.map(opt => {
            const selected = hover === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setHover(opt.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 2,
                  padding: '10px 12px',
                  border: selected
                    ? '1px solid rgba(29,26,19,0.55)'
                    : '1px solid rgba(29,26,19,0.16)',
                  background: selected
                    ? 'rgba(29,26,19,0.04)'
                    : 'transparent',
                  borderRadius: 3,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.25s, background 0.25s',
                  fontFamily: "'EB Garamond', Georgia, serif",
                  color: 'inherit',
                  width: '100%',
                }}
              >
                <span style={{
                  fontVariant: 'small-caps',
                  letterSpacing: '0.18em',
                  fontWeight: 500,
                  fontSize: 13,
                }}>{opt.label}</span>
                <span style={{
                  fontStyle: 'italic',
                  color: 'rgba(29,26,19,0.55)',
                  fontSize: 12,
                }}>{opt.note}</span>
              </button>
            );
          })}
        </div>
      </TweakSection>

      <TweakSection title="Try it">
        <a
          href="chapters.html"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: "'EB Garamond', Georgia, serif",
            fontVariant: 'all-small-caps',
            letterSpacing: '0.22em',
            fontSize: 13,
            color: 'inherit',
            textDecoration: 'none',
            opacity: 0.75,
          }}
        >
          <span style={{ width: 20, height: 1, background: 'currentColor' }}></span>
          See the chapter list
          <span style={{ fontFamily: "'Cormorant Garamond', serif" }}>→</span>
        </a>
      </TweakSection>
    </TweaksPanel>
  );
}

const mount = document.createElement('div');
document.body.appendChild(mount);
ReactDOM.createRoot(mount).render(<PaletteTweaks />);
