import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Toast";
import { createProject } from "../api";
import {
  ArrowLeft, Loader2, Plus, X,
  Heading1, FileText, Layers, StickyNote, Tag,
  Lightbulb, Rocket, TrendingUp, ChevronRight,
  Sparkles,
} from "lucide-react";

const TRENDING_TAGS = ["React", "Python", "Node.js", "TypeScript", "Go", "Rust", "Next.js", "Tailwind", "MongoDB"];

const PROJECT_TIPS = [
  { icon: Lightbulb, title: "Be specific in descriptions", desc: "Instead of 'A social media app', try 'A real-time collaborative project management platform'." },
  { icon: Tag, title: "Use relevant tech tags", desc: "Tag the technologies you're using so developers with the right skills can find you." },
  { icon: Rocket, title: "Add collaboration notes", desc: "Tell potential collaborators what you need — frontend help? backend? design?" },
  { icon: Heading1, title: "Keep title under 60 chars", desc: "Short, descriptive titles get more visibility and are easier to browse." },
];

const HOW_IT_WORKS = [
  { step: 1, text: "Post your project idea" },
  { step: 2, text: "Developers discover it in the feed" },
  { step: 3, text: "They comment or send join requests" },
  { step: 4, text: "Accept teammates and build together" },
];

function useAutoResize(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const resize = () => {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    };
    el.addEventListener("input", resize);
    return () => el.removeEventListener("input", resize);
  }, [ref]);
}

function TechStackInput({ tags, onChange }) {
  const [input, setInput] = useState("");

  const commitTag = useCallback((val) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
  }, [tags, onChange]);

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTag(input);
      setInput("");
    }
  };

  const handleBlur = () => {
    if (input) {
      commitTag(input);
      setInput("");
    }
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  return (
    <div className="w-full glass-input transition-all duration-200">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={handleBlur}
        placeholder={tags.length === 0 ? "React, Node.js, MongoDB..." : "Add more..."}
        className="w-full bg-transparent outline-none text-sm text-white placeholder-gray-500"
      />
    </div>
  );
}

function CharCounter({ current, max }) {
  const ratio = current / max;
  const color =
    ratio > 0.9 ? "text-red-400" :
    ratio > 0.75 ? "text-yellow-400" :
    "text-gray-500";
  return (
    <span className={`text-xs ${color} transition-colors font-medium`}>
      {current}/{max}
    </span>
  );
}

function SectionCard({ icon: Icon, title, children, error }) {
  return (
    <div className="glass-card">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function CreateProject({ onNavigate }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ title: "", description: "", note: "" });
  const [techTags, setTechTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const descRef = useRef(null);
  const noteRef = useRef(null);

  useAutoResize(descRef);
  useAutoResize(noteRef);

  const DESC_MAX = 500;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "description" && value.length > DESC_MAX) return;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = useCallback(() => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.description.trim()) errs.description = "Description is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (!form[name]?.trim()) {
      setErrors((prev) => ({
        ...prev,
        [name]: name === "title" ? "Title is required" : "Description is required",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ title: true, description: true });
    if (!validate()) return;

    setLoading(true);
    try {
      await createProject(token, {
        title: form.title.trim(),
        description: form.description.trim(),
        techStack: techTags,
        note: form.note.trim(),
      });
      toast("Project created successfully!");
      onNavigate("feed");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (name) =>
    `w-full glass-input transition-all duration-200 ${
      errors[name] && touched[name]
        ? "border-red-500/60"
        : ""
    }`;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-10 pb-24 sm:pb-24 lg:pb-10">
        {/* Back button */}
        <button
          onClick={() => onNavigate("feed")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Feed
        </button>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-10">
          {/* ─── LEFT COLUMN: Form ─── */}
          <div>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Create Project</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Share your project idea and find collaborators
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pb-36 lg:pb-0">
              {/* Project Title */}
              <SectionCard icon={Heading1} title="Project Title" error={touched.title && errors.title}>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your project title"
                  className={inputClass("title")}
                />
                {errors.title && touched.title && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    {errors.title}
                  </p>
                )}
              </SectionCard>

              {/* Description */}
              <SectionCard icon={FileText} title="Description">
                <textarea
                  ref={descRef}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Describe your project idea in detail — what problem does it solve? What features does it have? What's the tech stack?"
                  rows={5}
                  className={inputClass("description") + " min-h-[120px]"}
                />
                <div className="flex items-center justify-between mt-2">
                  {errors.description && touched.description ? (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                      {errors.description}
                    </p>
                  ) : <span />}
                  <CharCounter current={form.description.length} max={DESC_MAX} />
                </div>
              </SectionCard>

              {/* Tech Stack */}
              <SectionCard icon={Layers} title="Tech Stack">
                <TechStackInput tags={techTags} onChange={setTechTags} />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-gray-600 shrink-0" />
                  Press comma or Enter after each technology
                </p>
              </SectionCard>

              {/* Notes */}
              <SectionCard icon={StickyNote} title="Notes">
                <textarea
                  ref={noteRef}
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Any additional notes for collaborators — what skills do you need? What's your timeline?"
                  rows={3}
                  className={inputClass("note") + " min-h-[80px]"}
                />
              </SectionCard>

              {/* Desktop CTA */}
              <div className="hidden lg:block pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="gradient-btn w-full"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Creating Project...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Plus size={18} />
                      Create Project
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ─── RIGHT COLUMN: Tips & Info ─── */}
          <div className="space-y-5 lg:pt-16">
            {/* Project Tips */}
            <div className="glass-card">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Lightbulb size={16} />
                </div>
                <span className="text-sm font-semibold text-white">Project Tips</span>
              </div>
              <div className="space-y-4">
                {PROJECT_TIPS.map((tip, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                      <tip.icon size={13} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/90">{tip.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How Collaboration Works */}
            <div className="glass-card">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Rocket size={16} />
                </div>
                <span className="text-sm font-semibold text-white">How Collaboration Works</span>
              </div>
              <div className="space-y-3">
                {HOW_IT_WORKS.map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-indigo-400">{item.step}</span>
                    </div>
                    <p className="text-sm text-gray-400">{item.text}</p>
                    {item.step < 4 && <ChevronRight size={14} className="text-gray-600 ml-auto shrink-0" />}
                  </div>
                ))}
              </div>
              <div className="mt-5 p-3 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/10">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Your project is <span className="text-indigo-400 font-medium">public by default</span> — maximum visibility means more potential collaborators.
                </p>
              </div>
            </div>

            {/* Trending Technologies */}
            <div className="glass-card">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <TrendingUp size={16} />
                </div>
                <span className="text-sm font-semibold text-white">Trending Technologies</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!techTags.includes(tag)) {
                        setTechTags((prev) => [...prev, tag]);
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-indigo-300 hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all duration-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">Click a tag to add it to your tech stack</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MOBILE STICKY CTA ─── */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-50">
        <div className="sticky-cta">
          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="gradient-btn w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Creating Project...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Plus size={18} />
                Create Project
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
