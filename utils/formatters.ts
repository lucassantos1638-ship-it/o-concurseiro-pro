/**
 * Funções utilitárias de formatação reutilizáveis
 */

/**
 * Formata uma string de data ISO para formato brasileiro (DD/MM/YYYY)
 */
export const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
};

/**
 * Formata um valor numérico ou string para moeda BRL
 */
export const formatCurrency = (val: any): string => {
    if (!val) return 'R$ 0,00';
    let sVal = val.toString().trim();

    // Se já tem R$, apenas retorna
    if (sVal.toLowerCase().includes('r$')) return sVal;

    // Tenta converter para número (limpando caracteres não numéricos exceto ponto e vírgula)
    let numeric = parseFloat(sVal.replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (isNaN(numeric)) return sVal;

    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numeric);
};
