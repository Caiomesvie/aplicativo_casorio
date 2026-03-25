// Arquivo: app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
// 1. Adicionamos o ScrollView na importação
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

// --- 1. NOSSA PALETA DE CORES ---
const cores = {
  azulClaro: '#A2D2FF',
  verde: '#A8D5BA',      // Verde pastel (menta suave)
  laranja: '#FFC8A2',    // Laranja pastel (pêssego)
  terracota: '#E29578',  // Terracota suave (coral)
  azul: '#A8CDE5',       // Azul pastel (para Anexos)
  amarelo: '#FDE293',    // Amarelo pastel (para Orçamentos)
  lilas: '#D1C4E9',      // Lilás pastel (para Compromissos)
  fundo: '#FAFAFA',      // Fundo super claro e clean
  branco: '#FFFFFF',
  textoEscuro: '#2D3142' // Cor de texto mais moderna
};

// --- 2. CONFIGURAÇÕES DO CASAMENTO ---
const DATA_CASAMENTO = new Date('2027-09-11T00:00:00'); // Data do Caio e da Natália!
const SENHA_SECRETA = '110927';
export default function HomeScreen() {
  const router = useRouter();
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState('');

  const [tempoRestante, setTempoRestante] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });

  useEffect(() => {
    if (!desbloqueado) return;

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

    return () => clearInterval(relogio);
  }, [desbloqueado]);

  const verificarSenha = () => {
    if (senhaDigitada === SENHA_SECRETA) {
      setDesbloqueado(true);
    } else {
      Alert.alert('Ops!', 'Senha incorreta. Tente novamente! 😅');
      setSenhaDigitada('');
    }
  };

  // ==========================================
  // INTERFACE
  // ==========================================

  // TELA DE BLOQUEIO MANTIDA COM SUAS CONFIGURAÇÕES (6 dígitos)
  if (!desbloqueado) {
    return (
      <View style={styles.telaBloqueio}>
        <Text style={styles.tituloBloqueio}>Nosso Casamento 💍</Text>
        <Text style={styles.subtituloBloqueio}>Acesso restrito aos noivos</Text>
        <StatusBar barStyle="dark-content" backgroundColor={cores.fundo} />
        <TextInput
          style={styles.inputSenha}
          keyboardType="numeric"
          secureTextEntry={true}
          maxLength={6}
          value={senhaDigitada}
          onChangeText={setSenhaDigitada}
          placeholder="******"
          placeholderTextColor="#A0A0A0"
        />

        <TouchableOpacity style={styles.botaoEntrar} onPress={verificarSenha}>
          <Text style={styles.textoBotaoEntrar}>Entrar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // TELA HOME COM SCROLLVIEW E GRADE DE 6 BOTÕES
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

      <StatusBar barStyle="dark-content" backgroundColor={cores.fundo} />

      <Text style={styles.tituloHome}>Bem-vindos, Caio e Natália!</Text>

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

      <View style={styles.gridBotoes}>

        {/* 1. Convidados */}
        <TouchableOpacity style={[styles.botaoModulo, { backgroundColor: cores.verde }]} onPress={() => router.push('/convidados')}>
          <Text style={styles.emojiBotao}>👥</Text>
          <Text style={styles.textoBotaoModulo}>Convidados</Text>
        </TouchableOpacity>

        {/* 2. Tarefas */}
        <TouchableOpacity style={[styles.botaoModulo, { backgroundColor: cores.laranja }]} onPress={() => router.push('/tarefas')}>
          <Text style={styles.emojiBotao}>✅</Text>
          <Text style={styles.textoBotaoModulo}>Tarefas</Text>
        </TouchableOpacity>

        {/* 3. Orçamentos */}
        <TouchableOpacity style={[styles.botaoModulo, { backgroundColor: cores.amarelo }]} onPress={() => router.push('/orcamentos')}>
          <Text style={styles.emojiBotao}>📊</Text>
          <Text style={styles.textoBotaoModulo}>Orçamentos</Text>
        </TouchableOpacity>

        {/* 4. Pagamentos */}
        <TouchableOpacity style={[styles.botaoModulo, { backgroundColor: cores.terracota }]} onPress={() => router.push('/pagamentos')}>
          <Text style={styles.emojiBotao}>💰</Text>
          <Text style={styles.textoBotaoModulo}>Pagamentos</Text>
        </TouchableOpacity>

        {/* 5. Agenda/Compromissos */}
        <TouchableOpacity style={[styles.botaoModulo, { backgroundColor: cores.lilas }]} onPress={() => router.push('/agenda')}>
          <Text style={styles.emojiBotao}>📅</Text>
          <Text style={styles.textoBotaoModulo}>Agenda</Text>
        </TouchableOpacity>

        {/* 6. Bloco de Notas */}
        <TouchableOpacity style={[styles.botaoModulo, { backgroundColor: cores.azulClaro }]} onPress={() => router.push('/notas')}>
          <Text style={styles.emojiBotao}>📝</Text>
          <Text style={styles.textoBotaoModulo}>Anotações</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

// --- 6. ESTILOS (O VISUAL DO APLICATIVO) ---
const styles = StyleSheet.create({
  // Estilo base do app
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  // O conteúdo interno do ScrollView precisa de padding para não colar nas bordas
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  // Estilo específico para centralizar a tela de bloqueio
  telaBloqueio: {
    flex: 1,
    backgroundColor: cores.fundo,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  tituloBloqueio: {
    fontSize: 32,
    fontWeight: 'bold',
    color: cores.terracota,
    marginBottom: 5,
  },
  subtituloBloqueio: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
  },
  inputSenha: {
    backgroundColor: cores.branco,
    width: '70%', // Aumentei um pouquinho para caber os 6 dígitos confortavelmente
    padding: 15,
    borderRadius: 12,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    elevation: 1,
  },
  botaoEntrar: {
    backgroundColor: cores.verde,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  textoBotaoEntrar: {
    color: cores.textoEscuro,
    fontSize: 18,
    fontWeight: 'bold',
  },
  tituloHome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: cores.terracota,
    marginBottom: 20,
    textAlign: 'center',
  },
  cardContagem: {
    backgroundColor: cores.branco,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tituloContagem: {
    fontSize: 18,
    color: cores.textoEscuro,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: cores.verde,
  },
  legendaTempo: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '500',
    marginTop: 4,
  },

  // --- ESTILOS DA GRADE COM 6 MÓDULOS ---
  gridBotoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  botaoModulo: {
    width: '47%',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    height: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  emojiBotao: {
    fontSize: 32,
    marginBottom: 8,
  },
  textoBotaoModulo: {
    color: cores.textoEscuro,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});