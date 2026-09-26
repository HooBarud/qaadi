import React, { useState, useMemo } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Tag,
  DollarSign,
  FileText,
  CheckCircle,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { ServiceItem } from "../types";

export const ServicesView: React.FC = () => {
  const {
    services,
    addService,
    updateService,
    deleteService,
    incomes,
    formatCurrency,
    exchangeRate,
    canEdit,
    canDelete,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Qoraallada Sharciga");
  const [defaultPriceUSD, setDefaultPriceUSD] = useState<number>(0);
  const [defaultPriceSLSH, setDefaultPriceSLSH] = useState<number>(0);
  const [description, setDescription] = useState("");

  // Categories list from existing services
  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [services]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [services, searchTerm, selectedCategory]);

  // Usage statistics for each service
  const serviceStats = useMemo(() => {
    const stats: Record<string, { count: number; totalRevenueUSD: number }> = {};
    services.forEach((s) => {
      stats[s.id] = { count: 0, totalRevenueUSD: 0 };
    });
    incomes.forEach((inc) => {
      if (inc.serviceId && stats[inc.serviceId]) {
        stats[inc.serviceId].count += 1;
        stats[inc.serviceId].totalRevenueUSD += inc.amountUSD;
      }
    });
    return stats;
  }, [services, incomes]);

  const handleOpenAdd = () => {
    setEditingService(null);
    setName("");
    setCategory("Qoraallada Sharciga");
    setDefaultPriceUSD(50);
    setDefaultPriceSLSH(50 * exchangeRate);
    setDescription("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv: ServiceItem) => {
    setEditingService(srv);
    setName(srv.name);
    setCategory(srv.category || "Qoraallada Sharciga");
    setDefaultPriceUSD(srv.defaultPriceUSD);
    setDefaultPriceSLSH(srv.defaultPriceSLSH || srv.defaultPriceUSD * exchangeRate);
    setDescription(srv.description || "");
    setIsModalOpen(true);
  };

  const handleUSDChange = (usd: number) => {
    setDefaultPriceUSD(usd);
    setDefaultPriceSLSH(Math.round(usd * exchangeRate));
  };

  const handleSLSHChange = (slsh: number) => {
    setDefaultPriceSLSH(slsh);
    if (exchangeRate > 0) {
      setDefaultPriceUSD(Number((slsh / exchangeRate).toFixed(2)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingService) {
      updateService(editingService.id, {
        name: name.trim(),
        category: category.trim(),
        defaultPriceUSD: Number(defaultPriceUSD),
        defaultPriceSLSH: Number(defaultPriceSLSH),
        description: description.trim(),
      });
    } else {
      addService({
        name: name.trim(),
        category: category.trim(),
        defaultPriceUSD: Number(defaultPriceUSD),
        defaultPriceSLSH: Number(defaultPriceSLSH),
        description: description.trim(),
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Adeegyada (Services & Notary Fees)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maamulka adeegyada sharciga, qiimaha go'an ee adeeg kasta iyo dakhliga ka soo xarooday.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            + Ku dar Adeeg Cusub
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Wadarta Adeegyada
            </span>
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {services.length}
          </p>
          <span className="text-[11px] text-slate-400">Adeegyo diiwaangashan</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Celceliska Qiimaha (USD)
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            $
            {services.length > 0
              ? (
                  services.reduce((acc, s) => acc + s.defaultPriceUSD, 0) / services.length
                ).toFixed(1)
              : "0"}
          </p>
          <span className="text-[11px] text-slate-400">Qiimaha rasmiga ah</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Qaybaha Adeegyada
            </span>
            <div className="rounded-xl bg-violet-50 p-2 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {categories.length || 1}
          </p>
          <span className="text-[11px] text-slate-400">Noocyada kala duwan</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Raadi adeeg, qiimo ama sharaxaad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="all">Dhammaan Qaybaha</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services List Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Magaca Adeegga</th>
                <th className="px-4 py-3">Qaybta (Category)</th>
                <th className="px-4 py-3">Qiimaha USD ($)</th>
                <th className="px-4 py-3">Qiimaha SLSH (Sh)</th>
                <th className="px-4 py-3 text-center">Tirada La Qabtay</th>
                <th className="px-4 py-3 text-right">Ficilada (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Wax adeeg ah lama helin.
                  </td>
                </tr>
              ) : (
                filteredServices.map((srv) => {
                  const stats = serviceStats[srv.id] || { count: 0, totalRevenueUSD: 0 };
                  return (
                    <tr
                      key={srv.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {srv.name}
                        </div>
                        {srv.description && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {srv.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          <Tag className="h-2.5 w-2.5" />
                          {srv.category || "Adeeg"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                        ${srv.defaultPriceUSD.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                        {(srv.defaultPriceSLSH || srv.defaultPriceUSD * exchangeRate).toLocaleString()} SLSH
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {stats.count} jeer
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(srv)}
                              title="Wax ka beddel"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Ma hubtaa inaad tirtirto adeegga "${srv.name}"?`)) {
                                  deleteService(srv.id);
                                }
                              }}
                              title="Tirtir"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                {editingService ? "Wax ka beddel Adeegga" : "Ku dar Adeeg Cusub"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Magaca Adeegga (Service Name) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tusaale: Heshiis Qoraal Sharci, Wakaalad, Kala Wareejin..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Qaybta (Category) *
                </label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Tusaale: Qoraallada Sharciga, Diiwaangelin..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <datalist id="category-suggestions">
                  <option value="Qoraallada Sharciga" />
                  <option value="Heshiisyada Ganacsiga" />
                  <option value="Kala Wareejinta Hantida" />
                  <option value="Diiwaangelinta Shirkadaha" />
                  <option value="Wakaaladaha Sharciga" />
                  <option value="Adeegyo Guud" />
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Qiimaha ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min={0}
                    value={defaultPriceUSD || ""}
                    onChange={(e) => handleUSDChange(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Qiimaha (SLSH)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={defaultPriceSLSH || ""}
                    onChange={(e) => handleSLSHChange(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Faahfaahin Dheeraad ah (Description)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Shuruudaha ama sharaxaadda adeeggan..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Ka noqo
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                >
                  {editingService ? "Keydi Isbeddelka" : "Ku dar Adeegga"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
