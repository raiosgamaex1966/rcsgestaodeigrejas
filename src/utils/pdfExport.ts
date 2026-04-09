import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface CategorySummary {
  category_id: string;
  category_name: string;
  category_color: string | null;
  total: number;
}

interface CurrentMonthData {
  totalIncome: number;
  totalExpenses: number;
  monthBalance: number;
  totalBalance: number;
}

interface ExportData {
  currentMonth: CurrentMonthData | null;
  monthlyData: MonthlySummary[] | null;
  incomeByCategory: CategorySummary[] | null;
  expenseByCategory: CategorySummary[] | null;
  churchName?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const exportFinancialReportPDF = (data: ExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const currentMonthName = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });
  
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.churchName || 'Relatório Financeiro', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Relatório Financeiro - ${currentMonthName}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
  doc.setTextColor(0);

  // Linha separadora
  yPosition += 10;
  doc.setDrawColor(200);
  doc.line(14, yPosition, pageWidth - 14, yPosition);

  // Resumo do Mês
  yPosition += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Demonstrativo do Mês Atual', 14, yPosition);

  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const summaryData = [
    ['Receitas', formatCurrency(data.currentMonth?.totalIncome || 0)],
    ['Despesas', formatCurrency(data.currentMonth?.totalExpenses || 0)],
    ['Saldo do Mês', formatCurrency(data.currentMonth?.monthBalance || 0)],
    ['Saldo em Caixa', formatCurrency(data.currentMonth?.totalBalance || 0)],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Descrição', 'Valor']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [67, 56, 202], textColor: 255 },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  // Fluxo de Caixa Mensal
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Fluxo de Caixa - Últimos Meses', 14, yPosition);

  if (data.monthlyData && data.monthlyData.length > 0) {
    yPosition += 10;
    const cashFlowData = data.monthlyData.map(m => [
      m.month,
      formatCurrency(m.income),
      formatCurrency(m.expenses),
      formatCurrency(m.balance)
    ]);

    // Adicionar linha de total
    const totalIncome = data.monthlyData.reduce((sum, m) => sum + m.income, 0);
    const totalExpenses = data.monthlyData.reduce((sum, m) => sum + m.expenses, 0);
    const totalBalance = data.monthlyData.reduce((sum, m) => sum + m.balance, 0);
    cashFlowData.push(['TOTAL', formatCurrency(totalIncome), formatCurrency(totalExpenses), formatCurrency(totalBalance)]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Mês', 'Receitas', 'Despesas', 'Saldo']],
      body: cashFlowData,
      theme: 'striped',
      headStyles: { fillColor: [67, 56, 202], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        // Destacar linha de total
        if (data.row.index === cashFlowData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    });
  }

  // Nova página para categorias
  doc.addPage();
  yPosition = 20;

  // Receitas por Categoria
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Receitas por Categoria', 14, yPosition);

  if (data.incomeByCategory && data.incomeByCategory.length > 0) {
    yPosition += 10;
    const incomeData = data.incomeByCategory.map(c => [
      c.category_name,
      formatCurrency(c.total)
    ]);
    const totalCategoryIncome = data.incomeByCategory.reduce((sum, c) => sum + c.total, 0);
    incomeData.push(['TOTAL', formatCurrency(totalCategoryIncome)]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Categoria', 'Valor']],
      body: incomeData,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' }
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.row.index === incomeData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    });
  } else {
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Nenhuma receita registrada no período', 14, yPosition);
  }

  // Despesas por Categoria
  yPosition = (doc as any).lastAutoTable?.finalY + 20 || yPosition + 20;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Despesas por Categoria', 14, yPosition);

  if (data.expenseByCategory && data.expenseByCategory.length > 0) {
    yPosition += 10;
    const expenseData = data.expenseByCategory.map(c => [
      c.category_name,
      formatCurrency(c.total)
    ]);
    const totalCategoryExpense = data.expenseByCategory.reduce((sum, c) => sum + c.total, 0);
    expenseData.push(['TOTAL', formatCurrency(totalCategoryExpense)]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Categoria', 'Valor']],
      body: expenseData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68], textColor: 255 },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' }
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.row.index === expenseData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    });
  } else {
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Nenhuma despesa registrada no período', 14, yPosition);
  }

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `relatorio-financeiro-${format(new Date(), 'yyyy-MM')}.pdf`;
  doc.save(fileName);
};
