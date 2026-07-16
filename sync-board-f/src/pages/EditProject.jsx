import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Toast";
import { editProject, getFeedProjects } from "../api";
import {
  ArrowLeft, Loader2, X, Save,
  Heading1, FileText, Layers, StickyNote,
  Lightbulb, Sparkles, Users, ToggleLeft, ToggleRight,
} from "lucide-react";

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

function SectionCard({ icon: Icon, title, children }) {
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

export default function EditProject() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();

  const initialProject = location.state?.project || null;

  const [form, setForm] = useState({
    title: initialProject?.title || "",
    description: initialProject?.description || "",
    note: initialProject?.note || "",
  });
  const [techTags, setTechTags] = useState(initialProject?.techStack || []);
  const [status, setStatus] = useState(initialProject?.status || "planning");
  const [isOpenForCollaboration, setIsOpenForCollaboration] = useState(initialProject?.isOpenForCollaboration !== false);
  const [lookingFor, setLookingFor] = useState(initialProject?.lookingFor || []);
  const [lookingForInput, setLookingForInput] = useState("");
  const [loading, setLoading] = useState(!initialProject);
  const [saving, setSaving] = useState(false);

  const AVAILABLE_ROLES = [
    "Frontend Developer",
    "Backend Developer",
    "UI/UX Designer",
    "DevOps Engineer",
    "Mobile Developer",
    "Designer",
  ];

  const noteRef = useRef(null);

  useAutoResize(noteRef);

  useEffect(() => {
    if (!projectId || !token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await getFeedProjects({ page: 1, limit: 50 });
        const found = data.projects?.find((p) => p._id === projectId);
        if (!cancelled && found) {
          const isOwner = found.userId?._id === user?._id || found.userId === user?._id;
          if (!isOwner) {
            toast("Only the project owner can edit", "error");
            navigate("/dashboard/my-feed");
            return;
          }
          setForm({
            title: found.title || "",
            description: found.description || "",
            note: found.note || "",
          });
          setTechTags(found.techStack || []);
          setStatus(found.status || "planning");
          setIsOpenForCollaboration(found.isOpenForCollaboration !== false);
          setLookingFor(found.lookingFor || []);
        } else if (!cancelled) {
          toast("Project not found", "error");
          navigate("/dashboard/my-feed");
        }
      } catch (err) {
        if (!cancelled) {
          toast(err.message, "error");
          navigate("/dashboard/my-feed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [projectId, token, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    try {
      await editProject(token, projectId, {
        techStack: techTags,
        note: form.note.trim(),
        status,
        isOpenForCollaboration,
        lookingFor,
      });
      toast("Project updated successfully!");
      navigate("/dashboard/my-feed");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full glass-input transition-all duration-200";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={36} className="feed-spinner" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-10 pb-24 sm:pb-24 lg:pb-10">
        <button
          onClick={() => navigate("/dashboard/my-feed")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to My Feed
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-10">
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Edit Project</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Update your project details and settings
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pb-36 lg:pb-0">
              <SectionCard icon={Heading1} title="Project Title">
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  readOnly
                  className="w-full glass-input transition-all duration-200 opacity-70 cursor-not-allowed"
                />
              </SectionCard>

              <SectionCard icon={FileText} title="Description">
                <textarea
                  name="description"
                  value={form.description}
                  readOnly
                  rows={5}
                  className="w-full glass-input transition-all duration-200 min-h-[120px] opacity-70 cursor-not-allowed"
                />
              </SectionCard>

              <SectionCard icon={Layers} title="Tech Stack">
                <TechStackInput tags={techTags} onChange={setTechTags} />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-gray-600 shrink-0" />
                  Press comma or Enter after each technology
                </p>
              </SectionCard>

              <SectionCard icon={StickyNote} title="Notes">
                <textarea
                  ref={noteRef}
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Any additional notes for collaborators..."
                  rows={3}
                  className={inputClass + " min-h-[80px]"}
                />
              </SectionCard>

              <SectionCard icon={Users} title="Project Status">
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "planning", label: "Planning", desc: "Idea stage" },
                    { value: "active", label: "Active", desc: "In development" },
                    { value: "completed", label: "Completed", desc: "Finished" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={`flex-1 min-w-[100px] p-3 rounded-xl border text-left transition-all duration-200 ${
                        status === opt.value
                          ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                          : "bg-white/[0.04] border-white/[0.06] text-gray-400 hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="text-[11px] opacity-70 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard icon={isOpenForCollaboration ? ToggleRight : ToggleLeft} title="Collaboration">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setIsOpenForCollaboration(!isOpenForCollaboration)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isOpenForCollaboration ? "bg-indigo-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        isOpenForCollaboration ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-300">
                    {isOpenForCollaboration ? "Accepting new members" : "Not accepting members"}
                  </span>
                </div>

                <label className="text-xs text-gray-500 mb-2 block">Looking For (roles needed)</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {AVAILABLE_ROLES.map((role) => {
                    const selected = lookingFor.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setLookingFor((prev) =>
                            selected ? prev.filter((r) => r !== role) : [...prev, role],
                          );
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                          selected
                            ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                            : "bg-white/[0.04] border-white/[0.06] text-gray-400 hover:border-white/[0.12]"
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={lookingForInput}
                    onChange={(e) => setLookingForInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = lookingForInput.trim();
                        if (trimmed && !lookingFor.includes(trimmed)) {
                          setLookingFor((prev) => [...prev, trimmed]);
                        }
                        setLookingForInput("");
                      }
                    }}
                    placeholder="Add custom role..."
                    className="flex-1 glass-input text-sm"
                  />
                </div>
                {lookingFor.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {lookingFor.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                      >
                        {role}
                        <button
                          type="button"
                          onClick={() => setLookingFor((prev) => prev.filter((r) => r !== role))}
                          className="hover:text-white transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </SectionCard>

              <div className="hidden lg:block pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="gradient-btn w-full"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Saving Changes...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Save size={18} />
                      Save Changes
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-5 lg:pt-16">
            <div className="glass-card">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Lightbulb size={16} />
                </div>
                <span className="text-sm font-semibold text-white">Editing Tips</span>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                    <Heading1 size={13} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90">Update tech stack</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Add or remove technologies to reflect your current stack.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                    <Users size={13} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90">Change project status</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Keep your status up to date so collaborators know where you are.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                    <ToggleRight size={13} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90">Manage collaboration</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Toggle collaboration on/off and specify roles you're looking for.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-50">
        <div className="sticky-cta">
          <button
            type="submit"
            disabled={saving}
            onClick={handleSubmit}
            className="gradient-btn w-full"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Saving Changes...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Save size={18} />
                Save Changes
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
