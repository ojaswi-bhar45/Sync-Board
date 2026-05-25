import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Toast";
import { createProject } from "../api";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";

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
    <div className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-2.5 text-sm transition-all focus-within:border-indigo-500/50">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
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
    <span className={`text-xs ${color} transition-colors`}>
      {current}/{max}
    </span>
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
    `w-full bg-white/[0.05] border rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-all resize-none ${
      errors[name] && touched[name]
        ? "border-red-500/60"
        : "border-white/10 focus:border-indigo-500/50"
    }`;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <button
          onClick={() => onNavigate("feed")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Back to Feed
        </button>

        <h1 className="text-2xl font-semibold text-white mb-1">Create Project</h1>
        <p className="text-sm text-gray-500 mb-8">
          Share your project idea with the community
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Project Title <span className="text-red-400">*</span>
            </label>
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
              <p className="text-xs text-red-400 mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              ref={descRef}
              name="description"
              value={form.description}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Describe your project idea in detail..."
              rows={4}
              className={inputClass("description") + " min-h-[100px]"}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.description && touched.description ? (
                <p className="text-xs text-red-400">{errors.description}</p>
              ) : <span />}
              <CharCounter current={form.description.length} max={DESC_MAX} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Tech Stack
            </label>
            <TechStackInput tags={techTags} onChange={setTechTags} />
            <p className="text-xs text-gray-500 mt-1">
              Press comma or Enter after each technology
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Note <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              ref={noteRef}
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder="Any additional notes for collaborators..."
              rows={2}
              className={inputClass("note") + " min-h-[60px]"}
            />
          </div>

          <div className="!mt-10">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:brightness-110 disabled:brightness-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
