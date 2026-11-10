
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import AdminSidebar from "../../components/admin/AdminSidebar";

import {
  adminService,
  type AdminResource,
  type ResourceFormData,
  type ResourceLevel,
  type ResourceStatus,
} from "../../services/adminService";

import {
  RefreshCw,
  Download,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  BookOpen,
  CheckCircle2,
  FileEdit,
  IndianRupee,
  AlertCircle,
  Layers,
  GraduationCap,
} from "lucide-react";

const emptyForm: ResourceFormData = {
  title: "",
  category: "Artificial Intelligence",
  description: "",
  instructor: "",
  price: 0,
  level: "Beginner",
  status: "Draft",
};

const categories = [
  "Artificial Intelligence",
  "Web Development",
  "Data Science",
  "Cloud Computing",
  "Cybersecurity",
  "Other",
];

const statusStyles: Record<ResourceStatus, string> = {
  Published: "bg-emerald-500/10 text-emerald-600",
  Draft: "bg-amber-500/10 text-amber-600",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function exportCSV(resources: AdminResource[]) {
  const headers = [
    "Resource ID",
    "Title",
    "Category",
    "Description",
    "Instructor",
    "Price INR",
    "Level",
    "Status",
    "Created At",
  ];

  const rows = resources.map((resource) => [
    resource.id,
    resource.title,
    resource.category,
    resource.description,
    resource.instructor,
    String(resource.price),
    resource.level,
    resource.status,
    resource.createdAt || "",
  ]);

  const escapeCSV = (value: string) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "skillora-resources.csv";
  anchor.click();

  URL.revokeObjectURL(url);
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [statusFilter, setStatusFilter] = useState<
    "All" | ResourceStatus
  >("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResourceId, setEditingResourceId] =
    useState<string | null>(null);

  const [form, setForm] = useState<ResourceFormData>(emptyForm);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState<AdminResource | null>(null);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Theme-aware styling helpers
  const inputClass =
    "w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none transition placeholder:text-[var(--admin-muted)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10";

  const labelClass =
    "mb-2 block text-sm font-medium text-[var(--admin-text)]";

  const secondaryButton =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-3 text-sm font-semibold text-[var(--admin-text)] transition hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-50";

  // -----------------------------------------
  // FETCH RESOURCES FROM MONGODB
  // -----------------------------------------

  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await adminService.getResources();

      setResources(response.resources || []);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Unable to load resources."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // -----------------------------------------
  // STATISTICS
  // -----------------------------------------

  const statistics = useMemo(() => {
    const published = resources.filter(
      (resource) => resource.status === "Published"
    ).length;

    const drafts = resources.filter(
      (resource) => resource.status === "Draft"
    ).length;

    const totalValue = resources.reduce(
      (sum, resource) => sum + resource.price,
      0
    );

    return {
      total: resources.length,
      published,
      drafts,
      totalValue,
    };
  }, [resources]);

  // -----------------------------------------
  // SEARCH AND FILTERS
  // -----------------------------------------

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesSearch =
        !query ||
        resource.title.toLowerCase().includes(query) ||
        resource.category.toLowerCase().includes(query) ||
        resource.instructor.toLowerCase().includes(query) ||
        resource.id.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "All" ||
        resource.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" ||
        resource.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [resources, search, categoryFilter, statusFilter]);

  const availableCategories = useMemo(
    () =>
      Array.from(
        new Set([
          ...categories,
          ...resources.map((resource) => resource.category),
        ])
      ),
    [resources]
  );

  // -----------------------------------------
  // CREATE RESOURCE MODAL
  // -----------------------------------------

  function openCreateModal() {
    setEditingResourceId(null);
    setForm(emptyForm);
    setFormError("");
    setIsModalOpen(true);
  }

  // -----------------------------------------
  // EDIT RESOURCE MODAL
  // -----------------------------------------

  function openEditModal(resource: AdminResource) {
    setEditingResourceId(resource.id);

    setForm({
      title: resource.title,
      category: resource.category,
      description: resource.description,
      instructor: resource.instructor,
      price: resource.price,
      level: resource.level,
      status: resource.status,
    });

    setFormError("");
    setIsModalOpen(true);
  }

  // -----------------------------------------
  // CREATE / UPDATE RESOURCE
  // -----------------------------------------

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim() || !form.description.trim()) {
      setFormError("Please provide a title and description.");
      return;
    }

    if (!form.instructor.trim()) {
      setFormError("Please provide an instructor or publisher name.");
      return;
    }

    if (!Number.isFinite(form.price) || form.price < 0) {
      setFormError("Price must be a valid, non-negative number.");
      return;
    }

    const payload: ResourceFormData = {
      ...form,
      title: form.title.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      instructor: form.instructor.trim(),
      price: Number(form.price),
    };

    try {
      setFormLoading(true);

      if (editingResourceId) {
        await adminService.updateResource(editingResourceId, payload);
      } else {
        await adminService.createResource(payload);
      }

      setIsModalOpen(false);
      setForm(emptyForm);
      setEditingResourceId(null);

      await loadResources();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to save the resource."
      );
    } finally {
      setFormLoading(false);
    }
  }

  // -----------------------------------------
  // DELETE RESOURCE
  // -----------------------------------------

  async function deleteResource() {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");

      await adminService.deleteResource(deleteTarget.id);

      setDeleteTarget(null);
      await loadResources();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Unable to delete the resource."
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="admin-page min-h-screen bg-[var(--admin-page-bg)] text-[var(--admin-text)] transition-colors duration-300">
      <AdminSidebar />

      <main className="min-h-screen transition-all duration-300 lg:ml-[260px]">
        <div className="mx-auto max-w-[1600px] px-5 pb-12 pt-20 sm:px-8 lg:px-10 lg:pt-10">

          {/* HEADER */}
          <header className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Content administration
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[var(--admin-text)] sm:text-4xl">
                Learning Resources
              </h1>

              <p className="mt-2 text-sm text-[var(--admin-muted)]">
                Create, organize, and manage your learning marketplace content.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadResources}
                disabled={loading}
                className={secondaryButton}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => exportCSV(filteredResources)}
                disabled={loading || filteredResources.length === 0}
                className={secondaryButton}
              >
                <Download size={16} />
                Export CSV
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-600"
              >
                <Plus size={17} />
                Add Resource
              </button>
            </div>
          </header>

          {/* LIVE DATABASE NOTICE */}
          <div className="mb-7 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4">
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0 text-emerald-500"
            />

            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Live database connection
              </p>

              <p className="mt-1 text-xs text-[var(--admin-muted)]">
                Resources are loaded directly from your MongoDB database.
              </p>
            </div>
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="mb-7 flex items-center justify-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] py-12 text-sm text-[var(--admin-muted)]">
              <RefreshCw
                size={20}
                className="animate-spin text-emerald-500"
              />
              Loading resources from MongoDB...
            </div>
          )}

          {/* ERROR STATE */}
          {!loading && pageError && (
            <div className="mb-7 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
              <div className="flex items-center gap-2">
                <AlertCircle size={19} className="text-red-500" />
                <h3 className="font-semibold text-red-500">
                  Unable to load resources
                </h3>
              </div>

              <p className="mt-2 text-sm text-[var(--admin-muted)]">
                {pageError}
              </p>

              <button
                type="button"
                onClick={loadResources}
                className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !pageError && (
            <>
              {/* STATISTICS */}
              <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    title: "Total Resources",
                    value: statistics.total.toString(),
                    subtitle: "Resources in MongoDB",
                    icon: Layers,
                    color: "violet",
                  },
                  {
                    title: "Published",
                    value: statistics.published.toString(),
                    subtitle: "Published resources",
                    icon: CheckCircle2,
                    color: "emerald",
                  },
                  {
                    title: "Drafts",
                    value: statistics.drafts.toString(),
                    subtitle: "Unpublished resources",
                    icon: FileEdit,
                    color: "amber",
                  },
                  {
                    title: "Listed Price Total",
                    value: formatCurrency(statistics.totalValue),
                    subtitle: "Sum of resource prices",
                    icon: IndianRupee,
                    color: "blue",
                  },
                ].map((stat) => {
                  const Icon = stat.icon;

                  const iconColors: Record<string, string> = {
                    violet: "bg-violet-500/10 text-violet-500",
                    emerald: "bg-emerald-500/10 text-emerald-500",
                    amber: "bg-amber-500/10 text-amber-500",
                    blue: "bg-blue-500/10 text-blue-500",
                  };

                  return (
                    <article
                      key={stat.title}
                      className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-black/5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[var(--admin-muted)]">
                          {stat.title}
                        </p>

                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconColors[stat.color]}`}
                        >
                          <Icon size={21} />
                        </span>
                      </div>

                      <h2 className="mt-5 text-2xl font-bold tracking-tight text-[var(--admin-text)]">
                        {stat.value}
                      </h2>

                      <p className="mt-2 text-xs text-[var(--admin-muted)]">
                        {stat.subtitle}
                      </p>
                    </article>
                  );
                })}
              </section>

              {/* SEARCH AND FILTERS */}
              <section className="mt-8 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <div className="relative min-w-0 flex-1">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]"
                    />

                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by title, category, instructor, or ID..."
                      className={`${inputClass} pl-11`}
                      aria-label="Search resources"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                      value={categoryFilter}
                      onChange={(event) =>
                        setCategoryFilter(event.target.value)
                      }
                      className={`${inputClass} sm:min-w-[190px]`}
                      aria-label="Filter by category"
                    >
                      <option value="All">All categories</option>

                      {availableCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(
                          event.target.value as "All" | ResourceStatus
                        )
                      }
                      className={`${inputClass} sm:min-w-[150px]`}
                      aria-label="Filter by status"
                    >
                      <option value="All">All statuses</option>
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* RESOURCE TABLE */}
              <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
                <div className="border-b border-[var(--admin-border)] px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
                      <BookOpen size={20} />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                        Resource Library
                      </h2>

                      <p className="mt-1 text-sm text-[var(--admin-muted)]">
                        {filteredResources.length} resource
                        {filteredResources.length === 1 ? "" : "s"} found
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-left text-sm">
                    <thead className="bg-[var(--admin-table-head)]">
                      <tr>
                        {[
                          "Resource",
                          "Category",
                          "Level",
                          "Price",
                          "Created",
                          "Status",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]"
                          >
                            {heading}
                          </th>
                        ))}

                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--admin-border)]">
                      {filteredResources.map((resource) => (
                        <tr
                          key={resource.id}
                          className="transition hover:bg-[var(--admin-hover)]"
                        >
                          <td className="max-w-sm px-6 py-5">
                            <p className="font-semibold text-[var(--admin-text)]">
                              {resource.title}
                            </p>

                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--admin-muted)]">
                              {resource.description}
                            </p>

                            <p className="mt-2 text-xs text-[var(--admin-muted)]">
                              ID: {resource.id} · {resource.instructor}
                            </p>
                          </td>

                          <td className="px-6 py-5 text-[var(--admin-text)]">
                            {resource.category}
                          </td>

                          <td className="px-6 py-5">
                            <span className="inline-flex items-center gap-1.5 text-[var(--admin-muted)]">
                              <GraduationCap size={15} />
                              {resource.level}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 font-semibold text-[var(--admin-text)]">
                            {formatCurrency(resource.price)}
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 text-[var(--admin-muted)]">
                            {formatDate(resource.createdAt)}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[resource.status]}`}
                            >
                              {resource.status}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(resource)}
                                aria-label={`Edit ${resource.title}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--admin-border)] px-3 py-2 text-xs font-medium text-[var(--admin-text)] transition hover:border-emerald-500 hover:bg-emerald-500/5 hover:text-emerald-600"
                              >
                                <Pencil size={14} />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteTarget(resource);
                                  setDeleteError("");
                                }}
                                aria-label={`Delete ${resource.title}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-500 transition hover:border-red-500 hover:bg-red-500/5"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredResources.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-16 text-center"
                          >
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--admin-hover)] text-[var(--admin-muted)]">
                              <Search size={25} />
                            </div>

                            <p className="text-lg font-semibold text-[var(--admin-text)]">
                              No resources found
                            </p>

                            <p className="mt-2 text-sm text-[var(--admin-muted)]">
                              {resources.length === 0
                                ? "Your MongoDB resources collection is currently empty. Add your first resource."
                                : "Try changing your filters or search term."}
                            </p>

                            {resources.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSearch("");
                                  setCategoryFilter("All");
                                  setStatusFilter("All");
                                }}
                                className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                              >
                                Clear filters
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-[var(--admin-border)] px-6 py-4 text-xs text-[var(--admin-muted)]">
                  Showing {filteredResources.length} of {resources.length} database resources.
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* CREATE / EDIT RESOURCE MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !formLoading
            ) {
              setIsModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-modal-title"
            className="my-8 w-full max-w-2xl rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 text-[var(--admin-text)] shadow-2xl sm:p-8"
          >
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
                  Resource administration
                </p>

                <h2
                  id="resource-modal-title"
                  className="mt-2 text-2xl font-bold text-[var(--admin-text)]"
                >
                  {editingResourceId
                    ? "Edit Resource"
                    : "Add New Resource"}
                </h2>

                <p className="mt-2 text-sm text-[var(--admin-muted)]">
                  Enter the resource details below.
                </p>
              </div>

              <button
                type="button"
                disabled={formLoading}
                onClick={() => setIsModalOpen(false)}
                aria-label="Close resource form"
                className="rounded-lg p-2 text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)] disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="resource-title"
                  className={labelClass}
                >
                  Resource title
                </label>

                <input
                  id="resource-title"
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  required
                  maxLength={150}
                  placeholder="e.g. Complete Python Course"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="resource-category"
                    className={labelClass}
                  >
                    Category
                  </label>

                  <select
                    id="resource-category"
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                    className={inputClass}
                  >
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="resource-instructor"
                    className={labelClass}
                  >
                    Instructor / Publisher
                  </label>

                  <input
                    id="resource-instructor"
                    value={form.instructor}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        instructor: event.target.value,
                      })
                    }
                    required
                    maxLength={100}
                    placeholder="Enter publisher name"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="resource-description"
                  className={labelClass}
                >
                  Description
                </label>

                <textarea
                  id="resource-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  required
                  maxLength={1000}
                  rows={4}
                  placeholder="Describe the learning resource..."
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="resource-price"
                    className={labelClass}
                  >
                    Price (₹)
                  </label>

                  <input
                    id="resource-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        price: Number(event.target.value),
                      })
                    }
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="resource-level"
                    className={labelClass}
                  >
                    Difficulty
                  </label>

                  <select
                    id="resource-level"
                    value={form.level}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        level: event.target.value as ResourceLevel,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="resource-status"
                    className={labelClass}
                  >
                    Status
                  </label>

                  <select
                    id="resource-status"
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as ResourceStatus,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500"
                >
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-[var(--admin-border)] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={formLoading}
                  onClick={() => setIsModalOpen(false)}
                  className={secondaryButton}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {formLoading && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}

                  {formLoading
                    ? "Saving..."
                    : editingResourceId
                      ? "Save Changes"
                      : "Create Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="w-full max-w-md rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 text-[var(--admin-text)] shadow-2xl"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <Trash2 size={22} />
            </div>

            <h2
              id="delete-modal-title"
              className="text-xl font-bold text-[var(--admin-text)]"
            >
              Delete resource?
            </h2>

            <p className="mt-3 text-sm leading-6 text-[var(--admin-muted)]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[var(--admin-text)]">
                {deleteTarget.title}
              </span>
              ? This action permanently deletes the resource from MongoDB.
            </p>

            {deleteError && (
              <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-500">
                {deleteError}
              </p>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteTarget(null)}
                className={secondaryButton}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteLoading}
                onClick={deleteResource}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading && (
                  <RefreshCw size={15} className="animate-spin" />
                )}

                {deleteLoading ? "Deleting..." : "Delete Resource"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
