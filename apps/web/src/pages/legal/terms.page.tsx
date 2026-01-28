import { LegalLayout } from './legal.layout'

export function TermsPage() {
  return (
    <LegalLayout>
      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Termos de Uso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: 27 de janeiro de 2026
        </p>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">1. Aceitação dos Termos</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Ao acessar ou utilizar o Plim, você concorda em cumprir e estar vinculado a estes Termos
            de Uso. Se você não concordar com qualquer parte destes termos, não poderá acessar ou
            usar o serviço.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Estes termos constituem um acordo legal entre você e o Plim, regendo o uso do aplicativo
            e seus serviços relacionados.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">2. Descrição do Serviço</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            O Plim é uma ferramenta de <strong>gestão financeira pessoal</strong> que permite:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Registrar e categorizar despesas</li>
            <li>Acompanhar salários e rendimentos</li>
            <li>Gerenciar cartões de crédito e seus limites</li>
            <li>Visualizar relatórios e análises financeiras</li>
            <li>Organizar gastos por categorias personalizadas</li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            <strong>Importante:</strong> O Plim é uma ferramenta de organização e acompanhamento.{' '}
            <strong>Não oferecemos</strong>:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Aconselhamento financeiro ou de investimentos</li>
            <li>Serviços bancários ou de pagamento</li>
            <li>Gestão de ativos ou carteiras de investimento</li>
            <li>Consultoria tributária ou contábil</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">3. Conta de Usuário</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Para usar o Plim, você deve criar uma conta. Ao criar sua conta, você concorda em:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Fornecer informações verdadeiras e atualizadas</li>
            <li>Manter a confidencialidade de suas credenciais de acesso</li>
            <li>Ser responsável por todas as atividades realizadas em sua conta</li>
            <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
            <li>Manter apenas uma conta por pessoa</li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">4. Uso Aceitável</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Você concorda em usar o Plim apenas para fins legais e de acordo com estes termos. É
            proibido:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Usar o serviço para qualquer finalidade ilegal ou não autorizada</li>
            <li>Tentar acessar áreas restritas do sistema ou dados de outros usuários</li>
            <li>Interferir ou interromper o funcionamento do serviço ou servidores</li>
            <li>Fazer engenharia reversa, descompilar ou tentar extrair o código-fonte</li>
            <li>Usar automações, bots ou scripts não autorizados</li>
            <li>Transmitir vírus, malware ou código malicioso</li>
            <li>Revender, sublicenciar ou comercializar o acesso ao serviço</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">5. Conteúdo do Usuário</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Você mantém todos os direitos sobre os dados financeiros e informações que inserir no
            Plim. Ao usar o serviço:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Você é responsável pela precisão e legalidade dos dados inseridos</li>
            <li>
              Você nos concede licença limitada para processar e armazenar seus dados conforme
              necessário para fornecer o serviço
            </li>
            <li>Você pode exportar ou excluir seus dados a qualquer momento</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">6. Propriedade Intelectual</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            O Plim, incluindo sua marca, logotipo, design, código-fonte, textos e todos os elementos
            visuais, são de propriedade exclusiva do Plim e estão protegidos por leis de propriedade
            intelectual.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Você recebe uma licença limitada, não exclusiva e não transferível para usar o
            aplicativo para fins pessoais, de acordo com estes termos.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">7. Isenção de Garantias</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            O Plim é fornecido "como está" e "conforme disponível", sem garantias de qualquer tipo,
            expressas ou implícitas. Não garantimos que:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>O serviço será ininterrupto ou livre de erros</li>
            <li>Os resultados obtidos serão precisos ou confiáveis para decisões financeiras</li>
            <li>O serviço atenderá a todos os seus requisitos específicos</li>
            <li>Quaisquer erros no software serão corrigidos</li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Você é o único responsável por verificar a precisão dos dados e por quaisquer decisões
            financeiras tomadas com base nas informações do aplicativo.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">8. Limitação de Responsabilidade</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Na máxima extensão permitida por lei, o Plim não será responsável por:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              Quaisquer danos diretos, indiretos, incidentais ou consequenciais resultantes do uso
              ou incapacidade de uso do serviço
            </li>
            <li>Decisões financeiras tomadas com base em informações do aplicativo</li>
            <li>Perda de dados causada por falhas técnicas ou ação de terceiros</li>
            <li>Interrupções do serviço por manutenção ou problemas técnicos</li>
            <li>
              Acesso não autorizado à sua conta devido a negligência na proteção de credenciais
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">9. Modificações do Serviço</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Reservamo-nos o direito de, a qualquer momento e sem aviso prévio:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Modificar, suspender ou descontinuar funcionalidades</li>
            <li>Alterar limites de uso ou recursos disponíveis</li>
            <li>Atualizar estes Termos de Uso (com notificação aos usuários)</li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Faremos esforços razoáveis para notificar sobre mudanças significativas com
            antecedência.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">10. Rescisão</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Você pode encerrar sua conta a qualquer momento através das configurações do aplicativo
            ou entrando em contato conosco.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Podemos suspender ou encerrar seu acesso imediatamente, sem aviso prévio, se:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Você violar qualquer disposição destes termos</li>
            <li>Houver suspeita de atividade fraudulenta ou abuso do serviço</li>
            <li>For necessário para proteger outros usuários ou a integridade do sistema</li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Após o encerramento, suas obrigações relacionadas a propriedade intelectual e limitação
            de responsabilidade permanecerão em vigor.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">11. Disposições Gerais</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              <strong>Lei Aplicável:</strong> Estes termos são regidos pelas leis da República
              Federativa do Brasil
            </li>
            <li>
              <strong>Foro:</strong> Fica eleito o foro da comarca de São Paulo/SP para dirimir
              quaisquer controvérsias
            </li>
            <li>
              <strong>Independência:</strong> Se qualquer disposição destes termos for considerada
              inválida, as demais permanecerão em vigor
            </li>
            <li>
              <strong>Integralidade:</strong> Estes termos constituem o acordo integral entre você e
              o Plim
            </li>
            <li>
              <strong>Renúncia:</strong> A falha em exercer qualquer direito não constitui renúncia
              a esse direito
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold md:text-2xl">12. Contato</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Para dúvidas sobre estes Termos de Uso:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              <strong>E-mail:</strong>{' '}
              <a href="mailto:suporte@plim.app.br" className="text-primary hover:underline">
                suporte@plim.app.br
              </a>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">Agradecemos por usar o Plim!</p>
        </section>
      </article>
    </LegalLayout>
  )
}
