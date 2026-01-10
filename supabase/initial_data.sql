
// This script will be run via Supabase SQL function or client side just once.
// Since I can't easily run a node script against the DB without env vars setup in the tool explicitly,
// I will construct a SQL query to insert definitions.

/* Queries to insert INITIAL_STATE data */

/* 1. Insert Materias */
INSERT INTO materias (id, nome, categoria, nivel_compativel) VALUES
('m1', 'Língua Portuguesa', 'Linguagens', 'Superior'),
('m2', 'Direito Constitucional', 'Direito', 'Superior'),
('m3', 'Raciocínio Lógico', 'Exatas', 'Superior'),
('m4', 'Direito Administrativo', 'Direito', 'Médio'),
('m5', 'Informática', 'Tecnologia', 'Médio');

/* 2. Insert Concursos */
INSERT INTO concursos (id, nome, banca, orgao, status, cidades, data_edital, data_prova, data_inscricao_inicio, data_inscricao_fim, link_oficial, observacoes, image_url) VALUES
('c1', 'Receita Federal 2024', 'FGV', 'Ministério da Fazenda', 'Edital Publicado', ARRAY['Brasília', 'São Paulo', 'Rio de Janeiro'], '2023-12-01', '2024-06-15', '2024-01-10', '2024-02-10', 'https://fgv.br/receita', '500 vagas para Auditor Fiscal com salários iniciais de R$ 21k.', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80'),
('c2', 'Polícia Federal 2026', 'Cebraspe', 'Polícia Federal', 'Inscrições Abertas', ARRAY['Todas as capitais'], NULL, '2026-03-20', '2025-11-01', '2025-12-01', NULL, 'Últimos dias para inscrição no concurso de Agente Administrativo.', 'https://images.unsplash.com/photo-1544216717-3bbf52512659?auto=format&fit=crop&w=800&q=80');

/* 3. Insert Cargos */
INSERT INTO cargos (id, concurso_id, nome, nivel, vagas_amplas, total_vagas, salario, carga_horaria, requisitos) VALUES
('ca1', 'c1', 'Auditor Fiscal', 'Superior', 230, 230, 'R$ 21.029,09', '40h semanais', 'Qualquer área de formação superior.'),
('ca2', 'c2', 'Agente Administrativo', 'Médio', 400, 400, 'R$ 5.200,00', '40h semanais', 'Ensino Médio completo.');

/* 4. Insert Questoes */
INSERT INTO questoes (id, codigo, banca, ano, prova, enunciado, alternativas, gabarito, nivel, materia_id) VALUES
('q1', 'Q1', 'FGV', '2024', 'RFB', 'Sobre a concordância nominal, assinale a alternativa correta:', ARRAY['É proibido a entrada de estranhos.', 'As cópias seguem anexo ao processo.', 'Meio-dia e meio.', 'Elas mesmas fizeram o trabalho.', 'Aquela comida custou caro.'], 'D', 'Superior', 'm1'),
('q2', 'Q2', 'Cebraspe', '2026', 'PF', 'Qual o principal objetivo do Princípio da Publicidade na Administração Pública?', ARRAY['Garantir lucros para o Estado.', 'Assegurar a transparência e o controle social.', 'Permitir a censura de informações.', 'Dificultar o acesso do cidadão aos dados.', 'Apenas decorar prédios públicos.'], 'B', 'Médio', 'm4');
