document.documentElement.classList.add("js");

const header = document.querySelector(".header");
const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".navigation");

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 20);
}

function updateHeaderHeight() {
  document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
}

updateHeader();
updateHeaderHeight();
window.addEventListener("scroll", updateHeader, { passive: true });
window.addEventListener("resize", updateHeaderHeight);

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  navigation.classList.toggle("open", !isOpen);
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    navigation.classList.remove("open");
  });
});

/* ---------------------------------------------------------
   Hero logo — morph position scrubbed by scroll
   --------------------------------------------------------- */

const heroLogoVideo = document.querySelector("video.hero-logo");
const heroLogoScroll = document.querySelector(".hero");

if (heroLogoScroll) {
  if (heroLogoVideo) heroLogoVideo.pause();

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let duration = 0;
    let targetProgress = 0;
    let smoothedProgress = 0;
    let smoothRafId = null;
    let updateQueued = false;

    const getScrollProgress = () => {
      const rect = heroLogoScroll.getBoundingClientRect();
      const scrollableDistance = rect.height - window.innerHeight;
      if (scrollableDistance <= 0) return rect.top <= 0 ? 1 : 0;
      return Math.min(1, Math.max(0, -rect.top / scrollableDistance));
    };

    const smoothTowardTarget = () => {
      smoothedProgress += (targetProgress - smoothedProgress) * 0.15;
      const remaining = Math.abs(targetProgress - smoothedProgress);
      if (remaining < 0.0005) smoothedProgress = targetProgress;

      heroLogoScroll.style.setProperty("--hero-progress", smoothedProgress.toFixed(4));

      if (heroLogoVideo && Number.isFinite(duration) && duration > 0) {
        const time = smoothedProgress * duration;
        if (Math.abs(heroLogoVideo.currentTime - time) > 0.005) {
          heroLogoVideo.currentTime = time;
        }
      }

      smoothRafId = remaining > 0.0005 ? requestAnimationFrame(smoothTowardTarget) : null;
    };

    const updateTarget = () => {
      updateQueued = false;
      targetProgress = getScrollProgress();
      if (smoothRafId === null) smoothRafId = requestAnimationFrame(smoothTowardTarget);
    };

    const queueUpdate = () => {
      if (!updateQueued) {
        updateQueued = true;
        requestAnimationFrame(updateTarget);
      }
    };

    if (heroLogoVideo) {
      const onMetadataReady = () => {
        if (heroLogoVideo.duration === Infinity || Number.isNaN(heroLogoVideo.duration)) {
          // Some WebM files don't report a finalized duration until Chrome is
          // forced to seek past the end once — otherwise duration is Infinity.
          const fixDuration = () => {
            heroLogoVideo.removeEventListener("timeupdate", fixDuration);
            heroLogoVideo.currentTime = 0;
            duration = heroLogoVideo.duration;
            updateTarget();
          };
          heroLogoVideo.addEventListener("timeupdate", fixDuration);
          heroLogoVideo.currentTime = 1e101;
          return;
        }
        duration = heroLogoVideo.duration;
        updateTarget();
      };

      if (heroLogoVideo.readyState >= 1 && !Number.isNaN(heroLogoVideo.duration)) {
        onMetadataReady();
      } else {
        heroLogoVideo.addEventListener("loadedmetadata", onMetadataReady, { once: true });
      }
    }

    updateTarget();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
  }
}

/* ---------------------------------------------------------
   Experiment image carousel
   --------------------------------------------------------- */

document.querySelectorAll(".image-carousel").forEach((carousel) => {
  const slides = carousel.querySelectorAll(".carousel-slide");
  const dots = carousel.querySelectorAll(".carousel-dot");
  const prevButton = carousel.querySelector(".carousel-prev");
  const nextButton = carousel.querySelector(".carousel-next");
  const AUTO_ADVANCE_MS = 4500;

  let current = 0;
  let timer = null;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle("is-active", i === current));
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === current));
  }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(() => show(current + 1), AUTO_ADVANCE_MS);
  }

  prevButton.addEventListener("click", () => {
    show(current - 1);
    startAuto();
  });

  nextButton.addEventListener("click", () => {
    show(current + 1);
    startAuto();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      show(i);
      startAuto();
    });
  });

  show(0);
  startAuto();
});

/* ---------------------------------------------------------
   Steps carousel ("How it works")
   --------------------------------------------------------- */

document.querySelectorAll(".steps-carousel").forEach((carousel) => {
  const cards = Array.from(carousel.querySelectorAll(".step-card"));

  const getActiveIndex = () => {
    const containerCenter = carousel.scrollLeft + carousel.clientWidth / 2;
    let closest = 0;
    let closestDistance = Infinity;
    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - containerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = i;
      }
    });
    return closest;
  };

  const setActive = (index) => {
    cards.forEach((card, i) => card.classList.toggle("is-active", i === index));
  };

  const goTo = (index) => {
    const clamped = Math.max(0, Math.min(cards.length - 1, index));
    cards[clamped].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  let scrollRafId = null;
  carousel.addEventListener(
    "scroll",
    () => {
      if (scrollRafId) return;
      scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null;
        setActive(getActiveIndex());
      });
    },
    { passive: true }
  );

  carousel.querySelectorAll(".step-nav--prev").forEach((btn) => {
    btn.addEventListener("click", () => goTo(getActiveIndex() - 1));
  });
  carousel.querySelectorAll(".step-nav--next").forEach((btn) => {
    btn.addEventListener("click", () => goTo(getActiveIndex() + 1));
  });

  setActive(0);
});

/* ---------------------------------------------------------
   Language switching (EN / DE)
   --------------------------------------------------------- */

const translations = {
  "nav.experiment": { en: "Concept", de: "Konzept" },
  "nav.event": { en: "Past Events", de: "Frühere Events" },
  "nav.research": { en: "Research", de: "Forschung" },
  "nav.about": { en: "About us", de: "Über uns" },
  "nav.contact": { en: "Contact", de: "Kontakt" },

  "menu.button": { en: "Menu", de: "Menü" },

  "hero.description": {
    en: "A multisensory experience where people discover new, deeper forms of communication.",
    de: "Eine multisensorische Erfahrung, bei der Menschen neue, tiefere Formen der Kommunikation entdecken.",
  },
  "hero.tagline": {
    en: "Come as a couple, a team, a group of friends, or strangers. Everyone leaves knowing someone a little better than words and faces allow.",
    de: "Kommt als Paar, als Team, als Freundesgruppe oder als Fremde. Alle gehen danach jemanden ein Stück besser kennen, als Worte und Gesichter es zulassen.",
  },
  "hero.explore": { en: "Explore", de: "Entdecken" },

  "experiment.kicker": { en: "Silent conversation", de: "Stilles Gespräch" },
  "experiment.heading": { en: "Concept", de: "Konzept" },
  "experiment.body1": {
    en: "Without Faces is a multi-sensory experience where people rediscover how to understand each other. Through facilitated sessions, people invent unfamiliar languages using shapes, colors, scents, and tastes to translate emotions into something visible.",
    de: "Without Faces ist eine multisensorische Erfahrung, bei der Menschen neu lernen, einander zu verstehen. In begleiteten Sessions erfinden die Teilnehmenden ungewohnte Sprachen aus Formen, Farben, Düften und Geschmäckern, um Emotionen sichtbar zu machen.",
  },
  "experiment.body2": {
    en: "The session gives people a shared experience of deliberate communication. By removing speech and facial expression, it resets how we pay attention to one another. It’s a space where people meet, sense, and shape emotions together, creating connection without words, without faces.",
    de: "Die Session gibt Menschen eine gemeinsame Erfahrung bewusster Kommunikation. Indem Sprache und Mimik wegfallen, verändert sich, wie wir einander wahrnehmen. Es ist ein Raum, in dem Menschen sich begegnen, spüren und gemeinsam Emotionen formen – Verbindung ohne Worte, ohne Gesichter.",
  },
  "experiment.body3": {
    en: "It’s a space where people meet, sense, and shape emotions together, creating connection without words, without faces.",
    de: "Es ist ein Raum, in dem Menschen sich begegnen, spüren und gemeinsam Emotionen formen – Verbindung ohne Worte, ohne Gesichter.",
  },

  "tags.colors": { en: "Colors", de: "Farben" },
  "tags.scents": { en: "Scents", de: "Düfte" },
  "tags.shapes": { en: "Shapes", de: "Formen" },
  "tags.tastes": { en: "Tastes", de: "Geschmäcker" },

  "process.link": { en: "How it works", de: "So funktioniert's" },
  "process.step1.title": { en: "Choose", de: "Wählen" },
  "process.step1.body": { en: "Pick an emotion you want to express.", de: "Wähle eine Emotion, die du ausdrücken möchtest." },
  "process.step2.title": { en: "Compose", de: "Komponieren" },
  "process.step2.body": { en: "Arrange shapes, colors, scents, and/or tastes into a message.", de: "Ordne Formen, Farben, Düfte und/oder Geschmäcker zu einer Botschaft an." },
  "process.step3.title": { en: "Interpret", de: "Deuten" },
  "process.step3.body": { en: "Your partner reads it, without words.", de: "Dein Gegenüber liest sie, ohne Worte." },
  "process.step4.title": { en: "Switch", de: "Wechseln" },
  "process.step4.body": { en: "Swap roles and respond, turning it into a conversation.", de: "Tauscht die Rollen und antwortet – so wird daraus ein Gespräch." },
  "process.step5.title": { en: "Reflect", de: "Reflektieren" },
  "process.step5.body": { en: "Compare what was meant with what was understood.", de: "Vergleicht, was gemeint war, mit dem, was verstanden wurde." },

  "process.context.title": { en: "For Whom?", de: "Für wen?" },
  "process.context.couples.title": { en: "Couples & Dates", de: "Paare & Dates" },
  "process.context.couples.body": {
    en: "A new way to notice each other, first date or years in.",
    de: "Eine neue Art, einander wahrzunehmen – beim ersten Date oder nach Jahren.",
  },
  "process.context.friends.title": { en: "Friends & Family", de: "Freunde & Familie" },
  "process.context.friends.body": {
    en: "A night out that brings you closer together.",
    de: "Ein Abend, der euch einander näherbringt.",
  },
  "process.context.teams.title": { en: "Companies & Teams", de: "Unternehmen & Teams" },
  "process.context.teams.body": {
    en: "A team-building experience that changes how you collaborate.",
    de: "Eine Teambuilding-Erfahrung, die verändert, wie ihr zusammenarbeitet.",
  },
  "process.context.schools.title": { en: "Schools & Workshops", de: "Schulen & Workshops" },
  "process.context.schools.body": {
    en: "A hands-on way to explore empathy and expression.",
    de: "Ein praktischer Weg, Empathie und Ausdruck zu erkunden.",
  },

  "process.impact.title": { en: "Why Try It?", de: "Warum ausprobieren?" },
  "process.impact.body": {
    en: "The experience makes people feel something they rarely notice: that communication is built, not given. When the usual channels close, emotion is still there, but it can't reach anyone. That loss is real, and so is what replaces it. People stop relying on words and start inventing, and in that invention they often understand each other more honestly than they did before. You leave with the memory of reaching someone with nothing but attention, and being reached for in return.",
    de: "Die Erfahrung lässt Menschen etwas spüren, das sie selten bemerken: dass Kommunikation erschaffen wird, nicht gegeben ist. Wenn die gewohnten Kanäle sich schließen, ist die Emotion noch da – sie kann nur niemanden erreichen. Dieser Verlust ist real, und das, was ihn ersetzt, ist es auch. Menschen hören auf, sich auf Worte zu verlassen, und beginnen zu erfinden – und in diesem Erfinden verstehen sie einander oft ehrlicher als zuvor. Am Ende bleibt die Erinnerung daran, jemanden mit nichts als Aufmerksamkeit erreicht zu haben – und selbst erreicht worden zu sein.",
  },

  "event.kicker": { en: "48-hour exhibition", de: "48-Stunden-Ausstellung" },
  "event.body1": {
    en: "Without Faces has been facilitated several times in the past, including at Media University Berlin in 2024 and 2025, and most recently at 48 Stunden Neukölln 2026, one of the city's longest-running art festivals.",
    de: "Without Faces wurde bereits mehrfach durchgeführt, unter anderem an der Media University Berlin 2024 und 2025 sowie zuletzt bei 48 Stunden Neukölln 2026, einem der am längsten laufenden Kunstfestivals der Stadt.",
  },
  "event.body2": {
    en: "In each setting, people sat down across from someone else, sometimes a stranger, sometimes someone they knew well, and held a conversation without a single word. Seeing it work in a full room, again and again, is what turned the experience from an experiment into something we now bring to teams, couples, and groups anywhere.",
    de: "In jeder Umgebung setzten sich Menschen gegenüber – manchmal Fremde, manchmal einander gut Bekannte – und führten ein Gespräch ohne ein einziges Wort. Zu erleben, wie das in einem vollen Raum immer wieder funktioniert, hat aus dem Experiment das gemacht, was wir heute für Teams, Paare und Gruppen überall anbieten.",
  },
  "event.link": { en: "View gallery", de: "Galerie ansehen" },

  "gallery.heading": { en: "Gallery", de: "Galerie" },
  "gallery.body": {
    en: "A closer look at the exhibition.",
    de: "Ein genauerer Blick auf die Ausstellung.",
  },
  "gallery.item1.caption": {
    en: "Visitors during a facilitated session at the exhibition.",
    de: "Besucher:innen während einer begleiteten Session auf der Ausstellung.",
  },
  "gallery.item1.credit": { en: "© Without Faces", de: "© Without Faces" },
  "gallery.item2.caption": {
    en: "A pair reading each other's message without words.",
    de: "Ein Paar liest die Botschaft des anderen ohne Worte.",
  },
  "gallery.item2.credit": { en: "© Without Faces", de: "© Without Faces" },
  "gallery.item3.caption": {
    en: "Sensory objects used to build a message.",
    de: "Sinnliche Objekte, mit denen eine Botschaft gebaut wird.",
  },
  "gallery.item3.credit": { en: "© Without Faces", de: "© Without Faces" },
  "gallery.item4.caption": {
    en: "Visitors reflecting on the experience together.",
    de: "Besucher:innen reflektieren gemeinsam die Erfahrung.",
  },
  "gallery.item4.credit": { en: "© Without Faces", de: "© Without Faces" },
  "gallery.item5.caption": {
    en: "The exhibition space during the 48-hour run.",
    de: "Der Ausstellungsraum während der 48 Stunden.",
  },
  "gallery.item5.credit": { en: "© Without Faces", de: "© Without Faces" },

  "impressum.kicker": { en: "Legal", de: "Rechtliches" },
  "impressum.heading": { en: "Imprint", de: "Impressum" },
  "impressum.provider.title": {
    en: "Information according to § 5 TMG",
    de: "Angaben gemäß § 5 TMG",
  },
  "impressum.contact.title": { en: "Contact", de: "Kontakt" },
  "impressum.contact.email": { en: "Email:", de: "E-Mail:" },
  "impressum.contact.phone": { en: "Phone:", de: "Telefon:" },
  "impressum.vat.title": { en: "VAT ID", de: "Umsatzsteuer-ID" },
  "impressum.vat.body": {
    en: "VAT identification number according to §27a of the German VAT act: [USt-IdNr., falls vorhanden]",
    de: "Umsatzsteuer-Identifikationsnummer gemäß §27a Umsatzsteuergesetz: [USt-IdNr., falls vorhanden]",
  },
  "impressum.responsible.title": {
    en: "Responsible for content according to § 18 Abs. 2 MStV",
    de: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
  },
  "impressum.liabilityContent.title": { en: "Liability for content", de: "Haftung für Inhalte" },
  "impressum.liabilityContent.body": {
    en: "As a service provider, we are responsible for our own content on these pages in accordance with general law. However, we are not obliged to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity. Obligations to remove or block the use of information under general law remain unaffected. Liability in this regard is only possible from the point in time at which knowledge of a specific infringement of the law becomes known. If we become aware of any such infringements, we will remove the relevant content immediately.",
    de: "Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.",
  },
  "impressum.liabilityLinks.title": { en: "Liability for links", de: "Haftung für Links" },
  "impressum.liabilityLinks.body": {
    en: "Our website contains links to external third-party websites over whose content we have no influence. We therefore cannot accept any liability for this third-party content. The respective provider or operator of the pages is always responsible for the content of the linked pages. At the time of linking, no legal infringements were apparent. A permanent control of the content of linked pages is not reasonable without concrete evidence of a legal infringement. Upon becoming aware of any legal infringements, we will remove such links immediately.",
    de: "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.",
  },
  "impressum.copyright.title": { en: "Copyright", de: "Urheberrecht" },
  "impressum.copyright.body": {
    en: "The content and works created by the site operators on these pages are subject to German copyright law. Duplication, processing, distribution and any kind of use outside the limits of copyright law require the written consent of the respective author or creator.",
    de: "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.",
  },
  "impressum.dispute.title": { en: "EU dispute resolution", de: "EU-Streitschlichtung" },
  "impressum.dispute.body": {
    en: "The European Commission provides a platform for online dispute resolution (ODR):",
    de: "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:",
  },

  "research.kicker": { en: "Theory into practice", de: "Theorie wird Praxis" },
  "research.body1": {
    en: "Without Faces grew out of our master's thesis in speculative design. Working in the field, we noticed it rarely addressed emotion, so we built a speculative future to explore it: a world where people share identical faces and voices, and, driven by productivity and disconnected from one another, have lost the ability to express or detect feelings.",
    de: "Without Faces entstand aus unserer Masterarbeit im Bereich Speculative Design. Bei der Arbeit in diesem Feld fiel uns auf, dass Emotionen darin selten eine Rolle spielen – also entwarfen wir eine spekulative Zukunft, um genau das zu untersuchen: eine Welt, in der Menschen identische Gesichter und Stimmen teilen und, getrieben von Produktivität und voneinander entfremdet, die Fähigkeit verloren haben, Gefühle auszudrücken oder zu erkennen.",
  },
  "research.body2": {
    en: "Where traditional speculative design leans toward tech-driven dystopia, our 247-page thesis proposes an alternative we call Human-Centered Speculative Design, an approach rooted in emotion, connection, and empathy. The project received an ADC Silver Award in the Communication Arts category.",
    de: "Während klassisches Speculative Design meist zu technikgetriebenen Dystopien tendiert, schlägt unsere 247-seitige Masterarbeit eine Alternative vor, die wir Human-Centered Speculative Design nennen – einen Ansatz, der in Emotion, Verbindung und Empathie verwurzelt ist. Das Projekt erhielt die ADC Silver Award in der Kategorie Communication Arts.",
  },
  "research.thesis.title": { en: "Thesis", de: "Masterarbeit" },
  "research.thesis.link": { en: "Read", de: "Lesen" },
  "research.book.title": { en: "ADC Talent Award", de: "ADC Talent Award" },
  "research.book.link": { en: "View", de: "Ansehen" },

  "about.kicker": { en: "The team", de: "Das Team" },
  "about.body": {
    en: "We are Vera and Anan, communication designers exploring the future of human connection through design, research and experimentation.",
    de: "Wir sind Vera und Anan, Kommunikationsdesignerinnen, die die Zukunft menschlicher Verbindung durch Design, Forschung und Experimente erkunden.",
  },
  "about.link": { en: "Face reveal", de: "Gesichter enthüllen" },

  "nav.teams": { en: "Booking", de: "Buchung" },

  "teams.kicker": { en: "For teams", de: "Für Teams" },
  "teams.heading": { en: "Booking", de: "Buchung" },
  "teams.body": {
    en: "Whether it is your team, your friends, or someone you love, Without Faces gives you the chance to truly understand one another. Tell us a little about your group, and we will shape a session around it.",
    de: "Ob es dein Team, deine Freunde oder jemand ist, den du liebst: Without Faces gibt euch die Chance, einander wirklich zu verstehen. Erzähle uns ein wenig über eure Gruppe, und wir gestalten eine Session passend dazu.",
  },
  "teams.benefit1": { en: "Sharper listening", de: "Schärferes Zuhören" },
  "teams.benefit2": { en: "Renewed trust", de: "Erneuertes Vertrauen" },
  "teams.benefit3": { en: "A shared reference", de: "Ein gemeinsamer Bezugspunkt" },

  "teams.format.label": { en: "Format", de: "Format" },
  "teams.format.value": { en: "In-person, facilitated", de: "Vor Ort, begleitet" },
  "teams.groupsize.label": { en: "Group size", de: "Gruppengröße" },
  "teams.groupsize.value": {
    en: "2–30 people (min–max), two conversations run side by side at a time",
    de: "2–30 Personen (min–max), zwei Gespräche laufen gleichzeitig nebeneinander",
  },
  "teams.duration.label": { en: "Session length", de: "Sessiondauer" },
  "teams.duration.value": {
    en: "15–20 minutes per conversation",
    de: "15–20 Minuten pro Gespräch",
  },
  "teams.location.label": { en: "Location", de: "Ort" },
  "teams.location.value": { en: "Your preferred space", de: "Ein Ort deiner Wahl" },
  "teams.languages.label": { en: "Languages", de: "Sprachen" },
  "teams.languages.value": { en: "English / German", de: "Englisch / Deutsch" },
  "teams.price.label": { en: "Price", de: "Preis" },
  "teams.price.value": { en: "On request", de: "Auf Anfrage" },
  "teams.cta": { en: "Request a session", de: "Session anfragen" },

  "book.kicker": { en: "Request a session", de: "Session anfragen" },
  "book.heading": { en: "Tell us more", de: "Erzähl uns mehr" },
  "book.body": {
    en: "Fill in a few details and we'll get back to you.",
    de: "Trag ein paar Details ein, wir melden uns.",
  },
  "book.field.name": { en: "Name", de: "Name" },
  "book.field.email": { en: "Email", de: "E-Mail" },
  "book.field.groupSize": { en: "Group size", de: "Gruppengröße" },
  "book.field.groupSizePlaceholder": { en: "e.g. 12", de: "z. B. 12" },
  "book.field.groupType": { en: "Group type", de: "Art der Gruppe" },
  "book.field.groupType.placeholder": { en: "Select an option", de: "Bitte auswählen" },
  "book.field.groupType.company": { en: "Company or organization", de: "Unternehmen oder Organisation" },
  "book.field.groupType.school": { en: "School or university", de: "Schule oder Universität" },
  "book.field.groupType.friends": { en: "Friends or family", de: "Freunde oder Familie" },
  "book.field.groupType.couple": { en: "Couple", de: "Paar" },
  "book.field.groupType.other": { en: "Other", de: "Sonstiges" },
  "book.field.language": { en: "Preferred language", de: "Bevorzugte Sprache" },
  "book.field.language.en": { en: "English", de: "Englisch" },
  "book.field.language.de": { en: "German", de: "Deutsch" },
  "book.field.message": { en: "Message", de: "Nachricht" },
  "book.field.messagePlaceholder": {
    en: "Preferred date, time, location, and anything else we should know.",
    de: "Wunschtermin, Uhrzeit, Ort und alles Weitere, das wir wissen sollten.",
  },
  "book.submit": { en: "Send request", de: "Anfrage senden" },
  "book.note": {
    en: "Opens your email client with the details filled in.",
    de: "Öffnet dein E-Mail-Programm mit den ausgefüllten Angaben.",
  },

  "cta.getInTouch": { en: "Get in touch", de: "Kontakt aufnehmen" },
  "contact.body": { en: "Interested in booking a session or collaborating?", de: "Interesse an einer Session oder Zusammenarbeit?" },
  "contact.location": { en: "Berlin, Germany", de: "Berlin, Deutschland" },
  "contact.button": { en: "Contact us", de: "Kontaktiere uns" },

  "team.heading": { en: "The Team", de: "Das Team" },
  "team.body": {
    en: "Anan Mahmoud & Vera Schmid form a Berlin-based design duo whose work focuses on conceptual and experience design. Their partnership began during their master’s thesis at the Media University of Applied Sciences in Berlin – the first ever collaborative thesis at their university, which was awarded Best Master Thesis. Born in Egypt and Austria respectively, they found that their contrasting backgrounds and skills created a creative dialogue neither could have alone. Anan comes from a graphic design background, Vera from motion design, but together they build experiences that move between these disciplines; combining conceptual art, graphic design, film, and interactivity into their work. What began as a collaboration has deepened into a methodology: using design to provoke, to question, and to make people feel something they weren’t expecting. Their friendship has shaped their work as much as their work has shaped their friendship – each project is both creation and connection.",
    de: "Anan Mahmoud & Vera Schmid sind ein in Berlin ansässiges Designduo, dessen Arbeit sich auf konzeptionelles und Experience Design konzentriert. Ihre Zusammenarbeit begann während ihrer Masterarbeit an der Mediadesign Hochschule in Berlin – der ersten gemeinsam verfassten Abschlussarbeit ihrer Hochschule, die mit dem Preis für die beste Masterarbeit ausgezeichnet wurde. Geboren in Ägypten beziehungsweise Österreich, entdeckten sie, dass ihre unterschiedlichen Hintergründe und Fähigkeiten einen kreativen Dialog ermöglichten, den keine von beiden allein hätte führen können. Anan kommt aus dem Grafikdesign, Vera aus dem Motion Design, doch gemeinsam schaffen sie Erfahrungen, die sich zwischen diesen Disziplinen bewegen und konzeptionelle Kunst, Grafikdesign, Film und Interaktivität miteinander verbinden. Was als Zusammenarbeit begann, hat sich zu einer Methodik vertieft: Design einzusetzen, um zu provozieren, zu hinterfragen und Menschen etwas fühlen zu lassen, das sie nicht erwartet hätten. Ihre Freundschaft hat ihre Arbeit ebenso geprägt wie ihre Arbeit ihre Freundschaft geformt hat – jedes Projekt ist zugleich Schöpfung und Verbindung.",
  },
};

const metaTranslations = {
  home: {
    title: { en: "without faces", de: "without faces" },
    description: {
      en: "Without Faces — a multi-sensory interactive experience exploring non-verbal communication.",
      de: "Without Faces — eine multisensorische, interaktive Erfahrung rund um nonverbale Kommunikation.",
    },
  },
  team: {
    title: { en: "the team — without faces", de: "das team — without faces" },
    description: {
      en: "Anan Mahmoud & Vera Schmid — a Berlin-based design duo working across conceptual and experience design.",
      de: "Anan Mahmoud & Vera Schmid — ein in Berlin ansässiges Designduo für konzeptionelles und Experience Design.",
    },
  },
  book: {
    title: { en: "request a session — without faces", de: "session anfragen — without faces" },
    description: {
      en: "Request a Without Faces session for your team.",
      de: "Fordere eine Without-Faces-Session für dein Team an.",
    },
  },
  gallery: {
    title: { en: "gallery — without faces", de: "galerie — without faces" },
    description: {
      en: "Photos from the Without Faces 48-hour exhibition.",
      de: "Fotos von der 48-Stunden-Ausstellung von Without Faces.",
    },
  },
  impressum: {
    title: { en: "imprint — without faces", de: "impressum — without faces" },
    description: {
      en: "Legal notice for the Without Faces website.",
      de: "Impressum für die Without-Faces-Website.",
    },
  },
};

const LANG_STORAGE_KEY = "wf-lang";
const langButtons = document.querySelectorAll(".lang-toggle button");

function applyLanguage(lang) {
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const entry = translations[el.dataset.i18n];
    if (!entry || !entry[lang]) return;

    if (Array.isArray(entry[lang])) {
      el.innerHTML = entry[lang].join("<br>\n");
    } else {
      el.textContent = entry[lang];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const entry = translations[el.dataset.i18nPlaceholder];
    if (entry && entry[lang]) {
      el.setAttribute("placeholder", entry[lang]);
    }
  });

  const page = document.body.dataset.page;
  const meta = metaTranslations[page];
  if (meta) {
    document.title = meta.title[lang];
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute("content", meta.description[lang]);
    }
  }

  langButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
  });

  localStorage.setItem(LANG_STORAGE_KEY, lang);
}

langButtons.forEach((button) => {
  button.addEventListener("click", () => applyLanguage(button.dataset.lang));
});

const storedLang = localStorage.getItem(LANG_STORAGE_KEY);
const preferredLang = storedLang || (navigator.language.startsWith("de") ? "de" : "en");
applyLanguage(preferredLang);

/* ---------------------------------------------------------
   Request-a-session form
   --------------------------------------------------------- */

const requestForm = document.querySelector("#request-form");

if (requestForm) {
  requestForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(requestForm);
    const name = data.get("name") || "";
    const email = data.get("email") || "";
    const groupSize = data.get("groupSize") || "";
    const groupType = data.get("groupType") || "";
    const preferredLanguage = data.get("preferredLanguage") || "";
    const message = data.get("message") || "";

    const subject = `Session request — ${name}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Group size: ${groupSize}`,
      `Group type: ${groupType}`,
      `Preferred language: ${preferredLanguage}`,
      "",
      message,
    ].join("\n");

    const mailto = `mailto:hello@veraschmid.eu?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  });
}
