import { listDigest, listPublications } from "@/lib/db";
import MoleculeField from "@/components/MoleculeField";
import Molecule3D from "@/components/Molecule3D";
import Nav from "@/components/Nav";
import Publications from "@/components/Publications";
import Digest from "@/components/Digest";
import { Counter, CopyButton, PageEffects, Typewriter } from "@/components/Effects";

export const dynamic = "force-dynamic";

const EMAIL = "obrien-zakumi.obed@binghamuni.edu.ng";

const RESEARCH = [
  { title: "Natural product chemistry", text: "Isolation, characterisation and chemical modification of biomass-derived compounds.", icon: "M12 3c4 3 6 6 6 9a6 6 0 0 1-12 0c0-3 2-6 6-9Zm0 6v9" },
  { title: "Biomass valorisation", text: "Lignin extraction and conversion into functional materials.", icon: "M12 2 20.5 7v10L12 22 3.5 17V7Zm0 6.5 3 1.75v3.5L12 15.5l-3-1.75v-3.5Z" },
  { title: "Sustainable polymer chemistry", text: "Bio-based photopolymers and waste-derived glycerol, including applications in 3D printing.", icon: "M4 7h4v4H4zM10 7h4v4h-4zM16 7h4v4h-4zM8 9h2M14 9h2M6 11v6h12v-6" },
  { title: "Circular bioresources", text: "Resource recovery from waste cooking oil and locally sourced biomass.", icon: "M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3M18 3v4h-4M6 21v-4h4" },
  { title: "Plastic biodegradation", text: "Microbial degradation of polystyrene and polypropylene.", icon: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3M8 15h8" },
  { title: "Environmental remediation", text: "Adsorption and electrocoagulation for pollutant removal.", icon: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Zm-3 11a3 3 0 0 0 3 3" },
];

const KEYWORDS = ["Lignin", "Biomass", "Glycerol", "Photopolymers", "3D printing", "Waste cooking oil", "Polystyrene", "Polypropylene", "Adsorption", "Electrocoagulation", "Green chemistry", "Circular economy"];

const FORMULAS = [
  { f: "C₁₀H₁₂O₃", n: "coniferyl alcohol" },
  { f: "C₃H₈O₃", n: "glycerol" },
  { f: "(C₈H₈)ₙ", n: "polystyrene" },
  { f: "(C₃H₆)ₙ", n: "polypropylene" },
  { f: "Al³⁺ + 3OH⁻", n: "electrocoagulation" },
];

export default async function Home() {
  const [publications, digest] = await Promise.all([listPublications(), listDigest()]);

  return (
    <>
      <PageEffects />
      <Nav />

      <section className="hero" id="home">
        <MoleculeField />
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow hero-in" style={{ ["--i" as string]: 0 }}>
              <span className="dot" /> Natural product chemistry · Sustainable environmental chemistry
            </span>
            <h1 className="hero-in" style={{ ["--i" as string]: 1 }}>
              Exploring nature.<br />
              <em>Advancing sustainability.</em>
            </h1>
            <p className="hero-name hero-in" style={{ ["--i" as string]: 2 }}>Dr. O’Brien Zakumi Obed</p>
            <p className="hero-lead hero-in" style={{ ["--i" as string]: 3 }}>
              Turning <Typewriter words={["lignin", "waste cooking oil", "glycerol", "plastic waste", "local biomass"]} /> into
              chemistry for a sustainable future.
            </p>
            <div className="hero-cta hero-in" style={{ ["--i" as string]: 4 }}>
              <a className="btn magnetic" href="#publications">Explore publications <span aria-hidden="true">→</span></a>
              <a className="btn ghost light magnetic" href="#contact">Collaborate</a>
            </div>
          </div>
          <div className="hero-visual hero-in" style={{ ["--i" as string]: 2 }}>
            <Molecule3D />
            {FORMULAS.map((x, i) => (
              <span key={x.f} className={`formula f${i}`} aria-hidden="true">
                {x.f}<small>{x.n}</small>
              </span>
            ))}
          </div>
        </div>
        <a href="#about" className="scroll-cue" aria-label="Scroll to overview"><span /></a>
      </section>

      <div className="marquee-wrap" aria-hidden="true">
        <div className="marquee">
          <div>
            {[...KEYWORDS, ...KEYWORDS].map((k, i) => (
              <span key={i}>{k}<i>⬡</i></span>
            ))}
          </div>
        </div>
      </div>

      <main>
        <section id="about" className="about">
          <div data-reveal>
            <span className="kicker">01 / Research overview</span>
            <h2>Exploring chemistry for a sustainable future</h2>
          </div>
          <div className="about-body">
            <div data-reveal>
              <p className="lead">
                A research platform dedicated to advancing natural product chemistry and sustainable environmental
                chemistry: exploring how natural resources, biomass and waste-derived materials can answer contemporary
                environmental challenges.
              </p>
              <p>
                The work spans natural product valorisation, sustainable polymer development, circular bioresources,
                plastic biodegradation and environmental remediation, with an emphasis on resource efficiency and
                environmentally responsible chemical processes.
              </p>
              <p>
                Beyond publications, this is a knowledge-sharing space for students, researchers and academics. Through
                the <a href="#digest">Research Digest</a>, visitors can discover scientific literature, emerging
                developments and educational insights that encourage curiosity and interdisciplinary collaboration.
              </p>
            </div>
            <div className="stats" data-stagger>
              <div className="stat spot" data-reveal><strong><Counter to={publications.length} /></strong><span>Publications</span></div>
              <div className="stat spot" data-reveal><strong><Counter to={RESEARCH.length} /></strong><span>Research areas</span></div>
              <div className="stat spot" data-reveal><strong><Counter to={digest.length} /></strong><span>Digest readings</span></div>
              <div className="stat spot" data-reveal><strong>PhD</strong><span>Industrial Chemistry</span></div>
            </div>
          </div>
        </section>

        <section id="research">
          <div data-reveal>
            <span className="kicker">02 / Research</span>
            <h2>Research interests</h2>
          </div>
          <div className="grid" data-stagger>
            {RESEARCH.map((r, i) => (
              <article className="tile spot tilt" key={r.title} data-reveal>
                <div className="tile-top">
                  <span className="icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d={r.icon} /></svg>
                  </span>
                  <span className="index">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="publications">
          <div data-reveal>
            <span className="kicker">03 / Scholarship</span>
            <h2>Publications</h2>
            <p className="muted">Published journal articles and conference proceedings.</p>
          </div>
          <Publications items={publications} />
        </section>

        <section id="digest">
          <div data-reveal>
            <span className="kicker">04 / Student learning hub</span>
            <h2>Research digest</h2>
            <p className="muted">
              A reading space for students and early-career researchers: research papers, practical insights and
              questions for further exploration.
            </p>
          </div>
          <Digest items={digest} />
        </section>

        <section id="experience">
          <div data-reveal>
            <span className="kicker">05 / Academic journey</span>
            <h2>Education &amp; affiliations</h2>
          </div>
          <div className="journey">
            <ol className="timeline" data-reveal>
              <li><span className="when">2024 – 2026</span><h3>PhD · Industrial Chemistry</h3><p>Nile University of Nigeria</p></li>
              <li><span className="when">2022 – 2023</span><h3>MSc · Environmental Chemistry</h3><p>Bingham University</p></li>
              <li><span className="when">2016 – 2020</span><h3>BSc · Industrial Chemistry</h3><p>Bingham University</p></li>
            </ol>
            <div className="tile spot affiliation" data-reveal>
              <span className="index">Current affiliation</span>
              <h3>Member, NatuRes Innovate Research Group</h3>
              <p>Bingham University, Nigeria</p>
              <hr />
              <h3>Curriculum vitae</h3>
              <p>Academic background, research and professional experience.</p>
              <a className="btn magnetic" download href="/cv.docx">Download CV (DOCX) <span aria-hidden="true">↓</span></a>
            </div>
          </div>
        </section>

        <section id="contact" className="contact" data-reveal>
          <MoleculeField density={0.45} />
          <div className="contact-inner">
            <span className="kicker">06 / Connect</span>
            <h2>Let’s collaborate on greener chemistry</h2>
            <p>
              Get in touch to discuss natural product chemistry, sustainable environmental chemistry, circular
              bioresources and collaborative research.
            </p>
            <div className="email-row">
              <a className="btn magnetic" href={`mailto:${EMAIL}`}>{EMAIL}</a>
              <CopyButton text={EMAIL} label="Copy email" className="light" />
            </div>
            <div className="links">
              <a href="https://orcid.org/0000-0002-9474-4371" target="_blank" rel="noopener noreferrer">ORCID ↗</a>
              <a href="https://sciprofiles.com/profile/4396664" target="_blank" rel="noopener noreferrer">SciProfiles ↗</a>
              <a href="https://www.linkedin.com/in/o%E2%80%99brien-obed-ph-d-509b90191/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span>© {new Date().getFullYear()} O’Brien Zakumi Obed</span>
        <span>Personal research website</span>
        <a href="#home">Back to top ↑</a>
      </footer>
    </>
  );
}
