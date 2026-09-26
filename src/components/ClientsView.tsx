import React, { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  MapPin,
  FileSpreadsheet,
  FileText,
  Printer,
  Edit2,
  Trash2,
  DollarSign,
  CreditCard,
  X,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { Client, IncomeTransaction, Invoice } from "../types";
import { exportToExcel } from "../utils/excel";

interface ClientsViewProps {
  onPrintStatement?: (client: Client, transactions: IncomeTransaction[], invoices: Invoice[]) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onPrintStatement }) => {
  const {
    clients,
    incomes,
    invoices,
    addClient,
    updateClient,
    deleteClient,
    formatCurrency,
    activeBusiness,
    canEdit,
    canDelete,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Calculate client financial metrics
  const clientsWithMetrics = useMemo(() => {
    return clients.map((c) => {
      const clientIncomes = incomes.filter((i) => i.clientId === c.id);
      const totalBilledUSD = clientIncomes.reduce((acc, i) => acc + i.amountUSD, 0);
      const totalPaidUSD = clientIncomes.reduce((acc, i) => acc + i.paidAmountUSD, 0);
      const outstandingDebtUSD = clientIncomes.reduce((acc, i) => acc + i.debtAmountUSD, 0);

      const lastTx = clientIncomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      return {
        ...c,
        totalBilledUSD,
        totalPaidUSD,
        outstandingDebtUSD,
        lastTransactionDate: lastTx?.date || "Ma jiro",
        transactionCount: clientIncomes.length,
      };
    });
  }, [clients, incomes]);

  const filteredClients = useMemo(() => {
    return clientsWithMetrics.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        c.phone.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [clientsWithMetrics, searchTerm]);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setName("");
    setPhone("+252 ");
    setEmail("");
    setCompany("");
    setAddress("");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Client) => {
    setEditingClient(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || "");
    setCompany(c.company || "");
    setAddress(c.address || "");
    setNotes(c.notes || "");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingClient) {
      updateClient(editingClient.id, {
        name,
        phone,
        email,
        company,
        address,
        notes,
      });
    } else {
      addClient({
        name,
        phone,
        email,
        company,
        address,
        notes,
      });
    }

    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const data = filteredClients.map((c) => ({
      "Client Name": c.name,
      "Phone": c.phone,
      "Email": c.email || "",
      "Company": c.company || "",
      "Address": c.address || "",
      "Total Billed (USD)": c.totalBilledUSD,
      "Total Paid (USD)": c.totalPaidUSD,
      "Outstanding Debt (USD)": c.outstandingDebtUSD,
      "Last Transaction": c.lastTransactionDate,
      "Notes": c.notes || "",
    }));
    exportToExcel(data, `Macaamiisha_${activeBusiness.name.replace(/\s+/g, "_")}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Maamulka Macaamiisha (Clients Directory)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Diiwaanka macaamiisha, taariikhda lacag bixinta, deynta kugu jirta, iyo xisaab-celinta (Statement).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Soo Saaro Excel</span>
          </button>

          <button
            onClick={handleOpenAdd}
            id="btn-add-client-main"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ Macmiil Cusub</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Raadi macmiil magac, shirkad, telefoon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClients.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            Wax macmiil ah lagama helin raadintaada.
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 font-black text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 text-sm">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
                        {client.name}
                      </h4>
                      {client.company && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building className="h-3 w-3" /> {client.company}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(client)}
                        title="Wax ka beddel"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Ma hubtaa inaad tirtirto macmiilka ${client.name}?`)) {
                            deleteClient(client.id);
                          }
                        }}
                        title="Tirtir"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Financial Summary Box */}
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Wadarta Adeegyada:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(client.totalBilledUSD)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Wadarta La Bixiyay:</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(client.totalPaidUSD)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Deyn Harta:</span>
                    <span
                      className={`font-black ${
                        client.outstandingDebtUSD > 0 ? "text-amber-600" : "text-slate-400"
                      }`}
                    >
                      {client.outstandingDebtUSD > 0 ? formatCurrency(client.outstandingDebtUSD) : "$0.00"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {client.transactionCount} hawlood
                </span>
                <button
                  onClick={() => setSelectedClientDetail(client)}
                  className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
                >
                  Xisaabta Macmiilka →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Client Detail & Statement Modal */}
      {selectedClientDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-lg">
                  {selectedClientDetail.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedClientDetail.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedClientDetail.company || "Macmiil Gaar ah"} • {selectedClientDetail.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onPrintStatement && (
                  <button
                    onClick={() => {
                      const clientIncs = incomes.filter((i) => i.clientId === selectedClientDetail.id);
                      const clientInvs = invoices.filter((inv) => inv.clientId === selectedClientDetail.id);
                      onPrintStatement(selectedClientDetail, clientIncs, clientInvs);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <Printer className="h-4 w-4 text-indigo-600" />
                    <span>Daabac Statement</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedClientDetail(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Client Statement Transactions */}
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Diiwaanka Hawlaha & Lacag Bixinta (Transaction Statement)
              </h4>
              <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 font-semibold">Taariikhda</th>
                      <th className="p-2.5 font-semibold">Ref / ID</th>
                      <th className="p-2.5 font-semibold">Adeegga / Shaqada</th>
                      <th className="p-2.5 font-semibold text-right">Cadadka</th>
                      <th className="p-2.5 font-semibold text-right">Bixiyay</th>
                      <th className="p-2.5 font-semibold text-right">Deyn Harta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {incomes
                      .filter((i) => i.clientId === selectedClientDetail.id)
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{item.date}</td>
                          <td className="p-2.5 font-mono font-bold text-indigo-600">{item.id}</td>
                          <td className="p-2.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{item.serviceName}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{item.description}</p>
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                            {formatCurrency(item.amountUSD, item.amountSLSH)}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-600">
                            {formatCurrency(item.paidAmountUSD, item.paidAmountSLSH)}
                          </td>
                          <td className="p-2.5 text-right font-bold text-amber-600">
                            {item.debtAmountUSD > 0 ? formatCurrency(item.debtAmountUSD, item.debtAmountSLSH) : "-"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedClientDetail(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                Xidh (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingClient ? "Wax ka beddel Macmiilka" : "Kudar Macmiil Cusub"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Magaca Macmiilka *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tusaale: Maxamed Cali Cilmi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefoonka *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+252 63..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Shirkadda (Haddii ay jirto)
                </label>
                <input
                  type="text"
                  placeholder="Tusaale: Somaliland Trading Co."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cinwaanka / Magaalada
                </label>
                <input
                  type="text"
                  placeholder="Tusaale: Jigjiga Yar, Hargeysa"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Xusuusin / Faallo (Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="Xusuusin ku saabsan macmiilkan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 shadow-sm transition"
                >
                  {editingClient ? "Badbaadi Isbeddelka" : "Kudar Macmiilka"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
