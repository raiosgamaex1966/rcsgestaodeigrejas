export const safeParseDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;

    // Se for uma data no formato YYYY-MM-DD (comum do banco de dados para campos DATE)
    // Adicionamos T12:00:00 para garantir que, independentemente do fuso horário
    // (mesmo um deslocamento de até 12 horas), o dia permaneça o mesmo ao converter para objeto Date local.
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(`${dateStr}T12:00:00`);
    }

    // Fallback para outros formatos
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
};
