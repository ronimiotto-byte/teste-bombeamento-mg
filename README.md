# Teste de Bombeamento M&G

App Android da M&G Geologia para o teste de bombeamento de poço tubular:

- cronômetro do bombeamento e da recuperação, com alerta 40 s antes de cada leitura a partir de 5 min (funciona com a tela desligada);
- projetos salvos no celular (salvar, abrir e novo projeto);
- cronômetro da vazão (minutos, segundos e décimos) na mesma tela;
- opção de manter a tela ligada durante o teste;
- lançamento das leituras (N.D., Q e N.A.) direto no cronômetro;
- dados do poço, coordenada pelo GPS do celular convertida para UTM SIRGAS 2000;
- memorial de cálculo (vazão de estabilização ou Cooper-Jacob com t₀) em Word e PDF, no layout M&G;
- coordenada do GPS só trava quando a precisão fica em 3 m ou menos por 3 leituras seguidas (ou quando você manda usar a melhor);
- dados do perfil geológico-construtivo lançados no celular (litologia, perfuração, revestimento, filtros, encamisamento, espaço anelar, entradas d'água, saliência, laje, tubo edutor, bomba, tubo de inspeção e dispositivos), com conferência; o desenho é gerado no programa do computador;
- modo Campo, separado dos poços: levantamentos com pontos, descrição e fotos com carimbo (data, coordenada, UTM, altitude, precisão e azimute), exportados em .zip com uma pasta por ponto, pontos.csv e pontos.kml.

## Instalar no celular

1. Abra no celular: https://github.com/ronimiotto-byte/teste-bombeamento-mg/releases/latest
2. Toque em `TesteBombeamentoMG.apk` para baixar e abra o arquivo.
3. Se o Android pedir, permita instalar apps desta fonte (Chrome ou Arquivos).
4. Na primeira vez que iniciar o cronômetro, permita as notificações e "Alarmes e lembretes".

Os testes ficam salvos só no celular.

A partir da versão 1.4 todas as versões usam a mesma assinatura, então as próximas instalam por cima da anterior sem perder os projetos. Quem tem a 1.1 a 1.3 precisa desinstalar uma vez antes de instalar a 1.4.
