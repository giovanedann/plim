import { LegalLayout } from './legal.layout'

export function PrivacyPage() {
  return (
    <LegalLayout>
      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: 12 de fevereiro de 2026
        </p>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">1. Introdução</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            O Plim é um aplicativo de gestão financeira pessoal desenvolvido para ajudar você a
            organizar suas finanças. Esta Política de Privacidade descreve como coletamos, usamos,
            armazenamos e protegemos suas informações pessoais, em conformidade com a Lei Geral de
            Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Ao utilizar o Plim, você concorda com as práticas descritas nesta política. Se tiver
            dúvidas, entre em contato conosco pelo e-mail:{' '}
            <a href="mailto:privacidade@plim.app.br" className="text-primary hover:underline">
              privacidade@plim.app.br
            </a>
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">2. Dados que Coletamos</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Coletamos os seguintes tipos de dados para fornecer nossos serviços:
          </p>

          <h3 className="mt-6 text-lg font-medium">2.1 Dados de Cadastro</h3>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Endereço de e-mail</li>
            <li>Nome completo</li>
            <li>Foto de perfil (opcional)</li>
          </ul>

          <h3 className="mt-6 text-lg font-medium">2.2 Dados Financeiros</h3>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Transações e suas descrições</li>
            <li>Informações de salários</li>
            <li>Dados de cartões de crédito (nome do cartão e limite)</li>
            <li>Categorias de gastos personalizadas</li>
          </ul>

          <h3 className="mt-6 text-lg font-medium">2.3 Dados Técnicos</h3>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Preferências de tema (claro/escuro)</li>
            <li>Configuração de moeda e localização</li>
            <li>Informações de sessão para autenticação</li>
            <li>
              Dados anonimizados de uso do aplicativo, como páginas visitadas e funcionalidades
              utilizadas (somente com seu consentimento explícito)
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">3. Como Usamos seus Dados</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Utilizamos seus dados exclusivamente para:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Fornecer as funcionalidades de gestão financeira do Plim</li>
            <li>Manter sua conta segura e autenticada</li>
            <li>Personalizar sua experiência no aplicativo</li>
            <li>Gerar relatórios e análises financeiras para você</li>
            <li>Enviar comunicações importantes sobre o serviço</li>
            <li>
              Melhorar o produto com base em dados de uso agregados e anonimizados (analytics),
              apenas com seu consentimento
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            <strong>Não utilizamos seus dados para:</strong>
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Exibir anúncios publicitários</li>
            <li>Vender ou compartilhar com terceiros para fins comerciais</li>
            <li>Criar perfis de marketing</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">4. Armazenamento e Segurança</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Levamos a segurança dos seus dados muito a sério. Implementamos as seguintes medidas:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              <strong>Criptografia AES-256:</strong> Dados financeiros sensíveis são criptografados
              usando o padrão AES-256 antes de serem armazenados
            </li>
            <li>
              <strong>Row Level Security (RLS):</strong> Cada usuário só pode acessar seus próprios
              dados no banco de dados
            </li>
            <li>
              <strong>Supabase Vault:</strong> Chaves de criptografia são armazenadas de forma
              segura em um cofre digital
            </li>
            <li>
              <strong>HTTPS:</strong> Toda comunicação entre seu dispositivo e nossos servidores é
              criptografada
            </li>
            <li>
              <strong>Infraestrutura:</strong> Utilizamos Supabase como provedor de banco de dados,
              com servidores seguros e em conformidade com padrões internacionais
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">5. Compartilhamento de Dados</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            <strong>Não compartilhamos seus dados pessoais</strong> com terceiros, exceto nas
            seguintes situações:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Quando exigido por lei ou ordem judicial em território brasileiro</li>
            <li>Para proteger nossos direitos legais ou segurança do serviço</li>
            <li>
              Com prestadores de serviço essenciais (como Supabase para hospedagem e PostHog para
              analytics), sob rigorosos contratos de confidencialidade
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">6. Seus Direitos (LGPD Art. 18)</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Em conformidade com a LGPD, você tem os seguintes direitos sobre seus dados pessoais:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              <strong>Confirmação e Acesso:</strong> Saber se tratamos seus dados e acessar uma
              cópia deles
            </li>
            <li>
              <strong>Correção:</strong> Solicitar a correção de dados incompletos, inexatos ou
              desatualizados
            </li>
            <li>
              <strong>Anonimização ou Eliminação:</strong> Solicitar a anonimização ou exclusão de
              dados desnecessários
            </li>
            <li>
              <strong>Portabilidade:</strong> Receber seus dados em formato estruturado para
              transferência a outro serviço
            </li>
            <li>
              <strong>Eliminação:</strong> Solicitar a exclusão completa dos seus dados pessoais
            </li>
            <li>
              <strong>Revogação do Consentimento:</strong> Retirar seu consentimento a qualquer
              momento
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Para exercer qualquer desses direitos, entre em contato pelo e-mail{' '}
            <a href="mailto:privacidade@plim.app.br" className="text-primary hover:underline">
              privacidade@plim.app.br
            </a>
            . Responderemos em até 15 dias úteis.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">7. Retenção de Dados</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Mantemos seus dados enquanto sua conta estiver ativa. Ao solicitar a exclusão da conta:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Seus dados são removidos do sistema principal em até 30 dias</li>
            <li>Backups de segurança são eliminados em até 90 dias após a solicitação</li>
            <li>Após esse período, todos os dados são permanentemente excluídos</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">8. Cookies e Analytics</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Utilizamos cookies essenciais para:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Manter sua sessão de autenticação ativa</li>
            <li>Armazenar sua preferência de tema (claro/escuro)</li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Utilizamos o <strong>PostHog</strong> como ferramenta de analytics para entender como o
            aplicativo é usado e melhorar sua experiência. Os dados coletados são anonimizados e
            incluem apenas informações de navegação (páginas visitadas, funcionalidades utilizadas)
            — <strong>nunca seus dados financeiros pessoais</strong>.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Esta coleta <strong>só ocorre com seu consentimento explícito</strong>. Ao acessar o
            Plim pela primeira vez, você verá um banner solicitando sua autorização. Você pode
            aceitar ou recusar a qualquer momento, e sua escolha é respeitada imediatamente.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            <strong>Não utilizamos</strong> cookies de publicidade ou rastreamento para fins
            comerciais.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">9. Menores de Idade</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            O Plim é destinado a usuários maiores de 18 anos. Não coletamos intencionalmente dados
            de menores de idade. Se tomarmos conhecimento de que um menor se cadastrou, excluiremos
            seus dados imediatamente.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">10. Alterações nesta Política</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Podemos atualizar esta Política de Privacidade periodicamente. Quando fizermos
            alterações significativas:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Notificaremos você por e-mail</li>
            <li>Exibiremos um aviso no aplicativo</li>
            <li>Atualizaremos a data de "Última atualização" no topo</li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Recomendamos revisar esta política periodicamente.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">11. Contato</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Para dúvidas sobre privacidade ou para exercer seus direitos:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              <strong>E-mail:</strong>{' '}
              <a href="mailto:privacidade@plim.app.br" className="text-primary hover:underline">
                privacidade@plim.app.br
              </a>
            </li>
            <li>
              <strong>Prazo de resposta:</strong> Até 15 dias úteis
            </li>
          </ul>
        </section>
      </article>
    </LegalLayout>
  )
}
