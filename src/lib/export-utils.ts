import * as XLSX from "xlsx";

const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function exportToExcel(data: Record<string, any>[], sheetName: string, tipo: string) {
  if (data.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const fileName = `makir-${tipo}-${formatDate(new Date())}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportDashboardPDF() {
  // Add print-specific styles temporarily
  const style = document.createElement("style");
  style.id = "print-style";
  style.textContent = `
    @media print {
      body * { visibility: hidden; }
      #dashboard-content, #dashboard-content * { visibility: visible; }
      #dashboard-content { position: absolute; left: 0; top: 0; width: 100%; }
      .no-print { display: none !important; }
      @page { size: landscape; margin: 1cm; }
    }
  `;
  document.head.appendChild(style);
  window.print();
  setTimeout(() => document.getElementById("print-style")?.remove(), 500);
}
