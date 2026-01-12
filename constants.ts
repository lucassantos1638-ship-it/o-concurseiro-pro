
import { AppState, Nivel, StatusConcurso } from './types';

export const INITIAL_STATE: AppState = {
  concursos: [
    {
      id: 'c1',
      nome: 'Receita Federal 2024',
      banca: 'FGV',
      orgao: 'Ministério da Fazenda',
      status: StatusConcurso.EditalPublicado,
      cidades: ['Brasília', 'São Paulo', 'Rio de Janeiro'],
      datas: {
        edital: '2023-12-01',
        prova: '2024-06-15',
        inscricaoInicio: '2024-01-10',
        inscricaoFim: '2024-02-10'
      },
      links: {
        oficial: 'https://fgv.br/receita'
      },
      observacoes: '500 vagas para Auditor Fiscal com salários iniciais de R$ 21k.',
      imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'c2',
      nome: 'Polícia Federal 2026',
      banca: 'Cebraspe',
      orgao: 'Polícia Federal',
      status: StatusConcurso.InscricoesAbertas,
      cidades: ['Todas as capitais'],
      datas: {
        prova: '2026-03-20',
        inscricaoInicio: '2025-11-01',
        inscricaoFim: '2025-12-01'
      },
      links: {},
      observacoes: 'Últimos dias para inscrição no concurso de Agente Administrativo.',
      imageUrl: 'https://images.unsplash.com/photo-1544216717-3bbf52512659?auto=format&fit=crop&w=800&q=80'
    }
  ],
  cargos: [
    {
      id: 'ca1',
      concursoId: 'c1',
      nome: 'Auditor Fiscal',
      nivel: Nivel.Superior,
      vagasAmplas: 230,
      vagasPcd: 12,
      vagasCR: 100,
      totalVagas: 242,
      salario: 'R$ 21.029,09',
      cargaHoraria: '40h semanais',
      requisitos: 'Qualquer área de formação superior.',
      materiasConfig: []
    },
    {
      id: 'ca2',
      concursoId: 'c2',
      nome: 'Agente Administrativo',
      nivel: Nivel.Medio,
      vagasAmplas: 400,
      vagasPcd: 20,
      vagasCR: 200,
      totalVagas: 420,
      salario: 'R$ 5.200,00',
      cargaHoraria: '40h semanais',
      requisitos: 'Ensino Médio completo.',
      materiasConfig: []
    }
  ],
  ranking: [
    { id: 'r1', userName: 'Ricardo Silva', city: 'São Paulo', state: 'SP', accuracyRate: 98.5, questionsResolved: 1240, cargoId: 'ca1', avatar: 'https://i.pravatar.cc/100?u=r1' },
    { id: 'r2', userName: 'Ana Oliveira', city: 'Rio de Janeiro', state: 'RJ', accuracyRate: 97.2, questionsResolved: 1100, cargoId: 'ca1', avatar: 'https://i.pravatar.cc/100?u=r2' },
    { id: 'r3', userName: 'Marcos Souza', city: 'Curitiba', state: 'PR', accuracyRate: 95.8, questionsResolved: 980, cargoId: 'ca1', avatar: 'https://i.pravatar.cc/100?u=r3' },
    { id: 'r4', userName: 'Carla Dias', city: 'Belo Horizonte', state: 'MG', accuracyRate: 94.1, questionsResolved: 850, cargoId: 'ca1', avatar: 'https://i.pravatar.cc/100?u=r4' },
    { id: 'r5', userName: 'Joaquim Neto', city: 'Recife', state: 'PE', accuracyRate: 99.2, questionsResolved: 1500, cargoId: 'ca2', avatar: 'https://i.pravatar.cc/100?u=r5' },
    { id: 'r6', userName: 'Patrícia Lima', city: 'Porto Alegre', state: 'RS', accuracyRate: 96.5, questionsResolved: 1020, cargoId: 'ca2', avatar: 'https://i.pravatar.cc/100?u=r6' },
  ],
  materias: [
    { id: 'm1', nome: 'Língua Portuguesa', categoria: 'Linguagens', nivelCompativel: Nivel.Superior },
    { id: 'm2', nome: 'Direito Constitucional', categoria: 'Direito', nivelCompativel: Nivel.Superior },
    { id: 'm3', nome: 'Raciocínio Lógico', categoria: 'Exatas', nivelCompativel: Nivel.Superior },
    { id: 'm4', nome: 'Direito Administrativo', categoria: 'Direito', nivelCompativel: Nivel.Medio },
    { id: 'm5', nome: 'Informática', categoria: 'Tecnologia', nivelCompativel: Nivel.Medio }
  ],
  questoes: [
    {
      id: 'q1',
      codigo: 'Q1',
      banca: 'FGV',
      ano: '2024',
      prova: 'RFB',
      enunciado: 'Sobre a concordância nominal, assinale a alternativa correta:',
      alternativas: [
        'É proibido a entrada de estranhos.',
        'As cópias seguem anexo ao processo.',
        'Meio-dia e meio.',
        'Elas mesmas fizeram o trabalho.',
        'Aquela comida custou caro.'
      ],
      gabarito: 'D',
      nivel: Nivel.Superior,
      materiaId: 'm1'
    },
    {
      id: 'q2',
      codigo: 'Q2',
      banca: 'Cebraspe',
      ano: '2026',
      prova: 'PF',
      enunciado: 'Qual o principal objetivo do Princípio da Publicidade na Administração Pública?',
      alternativas: [
        'Garantir lucros para o Estado.',
        'Assegurar a transparência e o controle social.',
        'Permitir a censura de informações.',
        'Dificultar o acesso do cidadão aos dados.',
        'Apenas decorar prédios públicos.'
      ],
      gabarito: 'B',
      nivel: Nivel.Medio,
      materiaId: 'm4'
    }
  ],
  userProgress: {
    hoursStudied: 12,
    questionsResolved: 150,
    accuracyRate: 85,
    history: []
  },
  userProfile: {
    name: 'Estudante Focado',
    state: 'São Paulo',
    city: 'São Paulo',
    profilePicture: 'https://picsum.photos/seed/user-pro/100/100',
    plan: 'free'
  },
  myCargosIds: ['ca1']
};

export const ESTADOS_BRASIL = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
  'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
  'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
  'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
];
