// Arquivo: app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';

// --- 1. NOSSA PALETA DE CORES ---
// Usamos códigos HEX para definir os tons exatos de Verde, Laranja e Terracota
const cores = {
  verde: '#A8D5BA',      // Verde pastel (menta suave)
  laranja: '#FFC8A2',    // Laranja pastel (pêssego)
  terracota: '#E29578',  // Terracota suave (coral)
  fundo: '#FAFAFA',      // Fundo super claro e clean (quase branco)
  branco: '#FFFFFF',
  textoEscuro: '#2D3142' // Cor de texto mais moderna que o preto puro
};

// --- 2. CONFIGURAÇÕES DO CASAMENTO ---
const DATA_CASAMENTO = new Date('2026-09-11T00:00:00'); // Coloque a data real aqui! (Ano-Mês-Dia)
const SENHA_SECRETA = process.env.EXPO_PUBLIC_SENHA_SECRETA

export default function HomeScreen() {
  // --- 3. ESTADOS (A memória do aplicativo) ---
  // desbloqueado: Diz se a tela inicial pode aparecer (começa como Falso)
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState('');

  // Guarda os dias, horas, minutos e segundos restantes
  const [tempoRestante, setTempoRestante] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });

  // --- 4. LÓGICA DA CONTAGEM REGRESSIVA ---
  // O useEffect executa um pedaço de código em segundo plano
  useEffect(() => {
    // Se o app estiver bloqueado, nem tenta calcular o tempo
    if (!desbloqueado) return;

    // Atualiza o relógio a cada 1 segundo (1000 milissegundos)
    const relogio = setInterval(() => {
      const agora = new Date();
      const diferenca = DATA_CASAMENTO.getTime() - agora.getTime();

      if (diferenca > 0) {
        setTempoRestante({
          dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
          horas: Math.floor((diferenca / (1000 * 60 * 60)) % 24),
          minutos: Math.floor((diferenca / 1000 / 60) % 60),
          segundos: Math.floor((diferenca / 1000) % 60)
        });
      }
    }, 1000);

    // Limpa o relógio quando a tela for fechada
    return () => clearInterval(relogio);
  }, [desbloqueado]); // Isso faz o relógio só iniciar quando "desbloqueado" virar verdadeiro

  // --- 5. FUNÇÃO DE VERIFICAR A SENHA ---
  const verificarSenha = () => {
    if (senhaDigitada === SENHA_SECRETA) {
      setDesbloqueado(true); // Abre as portas do app!
    } else {
      Alert.alert('Ops!', 'Senha incorreta. Tente novamente! 😅');
      setSenhaDigitada(''); // Limpa o campo
    }
  };

  // ==========================================
  // O QUE APARECE NA TELA (INTERFACE)
  // ==========================================

  // SE NÃO ESTIVER DESBLOQUEADO, MOSTRA A TELA DE SENHA
  if (!desbloqueado) {
    return (
      <View style={[styles.container, styles.centralizado]}>
        <Text style={styles.tituloBloqueio}>Nosso Casamento 💍</Text>
        <Text style={styles.subtituloBloqueio}>Acesso restrito aos noivos</Text>

        <TextInput
          style={styles.inputSenha}
          keyboardType="numeric" // Mostra o teclado de números do celular
          secureTextEntry={true} // Esconde os números como "bolinhas"
          maxLength={6} // Limita a 4 números
          value={senhaDigitada}
          onChangeText={setSenhaDigitada}
          placeholder="******"
        />

        <TouchableOpacity style={styles.botaoEntrar} onPress={verificarSenha}>
          <Text style={styles.textoBotaoEntrar}>Entrar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // SE A SENHA ESTIVER CORRETA, MOSTRA A HOME COM O DASHBOARD
  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Text style={styles.tituloHome}>Bem-vindos, Caio e Natália!</Text>

      {/* Dashboard - Contagem Regressiva */}
      <View style={styles.cardContagem}>
        <Text style={styles.tituloContagem}>Faltam para o grande dia:</Text>
        <View style={styles.relogioContainer}>
          <View style={styles.caixaTempo}>
            <Text style={styles.numeroTempo}>{tempoRestante.dias}</Text>
            <Text style={styles.legendaTempo}>Dias</Text>
          </View>
          <View style={styles.caixaTempo}>
            <Text style={styles.numeroTempo}>{tempoRestante.horas}</Text>
            <Text style={styles.legendaTempo}>Horas</Text>
          </View>
          <View style={styles.caixaTempo}>
            <Text style={styles.numeroTempo}>{tempoRestante.minutos}</Text>
            <Text style={styles.legendaTempo}>Min</Text>
          </View>
          <View style={styles.caixaTempo}>
            <Text style={styles.numeroTempo}>{tempoRestante.segundos}</Text>
            <Text style={styles.legendaTempo}>Seg</Text>
          </View>
        </View>
      </View>

      {/* Botões de Navegação (Módulos) */}
      <View style={styles.gridBotoes}>
        {/* Botão Convidados (Verde) */}
        <TouchableOpacity style={[styles.botaoModulo, { backgroundColor: cores.verde }]}>
          <Text style={styles.textoBotaoModulo}>Lista de Convidados</Text>
        </TouchableOpacity>

        {/* Botão Tarefas (Laranja) */}
        <TouchableOpacity style={[styles.botaoModulo, { backgroundColor: cores.laranja }]}>
          <Text style={styles.textoBotaoModulo}>Checklist de Tarefas</Text>
        </TouchableOpacity>

        {/* Botão Orçamento (Terracota) */}
        <TouchableOpacity style={[styles.botaoModulo, { backgroundColor: cores.terracota }]}>
          <Text style={styles.textoBotaoModulo}>Controle de Orçamento</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- 6. ESTILOS (O VISUAL DO APLICATIVO) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
    padding: 24,
    paddingTop: 60,
  },
  centralizado: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Estilos da Tela de Bloqueio
  tituloBloqueio: {
    fontSize: 32,
    fontWeight: 'bold',
    color: cores.terracota,
    marginBottom: 5,
  },
  subtituloBloqueio: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  inputSenha: {
    backgroundColor: cores.branco,
    width: '60%',
    padding: 15,
    borderRadius: 10,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 10, // Espaço entre os números
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  botaoEntrar: {
    backgroundColor: cores.verde,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  textoBotaoEntrar: {
    color: cores.branco,
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Estilos da Home (Dashboard)
  tituloHome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: cores.verde,
    marginBottom: 20,
    textAlign: 'center',
  },
  cardContagem: {
    backgroundColor: cores.branco,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 30,
    // Efeito de sombra (Sutil)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tituloContagem: {
    fontSize: 18,
    color: cores.terracota,
    fontWeight: '600',
    marginBottom: 15,
  },
  relogioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  caixaTempo: {
    alignItems: 'center',
  },
  numeroTempo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  legendaTempo: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
  },

  // Estilos dos Botões de Navegação
  gridBotoes: {
    flex: 1,
    gap: 15, // Espaçamento entre os botões
  },
  botaoModulo: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  textoBotaoModulo: {
    color: cores.branco,
    fontSize: 18,
    fontWeight: 'bold',
  }
});